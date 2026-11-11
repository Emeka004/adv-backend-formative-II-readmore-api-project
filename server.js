import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authorRoutes from './routes/authorRoutes.js';
import bookRoutes from './routes/bookRoutes.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'ReadMore API is running' });
});

app.use('/authors', authorRoutes);
app.use('/books', bookRoutes);

const startServer = async () => {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

startServer();
