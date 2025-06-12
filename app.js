import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import shipmentRoutes from './routes/shipment.js';

const app = express();

// Middleware
app.use(cors({
  origin: ['https://ups-chi.vercel.app', 'http://localhost:3000'],
}));
app.use(express.json());

// Routes
app.use('/api/shipments', shipmentRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('UPS Backend Running ✅');
});

// MongoDB connection
const PORT = process.env.PORT || 5005;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ DB connection error:', err);
  });

export default app;
