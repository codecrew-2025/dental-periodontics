import Pedodontics from "../departments/Pedodontics";
import OralMedicine from "../departments/OralMedicine";
import SmallCasesheetPeriodontics from "../departments/Small_Casesheet_Periodontics";
import DigitalDoctorCasesheetPeriodontics from "../departments/Doctor_Long_Case_Sheet_Periodontics";
import CampPeriodonticsCaseSheet from "./CampPeriodonticsCaseSheet";

// ─── Decode MongoDB Buffer signature to a base64 data URL ─────────────────────
const decodeSignature = (sig) => {
  if (!sig) return null;
  // If passed the whole caseSheet object, try common fields
  if (typeof sig === 'object' && !Array.isArray(sig) && !(sig instanceof Uint8Array)) {
    const alt = sig.digitalSignature || sig.doctorSignature || sig.signature || sig.sig || sig.oralSignature || sig.oralSig || sig.oralCode || sig.signatureUrl || sig.signaturePreview;
    if (alt) return decodeSignature(alt);
  }
  if (typeof sig === 'string') {
    if (sig.startsWith('data:')) return sig;
    if (sig.length > 100) return `data:image/png;base64,${sig}`;
    return null;
  }
  try {
    const buf = sig?.data || sig;
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

  // Debug: log signature-related fields to help identify where signature is stored
  try {
    console.log('[CaseSheetView] signature fields:', {
      digitalSignature: caseSheet?.digitalSignature,
      doctorSignature: caseSheet?.doctorSignature,
      signature: caseSheet?.signature,
      sig: caseSheet?.sig,
      oralCode: caseSheet?.oralCode,
    });
  } catch (e) { /* ignore */ }
  try {
    const inspect = (v) => {
      if (v === undefined) return 'undefined';
      if (v === null) return 'null';
      if (typeof v === 'string') return `string (${v.length})`;
      if (Array.isArray(v)) return `array (${v.length})`;
      if (v && typeof v === 'object') {
        if (v.data && (v.data.byteLength || Array.isArray(v.data))) {
          const len = v.data.byteLength || (Array.isArray(v.data) ? v.data.length : '?');
          return `buffer-like (contentType=${v.contentType||'?'}, length=${len})`;
        }
        return `object (keys=${Object.keys(v).length})`;
      }
      return typeof v;
    };
    console.log('[CaseSheetView] signature fields (summary):', {
      digitalSignature: inspect(caseSheet?.digitalSignature),
      doctorSignature: inspect(caseSheet?.doctorSignature),
      signature: inspect(caseSheet?.signature),
      sig: inspect(caseSheet?.sig),
      oralCode: inspect(caseSheet?.oralCode),
      otherKeys: caseSheet ? Object.keys(caseSheet).slice(0,20) : []
    });
  } catch (e) { /* ignore */ }

  // Decode the signature once so child components receive a plain data URL
  // Run decoder against the whole caseSheet so alternate keys (oralCode, signature, etc.) are checked
  const decoded = decodeSignature(caseSheet);
  console.log('[CaseSheetView] decoded signature:', decoded ? `${String(decoded).slice(0,60)}...` : null);
  const enriched = decoded
    ? { ...caseSheet, digitalSignature: decoded }
    : caseSheet;

  switch (dept) {
    case 'pedodontics':
      return <Pedodontics initialCaseData={enriched} readOnly={true} />;

    case 'oral':
    case 'general':
      return <OralMedicine initialCaseData={enriched} readOnly={true} />;

    case 'periodontics':
    case 'periodontology':
      if (isLongCase(caseSheet)) {
        return <DigitalDoctorCasesheetPeriodontics initialCaseData={enriched} readOnly={true} />;
      }
      return <SmallCasesheetPeriodontics initialCaseData={enriched} readOnly={true} />;

    case 'camp periodontics':
      return <CampPeriodonticsCaseSheet initialCaseData={enriched} readOnly={true} />;

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
