import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import CaseSheetView from "./Casesheets/CaseSheetView";
import { API_BASE_URL } from "../config/api";

const CaseSheetViewer = () => {
  const { caseId } = useParams();
  const [caseMeta, setCaseMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCaseMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const loadCaseMeta = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Try unified endpoint first
      const unifiedEndpoint = `/api/casesheets/${caseId}`;

      // Note: fallback endpoints that map by patient ID (not case ID) are intentionally removed.
      // All department case sheets are served by the unified /api/casesheets/:caseId endpoint.
      const fallbackEndpoints = [
        `/api/oral/${caseId}`,
        `/api/general/${caseId}`
      ];

      const mapping = {
        "/api/oral/": "oral",
        "/api/general/": "general"
      };

      let data = null;
      let dept = null;

      /* ---------- TRY UNIFIED ENDPOINT ---------- */
      try {
        const resUnified = await fetch(
          `${API_BASE_URL}${unifiedEndpoint}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const textUnified = await resUnified.text();
        let parsedUnified;
        try {
          parsedUnified = JSON.parse(textUnified);
        } catch {
          parsedUnified = textUnified;
        }

        setAttempts(prev => [
          ...prev,
          {
            endpoint: unifiedEndpoint,
            status: resUnified.status,
            body: parsedUnified
          }
        ]);

        if (resUnified.status === 401) {
          setAuthError(true);
          localStorage.clear();
          setTimeout(() => navigate("/login", { replace: true }), 300);
          return;
        }

        if (resUnified.status === 200) {
          data = parsedUnified?.data ?? parsedUnified;
          dept = parsedUnified?.department ?? null;
        }
      } catch (uErr) {
        setAttempts(prev => [
          ...prev,
          {
            endpoint: unifiedEndpoint,
            status: "error",
            body: String(uErr)
          }
        ]);
      }

      /* ---------- FALLBACK ENDPOINTS ---------- */
      if (!data) {
        for (const ep of fallbackEndpoints) {
          try {
            const res = await fetch(`${API_BASE_URL}${ep}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            let text = await res.text();
            let parsed;
            try {
              parsed = JSON.parse(text);
            } catch {
              parsed = text;
            }

            setAttempts(prev => [
              ...prev,
              {
                endpoint: ep,
                status: res.status,
                body: parsed
              }
            ]);

            if (res.status === 200) {
              data = parsed?.data ?? parsed;
              const base = ep.replace(caseId, "");
              dept = mapping[base] ?? null;
              break;
            }
          } catch (fetchErr) {
            setAttempts(prev => [
              ...prev,
              {
                endpoint: ep,
                status: "error",
                body: String(fetchErr)
              }
            ]);
          }
        }
      }

      /* ---------- FINAL SET ---------- */
      if (data) {
        if (!data.department && dept) {
          data.department = dept;
        }
        if (data.patientId) {
          localStorage.setItem('CurrentpatientId', String(data.patientId).trim());
        }
        if (data.patientName) {
          localStorage.setItem('CurrentpatientName', String(data.patientName).trim());
        }

        // Frontend fallback: If digitalSignature is missing (often because backend hasn't restarted), fetch from oral case
        if (!data.digitalSignature && data.patientId) {
          try {
            const token = localStorage.getItem('token');
            const resOral = await fetch(`${API_BASE_URL}/api/oral/patient/${data.patientId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (resOral.ok) {
              const oralJson = await resOral.json();
              const oralCases = oralJson.data || [];
              if (oralCases.length > 0 && oralCases[0].digitalSignature) {
                data.digitalSignature = oralCases[0].digitalSignature;
                console.log('[CaseSheetViewer] Fallback signature fetched from oral case sheet');
              }
            }
          } catch (err) {
            console.warn('[CaseSheetViewer] Frontend fallback fetch oral signature failed:', err);
          }
        }

        setCaseMeta(data);
        try {
          console.log('[CaseSheetViewer] loaded caseMeta summary:', {
            id: data._id || '(no _id)',
            department: data.department || '(no department)',
            keys: Object.keys(data).slice(0,40),
            hasDigitalSignature: data.digitalSignature !== undefined && data.digitalSignature !== null,
            digitalSignatureType: data.digitalSignature ? typeof data.digitalSignature : typeof data.digitalSignature
          });
        } catch (e) { /* ignore */ }

        // If patientName missing but patientId exists, try to fetch patient details
        if ((!data.patientName || data.patientName === '') && data.patientId) {
          (async () => {
            try {
              const token = localStorage.getItem('token');
              const patientIdToFetch = String(data.patientId).trim();
              console.log(`Fetching patient details for ID: ${patientIdToFetch}`);
              
              const res = await fetch(`${API_BASE_URL}/api/patient-details/by-patient-id/${patientIdToFetch}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });

              if (res.ok) {
                const json = await res.json();
                const patient = json.data || json.patient || null;
                if (patient) {
                  const first = patient.personalInfo?.firstName || '';
                  const last = patient.personalInfo?.lastName || '';
                  const full = `${first} ${last}`.trim();
                  if (full) {
                    console.log(`Patient name fetched: ${full}`);
                    setCaseMeta(prev => ({ ...prev, patientName: full }));
                  }
                }
              } else {
                const errData = await res.json().catch(() => ({ message: 'Unknown error' }));
                console.warn(`Failed to fetch patient details (${res.status}):`, errData);
              }
            } catch (err) {
              console.warn('Failed to fetch patient details for name:', err.message);
            }
          })();
        }
      } else {
        setCaseMeta(null);
      }
    } catch (err) {
      console.error("Failed to load case", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- RENDER ---------- */
  if (loading) return <p>Loading...</p>;

  if (!caseMeta) {
    return (
      <div style={{ padding: 16, color: "white" }}>
        <h3>{authError ? "Authentication required" : "Case not found"}</h3>

        {authError ? (
          <p>Your session expired. Please log in again.</p>
        ) : (
          <>
            <p>Debug info for attempted endpoints:</p>
            <ul>
              {attempts.map((a, i) => (
                <li key={i}>
                  <strong>{a.endpoint}</strong> — {a.status}
                  <pre style={{ whiteSpace: "pre-wrap", maxHeight: 120 }}>
                    {typeof a.body === "string"
                      ? a.body
                      : JSON.stringify(a.body, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  return <CaseSheetView caseSheet={caseMeta} />;
};

export default CaseSheetViewer;
