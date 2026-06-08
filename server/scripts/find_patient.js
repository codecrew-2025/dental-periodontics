import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set in environment');
  process.exit(1);
}

// Load User model
import('../models/User.js').then(({ User }) => {
  mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
      console.log('Connected to MongoDB for user lookup');
      try {
        const patient = await User.findOne({ role: 'patient' }).lean();
        if (!patient) {
          console.log('No patient user found. Listing any user:');
          const any = await User.findOne({}).lean();
          console.log(any);
        } else {
          console.log('Found patient:', {
            _id: patient._id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            Identity: patient.Identity,
            hasPassword: !!patient.password
          });
        }
      } catch (err) {
        console.error('Error querying users:', err);
      } finally {
        mongoose.connection.close();
      }
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err);
      process.exit(1);
    });
}).catch((err) => {
  console.error('Failed to import User model:', err);
  process.exit(1);
});
