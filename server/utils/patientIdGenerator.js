// server/utils/patientIdGenerator.js
import { User } from '../models/User.js';
import { PatientDetails } from '../models/patientDetails.js';

// Generate next patient ID in format C1000, C1001, C1002, etc.
export const generateNextPatientId = async () => {
  const prefix = 'C';
  const startingNumber = 1000;

  // Find latest IDs from both User (Identity) and PatientDetails (patientId)
  // using aggregation to correctly sort by numeric part rather than string sort
  const [userAgg, patientAgg] = await Promise.all([
    User.aggregate([
      { $match: { Identity: { $regex: `^${prefix}\\d+$` }, role: 'patient' } },
      { $project: { 
          Identity: 1, 
          numId: { $toDouble: { $substr: ["$Identity", prefix.length, -1] } } 
      } },
      { $sort: { numId: -1 } },
      { $limit: 1 }
    ]),
    PatientDetails.aggregate([
      { $match: { patientId: { $regex: `^${prefix}\\d+$` } } },
      { $project: { 
          patientId: 1, 
          numId: { $toDouble: { $substr: ["$patientId", prefix.length, -1] } } 
      } },
      { $sort: { numId: -1 } },
      { $limit: 1 }
    ])
  ]);

  const lastUser = userAgg[0] || null;
  const lastPatient = patientAgg[0] || null;

  let lastId = null;
  if (lastUser) lastId = lastUser.Identity;
  if (lastPatient && (!lastId || lastPatient.numId > (lastUser?.numId || 0))) {
    lastId = lastPatient.patientId;
  }

  let nextNumber = startingNumber;
  if (lastId) {
    const lastNumber = parseInt(lastId.slice(1), 10); // Remove 'C' prefix and parse number
    if (!isNaN(lastNumber) && lastNumber >= startingNumber) {
      nextNumber = lastNumber + 1;
    }
  }

  if (nextNumber > 99999) {
    throw new Error('Maximum patient IDs reached (C99999)');
  }

  return prefix + nextNumber;
};

export default generateNextPatientId;