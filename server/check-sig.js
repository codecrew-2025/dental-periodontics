import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PeriodonticsCaseModel from './models/PeriodonticsCaseModel.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const doc = await PeriodonticsCaseModel.findById('6a245b40331b200fc7bcc668').lean();
  console.log('Signature:', doc ? doc.digitalSignature : 'Not found');
  process.exit(0);
}
run();
