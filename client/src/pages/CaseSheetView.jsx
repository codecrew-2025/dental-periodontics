import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./CaseSheetView.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const decodeSignature = (sig) => {
  if (!sig) return null;
  if (typeof sig === "string") {
    if (sig.startsWith("data:")) return sig;
    if (sig.length > 100) return `data:image/png;base64,${sig}`;
    return null;
  }
  // Buffer object from MongoDB: { data: { type: 'Buffer', data: [...] }, contentType }
  try {
    const buf = sig?.data;
    let bytes;
    if (buf?.type === "Buffer" && Array.isArray(buf.data)) {
      bytes = new Uint8Array(buf.data);
    } else if (Array.isArray(buf)) {
      bytes = new Uint8Array(buf);
    } else {
      return null;
    }
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    const ct = sig.contentType || "image/png";
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
};

const Field = ({ label, value }) => (
  <div className="form-group-casesheet">
    <label>{label}</label>
    <div className="readonly-field">{value || "—"}</div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ fontSize: 16, color: "#1e3a8a", borderBottom: "2px solid #1e3a8a", paddingBottom: 4, marginBottom: 12 }}>
      {title}
    </h2>
    {children}
  </div>
);

// ─── Periodontics Read-Only View ──────────────────────────────────────────────

function PeriodonticsCaseView({ caseData }) {
  const sigSrc = decodeSignature(caseData?.digitalSignature);

  return (
    <div>
      <Section title="Patient Information">
        <Field label="Patient Name" value={caseData.patientName} />
        <Field label="Patient ID" value={caseData.patientId} />
        <Field label="Doctor" value={caseData.doctorName} />
        <Field label="Date" value={caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString("en-GB") : "—"} />
      </Section>

      <Section title="Medical & Dental History">
        <Field label="Medical History" value={caseData.medicalHistory} />
        <Field label="Dental History" value={caseData.dentalHistory} />
        <Field label="Current Medications" value={caseData.currentMedications} />
        <Field label="Allergies" value={caseData.allergies} />
      </Section>

      <Section title="Extra Oral Examination">
        <Field label="Facial Symmetry" value={caseData.facial_symmetry} />
        <Field label="TMJ Examination" value={caseData.tmj_examination} />
        <Field label="Mouth Opening" value={caseData.mouth_opening} />
        <Field label="Lymph Node Examination" value={caseData.lymph_node_examination} />
        <Field label="Lip Competence" value={caseData.lip_competence} />
        <Field label="Lesions" value={caseData.lesions} />
        <Field label="Halitosis" value={caseData.halitosis} />
      </Section>

      <Section title="Soft Tissues">
        <Field label="Buccal Mucosa" value={caseData.buccal_mucosa} />
        <Field label="Labial Mucosa" value={caseData.labial_mucosa} />
        <Field label="Tongue" value={caseData.tongue} />
        <Field label="Palate" value={caseData.palate} />
      </Section>

      <Section title="Intra Oral Examination">
        <Field label="Floor of Mouth" value={caseData.floor_of_mouth} />
        <Field label="Vestibule" value={caseData.vestibule} />
        <Field label="Tonsils" value={caseData.tonsils} />
      </Section>

      <Section title="Mucogingival Unit">
        <Field label="Vestibule Examination" value={caseData.vestibule_examination} />
        <Field label="Frenal Attachment" value={caseData.frenal_attachment} />
        <Field label="Width of Attached Gingiva" value={caseData.width_attached_gingiva} />
      </Section>

      <Section title="Clinical Examination">
        <Field label="Probing" value={caseData.probing} />
        <Field label="Bleeding" value={caseData.bleeding} />
        <Field label="Pocketing" value={caseData.pocketing} />
        <Field label="Furcation" value={caseData.furcation} />
        <Field label="Attachment" value={caseData.attachment} />
        <Field label="Mobility" value={caseData.mobility} />
      </Section>

      <Section title="Indices">
        <Field label="OHI-S Total" value={caseData.ohi_s_total} />
        <Field label="No. of Teeth" value={caseData.num_teeth} />
        <Field label="Missing Teeth" value={caseData.missing_teeth} />
        <Field label="Overhanging Restorations" value={caseData.overhanging_restorations} />
        <Field label="Impacted Teeth" value={caseData.impacted_teeth} />
      </Section>

      <Section title="Occlusal Evaluation">
        <Field label="Type of Occlusion" value={caseData.occlusion_type} />
        <Field label="Centric Occlusion" value={caseData.centric_occlusion} />
        <Field label="Overjet" value={caseData.overjet} />
        <Field label="Overbite" value={caseData.overbite} />
        <Field label="Fremitus Test" value={caseData.fremitus_test} />
        <Field label="Prematurities" value={caseData.prematurities} />
        <Field label="Plunger Cusp" value={caseData.plunger_cusp} />
        <Field label="Others" value={caseData.occlusal_others} />
      </Section>

      <Section title="Diagnosis">
        <Field label="Provisional Diagnosis" value={caseData.provisional_diagnosis || caseData.diagnosis} />
        <Field label="Differential Diagnosis" value={caseData.differential_diagnosis || caseData.differentialDiagnosis} />
        <Field label="Final Diagnosis" value={caseData.final_diagnosis || caseData.finalDiagnosis} />
      </Section>

      <Section title="Investigations">
        <Field label="Radiographs" value={caseData.invest_radiographs} />
        <Field label="Blood Tests" value={caseData.blood_tests} />
        <Field label="Study Models" value={caseData.study_models} />
        <Field label="Photographs" value={caseData.photographs} />
        <Field label="Vitality" value={caseData.vitality} />
        <Field label="Biopsy Examination" value={caseData.biopsy_examination} />
        <Field label="Microbiological Examination" value={caseData.microbiological_examination} />
      </Section>

      <Section title="Risk Assessment">
        <Field label="Risk Factors" value={caseData.risk_factors} />
        <Field label="Risk Determinants" value={caseData.risk_determinants} />
        <Field label="Risk Indicators" value={caseData.risk_indicators} />
        <Field label="Risk Predictors / Markers" value={caseData.risk_predictors_markers} />
      </Section>

      <Section title="Prognosis & Treatment">
        <Field label="Prognosis" value={caseData.prognosis} />
        <Field label="Case Summary" value={caseData.case_summary} />
        <Field label="Treatment Plan" value={caseData.treatment_plan || caseData.treatmentPlan} />
        <Field label="Treatment Done" value={caseData.treatmentDone || caseData.treatment} />
      </Section>

      <Section title="Case Report">
        <Field label="Case Report" value={caseData.case_report} />
      </Section>

      {/* Doctor Authentication */}
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: "2px solid #ddd" }}>
        <h3 style={{ marginBottom: 20, color: "#333" }}>Doctor's Authorization</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <Field label="Doctor's Name" value={caseData.doctorName} />
            <Field label="Chief Approval" value={caseData.chiefApproval} />
            <Field label="Approved By" value={caseData.approvedBy} />
          </div>
          <div>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Digital Signature</label>
            {sigSrc ? (
              <img
                src={sigSrc}
                alt="Doctor's Signature"
                style={{
                  maxWidth: "100%",
                  maxHeight: 140,
                  border: "1px solid #ddd",
                  padding: 5,
                  borderRadius: 4,
                  background: "#fff",
                }}
              />
            ) : (
              <div className="readonly-field">No signature on file</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pedodontics Read-Only View (5 pages) ────────────────────────────────────

function PedodonticsCaseView({ caseData }) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 5;
  const sigSrc = decodeSignature(caseData?.digitalSignature);

  const handleNext = () => { if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1); };
  const handlePrev = () => { if (currentPage > 0) setCurrentPage((p) => p - 1); };

  return (
    <>
      {currentPage === 0 && (
        <div className="page active">
          <Section title="Medical & Dental History">
            <Field label="Medical History" value={caseData.medicalHistory} />
            <Field label="Dental History" value={caseData.dentalHistory} />
            <Field label="Current Medications" value={caseData.currentMedications} />
            <Field label="Recent Medications" value={caseData.recentMedications} />
            <Field label="Allergies" value={caseData.allergies} />
            <Field label="Breastfeeding" value={caseData.breastfeeding} />
            <Field label="Bottle Usage" value={caseData.bottleUsage} />
            <Field label="Bottle Period" value={caseData.bottlePeriod} />
            <Field label="Bottle Contents" value={caseData.bottleContents} />
            <Field label="Brushing Habits" value={caseData.brushingHabits} />
          </Section>
        </div>
      )}
      {currentPage === 1 && (
        <div className="page active">
          <Section title="Extra Oral & Intra Oral Exam">
            <Field label="TMJ Examination" value={caseData.tmjExamination} />
            <Field label="Lymph Nodes" value={caseData.lymphNodes} />
            <Field label="Lip Competency" value={caseData.lipCompetency} />
            <Field label="Mouth Breathing" value={caseData.mouthBreathing} />
            <Field label="Tongue Habits" value={caseData.tongueHabits} />
            <Field label="Other Habits" value={caseData.otherHabits} />
            <Field label="Molar Relation" value={caseData.molarRelation} />
            <Field label="Canine Relation" value={caseData.canineRelation} />
            <Field label="Overjet" value={caseData.overjet} />
            <Field label="Overbite" value={caseData.overbite} />
          </Section>
        </div>
      )}
      {currentPage === 2 && (
        <div className="page active">
          <Section title="Clinical Findings">
            <Field label="Soft Tissue Findings" value={caseData.softTissueFindings} />
            <Field label="Hard Tissue Findings" value={caseData.hardTissueFindings} />
            <Field label="Dental Caries" value={caseData.dentalCaries} />
            <Field label="Developmental Defects" value={caseData.developmentalDefects} />
            <Field label="Trauma Findings" value={caseData.traumaFindings} />
            <Field label="Other Findings" value={caseData.otherFindings} />
          </Section>
        </div>
      )}
      {currentPage === 3 && (
        <div className="page active">
          <Section title="Radiographic & Diagnosis">
            <Field label="Radiographic Findings" value={caseData.radiographicFindings} />
            <Field label="Diagnosis" value={caseData.diagnosis} />
            <Field label="Differential Diagnosis" value={caseData.differentialDiagnosis} />
            <Field label="Prognosis" value={caseData.prognosis} />
          </Section>
        </div>
      )}
      {currentPage === 4 && (
        <div className="page active">
          <Section title="Treatment Plan">
            <Field label="Preventive Plan" value={caseData.preventivePlan} />
            <Field label="Restorative Plan" value={caseData.restorativePlan} />
            <Field label="Interceptive Ortho" value={caseData.interceptiveOrtho} />
            <Field label="Surgical Plan" value={caseData.surgicalPlan} />
            <Field label="Other Treatments" value={caseData.otherTreatments} />
            <Field label="Follow-up Instructions" value={caseData.followUpInstructions} />
          </Section>

          <div style={{ marginTop: 40, paddingTop: 20, borderTop: "2px solid #ddd" }}>
            <h3 style={{ marginBottom: 20, color: "#333" }}>Doctor's Authentication</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div><Field label="Doctor's Name" value={caseData.doctorName} /></div>
              <div>
                <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Digital Signature</label>
                {sigSrc ? (
                  <img src={sigSrc} alt="Doctor's Signature" style={{ maxWidth: "100%", maxHeight: 120, border: "1px solid #ddd", padding: 5, borderRadius: 4 }} />
                ) : (
                  <div className="readonly-field">No signature provided</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="navigation" style={{ marginTop: 20 }}>
        <button onClick={handlePrev} disabled={currentPage === 0}>Back</button>
        <span style={{ alignSelf: "center", color: "#555" }}>Page {currentPage + 1} of {totalPages}</span>
        <button onClick={handleNext} disabled={currentPage === totalPages - 1}>Next</button>
      </div>
    </>
  );
}

// ─── Oral Read-Only View ──────────────────────────────────────────────────────

function OralCaseView({ caseData }) {
  const sigSrc = decodeSignature(caseData?.digitalSignature);
  return (
    <div>
      <Section title="Patient Information">
        <Field label="Patient Name" value={caseData.patientName} />
        <Field label="Patient ID" value={caseData.patientId} />
        <Field label="Doctor" value={caseData.doctorName} />
        <Field label="Age" value={caseData.age} />
        <Field label="Gender" value={caseData.gender || caseData.sex} />
      </Section>
      <Section title="Medical History">
        <Field label="Chief Complaint" value={caseData.chiefComplaint} />
        <Field label="History of Present Illness" value={caseData.historyOfPresentIllness} />
        <Field label="Medical History" value={caseData.medicalHistory} />
        <Field label="Drug History" value={caseData.drugHistory} />
        <Field label="Allergies" value={caseData.allergies} />
      </Section>
      <Section title="Examination">
        <Field label="Extraoral Examination" value={caseData.extraOralExamination} />
        <Field label="Intraoral Examination" value={caseData.intraOralExamination} />
      </Section>
      <Section title="Diagnosis & Treatment">
        <Field label="Provisional Diagnosis" value={caseData.provisionalDiagnosis} />
        <Field label="Final Diagnosis" value={caseData.finalDiagnosis} />
        <Field label="Treatment Plan" value={caseData.treatmentPlan} />
        <Field label="Treatment Done" value={caseData.treatmentDone} />
      </Section>
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: "2px solid #ddd" }}>
        <h3 style={{ marginBottom: 16, color: "#333" }}>Doctor's Authentication</h3>
        <Field label="Doctor's Name" value={caseData.doctorName} />
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8, marginTop: 12 }}>Digital Signature</label>
        {sigSrc ? (
          <img src={sigSrc} alt="Doctor's Signature" style={{ maxWidth: "100%", maxHeight: 120, border: "1px solid #ddd", padding: 5, borderRadius: 4 }} />
        ) : (
          <div className="readonly-field">No signature provided</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const CaseSheetView = () => {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const fetchCaseData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const storedDept = (localStorage.getItem("viewCaseDepartment") || "").toLowerCase();

      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      // 1. Try the unified casesheets endpoint (supports all departments)
      const unifiedRes = await fetch(`${API_BASE}/api/casesheets/${caseId}`, { headers });
      if (unifiedRes.ok) {
        const json = await unifiedRes.json();
        if (json?.data) {
          setCaseData(json.data);
          setDepartment(json.department || storedDept || "unknown");
          return;
        }
      }

      // 2. Fallback — try department-specific endpoints
      const fallbackEndpoints = [
        { url: `${API_BASE}/api/pedodontics/${caseId}`, dept: "pedodontics" },
        { url: `${API_BASE}/api/oral/${caseId}`, dept: "oral" },
      ];

      for (const ep of fallbackEndpoints) {
        const res = await fetch(ep.url, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            setCaseData(json.data);
            setDepartment(storedDept || ep.dept);
            return;
          }
        }
      }

      setError("Case not found. It may have been deleted or you may not have access.");
    } catch (err) {
      console.error("Error fetching case:", err);
      setError("Failed to load case sheet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: "#1e3a8a" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <div style={{ fontWeight: 600 }}>Loading case sheet…</div>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: "#dc2626" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontWeight: 600 }}>{error || "Case not found"}</div>
        </div>
      </div>
    );
  }

  const dept = department.toLowerCase();
  const isPeriodontics = dept.includes("periodontics") || dept.includes("periodontology");
  const isOral = dept.includes("oral");
  const departmentLabel = isPeriodontics
    ? "PERIODONTICS"
    : isOral
    ? "ORAL MEDICINE AND RADIOLOGY"
    : "PEDODONTICS";

  return (
    <div className="digital-doctor-case-sheet">
      <div className="case-sheet">
        {/* Header */}
        <div className="header">
          <img
            src="/images/logo.png"
            alt="SRM Dental College Logo"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/logo.png"; }}
          />
          <h1>SRM DENTAL COLLEGE</h1>
          <h2>DEPARTMENT OF {departmentLabel}</h2>
          {isPeriodontics && <h3>LONG CASE SHEET — READ ONLY VIEW</h3>}
        </div>

        {/* Case content by department */}
        {isPeriodontics ? (
          <PeriodonticsCaseView caseData={caseData} />
        ) : isOral ? (
          <OralCaseView caseData={caseData} />
        ) : (
          <PedodonticsCaseView caseData={caseData} />
        )}
      </div>
    </div>
  );
};

export default CaseSheetView;
