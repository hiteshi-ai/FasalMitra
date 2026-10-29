import React, { useState, useEffect, useCallback } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  AlertIcon,
  RefreshIcon
} from '../../components/Icons';
import { expertService } from '../../services/expertService';
import CaseReviewModal from './components/CaseReviewModal';
import { useLanguage } from '../../i18n';

export default function ExpertPortal({ onExpertLogout }) {
  const { t } = useLanguage();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  const fetchCases = useCallback(() => {
    expertService.getConsultationRequests().then((data) => {
      setCases(data || []);
    }).catch((err) => {
      console.warn('ExpertPortal: Failed to fetch consultation queue:', err.message);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    expertService.getConsultationRequests().then((data) => {
      if (isMounted) setCases(data || []);
    }).catch((err) => {
      console.warn('ExpertPortal: Failed to fetch consultation queue:', err.message);
    });

    // Lightweight polling interval (15s) with clean teardown
    const intervalId = setInterval(() => {
      expertService.getConsultationRequests().then((data) => {
        if (isMounted) setCases(data || []);
      }).catch(() => {});
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleOpenReview = (caseItem) => {
    setSelectedCase(caseItem);
    setIsReviewOpen(true);
  };

  const handleCloseReview = () => {
    setIsReviewOpen(false);
    setSelectedCase(null);
  };

  const handleSaveReview = async (caseId, reviewPayload) => {
    // Call backend endpoint to update case
    const res = await expertService.updateConsultation(caseId, reviewPayload);
    const updatedCase = res.consultation || {
      ...selectedCase,
      ...reviewPayload,
      updatedAt: new Date().toISOString()
    };

    // Update local state immediately for instant UI feedback
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, ...updatedCase } : c))
    );
    setSelectedCase(updatedCase);
    setSuccessBanner(t('expert.reviewSaved'));
    setTimeout(() => {
      setSuccessBanner(null);
    }, 5000);
  };

  // Group cases dynamically by status
  const pendingCases = cases.filter((c) => {
    const s = (c.status || '').toLowerCase();
    return (
      s.includes('pending') ||
      (!s.includes('under review') &&
        !s.includes('active') &&
        !s.includes('in progress') &&
        !s.includes('resolve') &&
        !s.includes('closed'))
    );
  });

  const activeCases = cases.filter((c) => {
    const s = (c.status || '').toLowerCase();
    return (
      (s.includes('under review') || s.includes('active') || s.includes('in progress')) &&
      !s.includes('pending')
    );
  });

  const resolvedCases = cases.filter((c) => {
    const s = (c.status || '').toLowerCase();
    return s.includes('resolve') || s.includes('closed');
  });

  // Helper to format AI assessment text and styling class
  const getAiBadgeData = (c) => {
    const diag = c.diseaseAnalysis || c.imageAnalysis;
    if (!diag) {
      return {
        text: t('common.pending'),
        badgeClass: 'amber'
      };
    }

    if (diag.isHealthy) {
      return {
        text: t('diagnosis.healthy'),
        badgeClass: 'healthy'
      };
    }

    const conf = diag.confidence !== undefined
      ? `${Math.round(Number(diag.confidence) * 100)}%`
      : '';
    const sev = diag.severity ? `${diag.severity}` : '';
    const meta = [sev, conf].filter(Boolean).join(', ');

    const diseaseName = diag.disease || t('diagnosis.detected');
    const text = meta ? `${diseaseName} (${meta})` : diseaseName;

    const isHigh =
      diag.severity?.toLowerCase() === 'high' ||
      diag.severity?.toLowerCase() === 'severe' ||
      (diag.confidence && Number(diag.confidence) >= 0.8);

    return {
      text,
      badgeClass: isHigh ? 'high-risk' : 'amber'
    };
  };

  return (
    <div className="page-wrapper dashboard-page">
      {/* Expert Dashboard Header */}
      <header className="dashboard-header">
        <div>
          <div className="portal-crumb">{t('expert.crumb')}</div>
          <h1 className="dashboard-title">{t('expert.title')}</h1>
          <p className="dashboard-subtitle">
            {t('expert.subtitle')}
          </p>
        </div>
        <div className="expert-header-right">
          <button
            type="button"
            className="btn btn-outline btn-sm refresh-queue-btn"
            onClick={fetchCases}
            title={t('expert.refreshQueue')}
          >
            <RefreshIcon size={14} />
            <span>{t('expert.refreshQueue')}</span>
          </button>
          {onExpertLogout && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onExpertLogout}
              title={t('common.logout')}
            >
              <span>{t('common.logout')}</span>
            </button>
          )}
          <div className="header-meta-badge expert-mode">
            <span className="live-dot green"></span>
            <span>{t('expert.stationBadge')}</span>
          </div>
        </div>
      </header>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="modal-success-banner" style={{ margin: '16px 0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} role="status">
          <CheckCircleIcon size={18} />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Dynamic Summary KPI Cards */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper pending">
            <ClockIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">{t('expert.kpiPending')}</span>
            <span className="kpi-value">{pendingCases.length}</span>
            <span className="kpi-subtext">{t('expert.kpiPendingSub')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper active">
            <AlertIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">{t('expert.kpiActive')}</span>
            <span className="kpi-value">{activeCases.length}</span>
            <span className="kpi-subtext">{t('expert.kpiActiveSub')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper resolved">
            <CheckCircleIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">{t('expert.kpiResolved')}</span>
            <span className="kpi-value">{resolvedCases.length}</span>
            <span className="kpi-subtext">{t('expert.kpiResolvedSub')}</span>
          </div>
        </div>
      </section>

      {/* Three Main Consultation Streams */}
      <div className="expert-sections-stack">
        {/* Section 1: Pending Consultation Requests */}
        <section className="expert-section-block">
          <div className="section-heading-bar">
            <div className="heading-left">
              <span className="status-indicator-dot warning"></span>
              <h2 className="section-title">{t('expert.pendingSection')}</h2>
            </div>
            <span className="section-count-badge">
              {t('expert.pendingCount', { count: pendingCases.length, s: pendingCases.length === 1 ? '' : 's' })}
            </span>
          </div>

          <div className="cases-list-container">
            {pendingCases.length === 0 ? (
              <div className="empty-cases-placeholder">
                <ClockIcon size={24} />
                <p>{t('expert.noPendingTitle')}</p>
                <span>{t('expert.noPendingSub')}</span>
              </div>
            ) : (
              pendingCases.map((c) => {
                const aiBadge = getAiBadgeData(c);
                return (
                  <div key={c.id} className="case-row">
                    <div className="case-col-main">
                      <div className="case-id-tag">{t('expert.caseTag', { id: c.id })}</div>
                      <h4 className="case-farmer-crop">
                        {c.crop} {c.cropStage ? `\u2022 ${c.cropStage}` : ''}
                        {c.farmerNotes ? ` \u2022 ${c.farmerNotes}` : ''}
                      </h4>
                      <div className="case-meta-tags">
                        <span>{c.location || 'Local Farm'}</span>
                        {c.soil?.type && <span>&bull; {t('soil.soilType')}: {c.soil.type}</span>}
                        {c.weather?.humidity && <span>&bull; {t('weather.humidity')}: {c.weather.humidity}%</span>}
                        {c.weather?.temperature && <span>&bull; Temp: {c.weather.temperature}&deg;C</span>}
                      </div>
                    </div>

                    <div className="case-col-ai">
                      <span className="ai-label">{t('expert.aiAssessment')}</span>
                      <span className={`ai-prediction-badge ${aiBadge.badgeClass}`}>
                        {aiBadge.text}
                      </span>
                    </div>

                    <div className="case-col-action">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleOpenReview(c)}
                      >
                        {t('expert.reviewCaseBtn')}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Section 2: Active Cases */}
        <section className="expert-section-block">
          <div className="section-heading-bar">
            <div className="heading-left">
              <span className="status-indicator-dot active-blue"></span>
              <h2 className="section-title">{t('expert.activeSection')}</h2>
            </div>
            <span className="section-count-badge blue">
              {t('expert.activeCount', { count: activeCases.length })}
            </span>
          </div>

          <div className="cases-list-container">
            {activeCases.length === 0 ? (
              <div className="empty-cases-placeholder">
                <AlertIcon size={24} />
                <p>{t('expert.noActiveTitle')}</p>
                <span>{t('expert.noActiveSub')}</span>
              </div>
            ) : (
              activeCases.map((c) => {
                const aiBadge = getAiBadgeData(c);
                return (
                  <div key={c.id} className="case-row active-highlight">
                    <div className="case-col-main">
                      <div className="case-id-tag">{t('expert.caseTag', { id: c.id })}</div>
                      <h4 className="case-farmer-crop">
                        {c.crop} {c.cropStage ? `\u2022 ${c.cropStage}` : ''}
                        {c.farmerNotes ? ` \u2022 ${c.farmerNotes}` : ''}
                      </h4>
                      <div className="case-meta-tags">
                        <span>{c.location || 'Local Farm'}</span>
                        {c.soil?.type && <span>&bull; {t('soil.soilType')}: {c.soil.type}</span>}
                        {c.weather?.humidity && <span>&bull; {t('weather.humidity')}: {c.weather.humidity}%</span>}
                      </div>
                    </div>

                    <div className="case-col-ai">
                      <span className="ai-label">{t('expert.aiAndStatus')}</span>
                      <span className={`ai-prediction-badge ${aiBadge.badgeClass}`}>
                        {aiBadge.text}
                      </span>
                      <span className="case-status-in-progress">
                        {c.expertNotes ? t('expert.adviceDrafted') : t('expert.underReview')}
                      </span>
                    </div>

                    <div className="case-col-action">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleOpenReview(c)}
                      >
                        {t('expert.continueReviewBtn')}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Section 3: Resolved Cases */}
        <section className="expert-section-block">
          <div className="section-heading-bar">
            <div className="heading-left">
              <span className="status-indicator-dot resolved-green"></span>
              <h2 className="section-title">{t('expert.resolvedSection')}</h2>
            </div>
            <span className="section-count-badge green">
              {t('expert.resolvedCount', { count: resolvedCases.length })}
            </span>
          </div>

          <div className="cases-list-container">
            {resolvedCases.length === 0 ? (
              <div className="empty-cases-placeholder">
                <CheckCircleIcon size={24} />
                <p>{t('expert.noResolvedTitle')}</p>
                <span>{t('expert.noResolvedSub')}</span>
              </div>
            ) : (
              resolvedCases.map((c) => (
                <div key={c.id} className="case-row resolved-item">
                  <div className="case-col-main">
                    <div className="case-id-tag">{t('expert.caseTag', { id: c.id })}</div>
                    <h4 className="case-farmer-crop">
                      {c.crop} &bull; {t('expert.caseResolvedTitle')}
                    </h4>
                    <div className="case-meta-tags">
                      <span>{c.location || 'Local Farm'}</span>
                      {c.updatedAt && (
                        <span>&bull; {t('expert.resolvedDate', { date: new Date(c.updatedAt).toLocaleDateString() })}</span>
                      )}
                    </div>
                  </div>

                  <div className="case-col-ai">
                    <span className="ai-label">{t('expert.expertAction')}</span>
                    <span className="case-status-resolved">
                      {c.expertAssessment ? c.expertAssessment.slice(0, 50) + (c.expertAssessment.length > 50 ? '...' : '') : t('expert.prescriptionRecorded')}
                    </span>
                  </div>

                  <div className="case-col-action">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleOpenReview(c)}
                    >
                      {t('expert.viewCaseBtn')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Real Case Review Modal */}
      <CaseReviewModal
        isOpen={isReviewOpen}
        caseData={selectedCase}
        onClose={handleCloseReview}
        onSaveReview={handleSaveReview}
      />
    </div>
  );
}
