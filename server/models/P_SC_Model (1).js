// caseSheetModel.js
// Initial state / data model for the Periodontics Case Sheet form

const gingivaFeatureTemplate = (surface1, surface2) => ({
  color:          { [surface1]: "", [surface2]: "", g1: "", g2: "", g3: "", g4: "" },
  contour:        { [surface1]: "", [surface2]: "", g1: "", g2: "", g3: "", g4: "" },
  consistency:    { [surface1]: "", [surface2]: "", g1: "", g2: "", g3: "", g4: "" },
  surfaceTexture: { [surface1]: "", [surface2]: "", g1: "", g2: "", g3: "", g4: "" },
  position:       { [surface1]: "", [surface2]: "", g1: "", g2: "", g3: "", g4: "" },
});

export const initialCaseSheetState = {

  // ─── Page 1: Extra & Intra Oral Examination ────────────────────────────────
  extraOral: {
    facialSymmetry:       "",
    tmjExamination:       "",
    mouthOpening:         "",
    lymphNodeExamination: "",
    lipCompetence:        "",
  },

  intraOral: {
    buccalMucosa:          "",
    labialMucosa:          "",
    palatalLingualMucosa:  "",
    tongue:                "",
    palate:                "",
    floorOfMouth:          "",
    vestibule:             "",
    tonsils:               "",
  },

  // ─── Page 2: Periodontal Examination — Gingiva ─────────────────────────────
  // Maxilla columns: Buccal | Palatal | 18-14 | 13-11 | 21-23 | 24-28
  // Mandible columns: Buccal | Lingual | 48-45 | 43-41 | 31-33 | 34-38
  gingiva: {
    maxilla:  gingivaFeatureTemplate("buccal", "palatal"),
    mandible: gingivaFeatureTemplate("buccal", "lingual"),
  },

  // ─── Page 3: Mucogingival Unit & Probing Depth ─────────────────────────────
  mucogingival: {
    mucogingivalJunction:    "",
    widthOfAttachedGingiva:  "",
    frenalAttachment:        "",
    vestibularDepth:         "",
    otherFindings:           "",
  },

  probingDepth: [
    { quadrant: "Maxillary Right",  distal: "", mid: "", mesial: "", notes: "" },
    { quadrant: "Maxillary Left",   distal: "", mid: "", mesial: "", notes: "" },
    { quadrant: "Mandibular Right", distal: "", mid: "", mesial: "", notes: "" },
    { quadrant: "Mandibular Left",  distal: "", mid: "", mesial: "", notes: "" },
  ],

  // ─── Page 4: Recession, Mobility, OHIS & Hard Tissue ──────────────────────
  recession: [
    { tooth: "", recession: "", mobility: "" },
    { tooth: "", recession: "", mobility: "" },
    { tooth: "", recession: "", mobility: "" },
    { tooth: "", recession: "", mobility: "" },
  ],

  oralHygieneIndex: {
    upper: { debris: "", calculus: "" },
    lower: { debris: "", calculus: "" },
  },

  hardTissue: {
    numberOfTeeth: "",
    missingTeeth:  "",
  },

  // ─── Page 5: Hard Tissue Continued ────────────────────────────────────────
  hardTissueCont: {
    overhangingRestorations:  "",
    dentalCaries:             "",
    restored:                 "",
    foodImpaction:            "",
    pathologicalMigrations:   "",
    openContacts:             "",
    dentalHypersensitivity:   "",
    wastingDisease:           "",
  },

  // ─── Page 6: Investigations & Case Summary ────────────────────────────────
  investigations: "",
  caseSummary:    "",

  // ─── Page 7: Diagnosis, Risk Assessment, Treatment Plan & Auth ────────────
  diagnosis: "",

  riskAssessment: {
    riskFactors:      "",
    riskDeterminants: "",
    riskIndicators:   "",
    riskPredictors:   "",
  },

  treatmentPlan: "",

  authorization: {
    doctorName:    "",   // required
    signatureFile: null, // File object (required) — store as base64 string if persisting
  },
};

export default initialCaseSheetState;
