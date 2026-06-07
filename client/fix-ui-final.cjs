const fs = require('fs');
const files = ['d:/dental-endodontics/client/src/pages/PGDashboard.jsx', 'd:/dental-endodontics/client/src/pages/UGDashboard.jsx'];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Fix My Appointments (which wasn't fixed before because it didn't have pg-nav-label)
  content = content.replace(/<span className="chief-nav-icon">[^\x00-\x7F]*<\/span>\s*<span>My Appointments<\/span>/g, '<span className="chief-nav-icon"><i className="fas fa-calendar-check"></i></span>\n                  <span>My Appointments</span>');

  // Fix hamburger menu
  content = content.replace(/onClick=\{\(\) => setIsSideNavOpen\(\(v\) => !v\)\}\s*>\s*[^\x00-\x7F]+\s*<\/button>/g, 'onClick={() => setIsSideNavOpen((v) => !v)}\n            >\n              <i className="fas fa-bars"></i>\n            </button>');

  // Fix dropdown arrows
  content = content.replace(/\{showLogoutDropdown \? '[^\x00-\x7F]+' : '[^\x00-\x7F]+'\}/g, '{showLogoutDropdown ? <i className="fas fa-chevron-up"></i> : <i className="fas fa-chevron-down"></i>}');

  // Fix My Profile
  content = content.replace(/<span className="dropdown-icon">[^\x00-\x7F]*<\/span>\s*<span>My Profile<\/span>/g, '<span className="dropdown-icon"><i className="fas fa-user"></i></span>\n                    <span>My Profile</span>');

  // Fix Change Password
  content = content.replace(/<span className="dropdown-icon">[^\x00-\x7F]*<\/span>\s*<span>Change Password<\/span>/g, '<span className="dropdown-icon"><i className="fas fa-key"></i></span>\n                    <span>Change Password</span>');

  // Fix Logout
  content = content.replace(/<span className="dropdown-icon">[^\x00-\x7F]*<\/span>\s*<span>Logout<\/span>/g, '<span className="dropdown-icon"><i className="fas fa-sign-out-alt"></i></span>\n                    <span>Logout</span>');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fully Fixed', file);
}
