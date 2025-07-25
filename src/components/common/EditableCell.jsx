// src/components/common/EditableCell.jsx - Enhanced with validation
import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X, AlertTriangle, Info } from 'lucide-react';
import { validateCellValue, formatDisplayValue, sanitizeForSave, getColumnDisplayType } from '../../utils/dataValidation';

const EditableCell = ({ 
  value, 
  onSave, 
  column, 
  rowIndex, 
  isEditing, 
  onStartEdit, 
  onCancelEdit,
  disabled = false,
  showValidation = true 
}) => {
  const [editValue, setEditValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);
  const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [] });
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef(null);

  const dataType = getColumnDisplayType(column);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
    setHasChanges(false);
    setValidation({ isValid: true, errors: [], warnings: [] });
  }, [value]);

  const handleSave = () => {
    if (!validation.isValid) {
      // Don't save if validation fails
      return;
    }

    if (hasChanges && editValue !== value) {
      const sanitizedValue = sanitizeForSave(editValue, column);
      onSave(sanitizedValue);
    }
    onCancelEdit();
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setHasChanges(false);
    setValidation({ isValid: true, errors: [], warnings: [] });
    onCancelEdit();
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    setHasChanges(newValue !== value);

    // Validate in real-time if validation is enabled
    if (showValidation) {
      const validationResult = validateCellValue(column, newValue, dataType);
      setValidation(validationResult);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const getInputType = () => {
    switch (dataType) {
      case 'number':
      case 'currency':
        return 'number';
      case 'date':
        return 'date';
      default:
        return 'text';
    }
  };

  const getInputStep = () => {
    if (dataType === 'currency') {
      return '0.01';
    }
    if (dataType === 'number') {
      return '1';
    }
    return undefined;
  };

  const getCellStatusColor = () => {
    if (!validation.isValid) return 'text-red-600 bg-red-50';
    if (validation.warnings.length > 0) return 'text-orange-600 bg-orange-50';
    if (hasChanges) return 'text-blue-600 bg-blue-50';
    return 'text-gray-900';
  };

  const getStatusIcon = () => {
    if (!validation.isValid) {
      return <AlertTriangle className="w-3 h-3 text-red-500" />;
    }
    if (validation.warnings.length > 0) {
      return <Info className="w-3 h-3 text-orange-500" />;
    }
    if (hasChanges) {
      return <div className="w-2 h-2 bg-blue-400 rounded-full" title="Unsaved changes" />;
    }
    return null;
  };

  const getTooltipContent = () => {
    const messages = [];
    if (validation.errors.length > 0) {
      messages.push(...validation.errors.map(error => `❌ ${error}`));
    }
    if (validation.warnings.length > 0) {
      messages.push(...validation.warnings.map(warning => `⚠️ ${warning}`));
    }
    if (hasChanges && validation.isValid) {
      messages.push('💾 Click to save changes');
    }
    return messages.join('\n');
  };

  if (disabled) {
    return (
      <div className="px-2 py-1 text-gray-500 bg-gray-100 rounded">
        {formatDisplayValue(value, column)}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type={getInputType()}
            step={getInputStep()}
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:border-transparent ${
              validation.isValid 
                ? 'border-blue-300 focus:ring-blue-500' 
                : 'border-red-300 focus:ring-red-500 bg-red-50'
            }`}
            style={{ minWidth: '80px' }}
            placeholder={dataType === 'currency' ? '0.00' : ''}
          />
          {showValidation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded shadow-lg z-50 text-xs max-w-xs">
              {validation.errors.map((error, index) => (
                <div key={`error-${index}`} className="text-red-600 mb-1">❌ {error}</div>
              ))}
              {validation.warnings.map((warning, index) => (
                <div key={`warning-${index}`} className="text-orange-600">⚠️ {warning}</div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleSave}
            disabled={!validation.isValid}
            className={`p-1 rounded transition-colors ${
              validation.isValid 
                ? 'text-green-600 hover:bg-green-100' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={validation.isValid ? 'Save changes' : 'Fix validation errors first'}
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Cancel changes"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`group relative flex items-center justify-between cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors min-h-[32px] ${getCellStatusColor()}`}
      onClick={onStartEdit}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title="Click to edit"
    >
      <span className="flex-1 truncate">
        {formatDisplayValue(editValue, column)}
      </span>
      
      <div className="flex items-center gap-1 ml-2">
        {getStatusIcon()}
        <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Tooltip for validation messages */}
      {showTooltip && showValidation && getTooltipContent() && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 max-w-xs whitespace-pre-line">
          {getTooltipContent()}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default EditableCell;