
import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema(
  {
    trackingNumber: { type: String, required: true, unique: true },
    image: { type: String },
    sender: { type: String, required: true },
    recipient: { type: String, required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Shipment', shipmentSchema);