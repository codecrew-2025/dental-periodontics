const mongoose = require('mongoose');
const User = require('./models/User.js').default;
const Appointment = require('./models/AppoitmentBooked.js').default;
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const deptDoctors = await User.find({ role: { $in: ['doctor', 'chief-doctor', 'chief'] } }, { _id: 1, Identity: 1, department: 1, name: 1 }).lean();
  console.log('All Doctors:', deptDoctors);
  
  const pgAppointments = await Appointment.find({}).sort({ createdAt: -1 }).limit(10).lean();
  console.log('Recent Appointments:', pgAppointments.map(a => ({ id: a._id, doc: a.doctorId, supDoc: a.supervisingDeptDoctorId, deptDoc: a.deptDoctorId })));
  
  process.exit(0);
});
