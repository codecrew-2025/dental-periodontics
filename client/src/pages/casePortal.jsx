import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './casePortal.css';
import { isDepartmentAllowed } from '../config/allowedDepartments';
const CASE_CONSENT_NAV_STATE_KEY = 'caseSheetConsentApproved';

const CasePortal = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showOral, setShowOral] = useState(false);
  const [showPerio, setShowPerio] = useState(false);

  // Auto-open specific department sections when coming from other flows (e.g., General Case Sheet)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dept = params.get('dept');
    const path = String(location.pathname || '').trim().toLowerCase();
    const navState = location.state || {};
    const consentAlreadyDone = Boolean(navState[CASE_CONSENT_NAV_STATE_KEY]);

    // Auto-navigate to General Case Sheet when coming from consent form for Oral Medicine
    if (dept === 'oral' && consentAlreadyDone) {
      navigate('/oral-medicine', { 
        replace: true,
        state: { [CASE_CONSENT_NAV_STATE_KEY]: true } 
      });
      return;
    }

    if (dept === 'periodontics' || path === '/periodontics') {
      setShowPerio(true);
      return;
    }

    if (dept === 'oral' || path === '/oral-medicine') {
      setShowOral(true);
    }
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    const navState = location.state || {};
    if (!navState.requestConsentAfterEntry) return;
    if (navState[CASE_CONSENT_NAV_STATE_KEY]) return;

    const redirectTarget = `${location.pathname}${location.search}`;
    const shouldOpenConsent = window.confirm(
      'Please complete the consent form before proceeding with the department case sheet.'
    );

    if (shouldOpenConsent) {
      navigate(`/consent-form?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
    }
  }, [location.pathname, location.search, location.state, navigate]);


  const startCaseFlow = (targetPage) => {
    const navState = location.state || {};
    const consentAlreadyDone = Boolean(navState[CASE_CONSENT_NAV_STATE_KEY]);

    if (consentAlreadyDone) {
      // Consent was completed before arriving at CasePortal — pass it through
      navigate(targetPage, { state: { [CASE_CONSENT_NAV_STATE_KEY]: true } });
    } else {
      // No consent yet — ask for it on the destination page
      navigate(targetPage, { state: { requestConsentAfterEntry: true } });
    }
  };

  return (
    <div className="case-portal-container">
      <div className="container-portal">
        <div className="heading">Select Case Sheet</div>


        <div className="button-group-portal" id="mainButtonGroup" style={{ display: showOral || showPerio ? 'none' : 'flex' }}>
          <button className="button-portal" onClick={() => isDepartmentAllowed('periodontics') && setShowPerio(true)} disabled={!isDepartmentAllowed('periodontics')} style={!isDepartmentAllowed('periodontics') ? {opacity: 0.4, cursor: 'not-allowed'} : {}}>Periodontics</button>

          <button className="button-portal" onClick={() => isDepartmentAllowed('general') && setShowOral(true)} disabled={!isDepartmentAllowed('general')} style={!isDepartmentAllowed('general') ? {opacity: 0.4, cursor: 'not-allowed'} : {}}>General</button>
          <button className="button-portal" onClick={() => isDepartmentAllowed('orthognathic') && startCaseFlow('/casePortal')} disabled={!isDepartmentAllowed('orthognathic')} style={!isDepartmentAllowed('orthognathic') ? {opacity: 0.4, cursor: 'not-allowed'} : {}}>Orthoganthic Case History</button>
        </div>



        {/* Oral and Maxillofacial sub-options */}
        {showOral && (
          <div className="sub-options" id="oralSubOptions">
            <button className="button-portal" onClick={() => startCaseFlow('/oral-medicine')}>General Case Sheet</button>
            <button className="button-portal" onClick={() => startCaseFlow('/casePortal')}>Clef Lip</button>
            <button className="button-portal" onClick={() => startCaseFlow('/casePortal')}>Trauma</button>
            <button className="button-portal" onClick={() => startCaseFlow('/casePortal')}>Impaction</button>
            <button className="button-portal" onClick={() => startCaseFlow('/casePortal')}>Pathology</button>
          </div>
        )}

        {/* Periodontics sub-options */}
        {showPerio && (
          <div className="sub-options" id="perioSubOptions">
            <button className="button-portal" onClick={() => startCaseFlow('/periodontics/long')}>Long Case Sheet</button>
            <button className="button-portal" onClick={() => startCaseFlow('/periodontics/short')}>Short Case Sheet</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CasePortal;