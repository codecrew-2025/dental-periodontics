const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-college';

mongoose.connect(uri).then(async () => {
  const User = require('./models/User');
  const Appointment = require('./models/AppoitmentBooked');
  
  // Find all PG/UG
  const pgUsers = await User.find({ role: { $in: ['pg', 'ug'] } }).limit(5).lean();
  console.log('\n=== PG/UG Users ===');
  pgUsers.forEach(u => console.log(`${u.name} (${u.role}): Identity=${u.Identity}, CreatedBy=${u.createdBy}`));
  
  // Find appointments with rescheduleRequest
  const appts = await Appointment.find({ 'rescheduleRequest.requestedBy': { $exists: true } }).limit(5).lean();
  console.log('\n=== Appointments with Reschedule Requests ===');
  if (appts.length === 0) {
    console.log('No reschedule requests found');
  } else {
    appts.forEach(a => console.log(`BookingID: ${a.bookingId}, Status: ${a.status}, RequestStatus: ${a.rescheduleRequest?.requestStatus}`));
  }
  
  // Count all PG/UG
  const pgCount = await User.countDocuments({ role: { $in: ['pg', 'ug'] } });
  console.log(`\nTotal PG/UG users: ${pgCount}`);
  
  // Check a specific doctor's assigned PG/UG
  const doctors = await User.find({ role: 'doctor' }).select('_id name').limit(1).lean();
  if (doctors.length > 0) {
    const doctor = doctors[0];
    const assignedPg = await User.find({ createdBy: doctor._id, role: { $in: ['pg', 'ug'] } }).lean();
    console.log(`\nDoctor "${doctor.name}" has ${assignedPg.length} assigned PG/UG`);
    if (assignedPg.length > 0) {
      console.log('Assigned PG/UG:', assignedPg.map(p => `${p.name} (${p.Identity})`).join(', '));
      
      // Check appointments for this PG/UG
      const pgIdentities = assignedPg.map(p => String(p.Identity || '').trim()).filter(Boolean);
      const pgAppts = await Appointment.find({ assigned_pg_ug_id: { $in: pgIdentities } }).lean();
      console.log(`\nAppointments for this doctor's PG/UG: ${pgAppts.length}`);
      pgAppts.slice(0, 3).forEach(a => {
        console.log(`  - BookingID: ${a.bookingId}, Status: ${a.status}, PG: ${a.assigned_pg_ug_id}`);
      });
    }
  }
  
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
