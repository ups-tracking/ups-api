import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import shipmentRoutes from './routes/shipment.js';

dotenv.config();
const app = express();

// ✅ CORS SETUP
const allowedOrigins = [
  'http://localhost:3000',
  'https://ups-chi.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ✅ ROUTES
app.use('/api/shipments', shipmentRoutes);

// ✅ HEALTH CHECK
app.get('/', (req, res) => {
  res.send('UPS Backend Running ✅');
});

// ✅ DB & SERVER
const PORT = process.env.PORT || 5005;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ DB connection error:', err);
  });
