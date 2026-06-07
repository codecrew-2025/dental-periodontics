const fs = require('fs');
let content = fs.readFileSync('d:/dental-endodontics/client/src/pages/PGDashboard.jsx', 'utf8');

// Use simple string splits and joins to avoid regex matching issues

// 1. Fix hamburger menu
let parts = content.split('onClick={() => setIsSideNavOpen((v) => !v)}');
if (parts.length > 1) {
  let after = parts[1];
  // find the first closing button tag
  let btnEnd = after.indexOf('</button>');
  if (btnEnd !== -1) {
    let replaced = `\n            >\n              <i className="fas fa-bars"></i>\n            </button>` + after.substring(btnEnd + 9);
    content = parts[0] + 'onClick={() => setIsSideNavOpen((v) => !v)}' + replaced;
  }
}

// 2. Fix the profile dropdown arrow
content = content.replace(/\{showLogoutDropdown \? '[^']+' : '[^']+'\}/g, '{showLogoutDropdown ? <i className="fas fa-chevron-up"></i> : <i className="fas fa-chevron-down"></i>}');

// 3. Fix the profile icons
content = content.replace(/<span className="dropdown-icon">[^<]+<\/span>\s*<span>My Profile<\/span>/g, '<span className="dropdown-icon"><i className="fas fa-user"></i></span>\n                    <span>My Profile</span>');
content = content.replace(/<span className="dropdown-icon">[^<]+<\/span>\s*<span>Change Password<\/span>/g, '<span className="dropdown-icon"><i className="fas fa-key"></i></span>\n                    <span>Change Password</span>');
content = content.replace(/<span className="dropdown-icon">[^<]+<\/span>\s*<span>Logout<\/span>/g, '<span className="dropdown-icon"><i className="fas fa-sign-out-alt"></i></span>\n                    <span>Logout</span>');

// 4. Fix search UI
const searchStartStr = '<label htmlFor="unique-id">Enter Registered Patient ID</label>';
const searchEndStr = 'placeholder="Enter Patient ID from Admin Patient Registration"';
let sStart = content.indexOf(searchStartStr);
let sEnd = content.indexOf('/>', content.indexOf(searchEndStr));

if (sStart !== -1 && sEnd !== -1) {
  let replacementSearch = `
                  <label>Search Patient</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      value={searchQuery || formData.uniqueId || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setSearchQuery(val);
                        setFormData(p => ({ ...p, uniqueId: val }));
                        setSearchType(/^\\d+$/.test(val.trim()) ? 'id' : 'name');
                        if (val.length >= 2) handlePatientSearch(val);
                        else setSearchResults([]);
                      }}
                      placeholder="Enter name, patient ID or phone number"
                      autoComplete="off"
                    />
                    {searchResults.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
                        background: '#1e2a4a', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: 260, overflowY: 'auto',
                      }}>
                        {searchResults.map((p, i) => {
                          const fullName = [p.personalInfo?.firstName, p.personalInfo?.lastName].filter(Boolean).join(' ') || p.patientName || 'Unknown';
                          const phone = p.personalInfo?.phone || 'Unknown';
                          return (
                            <div key={p.patientId || i}
                              onClick={() => handleSelectSearchResult(p)}
                              style={{
                                padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.07)',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{fullName}</div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                                ID: {p.patientId} • Phone: {phone}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>`;
  content = content.substring(0, sStart) + replacementSearch + content.substring(sEnd + 2);
}

// Add state variables
if (!content.includes('setSearchQuery')) {
  content = content.replace("const [activeView, setActiveView] = useState('patient');", 
`const [activeView, setActiveView] = useState('patient');
  const [searchType, setSearchType] = useState('id');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);`);
}

// Add functions
if (!content.includes('handlePatientSearch')) {
  content = content.replace("const fetchGeneralCasePreview = async (patientId) => {", 
`const handlePatientSearch = async (query) => {
    const q = String(query || '').trim();
    if (!q) { setSearchResults([]); return; }
    try {
      setSearchLoading(true);
      const res = await fetch(buildApiUrl(\`/api/patient-details?search=\${encodeURIComponent(q)}&limit=8\`));
      if (!res.ok) { setSearchResults([]); return; }
      const json = await res.json();
      const patients = Array.isArray(json?.data) ? json.data : (Array.isArray(json?.patients) ? json.patients : []);
      setSearchResults(patients);
    } catch { setSearchResults([]); }
    finally { setSearchLoading(false); }
  };

  const handleSelectSearchResult = (patient) => {
    const pid = String(patient.patientId || '').trim();
    setSearchResults([]);
    setSearchQuery('');
    setFormData(prev => ({ ...prev, uniqueId: pid }));
    handleGetDetails(pid);
  };

  const fetchGeneralCasePreview = async (patientId) => {`);
}

fs.writeFileSync('d:/dental-endodontics/client/src/pages/PGDashboard.jsx', content, 'utf8');
console.log('Fixed PGDashboard completely');

// ALSO fix UGDashboard which might have similar corrupted characters:
let ugContent = fs.readFileSync('d:/dental-endodontics/client/src/pages/UGDashboard.jsx', 'utf8');

let ugParts = ugContent.split('onClick={() => setIsSideNavOpen((v) => !v)}');
if (ugParts.length > 1) {
  let after = ugParts[1];
  let btnEnd = after.indexOf('</button>');
  if (btnEnd !== -1) {
    let replaced = `\n            >\n              <i className="fas fa-bars"></i>\n            </button>` + after.substring(btnEnd + 9);
    ugContent = ugParts[0] + 'onClick={() => setIsSideNavOpen((v) => !v)}' + replaced;
  }
}
ugContent = ugContent.replace(/\{showLogoutDropdown \? '[^']+' : '[^']+'\}/g, '{showLogoutDropdown ? <i className="fas fa-chevron-up"></i> : <i className="fas fa-chevron-down"></i>}');
ugContent = ugContent.replace(/<span className="dropdown-icon">[^<]+<\/span>\s*<span>My Profile<\/span>/g, '<span className="dropdown-icon"><i className="fas fa-user"></i></span>\n                    <span>My Profile</span>');
ugContent = ugContent.replace(/<span className="dropdown-icon">[^<]+<\/span>\s*<span>Change Password<\/span>/g, '<span className="dropdown-icon"><i className="fas fa-key"></i></span>\n                    <span>Change Password</span>');
ugContent = ugContent.replace(/<span className="dropdown-icon">[^<]+<\/span>\s*<span>Logout<\/span>/g, '<span className="dropdown-icon"><i className="fas fa-sign-out-alt"></i></span>\n                    <span>Logout</span>');

// Replace any corrupted Unknown characters
ugContent = ugContent.replace(/\|\| '[^']*';/g, "|| 'Unknown';");

fs.writeFileSync('d:/dental-endodontics/client/src/pages/UGDashboard.jsx', ugContent, 'utf8');
console.log('Fixed UGDashboard completely');
