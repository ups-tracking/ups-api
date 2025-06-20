import express from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../utils/cloudinary.js';
import Shipment from '../models/Shipment.js';

const router = express.Router();
const upload = multer();

function generateTrackingNumber() {
  const prefix = 'UPS';
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomPart}`;
}
// POST: Create a shipment with optional image
router.post('/', upload.single('image'), async (req, res) => {
  try {


    const { sender, recipient, origin, destination } = req.body;

    // Validate required text fields
    if (!sender || !recipient || !origin || !destination) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    let imageUrl = null;

    // If image is provided, upload it to Cloudinary
    if (req.file) {
      const uploadImage = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'shipments' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

      const result = await uploadImage();
      imageUrl = result.secure_url;
    }

    // Generate unique tracking number
    let trackingNumber;
    let isUnique = false;
    while (!isUnique) {
      trackingNumber = generateTrackingNumber();
      const exists = await Shipment.findOne({ trackingNumber });
      if (!exists) isUnique = true;
    }

    // Create new shipment
    const shipment = new Shipment({
      trackingNumber,
      sender,
      recipient,
      origin,
      destination,
      ...(imageUrl && { image: imageUrl }), // only add image if it exists
    });

    const saved = await shipment.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ Shipment creation error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST: Add image to existing shipment
router.post('/:id/add-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image is required' });

    const uploadImage = () => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'shipments' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    const result = await uploadImage();

    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { $push: { additionalImages: result.secure_url } },
      { new: true }
    );

    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    res.status(200).json({ image: result.secure_url });
  } catch (err) {
    console.error('Error adding image:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH: Update status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'in transit', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedShipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedShipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.status(200).json(updatedShipment);
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: All shipments
router.get('/', async (req, res) => {
  try {
    const shipments = await Shipment.find();
    res.status(200).json(shipments);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Shipment by tracking number
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingNumber });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.status(200).json(shipment);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
