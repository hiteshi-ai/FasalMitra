import React, { useState, useRef } from 'react';
import {
  UploadIcon,
  CameraIcon,
  XIcon,
  RefreshIcon,
  AlertIcon,
  CheckCircleIcon
} from '../../../components/Icons';
import { useLanguage } from '../../../i18n';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export default function ImageUpload({ image, onImageChange }) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = (file) => {
    setErrorMsg(null);

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg(t('image.invalidType'));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg(t('image.tooLarge', { size: formatFileSize(file.size) }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const imageInfo = {
      file,
      previewUrl,
      dataUrl: null,
      name: file.name,
      size: file.size,
      type: file.type
    };
    onImageChange(imageInfo);

    const reader = new FileReader();
    reader.onload = (e) => {
      onImageChange({
        ...imageInfo,
        dataUrl: e.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    if (image?.previewUrl) {
      URL.revokeObjectURL(image.previewUrl);
    }
    onImageChange(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="image-upload-component">
      {/* Hidden File Input supporting mobile camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden-file-input"
        aria-label={t('image.selectBtn')}
      />

      {image ? (
        // Preview State
        <div className="image-preview-card">
          <div className="preview-image-container">
            <img
              src={image.previewUrl}
              alt="Crop Leaf Preview"
              className="leaf-preview-img"
            />
            <div className="preview-badge-overlay">
              <CheckCircleIcon size={16} />
              <span>{t('image.readyBadge')}</span>
            </div>
          </div>

          <div className="preview-meta-panel">
            <div className="preview-file-info">
              <h4 className="preview-filename">{image.name}</h4>
              <span className="preview-filesize">{formatFileSize(image.size)} &bull; {image.type}</span>
            </div>

            <div className="preview-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleTriggerBrowse}
              >
                <RefreshIcon size={14} />
                <span>{t('image.replaceBtn')}</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm remove-btn"
                onClick={handleRemove}
              >
                <XIcon size={14} />
                <span>{t('image.removeBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Upload Dropzone
        <div
          className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleTriggerBrowse}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleTriggerBrowse()}
        >
          <div className="dropzone-icon-bubble">
            <CameraIcon size={32} />
          </div>

          <div className="dropzone-text-group">
            <p className="dropzone-title">
              {t('image.dropzoneTitle')}
            </p>
            <p className="dropzone-subtitle">
              {t('image.dropzoneSubtitle')}
            </p>
            <span className="dropzone-limits">
              {t('image.dropzoneLimits')}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm dropzone-browse-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleTriggerBrowse();
            }}
          >
            <UploadIcon size={16} />
            <span>{t('image.selectBtn')}</span>
          </button>
        </div>
      )}

      {/* Validation Error Message */}
      {errorMsg && (
        <div className="upload-error-banner" role="alert">
          <AlertIcon size={16} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
