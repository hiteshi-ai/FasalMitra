import React, { useState, useMemo } from 'react';
import { CROP_CATEGORIES, searchCrops } from '../../../data/crops';
import { SearchIcon, XIcon, LeafIcon } from '../../../components/Icons';
import { useLanguage } from '../../../i18n';

const CATEGORY_TRANSLATION_KEYS = {
  'All': 'farmer.catAll',
  'Cereal / Grain': 'farmer.catCereal',
  'Oilseed': 'farmer.catOilseed',
  'Pulse / Legume': 'farmer.catPulse',
  'Commercial / Fiber': 'farmer.catCommercial',
  'Vegetable': 'farmer.catVegetable'
};

export default function CropSelector({ selectedCrop, onSelectCrop }) {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredCrops = useMemo(() => {
    return searchCrops(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const getRegionalCropName = (crop) => {
    if (!crop) return '';
    if (language === 'pa' && crop.punjabiName) return crop.punjabiName;
    return crop.hindiName || '';
  };

  const getCategoryLabel = (cat) => {
    const key = CATEGORY_TRANSLATION_KEYS[cat];
    return key ? t(key) : cat;
  };

  return (
    <div className="crop-selector-wrapper">
      {selectedCrop ? (
        // Selected Crop Summary State
        <div className="selected-crop-card">
          <div className="selected-crop-info">
            <div className="crop-avatar-badge">
              <LeafIcon size={24} />
            </div>
            <div>
              <div className="selected-tag">{t('farmer.selectedCrop')}</div>
              <h3 className="selected-crop-name">
                {selectedCrop.name}{' '}
                <span className="hindi-label">({getRegionalCropName(selectedCrop)})</span>
              </h3>
              <div className="selected-crop-meta">
                <span className="meta-pill">{getCategoryLabel(selectedCrop.category)}</span>
                {selectedCrop.idealTempRange && (
                  <span className="meta-pill subtle">
                    {t('farmer.ideal')} {selectedCrop.idealTempRange}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm change-crop-btn"
            onClick={() => onSelectCrop(null)}
          >
            {t('farmer.changeCrop')}
          </button>
        </div>
      ) : (
        // Selection Workflow
        <div className="crop-picker-box">
          {/* Search & Filter Header */}
          <div className="crop-search-bar">
            <div className="search-input-wrapper">
              <SearchIcon size={18} className="search-icon" />
              <input
                type="text"
                placeholder={t('farmer.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="crop-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label={t('farmer.clearSearch')}
                >
                  <XIcon size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="category-filter-chips">
            {CROP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Crop Grid */}
          <div className="crop-grid-list">
            {filteredCrops.length > 0 ? (
              filteredCrops.map((crop) => (
                <button
                  key={crop.id}
                  type="button"
                  className="crop-choice-btn"
                  onClick={() => onSelectCrop(crop)}
                >
                  <div className="choice-left">
                    <span className="crop-choice-title">{crop.name}</span>
                    <span className="crop-choice-hindi">{getRegionalCropName(crop)}</span>
                  </div>
                  <span className="crop-choice-category">{getCategoryLabel(crop.category)}</span>
                </button>
              ))
            ) : (
              <div className="no-crops-found">
                <p>{t('farmer.noCropsMatch', { query: searchQuery })}</p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  {t('farmer.resetFilters')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
