import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

const ALLOWED_APPOINTMENT_TIMES = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "2:00 PM",
  "2:30 PM",
];

const App = ({ initialCaseData, readOnly = false }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [doctorName, setDoctorName] = useState(() => {
    if (initialCaseData?.doctorName) return initialCaseData.doctorName;
    return localStorage.getItem('doctorName') || localStorage.getItem('ugName') || localStorage.getItem('pgName') || '';
  });
  const [signatureFile, setSignatureFile] = useState(null);
  const getSignatureUrl = (sig) => {
    if (!sig) return "";
    if (typeof sig === 'string') return sig;
    if (sig.data && Array.isArray(sig.data.data)) {
      const bytes = new Uint8Array(sig.data.data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return `data:${sig.contentType || 'image/png'};base64,${btoa(binary)}`;
    }
    return "";
  };

  const [signaturePreviewSrc, setSignaturePreviewSrc] = useState(() => getSignatureUrl(initialCaseData?.digitalSignature));
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allergyMessage, setAllergyMessage] = useState('Loading allergies...');
  const [showAllergy, setShowAllergy] = useState(true);
  const [appointmentDate, setAppointmentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [appointmentTime, setAppointmentTime] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [criticalCondition, setCriticalCondition] = useState('');

  const getTodayIso = () => new Date().toISOString().slice(0, 10);

  const navigate = useNavigate();
  const signatureInputRef = useRef(null);
  const formRef = useRef(null);
  const totalPages = 7;
  const patientId = (initialCaseData?.patientId) || localStorage.getItem('CurrentpatientId') || '';
  const patientName = (initialCaseData?.patientName) || localStorage.getItem('CurrentpatientName') || '';

  // Consent redirect handling
  const CASE_CONSENT_NAV_STATE_KEY = 'caseSheetConsentApproved';
  const location = useLocation();
  useEffect(() => {
    if (readOnly) return;
    const navState = location.state || {};
    if (!navState.requestConsentAfterEntry) return;
    if (navState[CASE_CONSENT_NAV_STATE_KEY]) return;
    const redirectTarget = `${location.pathname}${location.search}`;
    navigate(`/consent-form?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
  }, [location, navigate, readOnly]);

  // Inject saved field values into DOM inputs when in readOnly mode
  useEffect(() => {
    if (!readOnly || !initialCaseData || !formRef.current) return;
    const timer = setTimeout(() => {
      if (!formRef.current) return;
      const inputs = formRef.current.querySelectorAll('input[id], input[name], textarea[id], textarea[name]');
      inputs.forEach((el) => {
        const key = el.id || el.name;
        if (key && initialCaseData[key] !== undefined && initialCaseData[key] !== null) {
          el.value = String(initialCaseData[key]);
        }
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [readOnly, initialCaseData, currentPage]);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, [currentPage]);

  useEffect(() => {
    let isMounted = true;

    const toListString = (value) => {
      if (Array.isArray(value)) {
        return value.map(v => String(v).trim()).filter(Boolean).join(', ');
      }
      return String(value || '').trim();
    };

    const extractPatient = (response) => {
      if (Array.isArray(response?.data)) return response.data[0] || null;
      if (response?.data) return response.data;
      return null;
    };

    const loadAllergy = async () => {
      const pid = localStorage.getItem('CurrentpatientId');
      if (!pid) {
        if (isMounted) setAllergyMessage('No known allergies');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let patient = null;

        const response1 = await fetch(`${API_BASE_URL}/api/doctor-patient/${pid}`, { headers });
        if (response1.ok) {
          patient = extractPatient(await response1.json());
        }

        if (!patient) {
          const response2 = await fetch(`${API_BASE_URL}/api/patient-details/by-patient-id/${pid}`, { headers });
          if (response2.ok) {
            patient = extractPatient(await response2.json());
          }
        }

        if (!isMounted) return;
        if (!patient) {
          setAllergyMessage('No known allergies');
          return;
        }

        const drug = toListString(patient.vitals?.drugAllergies);
        const known = toListString(patient.medicalInfo?.knownAllergies);
        const diet = toListString(patient.vitals?.dietAllergies);
        const critical = String(patient.vitals?.criticalCondition || '').trim();

        if (drug) setAllergyMessage(`Drug Allergies: ${drug}`);
        else if (known) setAllergyMessage(`Known Allergies: ${known}`);
        else if (diet) setAllergyMessage(`Diet Allergies: ${diet}`);
        else setAllergyMessage('No known allergies');

        if (critical) setCriticalCondition(critical);
      } catch {
        if (isMounted) setAllergyMessage('No known allergies');
      }
    };

    loadAllergy();
    if (patientId) fetchPatientEmail();
    return () => { isMounted = false; };
  }, [patientId]);

  const checkRequiredFields = (nameVal, fileVal) => {
    const n = nameVal !== undefined ? nameVal : doctorName;
    const f = fileVal !== undefined ? fileVal : signatureFile;
    setSubmitDisabled(!(n.trim() !== "" && f !== null));
  };

  const handleDoctorNameChange = (e) => {
    setDoctorName(e.target.value);
    checkRequiredFields(e.target.value, undefined);
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setSignaturePreviewSrc(ev.target.result);
      reader.readAsDataURL(file);
      checkRequiredFields(undefined, file);
    } else {
      setSignatureFile(null);
      setSignaturePreviewSrc("");
      checkRequiredFields(undefined, null);
    }
  };

  const fetchPatientEmail = async () => {
    if (!patientId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/email-retrieve/${encodeURIComponent(patientId)}`);
      const json = await response.json();
      if (response.ok && json.success && json.email) {
        setPatientEmail(String(json.email || '').trim());
      }
    } catch (error) {
      console.warn('Unable to fetch patient email for appointment booking:', error);
    }
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

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const isValid = doctorName.trim() !== "" && signatureFile !== null;
    if (!doctorName.trim()) {
      alert("Please enter doctor's name");
      return;
    }
    if (!signatureFile) {
      alert("Please upload a signature image");
      return;
    }
    if (isValid) {
      setIsSubmitting(true);

      if ((appointmentDate && !appointmentTime) || (!appointmentDate && appointmentTime)) {
        alert('Please select both appointment date and time, or leave both blank.');
        setIsSubmitting(false);
        return;
      }

      if (appointmentDate && appointmentDate < getTodayIso()) {
        alert('Appointment date cannot be in the past.');
        setIsSubmitting(false);
        return;
      }

      if (appointmentTime && !ALLOWED_APPOINTMENT_TIMES.includes(appointmentTime)) {
        alert('Please choose a valid appointment time from the available options.');
        setIsSubmitting(false);
        return;
      }

      // Prepare form data to send to backend
      const doctorId = localStorage.getItem('pgId') || localStorage.getItem('ugId') || localStorage.getItem('doctorId') || '';
      const token = localStorage.getItem('token');

      const caseData = {
        patientId,
        patientName,
        diagnosis: 'Periodontics case', // Placeholder - would be collected from form
        treatment: 'Treatment pending',
        treatmentPlan: doctorName,
        finalDiagnosis: 'Pending doctor approval',
        digitalSignature: signaturePreviewSrc,
        caseType: 'short',
        doctorId,
        doctorName
      };

      const editCaseId = localStorage.getItem('redoEditCaseId');
      const isRedoEdit = !!editCaseId;
      const endpoint = isRedoEdit
        ? `${API_BASE_URL}/api/casesheets/${encodeURIComponent(editCaseId)}`
        : `${API_BASE_URL}/api/casesheets/periodontics/save`;
      const method = isRedoEdit ? 'PUT' : 'POST';

      try {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(caseData)
        });

        const json = await response.json();

        if (!response.ok || json.success === false) {
          throw new Error(json.message || 'Failed to submit Periodontics case');
        }

        if (appointmentDate && appointmentTime) {
          try {
            const bookingResponse = await fetch(`${API_BASE_URL}/api/appointment/appointments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                patientId,
                patientEmail: patientEmail || `${patientId}@temp.com`,
                department: 'Periodontics',
                chiefComplaint: 'Periodontics follow-up',
                appointmentDate,
                appointmentTime,
              }),
            });
            const bookingJson = await bookingResponse.json();
            if (!bookingResponse.ok || bookingJson.success === false) {
              console.warn('Appointment booking failed:', bookingJson.message || 'unknown error');
            }
          } catch (bookingError) {
            console.warn('Appointment booking error:', bookingError);
          }
        }

        const confirmBox = document.createElement('div');
        confirmBox.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
        `;
        confirmBox.innerHTML = `
          <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; max-width: 350px; width: 100%;">
            <p style="color: rgb(30, 58, 138); font-weight: bold; margin-bottom: 16px;">Periodontics case sheet submitted successfully!</p>
            <button id="closeModal" style="background-color: rgb(30, 58, 138); color: white; padding: 8px 24px; border-radius: 8px; font-weight: bold; border: none; cursor: pointer;">OK</button>
          </div>
        `;
        document.body.appendChild(confirmBox);
        document.getElementById('closeModal').onclick = () => {
          document.body.removeChild(confirmBox);
          const form = document.getElementById("periodonticsForm");
          if (form) form.reset();
          const wasRedoEdit = isRedoEdit;
          localStorage.removeItem('redoEditCaseId');
          localStorage.removeItem('redoEditDepartmentKey');
          setDoctorName("");
          setSignatureFile(null);
          setSignaturePreviewSrc("");
          setAppointmentDate(getTodayIso());
          setAppointmentTime('');
          setSubmitDisabled(true);
          setCurrentPage(0);
          setIsSubmitting(false);
          window.location.href = wasRedoEdit ? '/pg-dashboard' : '/prescriptions';
        };
      } catch (error) {
        alert(`Error submitting case: ${error.message}`);
        setIsSubmitting(false);
      }
    }
  };

  const goNext = () => {
    if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
  };

  const goPrev = () => {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  const isLastPage = currentPage === totalPages - 1;

  // Render Table Row Helper
  const renderRow = (label, count = 4) => (
    <tr>
      <td className="table-label">{label}</td>
      <td><input type="text" /></td>
      <td><input type="text" /></td>
      {[...Array(count)].map((_, i) => (
        <td key={i}><input type="text" /></td>
      ))}
    </tr>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: '40px 20px',
      backgroundImage: 'linear-gradient(rgba(6, 12, 42, 0.56), rgba(6, 12, 42, 0.56)), url("/images/campus.png")',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      backgroundPosition: 'center'
    }}>
      <style>{`
        .case-sheet {
          background-color: rgba(38, 40, 107, 0.95);
          border-radius: 12px;
          padding: 30px;
          width: 100%;
          max-width: 900px;
          color: white;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          margin: 0 auto;
        }

        h2 {
          border-bottom: 2px solid rgba(255,255,255,0.2);
          padding-bottom: 8px;
          margin-top: 25px;
          margin-bottom: 15px;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }

        h3 {
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 1.2rem;
          font-weight: 600;
          color: white;
        }

        .form-group {
          margin-bottom: 15px;
        }

        label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
          font-size: 0.95rem;
        }

        input[type="text"],
        input[type="number"],
        textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          background-color: rgba(255, 255, 255, 0.95);
          color: #1e3a8a;
          font-size: 1rem;
          transition: all 0.2s;
        }

        input:focus, textarea:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.4);
        }

        .table-container {
          overflow-x: auto;
          margin-bottom: 25px;
          background: rgba(0,0,0,0.2);
          padding: 1px;
          border-radius: 8px;
        }

        table {
          width: 100%;
          min-width: 650px;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        th, td {
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 8px 4px;
          text-align: center;
        }

        th {
          background-color: rgba(255, 255, 255, 0.1);
          color: #fff;
          font-weight: 600;
        }

        td input {
          width: 100% !important;
          padding: 4px !important;
          min-height: auto !important;
          text-align: center;
          border: none !important;
          background: white !important;
        }

        .navigation {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .nav-btn {
          padding: 10px 24px;
          background-color: white;
          color: #1e3a8a;
          font-weight: bold;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .nav-btn:hover:not(:disabled) {
          background-color: #f1f5f9;
          transform: translateY(-1px);
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-btn {
          background-color: #22c55e;
          color: white;
          padding: 12px 32px;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #16a34a;
        }

        .signature-preview {
          max-width: 150px;
          height: auto;
          margin-top: 10px;
          border: 2px dashed rgba(255,255,255,0.3);
          border-radius: 4px;
        }

        .animate-in {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        width: '90%',
        maxWidth: '900px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '0.82rem',
        color: 'rgba(255, 255, 255, 0.85)',
        flexWrap: 'wrap',
        gap: '6px',
        marginTop: '40px',
        fontWeight: 600
      }}>
        <span>
          {patientId
            ? <>Patient: <strong>{patientName || patientId}</strong> &nbsp;|&nbsp; ID: {patientId}</>
            : 'No patient loaded'}
        </span>
      </div>


      {showAllergy && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100vw',
          background: '#ffffff',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          boxShadow: '0 3px 12px rgba(0,0,0,0.16)',
          zIndex: 9999,
          borderBottom: '1px solid rgba(0,0,0,0.08)'
        }}>
          <span style={{ fontSize: '18px', color: '#b91c1c', flexShrink: 0 }}>⚠️</span>
          <div style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '10px 12px'
          }}>
            <span style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              color: '#7f1d1d',
              fontWeight: 700,
              fontSize: '0.95rem',
              animation: 'allergyTextFlow 14s linear infinite'
            }}>
              {formatAllergyTicker(allergyMessage)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAllergy(false)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              fontSize: '22px',
              color: '#7f1d1d',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 6px'
            }}
          >
            ×
          </button>
          <style>{`
            @keyframes allergyTextFlow {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100vw); }
            }
          `}</style>
        </div>
      )}

      <div className="case-sheet">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/images/logo.png"
            alt="SRM Dental College Logo"
            style={{
              width: '88px',
              height: '88px',
              objectFit: 'contain',
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.75)',
              background: 'rgba(255,255,255,0.05)',
              display: 'block',
              margin: '0 auto 14px auto'
            }}
            onError={(e) => {
              e.currentTarget.src = '/logo.png';
            }}
          />
          <h1 className="text-3xl font-bold tracking-tight">SRM Dental College</h1>
          <p className="text-white font-medium tracking-widest mt-1 opacity-80 uppercase">Department of Periodontics</p>
          <div className="mt-4 h-6"></div>
        </div>

        <form ref={formRef} id="periodonticsForm" onSubmit={(e) => e.preventDefault()}>
          <fieldset disabled={readOnly} style={{ border: 'none', margin: 0, padding: 0 }}>

            {/* Page 1: Extra & Intra Oral */}
            {currentPage === 0 && (
              <div className="animate-in">
                <h2>1. Extra – Oral Examination</h2>
                {["Facial Symmetry", "TMJ Examination", "Mouth Opening", "Lymph Node Examination", "Lip Competence"].map((label) => (
                  <div className="form-group" key={label}>
                    <label>{label}:</label>
                    <input type="text" />
                  </div>
                ))}

                <h2>2. Intra – Oral Examination (Soft Tissues)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["Buccal mucosa", "Labial mucosa", "Palatal/lingual mucosa", "Tongue", "Palate", "Floor of mouth", "Vestibule", "Tonsils"].map((label) => (
                    <div className="form-group" key={label}>
                      <label>{label}:</label>
                      <input type="text" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Page 2: Gingiva Tables */}
            {currentPage === 1 && (
              <div className="animate-in">
                <h2>3. Periodontal Examination - Gingiva</h2>

                <h3>Maxilla</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th rowSpan="2">Feature</th>
                        <th colSpan="2">Surface</th>
                        <th colSpan="4">Tooth Groups</th>
                      </tr>
                      <tr>
                        <th>Buccal</th>
                        <th>Palatal</th>
                        <th>18-14</th>
                        <th>13-11</th>
                        <th>21-23</th>
                        <th>24-28</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["Color", "Contour", "Consistency", "Surface Texture", "Position"].map((f) => renderRow(f))}
                    </tbody>
                  </table>
                </div>

                <h3>Mandible</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th rowSpan="2">Feature</th>
                        <th colSpan="2">Surface</th>
                        <th colSpan="4">Tooth Groups</th>
                      </tr>
                      <tr>
                        <th>Buccal</th>
                        <th>Lingual</th>
                        <th>48-45</th>
                        <th>43-41</th>
                        <th>31-33</th>
                        <th>34-38</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["Color", "Contour", "Consistency", "Surface Texture", "Position"].map((f) => renderRow(f))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Page 3: Mucogingival & Depth */}
            {currentPage === 2 && (
              <div className="animate-in">
                <h2>Mucogingival Unit</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Mucogingival Junction:</label>
                    <input type="text" />
                  </div>
                  <div className="form-group">
                    <label>Width of Attached Gingiva (mm):</label>
                    <input type="text" />
                  </div>
                  <div className="form-group">
                    <label>Frenal Attachment:</label>
                    <input type="text" />
                  </div>
                  <div className="form-group">
                    <label>Vestibular Depth (mm):</label>
                    <input type="text" />
                  </div>
                </div>

                <div className="form-group mt-2">
                  <label>Other Findings:</label>
                  <textarea rows="3"></textarea>
                </div>

                <h2>Probing Depth (mm)</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Quadrant</th>
                        <th>Distal</th>
                        <th>Mid</th>
                        <th>Mesial</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["Maxillary Right", "Maxillary Left", "Mandibular Right", "Mandibular Left"].map(q => (
                        <tr key={q}>
                          <td className="font-bold">{q}</td>
                          <td><input type="number" /></td>
                          <td><input type="number" /></td>
                          <td><input type="number" /></td>
                          <td><input type="text" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Page 4: Recession/Mobility/OHIS */}
            {currentPage === 3 && (
              <div className="animate-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h2>Recession & Mobility</h2>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr><th>Tooth</th><th>Recession (mm)</th><th>Mobility (Gr)</th></tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3, 4].map(i => (
                            <tr key={i}>
                              <td><input type="text" placeholder="#" /></td>
                              <td><input type="text" /></td>
                              <td><input type="text" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h2>Oral Hygiene Index- simplified</h2>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr><th>Segment</th><th>Debris</th><th>Calculus</th></tr>
                        </thead>
                        <tbody>
                          {["Upper", "Lower"].map(s => (
                            <tr key={s}>
                              <td className="font-bold">{s}</td>
                              <td><input type="text" /></td>
                              <td><input type="text" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <h2>13. Examination of Teeth / Hard Tissue</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>No. of teeth:</label>
                    <input type="number" />
                  </div>
                  <div className="form-group">
                    <label>Missing teeth:</label>
                    <input type="text" />
                  </div>
                </div>
              </div>
            )}

            {/* Page 5: Hard Tissue Cont. */}
            {currentPage === 4 && (
              <div className="animate-in">
                <h2>13. Examination of Teeth / Hard Tissue (Continued)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Overhanging restorations", "Dental caries", "Restored",
                    "Food impaction", "Pathological migrations", "Open contacts",
                    "Dental hypersensitivity", "Wasting disease"
                  ].map(label => (
                    <div className="form-group" key={label}>
                      <label>{label}:</label>
                      <input type="text" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Page 6: Summary */}
            {currentPage === 5 && (
              <div className="animate-in">
                <h2>14. Investigations</h2>
                <div className="form-group">
                  <label>Investigations:</label>
                  <textarea rows="4"></textarea>
                </div>

                <h2>15. Case Summary</h2>
                <div className="form-group">
                  <label>Case Summary:</label>
                  <textarea rows="6"></textarea>
                </div>
              </div>
            )}

            {/* Page 7: Diagnosis, Risk & Plan */}
            {currentPage === 6 && (
              <div className="animate-in">
                <h2>16. Diagnosis</h2>
                <div className="form-group">
                  <label>Diagnosis:</label>
                  <textarea rows="2"></textarea>
                </div>

                <h2>17. Risk Assessment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["a. Risk factors", "b. Risk determinants", "c. Risk indicators", "d. Risk predictors"].map(label => (
                    <div className="form-group" key={label}>
                      <label>{label}:</label>
                      <textarea rows="2"></textarea>
                    </div>
                  ))}
                </div>

                <h2>18. Treatment Plan</h2>
                <div className="form-group">
                  <label>Treatment Plan:</label>
                  <textarea rows="3"></textarea>
                </div>

                <div className="mt-8 p-6 bg-white/10 rounded-xl border border-white/20">
                  <h2 className="mt-0 border-none text-white">Doctor's Authorization</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="after:content-['*'] after:ml-1 after:text-red-400">Doctor's Name:</label>
                      <input
                        type="text"
                        value={doctorName}
                        onChange={handleDoctorNameChange}
                        className="bg-white text-blue-900"
                      />
                    </div>
                    <div className="form-group">
                      <label className={readOnly ? '' : "after:content-['*'] after:ml-1 after:text-red-400"}>Signature Image:</label>
                      {readOnly ? (
                        signaturePreviewSrc ? (
                          <img
                            src={signaturePreviewSrc}
                            alt="Signature"
                            className="signature-preview"
                            style={{ maxWidth: '200px', maxHeight: '120px', display: 'block', marginTop: 8 }}
                          />
                        ) : (
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', marginTop: 8 }}>No signature on file</div>
                        )
                      ) : (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            ref={signatureInputRef}
                            onChange={handleSignatureChange}
                            className="bg-white text-blue-900 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {signaturePreviewSrc && (
                            <img
                              src={signaturePreviewSrc}
                              alt="Preview"
                              className="signature-preview"
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!readOnly && (
                  <div style={{ marginTop: '24px', padding: '18px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}>
                    <h2 style={{ marginTop: 0 }}>Optional Follow-up Appointment</h2>
                    <p style={{ marginBottom: '14px', color: '#d1d5db' }}>
                      Schedule a patient appointment when you finish the case sheet. Leave blank to skip booking.
                    </p>
                    <div className="form-group">
                      <label htmlFor="appointmentDate">Appointment Date:</label>
                      <input
                        type="date"
                        id="appointmentDate"
                        value={appointmentDate}
                        min={getTodayIso()}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        disabled={readOnly}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="appointmentTime">Appointment Time:</label>
                      <select
                        id="appointmentTime"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        disabled={readOnly}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                      >
                        <option value="">Select time</option>
                        {ALLOWED_APPOINTMENT_TIMES.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    {patientEmail ? (
                      <p style={{ marginTop: '10px', color: '#cbd5e1' }}><strong>Patient email:</strong> {patientEmail}</p>
                    ) : (
                      <p style={{ marginTop: '10px', color: '#fbbf24' }}>Patient email not available. Appointment booking will use a fallback address.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </fieldset>

          {/* Navigation */}
          <div className="navigation">
            <button
              type="button"
              className="nav-btn"
              onClick={goPrev}
              disabled={currentPage === 0}
            >
              Back
            </button>
            {isLastPage ? (
              !readOnly && (
                <button
                  type="button"
                  disabled={submitDisabled || isSubmitting}
                  onClick={handleSubmit}
                  className="nav-btn submit-btn"
                >
                  Submit Complete Case Sheet
                </button>
              )
            ) : (
              <button
                type="button"
                className="nav-btn"
                onClick={goNext}
              >
                Next
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;