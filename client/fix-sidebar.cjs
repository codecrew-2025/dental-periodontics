const fs = require('fs');

const files = [
  'd:/dental-endodontics/client/src/pages/PGDashboard.jsx',
  'd:/dental-endodontics/client/src/pages/UGDashboard.jsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Fix sidebar icons correctly by matching the text "My Appointments"
  content = content.replace(/<span className="chief-nav-icon">[^<]+<\/span>\s*<span>My Appointments<\/span>/g, '<span className="chief-nav-icon"><i className="fas fa-calendar-check"></i></span>\n                  <span>My Appointments</span>');

  // Fix other sidebar icons just in case they were missed
  content = content.replace(/<span className="chief-nav-icon">[^<]+<\/span>\s*<span>Patient Management<\/span>/g, '<span className="chief-nav-icon"><i className="fas fa-user-injured"></i></span>\n                  <span>Patient Management</span>');
  content = content.replace(/<span className="chief-nav-icon">[^<]+<\/span>\s*<span>Case Sheet<\/span>/g, '<span className="chief-nav-icon"><i className="fas fa-file-medical"></i></span>\n                  <span>Case Sheet</span>');
  content = content.replace(/<span className="chief-nav-icon">[^<]+<\/span>\s*<span>Analytics<\/span>/g, '<span className="chief-nav-icon"><i className="fas fa-chart-line"></i></span>\n                  <span>Analytics</span>');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
}
