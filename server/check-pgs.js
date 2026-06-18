import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Appointment } from './models/AppoitmentBooked.js';
import { User } from './models/User.js';

async function check() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to DB");
  
  // Find Rohit (the doctor)
  const rohit = await User.findOne({ email: 'oralmedicine@gmail.com' });
  if (!rohit) {
    console.log("Rohit not found");
    process.exit(0);
  }
  
  console.log("Doctor Rohit ID:", rohit._id);
  
  // Find PGs created by Rohit
  const pgs = await User.find({ createdBy: rohit._id, role: 'pg' });
  console.log("PGs assigned to Rohit:");
  pgs.forEach(pg => console.log(`- ${pg.name} (${pg.Identity}) - _id: ${pg._id}`));
  
  const pgIdentities = pgs.map(p => p.Identity).filter(Boolean);
  const pgObjectIds = pgs.map(p => String(p._id));
  
  // Find any appointments matching these PGs
  const appts = await Appointment.find({
    $or: [
      { assignedPgUgId: { $in: pgIdentities } },
      { assigned_pg_ug_id: { $in: pgIdentities } },
      { pgDoctorId: { $in: pgIdentities } },
      { doctorId: { $in: pgIdentities } },
      { doctorId: { $in: pgObjectIds } }
    ]
  });
  
  console.log(`\nFound ${appts.length} appointments for these PGs in total.`);
  appts.forEach(a => console.log(`- Appt: ${a.bookingId}, patient: ${a.patientId}, date: ${a.appointmentDate}, status: ${a.status}, doctorId: ${a.doctorId}`));
  
  // Check GeneralCase for assignment
  const GeneralCase = (await import('./models/GeneralCase.js')).default;
  const cases = await GeneralCase.find({ assignedPgId: { $in: pgIdentities } });
  console.log(`\nFound ${cases.length} GeneralCases assigned to these PGs.`);
  
  // Check OralCase
  const OralCase = (await import('./models/Oral-model.js')).default;
  const oralCases = await OralCase.find({ doctorId: { $in: [...pgIdentities, ...pgObjectIds] } });
  console.log(`\nFound ${oralCases.length} OralCases created by these PGs.`);
  oralCases.forEach(c => console.log(`- OralCase: patient: ${c.patientId}, doctorId: ${c.doctorId}`));
  
  process.exit(0);
}
check().catch(console.error);
