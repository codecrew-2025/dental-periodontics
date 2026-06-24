const http = require('http');

const data = JSON.stringify({
  patientId: "C1234",
  personalInfo: {
    firstName: "",
    middleName: "",
    lastName: "Test",
    dateOfBirth: "2000-01-01",
    age: 26,
    gender: "",
    maritalStatus: "",
    preferredLanguage: "English",
    occupation: "Test",
    income: "Test",
    religion: "Test",
    address: "Test"
  },
  medicalInfo: {
    chiefComplaint: "Test",
    historyOfPresentIllness: "Test",
    diagnosis: "Test",
    treatmentPlan: "Test",
    hpi: [],
    pastMedicalHistory: [],
    personalHabits: [],
    currentMedications: [],
    knownAllergies: [],
    chronicConditions: [],
    pastSurgeries: [],
    pregnancyStatus: "",
    dentalConcerns: [],
    lastDentalVisit: null
  },
  vitals: {
    bloodGroup: "",
    drugAllergies: [],
    dietAllergies: [],
    criticalCondition: "None"
  },
  clinicalExam: {}
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/doctor-patient',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
