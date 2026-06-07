const fs = require('fs');

const files = [
  'd:/dental-endodontics/client/src/pages/PGDashboard.jsx',
  'd:/dental-endodontics/client/src/pages/UGDashboard.jsx',
  'd:/dental-endodontics/client/src/pages/ChiefDoctorDashboard.jsx',
  'd:/dental-endodontics/client/src/pages/DoctorDashboard.jsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // We are looking for the button that closes the success message
  // It has aria-label="Close" and title="Close"
  const regex = /<button[^>]+aria-label="Close"[^>]+title="Close"[^>]*>[\s\S]*?<\/button>/g;
  
  content = content.replace(regex, (match) => {
    // preserve the opening tag
    const openingTagEnd = match.indexOf('>') + 1;
    const openingTag = match.substring(0, openingTagEnd);
    return openingTag + '\\n                      &times;\\n                    </button>';
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed Close button in', file);
}
