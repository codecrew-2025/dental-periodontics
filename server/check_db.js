import mongoose from 'mongoose';
import PedodonticsCase from './models/PedodonticsCase.js';
import OralCase from './models/Oral-model.js';
import PeriodonticsCaseModel from './models/PeriodonticsCaseModel.js';
import { User } from './models/User.js';

async function check() {
  await mongoose.connect('mongodb://localhost:27017/dental-endodontics');
  
  const user = await User.findOne({ name: 'subi' });
  console.log('User subi:', user);
  
  const cases = await OralCase.find({ doctorName: 'subi' }).sort({ date: -1 }).limit(1);
  console.log('Recent oral case for subi:', cases);
  
  process.exit(0);
}

check();
