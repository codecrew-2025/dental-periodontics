import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const dbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/dental-periodontics';

async function run() {
  try {
    await mongoose.connect(dbUrl);
    console.log('Connected to DB');
    
    // Import User and Oral models
    const User = (await import('./server/models/User.js')).default;
    const OralCase = (await import('./server/models/Oral-model.js')).default;
    const PedoCase = (await import('./server/models/PedodonticsCase.js')).default;
    const PerioCase = (await import('./server/models/PeriodonticsCaseModel.js')).default;
    
    const pgs = await User.find({ role: 'pg' });
    console.log(`Found ${pgs.length} PGs`);
    
    for (const pg of pgs) {
      console.log(`PG: ${pg.name} (Identity: ${pg.Identity}, ID: ${pg._id}, Department: ${pg.department}, Assigned To: ${pg.createdBy})`);
    }
    
    const oralCases = await OralCase.find();
    console.log(`Found ${oralCases.length} OralCases`);
    for (const c of oralCases) {
      console.log(`- Patient: ${c.patientName}, DoctorId: ${c.doctorId}, ChiefApproval: ${c.chiefApproval}`);
    }

    const perioCases = await PerioCase.find();
    console.log(`Found ${perioCases.length} PerioCases`);
    for (const c of perioCases) {
      console.log(`- Patient: ${c.patientName}, DoctorId: ${c.doctorId}, ChiefApproval: ${c.chiefApproval}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
