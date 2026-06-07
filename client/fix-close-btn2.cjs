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

  // We find the block:
  // color: 'inherit',
  // }}
  // >
  // CORRUPTED TEXT
  // </button>
  // {successMessage}

  const regex = /(color:\s*'inherit',\s*\}\}\s*>)\s*[\s\S]*?(\s*<\/button>\s*\{successMessage\})/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, "$1\n                      &times;$2");
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed Close button in', file);
  } else {
    console.log('Regex did not match in', file);
  }
}
