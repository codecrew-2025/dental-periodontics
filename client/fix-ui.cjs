const fs = require('fs');
const files = ['d:/dental-endodontics/client/src/pages/PGDashboard.jsx', 'd:/dental-endodontics/client/src/pages/UGDashboard.jsx'];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/<span className=\`?\"?chief-nav-icon\`?\"?>.*?<\/span>\s*<span>Patient Management<\/span>/g, '<span className=\"chief-nav-icon\"><i className=\"fas fa-user-injured\"></i></span>\n                  <span>Patient Management</span>');
  content = content.replace(/<span className=\`?\"?chief-nav-icon\`?\"?>.*?<\/span>\s*<span className=\`?\"?pg-nav-label\`?\"?>\s*Case Sheet/g, '<span className=\"chief-nav-icon\"><i className=\"fas fa-file-medical\"></i></span>\n                  <span className=\"pg-nav-label\">\n                    Case Sheet');
  content = content.replace(/<span className=\`?\"?chief-nav-icon\`?\"?>.*?<\/span>\s*<span className=\`?\"?pg-nav-label\`?\"?>\s*My Appointments/g, '<span className=\"chief-nav-icon\"><i className=\"fas fa-calendar-check\"></i></span>\n                  <span className=\"pg-nav-label\">\n                    My Appointments');
  content = content.replace(/<span className=\`?\"?chief-nav-icon\`?\"?>.*?<\/span>\s*<span>Analytics<\/span>/g, '<span className=\"chief-nav-icon\"><i className=\"fas fa-chart-line\"></i></span>\n                  <span>Analytics</span>');
  
  content = content.replace(/<span className=\`?\"?chief-brand-title-dept\`?\"?>[^<]*?\{formatDepartmentLabel/g, '<span className=\"chief-brand-title-dept\">| {formatDepartmentLabel');
  
  content = content.replace(/<div className=\`?\"?chief-profile-icon\`?\"?>.*?<\/div>/g, '<div className=\"chief-profile-icon\"><i className=\"fas fa-user-circle\"></i></div>');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
}
