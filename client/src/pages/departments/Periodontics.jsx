import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Periodontics = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const CASE_CONSENT_NAV_STATE_KEY = 'caseSheetConsentApproved';
  const pathname = String(location.pathname || '').toLowerCase();
  const isLong = pathname.endsWith('/long');
  const isShort = pathname.endsWith('/short');
  const sheetType = isLong ? 'Long Case Sheet' : isShort ? 'Short Case Sheet' : 'Periodontics';

  // Consent redirect removed for Periodontics case sheet view

  return (
    <div className="periodontics-page" style={{ minHeight: '100vh', padding: 24, color: '#fff' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: 'rgba(12, 50, 109, 0.82)', borderRadius: 16, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <h1 style={{ marginBottom: 16 }}>{sheetType}</h1>
        <p style={{ marginBottom: 24, lineHeight: 1.6 }}>
          This is the dedicated Periodontics page. The doctor can use this route to open the selected Periodontics case sheet directly.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button-portal"
            onClick={() => navigate('/periodontics')}
            style={{ minWidth: 180 }}
          >
            Back to Periodontics Menu
          </button>

<button
  type="button"
  className="button-portal"
  onClick={() => navigate('/')}
  style={{ minWidth: 180 }}
>
  Back to Dashboard
</button>
<button
  type="button"
  className="button-portal"
  onClick={() => {
    const pId = location.state?.patientId || localStorage.getItem('CurrentpatientId') || '';
    const pName = location.state?.patientName || localStorage.getItem('CurrentpatientName') || '';
    if (pId) {
      localStorage.setItem('CurrentpatientId', pId);
      localStorage.setItem('CurrentpatientName', pName);
    }
    navigate('/case-history');
  }}
  style={{ minWidth: 180 }}
>
  Case History
</button>
        </div>
      </div>
    </div>
  );
};

export default Periodontics;
