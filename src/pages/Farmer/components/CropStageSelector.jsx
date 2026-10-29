import React from 'react';
import { CROP_STAGES } from '../../../data/crops';
import { CheckIcon } from '../../../components/Icons';
import { useLanguage } from '../../../i18n';

export default function CropStageSelector({ selectedStage, onSelectStage }) {
  const { t, language } = useLanguage();

  const getStageDisplay = (stage) => {
    if (language === 'pa') {
      return {
        label: stage.punjabiLabel || stage.hindiLabel,
        desc: stage.punjabiDesc || stage.desc
      };
    }
    if (language === 'hi') {
      return {
        label: stage.hindiLabel,
        desc: stage.desc
      };
    }
    return {
      label: stage.hindiLabel,
      desc: stage.desc
    };
  };

  return (
    <div className="crop-stage-selector">
      <div className="section-sub-desc">
        {t('farmer.stageDesc')}
      </div>

      <div className="stage-options-grid">
        {CROP_STAGES.map((stage) => {
          const isSelected = selectedStage === stage.label;
          const display = getStageDisplay(stage);
          return (
            <button
              key={stage.id}
              type="button"
              className={`stage-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectStage(isSelected ? '' : stage.label)}
            >
              <div className="stage-header">
                <span className="stage-name">{stage.label}</span>
                {isSelected && (
                  <span className="stage-check-icon">
                    <CheckIcon size={16} />
                  </span>
                )}
              </div>
              <span className="stage-hindi">{display.label}</span>
              <span className="stage-desc">{display.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
