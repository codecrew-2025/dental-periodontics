import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PeriodonticsCaseModel from './models/PeriodonticsCaseModel.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const cases = await PeriodonticsCaseModel.find({});
    console.log('Total cases:', cases.length);
    console.log('Cases:', cases.map(c => ({
      doctorId: c.doctorId,
      doctorName: c.doctorName,
      patientId: c.patientId
    })));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
