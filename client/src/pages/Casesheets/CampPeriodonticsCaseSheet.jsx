import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import '../generalCaseSheet.css';

const CampPeriodonticsCaseSheet = ({ initialCaseData, readOnly = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryPatientId = String(queryParams.get('patientId') || '').trim();
  const isNewCase = queryParams.get('new') === 'true';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [allergyMessage, setAllergyMessage] = useState('Loading allergies...');
  const [showAllergy, setShowAllergy] = useState(true);
  const [signaturePreview, setSignaturePreview] = useState(initialCaseData?.digitalSignature || '');
  const defaultFormData = {
    patientId: queryPatientId,
    campSerialNo: queryPatientId ? queryPatientId.replace(/\D+/g, '') : '',
    venueName: '',
    date: new Date().toISOString().split('T')[0],
    patientName: '',
    age: '',
    sex: '',
    diagnosis: '',
    treatmentPlan: '',
    remarks: '',
    doctorName: localStorage.getItem('doctorName') || ''
  };

  const parseInitialDate = (dateVal) => {
    if (!dateVal) return defaultFormData.date;
    try {
      return new Date(dateVal).toISOString().split('T')[0];
    } catch {
      return defaultFormData.date;
    }
  };

  const [formData, setFormData] = useState(() => {
    if (initialCaseData) {
      return {
        ...defaultFormData,
        ...initialCaseData,
        date: parseInitialDate(initialCaseData.date),
        remarks: initialCaseData.remarks || ''
      };
    }
    return defaultFormData;
  });

  useEffect(() => {
    if (initialCaseData) {
      setFormData({
        ...defaultFormData,
        ...initialCaseData,
        date: parseInitialDate(initialCaseData.date),
        remarks: initialCaseData.remarks || ''
      });
    }
  }, [initialCaseData]);

  const buildApiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const toListString = (value) => {
    if (Array.isArray(value)) {
      return value.map(v => String(v).trim()).filter(Boolean).join(', ');
    }
    return String(value || '').trim();
  };

  const formatAllergyTicker = (raw) => {
    const text = (raw || '').trim();
    if (!text) return 'Drug Allergies: None';
    if (/^loading/i.test(text)) return text;
    const withoutPrefix = text.replace(/^\s*(Drug\s*Allerg(?:y|ies)|Known\s*Allergies|Diet\s*Allergies)\s*:\s*/i, '');
    if (/^(no known allergies|nil|none)$/i.test(withoutPrefix.trim())) return 'Drug Allergies: None';
    const items = withoutPrefix.split(/[|,]/).map(x => x.trim()).filter(Boolean);
    return `Drug Allergies: ${items.length ? items.join(' | ') : 'None'}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!queryPatientId) {
        if (initialCaseData) setIsLoading(false);
        setAllergyMessage('No known allergies');
        return;
      }

      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      try {
        // Fetch patient details (always needed for allergies)
        let patient = null;
        const patientRes = await fetch(buildApiUrl(`/api/patient-details/by-patient-id/${encodeURIComponent(queryPatientId)}`), { headers });
        if (patientRes.ok) {
          const patientJson = await patientRes.json();
          patient = patientJson?.data || patientJson?.patient;
          
          if (patient) {
            const drug = toListString(patient.vitals?.drugAllergies);
            const known = toListString(patient.medicalInfo?.knownAllergies);
            const diet = toListString(patient.vitals?.dietAllergies);

            if (drug) setAllergyMessage(`Drug Allergies: ${drug}`);
            else if (known) setAllergyMessage(`Known Allergies: ${known}`);
            else if (diet) setAllergyMessage(`Diet Allergies: ${diet}`);
            else setAllergyMessage('No known allergies');
          } else {
            setAllergyMessage('No known allergies');
          }
        } else {
          setAllergyMessage('No known allergies');
        }

        if (initialCaseData) {
          setIsLoading(false);
          return;
        }        // If no case sheet exists, auto-fill from patient details
        if (patient) {
          setFormData(prev => ({
            ...prev,
            patientName: patient.personalInfo?.fullName || localStorage.getItem('CurrentpatientName') || '',
            age: patient.personalInfo?.age?.toString() || '',
            sex: patient.personalInfo?.gender || '',
            venueName: patient.institutionInfo?.institutionName || '',
            diagnosis: patient.medicalInfo?.chiefComplaint || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setAllergyMessage('Error loading allergies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [queryPatientId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.patientId) {
      alert("Patient ID is missing. Cannot save.");
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(buildApiUrl('/api/camp-periodontics/save'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, digitalSignature: signaturePreview })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        alert("Case sheet submitted successfully!");
        navigate('/doctor-dashboard');
      } else {
        alert(json.message || "Failed to save case sheet.");
      }
    } catch (error) {
      console.error('Save error:', error);
      alert("Error saving case sheet. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading...</div>;
  }

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', padding: '20px' }}>
      {showAllergy && (
        <div className="allergy-alert no-print">
          <span className="alert-icon" aria-hidden="true">⚠️</span>
          <div className="allergy-flow-window">
            <span id="allergyMessage">{formatAllergyTicker(allergyMessage)}</span>
          </div>
          <button
            type="button"
            className="close-btn"
            aria-label="Dismiss allergy alert"
            onClick={() => setShowAllergy(false)}
          >
            ×
          </button>
        </div>
      )}
      
      <div id="camp-periodontics-print-root">
        <div className="phd-sheet-shell">
          <form>
            <fieldset disabled={readOnly} style={{ border: 'none', margin: 0, padding: 0 }}>
          {/* ── Header ── */}
          <div className="phd-sheet-header">
            <div className="phd-sheet-sn" style={{ top: '10px', left: '10px', fontSize: '18px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', color: 'white' }}>Sl.No.:</span>
              <input 
                type="text" 
                name="campSerialNo" 
                value={'C ' + formData.campSerialNo} 
                onChange={(e) => setFormData(prev => ({ ...prev, campSerialNo: e.target.value.replace(/^C\s*/i, '') }))} 
                className="phd-input" 
                style={{ width: '100px', color: 'white', background: 'transparent', border: 'none', borderBottom: '2px solid white', outline: 'none', fontSize: '18px', fontWeight: 'bold' }}
              />
            </div>
            <div className="phd-sheet-title-block">
              <h1>DENTAL CAMP</h1>
              <h2>DEPARTMENT OF PERIODONTICS</h2>
            </div>
          </div>

          {/* ── Data Grid ── */}
          <div className="phd-sheet-grid">
            {/* Venue */}
            <div className="phd-field phd-field-wide">
              <span className="phd-label">Name of the Venue</span>
              <input 
                type="text" 
                name="venueName" 
                value={formData.venueName} 
                onChange={handleInputChange} 
                className="phd-input"
                style={{ width: '100%', color: 'white', background: 'transparent', border: 'none', borderBottom: '1px solid white', outline: 'none' }}
              />
            </div>

            {/* Date */}
            <div className="phd-field">
              <span className="phd-label">Date</span>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleInputChange} 
                className="phd-input"
                style={{ color: 'white', background: 'transparent', border: 'none', borderBottom: '1px solid white', outline: 'none' }}
              />
            </div>

            {/* Patient Name */}
            <div className="phd-field phd-field-wide">
              <span className="phd-label">Name of the Patient</span>
              <input 
                type="text" 
                name="patientName" 
                value={formData.patientName} 
                onChange={handleInputChange} 
                className="phd-input"
                style={{ width: '100%', color: 'white', background: 'transparent', border: 'none', borderBottom: '1px solid white', outline: 'none' }}
              />
            </div>

            {/* Age */}
            <div className="phd-field">
              <span className="phd-label">Age</span>
              <input 
                type="number" 
                name="age" 
                value={formData.age} 
                onChange={handleInputChange} 
                className="phd-input"
                style={{ width: '100%', color: 'white', background: 'transparent', border: 'none', borderBottom: '1px solid white', outline: 'none' }}
              />
            </div>

            {/* Sex */}
            <div className="phd-field">
              <span className="phd-label">Sex</span>
              <input 
                type="text" 
                name="sex" 
                value={formData.sex} 
                onChange={handleInputChange} 
                className="phd-input"
                style={{ width: '100%', color: 'white', background: 'transparent', border: 'none', borderBottom: '1px solid white', outline: 'none' }}
              />
            </div>

            {/* Diagnosis */}
            <div className="phd-field phd-field-wide phd-field-stack">
              <span className="phd-label" style={{ marginBottom: '8px', display: 'block' }}>Diagnosis</span>
              <textarea 
                name="diagnosis" 
                value={formData.diagnosis} 
                onChange={handleInputChange} 
                className="phd-box"
                rows="3"
                style={{ width: '100%', background: '#f5f5fc', color: '#333', border: 'none', borderRadius: '4px', padding: '10px', outline: 'none' }}
              />
            </div>

            {/* Treatment Plan */}
            <div className="phd-field phd-field-wide phd-field-stack">
              <span className="phd-label" style={{ marginBottom: '8px', display: 'block' }}>Treatment Plan</span>
              <textarea 
                name="treatmentPlan" 
                value={formData.treatmentPlan} 
                onChange={handleInputChange} 
                className="phd-box phd-treatment-box"
                rows="6"
                style={{ width: '100%', background: '#f5f5fc', color: '#333', border: 'none', borderRadius: '4px', padding: '10px', outline: 'none' }}
              />
            </div>

            {/* Remarks */}
            <div className="phd-field phd-field-wide phd-field-stack">
              <span className="phd-label" style={{ marginBottom: '8px', display: 'block' }}>Remarks</span>
              <textarea 
                name="remarks" 
                value={formData.remarks} 
                onChange={handleInputChange} 
                className="phd-box phd-remarks-box"
                rows="4"
                style={{ width: '100%', background: '#f5f5fc', color: '#333', border: 'none', borderRadius: '4px', padding: '10px', outline: 'none' }}
              />
            </div>

            {/* Doctor Signature */}
            <div className="phd-field phd-field-wide phd-field-stack" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>Doctor's Authentication</h2>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="doctorName" style={{ color: 'white', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Doctor's Name *</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={localStorage.getItem('doctorName') || formData.doctorName || ''}
                  disabled
                  style={{ background: '#f0f0f0', color: '#333', width: '100%', padding: '12px', borderRadius: '4px', border: 'none', fontSize: '16px', outline: 'none' }}
                />
              </div>
              <div>
                <label htmlFor="digitalSignature" style={{ color: 'white', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Digital Signature *</label>
                {!readOnly && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label htmlFor="digitalSignature" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                      Choose Signature
                    </label>
                    <input
                      id="digitalSignature"
                      type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setSignaturePreview(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    required
                    style={{ display: 'none' }}
                  />
                  <span style={{ color: 'white', fontSize: '16px' }}>{signaturePreview ? 'Signature selected' : 'No file selected'}</span>
                  </div>
                )}
                {signaturePreview && (
                  <div id="signaturePreview" style={{ marginTop: '15px' }}>
                    <img
                      src={signaturePreview}
                      alt="Signature Preview"
                      style={{ maxWidth: '200px', maxHeight: '100px', border: '1px solid #ddd', padding: '4px', borderRadius: '4px', background: 'white' }}
                    />
                  </div>
                )}
              </div>
            </div>
            </div>
            </fieldset>
            </form>
        </div>

        {/* ── Actions ── */}
        {!readOnly && (
        <div
          className="general-case-flex general-case-justify-center general-case-mt-4 no-print"
          style={{ gap: 12, flexWrap: 'wrap', marginBottom: 24, marginTop: 30 }}
        >

          <button type="button" className="general-case-button" onClick={handlePrint}>
            Print Case Sheet
          </button>
          <button type="button" className="general-case-button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Submitting...' : 'Submit Case Sheet'}
          </button>
        </div>
        )}
        
        {/* Print-only Yellow Slip Layout */}
        <div className="print-only-layout print-yellow-slip" style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff' }}>
          {/* Top Half */}
          <div className="print-section" style={{ paddingBottom: '30px' }}>
            <div className="print-header-top" style={{ textAlign: 'center', marginBottom: '15px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0' }}>SRM DENTAL COLLEGE</h1>
              <p style={{ fontSize: '14px', margin: '0 0 10px 0', fontWeight: 'bold' }}>BHARATHI SALAI, RAMAPURAM, CHENNAI - 600 089. ☎ : 2249 0526</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                <span>SRM Dental College Tel.: 044-2249 0526</span>
                <span>SRM Speciality Hospital Tel.: 044-2249 6499</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                <span>Monday to Saturday 8.00 a.m to 1.00 pm</span>
                <span>Holiday : Sunday and National Holidays</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '1.4' }}>
                Concession on Payment will be given on producing this form<br/>
                சிகிச்சை கட்டணத்தில் சலுகைகள் பெற இந்த சீட்டை எடுத்து வரவும்
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '2px solid black', margin: '15px 0' }}/>

            <div className="print-camp-header" style={{ display: 'flex', position: 'relative', justifyContent: 'center', margin: '20px 0', textAlign: 'center' }}>
              <div style={{ position: 'absolute', left: 0, top: '5px', fontSize: '16px', fontWeight: 'bold' }}>
                Sl.No.: C <span style={{ fontSize: '20px' }}>{formData.campSerialNo}</span>
              </div>
              <div>
                <h2 style={{ fontSize: '22px', textDecoration: 'underline', margin: '0 0 5px 0' }}>DENTAL CAMP</h2>
                <h3 style={{ fontSize: '18px', textDecoration: 'underline', margin: '0 0 5px 0' }}>DEPARTMENT OF PERIODONTICS</h3>
                <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Room No.: 11, 3rd Floor (PG Block)</p>
              </div>
            </div>

            <div className="print-grid" style={{ fontSize: '16px', lineHeight: '2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ flex: 1, display: 'flex' }}>
                  <span style={{ width: '150px', fontWeight: 'bold', color: '#1a4e8a' }}>Name of the Venue</span>
                  <span style={{ margin: '0 10px' }}>:</span>
                  <span style={{ flex: 1, borderBottom: '1px dotted #000' }}>{formData.venueName}</span>
                </div>
                <div style={{ width: '200px', display: 'flex', marginLeft: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#1a4e8a' }}>Date</span>
                  <span style={{ margin: '0 10px' }}>:</span>
                  <span style={{ flex: 1, borderBottom: '1px dotted #000' }}>{formData.date}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ flex: 1, display: 'flex' }}>
                  <span style={{ width: '150px', fontWeight: 'bold', color: '#1a4e8a' }}>Name of the Patient</span>
                  <span style={{ margin: '0 10px' }}>:</span>
                  <span style={{ flex: 1, borderBottom: '1px dotted #000' }}>{formData.patientName}</span>
                </div>
                <div style={{ display: 'flex', marginLeft: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#1a4e8a' }}>Age</span>
                  <span style={{ margin: '0 10px' }}>:</span>
                  <span style={{ width: '60px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{formData.age}</span>
                </div>
                <div style={{ display: 'flex', marginLeft: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#1a4e8a' }}>Sex</span>
                  <span style={{ margin: '0 10px' }}>:</span>
                  <span style={{ width: '80px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{formData.sex}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                <div style={{ flex: 1, display: 'flex' }}>
                  <span style={{ width: '150px', fontWeight: 'bold', color: '#1a4e8a' }}>Diagnosis</span>
                  <span style={{ margin: '0 10px' }}>:</span>
                  <span style={{ flex: 1, minHeight: '60px' }}>
                    {formData.diagnosis}
                    {formData.treatmentPlan && <div><br/><strong>Treatment Plan:</strong><br/>{formData.treatmentPlan}</div>}
                    {formData.remarks && <div><br/><strong>Remarks:</strong><br/>{formData.remarks}</div>}
                  </span>
                </div>
                <div style={{ width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', marginLeft: '20px' }}>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px dotted #000', width: '100%', marginBottom: '5px' }}>
                    {signaturePreview ? <img src={signaturePreview} alt="Signature" style={{ maxHeight: '50px', maxWidth: '150px' }} /> : null}
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#1a4e8a' }}>Doctor's Signature</span>
                </div>
              </div>
            </div>
            
            <div className="print-footer-top" style={{ textAlign: 'center', marginTop: '50px', fontWeight: 'bold', fontSize: '16px' }}>
              <div>Please bring this form while reporting to Dental Hospital.</div>
              <div style={{ position: 'relative', marginTop: '5px' }}>
                Valid upto 3 Months
                <span style={{ position: 'absolute', right: 0 }}>(PTO)</span>
              </div>
            </div>
          </div>


        </div>

        {/* Print styles */}
        <style>{`
          @media screen {
            .print-only-layout {
              display: none !important;
            }
          }
          
          @media print {
            /* Hide absolutely everything using visibility */
            body * {
              visibility: hidden;
            }
            
            /* Show only our print root and its children */
            #camp-periodontics-print-root,
            #camp-periodontics-print-root * {
              visibility: visible;
            }
            
            /* Position our print root at the top left of the page */
            #camp-periodontics-print-root {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* Reset body for clean print */
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            
            /* Hide the blue UI form entirely during print */
            .phd-sheet-shell {
              display: none !important;
              visibility: hidden !important;
            }
            
            /* Hide action buttons */
            .general-case-flex, .allergy-alert {
              display: none !important;
              visibility: hidden !important;
            }
            
            /* Ensure the print layout is visible and looks like the yellow paper */
            .print-only-layout {
              display: block !important;
              background-color: #fdf5ca !important; /* Yellow slip background color */
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              min-height: 100vh;
              padding: 10mm 15mm !important;
              box-sizing: border-box;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default CampPeriodonticsCaseSheet;
