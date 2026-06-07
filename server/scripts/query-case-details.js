import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PeriodonticsCaseModel from '../models/PeriodonticsCaseModel.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://DentalUser:DentalUser%40123@cluster0.6iyogx8.mongodb.net/Dental?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const caseId = '6a246c537a2f4dbf7ead16ca';
    const c = await PeriodonticsCaseModel.findById(caseId).lean();
    if (!c) {
      console.log(`Case ${caseId} not found in PeriodonticsCaseModel`);
      
      // Let's search all collections or list all periodontics cases
      const allCases = await PeriodonticsCaseModel.find({}).lean();
      console.log(`Found ${allCases.length} total periodontics cases:`);
      allCases.forEach(ac => {
        console.log(`- _id: ${ac._id}, patientId: ${ac.patientId}, patientName: ${ac.patientName}, doctorName: ${ac.doctorName}, caseType: ${ac.caseType}, hasSig: ${!!ac.digitalSignature}`);
      });
    } else {
      console.log('Case properties:');
      for (const [key, val] of Object.entries(c)) {
        if (key === 'digitalSignature') {
          console.log(`- ${key}: [exists, type: ${typeof val}, keys: ${Object.keys(val || {})}]`);
        } else {
          console.log(`- ${key}: ${JSON.stringify(val)}`);
        }
      }
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
