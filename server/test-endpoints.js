import http from 'http';

const testEndpoint = (path) => {
  return new Promise((resolve) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    }).on('error', (err) => resolve({ error: err.message }));
  });
};

async function run() {
  const r1 = await testEndpoint('/api/patient-details/by-patient-id/C1049');
  console.log('GET /api/patient-details/by-patient-id/C1049 ->', r1.status);
  if (r1.status >= 400) console.log(r1.data.slice(0, 500));

  const r2 = await testEndpoint('/api/doctor-patient/C1049');
  console.log('GET /api/doctor-patient/C1049 ->', r2.status);
  if (r2.status >= 400) console.log(r2.data.slice(0, 500));
}
run();
