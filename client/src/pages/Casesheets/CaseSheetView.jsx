import Pedodontics from "../departments/Pedodontics";
import OralMedicine from "../departments/OralMedicine";
import SmallCasesheetPeriodontics from "../departments/Small_Casesheet_Periodontics";
import DigitalDoctorCasesheetPeriodontics from "../departments/Doctor_Long_Case_Sheet_Periodontics";

// ─── Decode MongoDB Buffer signature to a base64 data URL ─────────────────────
const decodeSignature = (sig) => {
  if (!sig) return null;
  if (typeof sig === 'string') {
    if (sig.startsWith('data:')) return sig;
    if (sig.length > 100) return `data:image/png;base64,${sig}`;
    return null;
  }
  try {
    const buf = sig?.data;
    let bytes;
    if (buf?.type === 'Buffer' && Array.isArray(buf.data)) {
      bytes = new Uint8Array(buf.data);
    } else if (Array.isArray(buf)) {
      bytes = new Uint8Array(buf);
    } else {
      return null;
    }
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    const ct = sig.contentType || 'image/png';
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
};

// ─── Long-case detection: fields only saved by the 11-page long case sheet ────
const LONG_CASE_FIELDS = [
  'facial_symmetry', 'case_report', 'invest_radiographs',
  'provisional_diagnosis', 'differential_diagnosis',
  'biopsy_examination', 'microbiological_examination',
  'risk_predictors_markers', 'ohi_s_total',
  'tmj_examination', 'mouth_opening', 'lymph_node_examination',
  'lip_competence', 'lesions', 'halitosis',
  'buccal_mucosa', 'labial_mucosa', 'tongue', 'palate',
  'floor_of_mouth', 'vestibule', 'tonsils', 'case_summary',
  'prognosis', 'treatmentDone'
];

const isLongCase = (data) => {
  if (!data) return false;
  if (data.caseType === 'long') return true;
  if (data.caseType === 'short') return false;
  return LONG_CASE_FIELDS.some((f) => data[f] !== undefined && data[f] !== null);
};

const CaseSheetView = ({ caseSheet }) => {
  const dept = (caseSheet.department || '').toLowerCase();

  // Decode the signature once so child components receive a plain data URL
  const decoded = decodeSignature(caseSheet?.digitalSignature);
  const enriched = decoded
    ? { ...caseSheet, digitalSignature: decoded }
    : caseSheet;

  switch (dept) {
    case 'pedodontics':
      return <Pedodontics initialCaseData={enriched} readOnly={true} />;

    case 'oral':
      return <OralMedicine initialCaseData={enriched} readOnly={true} />;

    case 'periodontics':
    case 'periodontology':
      if (isLongCase(caseSheet)) {
        return <DigitalDoctorCasesheetPeriodontics initialCaseData={enriched} readOnly={true} />;
      }
      return <SmallCasesheetPeriodontics initialCaseData={enriched} readOnly={true} />;

    default:
      return (
        <div style={{ padding: '40px', color: '#fff', textAlign: 'center' }}>
          <h2>Department not supported for view</h2>
          <p style={{ opacity: 0.7 }}>Department: {caseSheet.department || 'Unknown'}</p>
        </div>
      );
  }
};

export default CaseSheetView;
