import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import "./Digital_Doctor_Case_Sheet_Periodontics.css";

// ─── Tiny text-input helper ───────────────────────────────────────────────────
function TI({ id }) {
  return <input type="text" id={id} name={id} />;
}

// ─── Gingiva examination table ────────────────────────────────────────────────
function GingivaTable({ prefix, colHeaders }) {
  const rows = [
    "Colour (Buccal)", "Colour (Lingual)",
    "Contour (Buccal)", "Contour (Lingual)",
    "Consistency (Buccal)", "Consistency (Lingual)",
    "Surface Texture (Buccal)", "Surface Texture (Lingual)",
    "Size (Buccal)", "Size (Lingual)",
    "Exudate (Buccal)", "Exudate (Lingual)",
    "Position (Buccal)", "Position (Lingual)",
  ];
  const label = prefix === "maxilla" ? "Maxilla" : "Mandible";
  return (
    <div className="table-container">
      <table className="gingiva-table">
        <thead>
          <tr>
            <th></th>
            {colHeaders.map((h, i) => <th key={i}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>{label}</b></td>
            <td colSpan={4}></td>
          </tr>
          {rows.map((row, ri) => {
            const key = row.toLowerCase().replace(/[^a-z]/g, "_");
            return (
              <tr key={ri}>
                <td className="gingiva-row-label">{row}</td>
                {[1, 2, 3, 4].map(ci => (
                  <td key={ci}><TI id={`${prefix}_${key}_${ci}`} /></td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Probing depth / CAL table ────────────────────────────────────────────────
function MeasurementTable({ idPrefix, teeth, sides }) {
  return (
    <div className="measurement-table-container">
      <table className="measurement-table">
        <thead>
          <tr>
            <th></th>
            {teeth.map(t => <th key={t}>{t}</th>)}
          </tr>
        </thead>
        <tbody>
          {sides.map(side =>
            [1, 2, 3].map((row, ri) => (
              <tr key={`${side}_${row}`}>
                {ri === 0 && <td className="table-label" rowSpan={3}>{side}</td>}
                {teeth.map(t => (
                  <td key={t}>
                    <TI id={`${idPrefix}_${t}_${side.toLowerCase()}_${row}`} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── 16-tooth chart (single data row) ────────────────────────────────────────
function ToothChart16({ prefix }) {
  const sides = ["8r","7r","6r","5r","4r","3r","2r","1r","1l","2l","3l","4l","5l","6l","7l","8l"];
  return (
    <div className="table-container">
      <table className="tooth-chart">
        <thead>
          <tr>
            {[8,7,6,5,4,3,2,1,1,2,3,4,5,6,7,8].map((n, i) => <th key={i}>{n}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            {sides.map(s => <td key={s}><TI id={`${prefix}_${s}`} /></td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── 16-col × 4-row index chart ──────────────────────────────────────────────
function IndexChart({ prefix }) {
  return (
    <div className="table-container">
      <table className="tooth-chart">
        <thead>
          <tr>
            {[8,7,6,5,4,3,2,1,1,2,3,4,5,6,7,8].map((n, i) => <th key={i}>{n}</th>)}
          </tr>
        </thead>
        <tbody>
          {[1,2,3,4].map(ri => (
            <tr key={ri}>
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(ci => (
                <td key={ci}><TI id={`${prefix}_r${ri}_c${ci}`} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Page1() {
  return (
    <>
      <h2>EXTRA ORAL EXAMINATION</h2>
      {[
        ["facial_symmetry","Facial Symmetry:"],
        ["tmj_examination","TMJ Examination:"],
        ["mouth_opening","Mouth Opening:"],
        ["lymph_node_examination","Lymph node Examination:"],
        ["lip_competence","Lip competence:"],
        ["lesions","Lesions:"],
        ["halitosis","Halitosis:"],
      ].map(([id, lbl]) => (
        <div className="form-group" key={id}>
          <label htmlFor={id}>{lbl}</label>
          <input type="text" id={id} name={id} />
        </div>
      ))}

      <h2>Soft Tissues</h2>
      {[
        ["buccal_mucosa","Buccal Mucosa:"],
        ["labial_mucosa","Labial Mucosa:"],
        ["tongue","Tongue:"],
        ["palate","Palate:"],
      ].map(([id, lbl]) => (
        <div className="form-group" key={id}>
          <label htmlFor={id}>{lbl}</label>
          <input type="text" id={id} name={id} />
        </div>
      ))}

      <h2>INTRA ORAL EXAMINATION</h2>
      {[
        ["floor_of_mouth","Floor of the Mouth:"],
        ["vestibule","Vestibule:"],
        ["tonsils","Tonsils:"],
      ].map(([id, lbl]) => (
        <div className="form-group" key={id}>
          <label htmlFor={id}>{lbl}</label>
          <input type="text" id={id} name={id} />
        </div>
      ))}
    </>
  );
}


function Page2() {
  return (
    <>
      <h2>IX) Examination Of Gingiva</h2>
      <GingivaTable
        prefix="maxilla"
        colHeaders={["18,17,16,15,14","13,12,11","21,22,23","24,25,26,27,28"]}
      />
      <br />
      <GingivaTable
        prefix="mandible"
        colHeaders={["48,47,46,45,44","43,42,41","31,32,33","34,35,36,37,38"]}
      />
    </>
  );
}

function Page3() {
  const maxTeeth = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  const mandTeeth = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
  return (
    <>
      <h2>Mucogingival Unit</h2>
      {[
        ["vestibule_examination","Vestibule:"],
        ["frenal_attachment","Frenal Attachment:"],
        ["width_attached_gingiva","Width of Attached Gingiva:"],
      ].map(([id, lbl]) => (
        <div className="form-group" key={id}>
          <label htmlFor={id}>{lbl}</label>
          <input type="text" id={id} name={id} />
        </div>
      ))}

      <h2>Probing depth:</h2>
      <MeasurementTable idPrefix="pd" teeth={maxTeeth} sides={["B","P"]} />
      <MeasurementTable idPrefix="pd" teeth={mandTeeth} sides={["B","L"]} />
    </>
  );
}

function Page4() {
  const maxTeeth = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  const mandTeeth = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
  return (
    <>
      <h2>Clinical Attachement Level:</h2>
      <MeasurementTable idPrefix="cal" teeth={maxTeeth} sides={["B","P"]} />
      <MeasurementTable idPrefix="cal" teeth={mandTeeth} sides={["B","L"]} />

      <div className="table-container">
        <table className="attachment-table">
          <thead>
            <tr>
              <th></th>
              <th>17,16,15,14</th>
              <th>13,12,11</th>
              <th>21,22,23</th>
              <th>24,25,26,27</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="attachment-label"><b>Maxilla</b></td><td colSpan={4}></td></tr>
            {["Recession","Mobility","Furcation"].map(row => (
              <tr key={row}>
                <td className="attachment-label">{row}</td>
                {[1,2,3,4].map(i => <td key={i}><TI id={`${row.toLowerCase()}_${i}`} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <br />
      <div className="table-container">
        <table className="attachment-table">
          <thead>
            <tr>
              <th></th>
              <th>47,46,45,44</th>
              <th>43,42,41</th>
              <th>31,32,33</th>
              <th>34,35,36,37</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="attachment-label"><b>Mandible</b></td><td colSpan={4}></td></tr>
            {["Furcation","Mobility","Recession"].map(row => (
              <tr key={row}>
                <td className="attachment-label">{row}</td>
                {[1,2,3,4].map(i => <td key={i}><TI id={`${row.toLowerCase()}_lower_${i}`} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Page5() {
  return (
    <>
      <h2>X) Plaque index</h2>
      <IndexChart prefix="plaque" />

      <h2>XI) Sulcular bleeding index</h2>
      <IndexChart prefix="sbi" />

      <h2>XII) OHI-S INDEX</h2>
      <div className="table-container">
        <table className="tooth-chart">
          <thead>
            <tr>
              <th></th>
              {[16,11,26,36,31,46].map(t => <th key={t}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {[["DIS-","dis"],["CI-S","cis"]].map(([label, key]) => (
              <tr key={key}>
                <td>{label}</td>
                {[16,11,26,36,31,46].map(t => (
                  <td key={t}><TI id={`ohi_${key}_${t}`} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="form-group" style={{ marginTop: "10px" }}>
        <label htmlFor="ohi_s_total">OHI-S =</label>
        <input type="text" id="ohi_s_total" name="ohi_s_total" />
      </div>

      <h2>XIII) Examination Of The Teeth/Hard Tissue</h2>
      {[
        ["num_teeth","No of teeth:"],
        ["missing_teeth","Missing teeth:"],
        ["overhanging_restorations","Overhanging restorations:"],
        ["impacted_teeth","Impacted teeth:"],
      ].map(([id, lbl]) => (
        <div className="form-group" key={id}>
          <label htmlFor={id}>{lbl}</label>
          <input type="text" id={id} name={id} />
        </div>
      ))}
    </>
  );
}

function Page6() {
  return (
    <>
      <h2>Dental caries</h2>
      <span className="section-sub-label">Maxilla</span>
      <ToothChart16 prefix="caries_max" />
      <span className="section-sub-label">Mandible</span>
      <ToothChart16 prefix="caries_mand" />

      <h2>Restorations</h2>
      <span className="section-sub-label">Maxilla</span>
      <ToothChart16 prefix="rest_max" />
      <span className="section-sub-label">Mandible</span>
      <ToothChart16 prefix="rest_mand" />

      <h2>Wasting diseases (Attrition At, Abrasion - Ab, Erosion - Er)</h2>
      <span className="section-sub-label">Maxilla</span>
      <ToothChart16 prefix="wasting_max" />
      <span className="section-sub-label">Mandible</span>
      <ToothChart16 prefix="wasting_mand" />

      {[
        ["open_contacts","Open contacts:"],
        ["food_impaction","Food impaction:"],
        ["dentinal_hypersensitivity","Dentinal Hypersensitivity:"],
        ["pathological_migration","Pathological Migration:"],
        ["dental_stains","Dental Stains:"],
      ].map(([id, lbl]) => (
        <div className="form-group" key={id}>
          <label htmlFor={id}>{lbl}</label>
          <input type="text" id={id} name={id} />
        </div>
      ))}
    </>
  );
}

function Page7() {
  return (
    <>
      <h2>Occlusal evaluation</h2>
      {[
        ["occlusion_type","Type of Occlusion:"],
        ["centric_occlusion","Centric Occlusion:"],
        ["overjet","Overjet:"],
        ["overbite","Overbite:"],
        ["fremitus_test","Fremitus Test:"],
        ["prematurities","Prematurities:"],
        ["plunger_cusp","Plunger cusp:"],
        ["occlusal_others","Others:"],
      ].map(([id, lbl]) => (
        <div className="form-group" key={id}>
          <label htmlFor={id}>{lbl}</label>
          <input type="text" id={id} name={id} />
        </div>
      ))}

      <h2>XIV) Provisional Diagnosis</h2>
      <div className="form-group">
        <textarea id="provisional_diagnosis" name="provisional_diagnosis" rows={3}></textarea>
      </div>

      <h2>XV) Investigations</h2>
      <div className="form-group">
        <label htmlFor="invest_radiographs">Radiographs:</label>
        <input type="text" id="invest_radiographs" name="invest_radiographs" />
      </div>
    </>
  );
}

function Page8() {
  return (
    <>
      {[
        ["blood_tests","Blood Tests:"],
        ["study_models","Study Models:"],
        ["photographs","Photographs:"],
        ["vitality","Vitality:"],
        ["biopsy_examination","Biopsy Examination:"],
        ["microbiological_examination","Microbiological Examination:"],
      ].map(([id, lbl]) => (
        <div className="form-group" key={id}>
          <label htmlFor={id}>{lbl}</label>
          <input type="text" id={id} name={id} />
        </div>
      ))}
      <h2>XVI) Case Summary</h2>
      <div className="form-group">
        <textarea id="case_summary" name="case_summary" rows={5}></textarea>
      </div>
    </>
  );
}

function Page9() {
  return (
    <>
      <h2>XVII) Differential Diagnosis</h2>
      <div className="form-group">
        <textarea id="differential_diagnosis" name="differential_diagnosis" rows={3}></textarea>
      </div>

      <h2>XVIII) Final Diagnosis</h2>
      <div className="form-group">
        <textarea id="final_diagnosis" name="final_diagnosis" rows={3}></textarea>
      </div>

      <h2>XIX) Risk assessment</h2>
      {[
        ["risk_factors","a. Risk factors:"],
        ["risk_determinants","b. Risk determinants:"],
        ["risk_indicators","c. Risk indicators:"],
        ["risk_predictors_markers","d. Risk predictors / markers:"],
      ].map(([id, lbl]) => (
        <div className="form-group" key={id}>
          <label htmlFor={id}>{lbl}</label>
          <textarea id={id} name={id} rows={2}></textarea>
        </div>
      ))}

      <h2>XX) Prognosis</h2>
      <div className="form-group">
        <textarea id="prognosis" name="prognosis" rows={3}></textarea>
      </div>

      <h2>XXI) Treatment Plan</h2>
      <div className="form-group">
        <textarea id="treatment_plan" name="treatment_plan" rows={5}></textarea>
      </div>
    </>
  );
}

function Page10() {
  return (
    <>
      <h2>XXII) Treatment done</h2>
      <div className="form-group">
        <label htmlFor="treatmentDone">Treatment Done:</label>
        <input type="text" id="treatmentDone" name="treatmentDone" />
      </div>
    </>
  );
}

function Page11({ doctorName, setDoctorName, setSignatureFile, signaturePreviewSrc, setSignaturePreviewSrc, readOnly }) {
  function handleSignatureChange(e) {
    const file = e.target.files[0];
    if (file) {
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onload = ev => setSignaturePreviewSrc(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setSignatureFile(null);
      setSignaturePreviewSrc(null);
    }
  }

  return (
    <>
      <h2>XXIII) Case report</h2>
      <div className="form-group">
        <textarea id="case_report" name="case_report" rows={10}></textarea>
      </div>

      <div className="signature-section">
        <h2>Doctor's Authorization</h2>
        <div className="doctor-fields">
          <div className="form-group">
            <label htmlFor="doctorName" className={readOnly ? '' : 'required-field'}>Doctor's Name:</label>
            <input
              type="text"
              id="doctorName"
              value={doctorName}
              onChange={e => setDoctorName(e.target.value)}
              required={!readOnly}
              readOnly={readOnly}
            />
          </div>
          <div className="form-group">
            <label className={readOnly ? '' : 'required-field'}>Doctor's Signature:</label>
            {readOnly ? (
              // Read-only: just show the image or a placeholder
              signaturePreviewSrc ? (
                <img
                  className="signature-preview"
                  src={signaturePreviewSrc}
                  alt="Doctor's Signature"
                  style={{ maxWidth: '200px', maxHeight: '120px', display: 'block', marginTop: 8, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, padding: 4 }}
                />
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', marginTop: 8 }}>No signature on file</div>
              )
            ) : (
              // Edit mode: file upload
              <>
                <input
                  type="file"
                  id="doctorSignature"
                  accept="image/*"
                  onChange={handleSignatureChange}
                  required
                  style={{
                    display: 'block',
                    marginTop: '8px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: '#f9f9f9',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                {signaturePreviewSrc && (
                  <img
                    className="signature-preview"
                    src={signaturePreviewSrc}
                    alt="Signature Preview"
                    style={{ marginTop: '8px', border: '1px solid #ddd', padding: '4px', borderRadius: '4px' }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Consent redirect: if the route was entered with requestConsentAfterEntry,
// forward to the consent form and return after approval.
const CASE_CONSENT_NAV_STATE_KEY = 'caseSheetConsentApproved';

function useConsentRedirect(readOnly) {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (readOnly) return;
    const navState = location.state || {};
    if (!navState.requestConsentAfterEntry) return;
    if (navState[CASE_CONSENT_NAV_STATE_KEY]) return;
    const redirectTarget = `${location.pathname}${location.search}`;
    navigate(`/consent-form?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
  }, [location, navigate, readOnly]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TOTAL_PAGES = 11;

export default function Digital_Doctor_Case_Sheet_Periodontics({ initialCaseData, readOnly = false }) {
  useConsentRedirect(readOnly);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [doctorName, setDoctorName] = useState(() => {
    if (initialCaseData?.doctorName) return initialCaseData.doctorName;
    return localStorage.getItem('doctorName') || localStorage.getItem('ugName') || localStorage.getItem('pgName') || '';
  });
  const [signatureFile, setSignatureFile] = useState(null);
  const getSignatureUrl = (sig) => {
    if (!sig) return null;
    if (typeof sig === 'string') return sig;
    if (sig.data && Array.isArray(sig.data.data)) {
      const bytes = new Uint8Array(sig.data.data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return `data:${sig.contentType || 'image/png'};base64,${btoa(binary)}`;
    }
    return null;
  };

  const [signaturePreviewSrc, setSignaturePreviewSrc] = useState(() => getSignatureUrl(initialCaseData?.digitalSignature));
  const [allergyMessage, setAllergyMessage] = useState('Loading allergies...');
  const [showAllergy, setShowAllergy] = useState(true);
  const [criticalCondition, setCriticalCondition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  // Inject saved field values into DOM inputs when in readOnly mode
  useEffect(() => {
    if (!readOnly || !initialCaseData || !formRef.current) return;
    // Small delay to let the page render first
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

  const patientId = localStorage.getItem('CurrentpatientId') || '';
  const patientName = localStorage.getItem('CurrentpatientName') || '';

  const isFirstPage = currentPage === 0;
  const isLastPage  = currentPage === TOTAL_PAGES - 1;
  const canSubmit   = doctorName.trim() !== "" && signatureFile !== null && !isSubmitting;

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
      const patientId = localStorage.getItem('CurrentpatientId');
      if (!patientId) {
        if (isMounted) setAllergyMessage('No known allergies');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let patient = null;

        const response1 = await fetch(`${API_BASE_URL}/api/doctor-patient/${patientId}`, { headers });
        if (response1.ok) {
          patient = extractPatient(await response1.json());
        }

        if (!patient) {
          const response2 = await fetch(`${API_BASE_URL}/api/patient-details/by-patient-id/${patientId}`, { headers });
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

        if (critical && isMounted) setCriticalCondition(critical);
        if (drug) setAllergyMessage(`Drug Allergies: ${drug}`);
        else if (known) setAllergyMessage(`Known Allergies: ${known}`);
        else if (diet) setAllergyMessage(`Diet Allergies: ${diet}`);
        else setAllergyMessage('No known allergies');
      } catch {
        if (isMounted) setAllergyMessage('No known allergies');
      }
    };

    loadAllergy();
    return () => { isMounted = false; };
  }, []);

  const formatAllergyTicker = (raw) => {
    const text = (raw || '').trim();
    if (!text) return 'Drug Allergies: None';
    if (/^loading/i.test(text)) return text;
    const withoutPrefix = text.replace(/^\s*(Drug\s*Allerg(?:y|ies)|Known\s*Allergies|Diet\s*Allergies)\s*:\s*/i, '');
    if (/^(no known allergies|nil|none)$/i.test(withoutPrefix.trim())) return 'Drug Allergies: None';
    const items = withoutPrefix.split(/[|,]/).map(x => x.trim()).filter(Boolean);
    return `Drug Allergies: ${items.length ? items.join(' | ') : 'None'}`;
  };

  function goNext() {
    if (!isLastPage) {
      setCurrentPage(p => p + 1);
    }
  }

  function goPrev() {
    if (!isFirstPage) {
      setCurrentPage(p => p - 1);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) {
      alert("Please complete all required fields before submitting.");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const doctorId = localStorage.getItem('pgId') || localStorage.getItem('ugId') || localStorage.getItem('doctorId') || '';
      const token = localStorage.getItem('token');

      // Collect all text/textarea values from the form
      const formEl = formRef.current;
      const formFields = {};
      if (formEl) {
        const inputs = formEl.querySelectorAll('input[type="text"], input[type="number"], textarea');
        inputs.forEach((input) => {
          const key = input.id || input.name;
          if (key) {
            formFields[key] = (input.value || '').trim();
          }
        });
      }

      const caseData = {
        patientId,
        patientName,
        doctorId,
        doctorName,
        diagnosis: formFields.provisional_diagnosis || formFields.final_diagnosis || 'Periodontics Long Case',
        treatment: formFields.treatmentDone || formFields.treatment_plan || '',
        treatmentPlan: formFields.treatment_plan || '',
        finalDiagnosis: formFields.final_diagnosis || formFields.provisional_diagnosis || '',
        digitalSignature: signaturePreviewSrc,
        caseType: 'long',
        // Include all collected form fields as additional data
        ...formFields,
      };

      const response = await fetch(`${API_BASE_URL}/api/casesheets/periodontics/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(caseData),
      });

      const json = await response.json();

      if (!response.ok || json.success === false) {
        throw new Error(json.message || 'Failed to submit Periodontics case');
      }

      // Show success and navigate
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
          <p style="color: rgb(30, 58, 138); font-weight: bold; margin-bottom: 16px;">Periodontics long case sheet submitted successfully!</p>
          <button id="closeLongCaseModal" style="background-color: rgb(30, 58, 138); color: white; padding: 8px 24px; border-radius: 8px; font-weight: bold; border: none; cursor: pointer;">OK</button>
        </div>
      `;
      document.body.appendChild(confirmBox);
      document.getElementById('closeLongCaseModal').onclick = () => {
        document.body.removeChild(confirmBox);
        if (formRef.current) formRef.current.reset();
        setDoctorName("");
        setSignatureFile(null);
        setSignaturePreviewSrc(null);
        setCurrentPage(0);
        setIsSubmitting(false);
        window.scrollTo(0, 0);
        window.location.href = '/prescriptions';
      };
    } catch (error) {
      alert(`Error submitting case: ${error.message}`);
      setIsSubmitting(false);
    }
  }

  // Build page list — only last page gets state props
  const pageComponents = [
    <Page1 />, <Page2 />, <Page3 />, <Page4 />,
    <Page5 />, <Page6 />, <Page7 />, <Page8 />, <Page9 />, <Page10 />,
    <Page11
      doctorName={doctorName}
      setDoctorName={setDoctorName}
      setSignatureFile={setSignatureFile}
      signaturePreviewSrc={signaturePreviewSrc}
      setSignaturePreviewSrc={setSignaturePreviewSrc}
      readOnly={readOnly}
    />,
  ];

  return (
    <div className="page-wrapper periodontics-page-wrapper">
      <div className="status-bar">
        <span className="status-bar-pid">
          {patientId
            ? <>Patient: <strong>{patientName || patientId}</strong> &nbsp;|&nbsp; ID: {patientId}</>
            : 'No patient loaded'}
        </span>
      </div>

      {showAllergy && (
        <div className="allergy-alert">
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

      <div className="case-sheet">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="header-section">
          <img
            src="/images/logo.png"
            alt="SRM Dental College Logo"
            className="header-logo"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/logo.png';
            }}
          />
          <h2 className="college-title">SRM Dental College</h2>
          <h3>DEPARTMENT OF PERIODONTICS</h3>
          <h4>LONG CASE SHEET</h4>
        </div>

        {/* ── Form ───────────────────────────────────────────────────────── */}
        <form ref={formRef} id="periodonticsForm" onSubmit={e => e.preventDefault()}>

          {/* Render only the current page */}
          <fieldset disabled={readOnly} style={{ border: 'none', margin: 0, padding: 0 }}>
            <div className="page active">
              {pageComponents[currentPage]}
            </div>
          </fieldset>

          {/* ── Navigation ─────────────────────────────────────────────── */}
          <div className="navigation">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirstPage}
            >
              Back
            </button>

            {isLastPage ? (
              !readOnly && (
                <button
                  type="button"
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Case Sheet'}
                </button>
              )
            ) : (
              <button type="button" onClick={goNext}>
                Next
              </button>
            )}
          </div>

          <div className="page-indicator">
            Page {currentPage + 1} of {TOTAL_PAGES}
          </div>
        </form>
      </div>
    </div>
  );
}
