const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-college';

mongoose.connect(uri).then(async () => {
  console.log('Connected to MongoDB');
  
  const User = require('./models/User');
  const Appointment = require('./models/AppoitmentBooked');
  const { default: GeneralCase } = await import('./models/GeneralCase.js');
  
  // Find a doctor
  const doctor = await User.findOne({ role: 'doctor' });
  if (!doctor) {
    console.log('No doctor found in database');
    process.exit(0);
  }
  console.log(`Found doctor: ${doctor.name} (${doctor.Identity})`);
  
  // Check if doctor has any PG/UG students
  let pg = await User.findOne({ role: 'pg', createdBy: doctor._id });
  if (!pg) {
    console.log('No PG found created by this doctor. Creating one...');
    pg = await User.create({
      name: 'Dr. Test PG',
      email: 'testpg@dental.college',
      phone: '9999999999',
      role: 'pg',
      department: doctor.department,
      Identity: 'PG-TEST-001',
      registrationNumber: 'REG-PG-001',
      createdBy: doctor._id,
      password: 'password123',
    });
    console.log(`Created PG: ${pg.name} (${pg.Identity})`);
  } else {
    console.log(`Found PG: ${pg.name} (${pg.Identity})`);
  }
  
  // Find an appointment assigned to the doctor
  let appt = await Appointment.findOne({ doctorId: doctor._id, status: 'pending' });
  if (!appt) {
    console.log('No pending appointment found. Creating one...');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    appt = await Appointment.create({
      bookingId: `TEST-${Date.now()}`,
      patientId: 'TEST-PATIENT-001',
      patientEmail: 'testpatient@email.com',
      chiefComplaint: 'Test complaint',
      appointmentDate: tomorrow,
      appointmentTime: '10:00 AM',
      doctorId: doctor._id,
      status: 'pending',
      needsGeneralApproval: false,
      needsPgApproval: false,
    });
    console.log(`Created appointment: ${appt.bookingId} on ${appt.appointmentDate}`);
  } else {
    console.log(`Found appointment: ${appt.bookingId} on ${appt.appointmentDate}`);
  }
  
  // Create a GeneralCase linking PG to this patient
  const gcase = await GeneralCase.findOne({ 
    patientId: appt.patientId,
    assignedPgId: pg.Identity
  });
  if (!gcase) {
    console.log('No GeneralCase found. Creating one...');
    await GeneralCase.create({
      patientId: appt.patientId,
      assignedPgId: pg.Identity,
      assignedPgName: pg.name,
      pgAssignedAt: new Date(),
      specialistStatus: 'approved',
      generalDoctorId: doctor.Identity,
      generalDoctorName: doctor.name,
    });
    console.log(`Created GeneralCase linking PG ${pg.Identity} to patient ${appt.patientId}`);
  } else {
    console.log(`GeneralCase already exists`);
  }
  
  // Link the appointment to the PG (fallback)
  appt.assigned_pg_ug_id = pg.Identity;
  await appt.save();
  console.log(`Linked appointment ${appt.bookingId} to PG ${pg.Identity}`);
  
  // Create a reschedule request manually (simulating PG action)
  const futureDate = new Date(Date.now() + 172800000).toISOString().split('T')[0]; // 2 days from now
  appt.rescheduleRequest = {
    requestedBy: pg.Identity,
    requestedByName: pg.name,
    proposedDate: futureDate,
    proposedTime: '02:00 PM',
    requestStatus: 'pending',
    requestedAt: new Date(),
    reviewedBy: null,
    reviewedAt: null,
  };
  appt.status = 'reschedule_requested';
  await appt.save();
  console.log(`Created reschedule request: ${futureDate} at 02:00 PM`);
  
  console.log('\n✅ Test data created successfully!');
  console.log(`Doctor: ${doctor.name} (${doctor.Identity})`);
  console.log(`PG: ${pg.name} (${pg.Identity})`);
  console.log(`Appointment: ${appt.bookingId}`);
  console.log(`Patient: ${appt.patientId}`);
  console.log(`Reschedule Request: Pending - ${futureDate} at 02:00 PM`);
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
