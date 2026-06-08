import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import './PeriodonticsView.css';

const PeriodonticsView = ({ caseData: propCaseData }) => {
  const { caseId: paramsCaseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(propCaseData || null);
  const [loading, setLoading] = useState(!propCaseData);
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 4;

  const roleKey = String(user?.role || localStorage.getItem('role') || '').trim().toLowerCase();
  const handleClickReferredDepartment = () => {
    if (!caseData?.referredDepartment) return;
    if (roleKey === 'pg') {
      navigate('/pg-dashboard?view=assigned-cases');
      return;
    }
    if (roleKey === 'ug') {
      navigate('/ug-dashboard?view=assigned-cases');
      return;
    }
    navigate('/doctor-dashboard?view=referrals');
  };

  useEffect(() => {
    if (propCaseData) return;

    const fetchCaseData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/casesheets/${paramsCaseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const json = await response.json();
          setCaseData(json.data);
        } else {
          console.error('Failed to fetch periodontics case data');
        }
      } catch (error) {
        console.error('Error fetching case data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [paramsCaseId, propCaseData]);

  const handleNext = () => { if (currentPage < totalPages - 1) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (currentPage > 0) setCurrentPage(p => p - 1); };

  const field = (label, value) => (
    <div className="form-group-casesheet">
      {label && <label>{label}</label>}
      <div className="readonly-field">{value || '—'}</div>
    </div>
  );

  const area = (label, value) => (
    <div className="form-group-casesheet">
      {label && <label>{label}</label>}
      <div className="readonly-textarea">{value || '—'}</div>
    </div>
  );

  if (loading) return <div className="omr-view-loading">Loading case sheet...</div>;
  if (!caseData) return <div className="omr-view-loading">Case not found.</div>;

  return (
    <div className="digital-doctor-case-sheet">
      <div className="case-sheet-header">
        <a href="/" className="logo-main">
          <img src="/logo.png" alt="SRM Dental College Logo" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/40x40/E0F2F7/2C3E50?text=LOGO'; }} />
          <span>SRM Dental College</span>
        </a>
        <div className="case-sheet-title">
          <h1>PERIODONTICS CASE SHEET</h1>
          <p>Case Sheet</p>
        </div>
      </div>

      <div className="case-sheet">
        {currentPage === 0 && (
          <div className="page active">
            <div className="form-row-wide">
              {field('PATIENT NAME:', caseData.patientName)}
              {field('PATIENT ID:', caseData.patientId)}
            </div>
            <div className="form-row-wide">
              {field('DOCTOR NAME:', caseData.doctorName)}
              {field('DATE:', caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString() : '')}
            </div>
            {area('MEDICAL HISTORY:', caseData.medicalHistory)}
            {area('DENTAL HISTORY:', caseData.dentalHistory)}
            {area('CURRENT MEDICATIONS:', caseData.currentMedications)}
            {area('ALLERGIES:', caseData.allergies)}
          </div>
        )}

        {currentPage === 1 && (
          <div className="page active">
            <h2>CLINICAL EXAMINATION</h2>
            {area('PROBING:', caseData.probing)}
            {area('BLEEDING:', caseData.bleeding)}
            {area('POCKETING:', caseData.pocketing)}
            {area('FURCATION:', caseData.furcation)}
            {area('ATTACHMENT LOSS:', caseData.attachment)}
            {area('MOBILITY:', caseData.mobility)}
          </div>
        )}

        {currentPage === 2 && (
          <div className="page active">
            <h2>DIAGNOSIS AND TREATMENT</h2>
            {area('DIAGNOSIS:', caseData.diagnosis)}
            {area('TREATMENT:', caseData.treatment)}
            {area('TREATMENT PLAN:', caseData.treatmentPlan)}
            {area('FINAL DIAGNOSIS:', caseData.finalDiagnosis)}
          </div>
        )}

        {currentPage === 3 && (
          <div className="page active">
            <h2>APPROVAL & NOTES</h2>
            {field('CHIEF APPROVAL:', caseData.chiefApproval)}
            {field('APPROVED BY:', caseData.approvedBy)}
            {field('APPROVED AT:', caseData.approvedAt ? new Date(caseData.approvedAt).toLocaleString() : '')}
            {field('LAST UPDATED:', caseData.updatedAt ? new Date(caseData.updatedAt).toLocaleString() : '')}
            {caseData.referredDepartment && (
              <div className="form-group-casesheet">
                <label>REFERRED DEPARTMENT:</label>
                <div 
                  className="readonly-field clickable-referral"
                  onClick={handleClickReferredDepartment}
                  style={{ cursor: 'pointer', textDecoration: 'underline', color: '#0066cc' }}
                  title="Click to view referral details"
                >
                  {caseData.referredDepartment}
                </div>
              </div>
            )}
            {area('ADDITIONAL NOTES:', caseData.additionalNotes)}
          </div>
        )}

        <div className="navigation">
          <button onClick={handlePrev} disabled={currentPage === 0}>Previous</button>
          <span>Page {currentPage + 1} of {totalPages}</span>
          <button onClick={handleNext} disabled={currentPage === totalPages - 1}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default PeriodonticsView;
