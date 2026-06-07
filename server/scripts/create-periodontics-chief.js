import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

const createPeriodonticsChief = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Dental';
    if (!process.env.MONGO_URI) {
      console.warn('⚠️ MONGO_URI not set. Using fallback local MongoDB URI:', uri);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const existingDoctor = await User.findOne({
      $or: [
        { Identity: 'CDNT25' },
        { email: 'periodontics.chief@dental.com' }
      ]
    });

    if (existingDoctor) {
      console.log('⚠️  Periodontics Chief Doctor already exists:');
      console.log('   Email:', existingDoctor.email);
      console.log('   Identity:', existingDoctor.Identity);
      console.log('   Department:', existingDoctor.department);
      return;
    }

    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const periodonticsChief = new User({
      name: 'Dr. Periodontics Chief',
      email: 'periodontics.chief@dental.com',
      phone: '9800000000',
      password: hashedPassword,
      role: 'chief-doctor',
      Identity: 'CDNT25',
      department: 'Periodontics',
      specialization: 'Periodontics',
      staffId: 'CDNT25',
      createdAt: new Date()
    });

    await periodonticsChief.save();

    console.log('\n✅ Periodontics Chief Doctor created successfully!');
    console.log('   Email: periodontics.chief@dental.com');
    console.log('   Password:', password);
    console.log('   Identity: CDNT25');
    console.log('   Department: Periodontics');
    console.log('   Role: chief-doctor');
    console.log('\n⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating Periodontics Chief Doctor:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

createPeriodonticsChief();
