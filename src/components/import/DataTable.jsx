// src/components/import/DataTable.jsx - Enhanced with dynamic column support
import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X, Save, AlertCircle, Eye, EyeOff } from 'lucide-react';
import SearchInput from '../common/SearchInput';
import ExportButtons from '../common/ExportButtons';
import { useApp } from '../../context/AppContext';
import { 
  validateCellValue, 
  formatDisplayValue, 
  sanitizeForSave,
  getUniqueColumns,
  getPrioritizedColumns,
  getColumnDisplayType
} from '../../utils/dataValidation';

const EditableCell = ({ 
  value, 
  onSave, 
  column, 
  rowIndex, 
  isEditing, 
  onStartEdit, 
  onCancelEdit 
}) => {
  const [editValue, setEditValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);
  const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [] });
  const inputRef = useRef(null);

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
    
    // Real-time validation
    const dataType = getColumnDisplayType(column);
    const validationResult = validateCellValue(column, newValue, dataType);
    setValidation(validationResult);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (validation.isValid) {
        handleSave();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const getInputType = () => {
    const dataType = getColumnDisplayType(column);
    switch (dataType) {
      case 'numeric':
        return 'number';
      case 'date':
        return 'date';
      default:
        return 'text';
    }
  };

  const getCellClassName = () => {
    let baseClass = "group flex items-center justify-between cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors min-h-[32px]";
    
    if (hasChanges) {
      if (!validation.isValid) {
        baseClass += " bg-red-50 border border-red-200";
      } else if (validation.warnings.length > 0) {
        baseClass += " bg-orange-50 border border-orange-200";
      } else {
        baseClass += " bg-blue-50 border border-blue-200";
      }
    }
    
    return baseClass;
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type={getInputType()}
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            className={`flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:border-transparent ${
              validation.isValid 
                ? 'border-blue-300 focus:ring-blue-500' 
                : 'border-red-300 focus:ring-red-500'
            }`}
            style={{ minWidth: '80px' }}
          />
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={!validation.isValid}
              className={`p-1 rounded ${
                validation.isValid 
                  ? 'text-green-600 hover:bg-green-100' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={validation.isValid ? "Save changes" : "Fix validation errors first"}
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Cancel changes"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        {/* Validation messages */}
        {!validation.isValid && (
          <div className="text-xs text-red-600">
            {validation.errors.join(', ')}
          </div>
        )}
        {validation.warnings.length > 0 && (
          <div className="text-xs text-orange-600">
            {validation.warnings.join(', ')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={getCellClassName()}
      onClick={onStartEdit}
      title="Click to edit"
    >
      <span className="flex-1 truncate">
        {formatDisplayValue(editValue, column)}
      </span>
      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
      {hasChanges && (
        <div className={`w-2 h-2 rounded-full ml-1 ${
          !validation.isValid 
            ? 'bg-red-400' 
            : validation.warnings.length > 0 
              ? 'bg-orange-400' 
              : 'bg-blue-400'
        }`} title={
          !validation.isValid 
            ? 'Validation errors' 
            : validation.warnings.length > 0 
              ? 'Warnings' 
              : 'Unsaved changes'
        } />
      )}
    </div>
  );
};

const DataTable = ({ 
  data, 
  title, 
  searchTerm, 
  onSearchChange,
  onExportExcel,
  maxRows = 10,
  maxColumns = 8,
  editable = true
}) => {
  const { actions } = useApp();
  const [editingCell, setEditingCell] = useState({ rowIndex: null, column: null });
  const [modifiedData, setModifiedData] = useState(data);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);

  // Update modifiedData when data prop changes
  useEffect(() => {
    setModifiedData(data);
    setHasUnsavedChanges(false);
  }, [data]);

  const handleCellEdit = (rowIndex, column, newValue) => {
    const updatedData = [...modifiedData];
    updatedData[rowIndex] = { ...updatedData[rowIndex], [column]: newValue };
    setModifiedData(updatedData);
    setHasUnsavedChanges(true);
  };

  const handleStartEdit = (rowIndex, column) => {
    if (editable) {
      setEditingCell({ rowIndex, column });
    }
  };

  const handleCancelEdit = () => {
    setEditingCell({ rowIndex: null, column: null });
  };

  const saveAllChanges = () => {
    actions.setImportedData(modifiedData);
    actions.setSuccess('Imported data updated successfully!');
    setHasUnsavedChanges(false);
  };

  const discardChanges = () => {
    setModifiedData(data);
    setHasUnsavedChanges(false);
    setEditingCell({ rowIndex: null, column: null });
    actions.setSuccess('Changes discarded successfully!');
  };

  if (!modifiedData || modifiedData.length === 0) return null;

  // Get all unique columns and prioritize them
  const allColumns = getUniqueColumns(modifiedData);
  // const prioritizedColumns = getPrioritizedColumns(allColumns);
  // const displayHeaders = showAllColumns ? prioritizedColumns : prioritizedColumns.slice(0, maxColumns);
  const displayHeaders = showAllColumns ? allColumns : allColumns.slice(0, maxColumns);
  const displayData = modifiedData.slice(0, maxRows);

  // Categorize columns for better display
  const standardColumns = ['MONTH_FROM', 'MONTH_TO', 'YEAR', 'CODE_NO', 'FLAT_NO', 'NAME', 'TOTAL', 'GR_TOTAL', 'BILL_NO'];
  const extraColumns = allColumns.filter(col => !standardColumns.includes(col));

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <div className="mx-6 mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-800">Unsaved Changes</h4>
                <p className="text-sm text-orange-600">You have modified imported data that hasn't been saved yet.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveAllChanges}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
              <button
                onClick={discardChanges}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {title} ({modifiedData.length} records)
              {hasUnsavedChanges && <span className="text-orange-600">*</span>}
            </h2>
            
            {/* Column information display */}
            {extraColumns.length > 0 && (
              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                +{extraColumns.length} extra column{extraColumns.length > 1 ? 's' : ''}
              </div>
            )}
            
            {/* Show/Hide All Columns Button */}
            <button
              onClick={() => setShowAllColumns(!showAllColumns)}
              className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              {showAllColumns ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showAllColumns ? `Hide (${displayHeaders.length}/${allColumns.length})` : `Show All (${allColumns.length})`}
            </button>
          </div>
          
          <ExportButtons
            onExportExcel={onExportExcel}
          />
        </div>
        
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search in all columns..."
        />

        {/* Enhanced tips with column information */}
        <div className="mt-3 text-xs text-gray-500 space-y-1">
          {editable && (
            <div>💡 <strong>Tip:</strong> Click on any cell to edit its value. Press Enter to save or Escape to cancel.</div>
          )}
          {extraColumns.length > 0 && (
            <div>🆕 <strong>Extra columns detected:</strong> {extraColumns.slice(0, 5).join(', ')}{extraColumns.length > 5 ? ` and ${extraColumns.length - 5} more` : ''}</div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {displayHeaders.map((column) => {
                const isExtraColumn = extraColumns.includes(column);
                return (
                  <th
                    key={column}
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b ${
                      isExtraColumn 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-500'
                    }`}
                    title={isExtraColumn ? 'Extra column not in standard template' : ''}
                  >
                    <div className="flex items-center gap-1">
                      {column}
                      {isExtraColumn && (
                        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full" title="Extra column" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, rowIndex) => (
              <tr key={row._rowIndex || rowIndex} className="hover:bg-gray-50">
                {displayHeaders.map((header, cellIndex) => {
                  const isEditing = editingCell.rowIndex === rowIndex && editingCell.column === header;
                  const isExtraColumn = extraColumns.includes(header);
                  
                  return (
                    <td
                      key={cellIndex}
                      className={`px-4 py-3 text-sm border-b whitespace-nowrap ${
                        isExtraColumn ? 'bg-blue-25' : 'text-gray-900'
                      }`}
                    >
                      {editable ? (
                        <EditableCell
                          value={row[header] || ''}
                          onSave={(newValue) => handleCellEdit(rowIndex, header, newValue)}
                          column={header}
                          rowIndex={rowIndex}
                          isEditing={isEditing}
                          onStartEdit={() => handleStartEdit(rowIndex, header)}
                          onCancelEdit={handleCancelEdit}
                        />
                      ) : (
                        <span>{formatDisplayValue(row[header] || '', header)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 text-center text-gray-500">
          <div className="space-y-1">
            <div>
              Showing first {Math.min(maxRows, modifiedData.length)} records and {Math.min(maxColumns, allColumns.length)} columns.
              {allColumns.length > maxColumns && !showAllColumns && ` ${allColumns.length - maxColumns} more columns available.`}
            </div>
            
            {/* Column breakdown */}
            <div className="text-xs">
              Total columns: {allColumns.length} 
              {extraColumns.length > 0 && (
                <span className="text-blue-600"> (including {extraColumns.length} extra)</span>
              )}
              {hasUnsavedChanges && (
                <span className="ml-2 text-orange-600 font-medium">• Unsaved changes</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;