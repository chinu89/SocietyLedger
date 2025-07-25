// src/components/process/ProcessedDataView.jsx - Updated with Default Hide Validation
import React, { useState, useRef, useEffect } from 'react';
import { Search, Download, Filter, Eye, EyeOff, ArrowUpDown, BarChart3, TrendingUp, Calendar, Edit2, Check, X, Save, AlertCircle, DollarSign, TrendingDown } from 'lucide-react';
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
  }, [value]);

  const handleSave = () => {
    if (hasChanges && editValue !== value) {
      onSave(editValue);
    }
    onCancelEdit();
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setHasChanges(false);
    onCancelEdit();
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    setHasChanges(newValue !== value);
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

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        <input
          ref={inputRef}
          type={getInputType()}
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ minWidth: '80px' }}
        />
        <div className="flex gap-1">
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:bg-green-100 rounded"
            title="Save changes"
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
    );
  }

  return (
    <div 
      className="group flex items-center justify-between cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors"
      onClick={onStartEdit}
      title="Click to edit"
    >
      <span className="flex-1 truncate">
        {formatDisplayValue(editValue, column)}
      </span>
      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
      {hasChanges && (
        <div className="w-2 h-2 bg-orange-400 rounded-full ml-1" title="Unsaved changes" />
      )}
    </div>
  );
};

const ProcessedDataView = ({ 
  data, 
  currentStep, 
  searchTerm, 
  onSearchChange, 
  onExportExcel,
  isImported = false,
  defaultHideValidation = false // NEW PROP
}) => {
  const { actions } = useApp();
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showStats, setShowStats] = useState(!defaultHideValidation); // NEW: Use prop to set default
  const [editingCell, setEditingCell] = useState({ rowIndex: null, column: null });
  const [modifiedData, setModifiedData] = useState(data);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update modifiedData when data prop changes
  useEffect(() => {
    setModifiedData(data);
    setHasUnsavedChanges(false);
  }, [data]);

  const handleCellEdit = (rowIndex, column, newValue) => {
    const sanitizedValue = sanitizeForSave(newValue, column);
    const updatedData = [...modifiedData];
    updatedData[rowIndex] = { ...updatedData[rowIndex], [column]: sanitizedValue };
    setModifiedData(updatedData);
    setHasUnsavedChanges(true);
  };

  const handleStartEdit = (rowIndex, column) => {
    setEditingCell({ rowIndex, column });
  };

  const handleCancelEdit = () => {
    setEditingCell({ rowIndex: null, column: null });
  };

  const saveAllChanges = () => {
    if (isImported) {
      actions.setImportedData(modifiedData);
      actions.setSuccess('Imported data updated successfully!');
    } else {
      actions.setProcessedData(modifiedData);
      actions.setSuccess(`Step ${currentStep} data updated successfully!`);
    }
    setHasUnsavedChanges(false);
  };

  const discardChanges = () => {
    setModifiedData(data);
    setHasUnsavedChanges(false);
    setEditingCell({ rowIndex: null, column: null });
    actions.setSuccess('Changes discarded successfully!');
  };

  if (!modifiedData || modifiedData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">
            {isImported ? 'Import data to see it here.' : 'Complete processing steps to see processed data here.'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate financial validation statistics (only for Step 3 and above)
  const calculateFinancialStats = () => {
    if (currentStep < 3 && !isImported) {
      return null;
    }

    const parseAmount = (value) => parseFloat(value) || 0;
    
    const totalOutstanding = modifiedData.reduce((sum, row) => sum + parseAmount(row.OUTST_BAL), 0);
    const totalArrears = modifiedData.reduce((sum, row) => sum + parseAmount(row.ARREARS), 0);
    const totalIntArrears = modifiedData.reduce((sum, row) => sum + parseAmount(row.INT_ARREAR), 0);
    const totalAdvance = modifiedData.reduce((sum, row) => sum + parseAmount(row.ADVANCE), 0);
    
    // Calculate expected outstanding balance: (ARREARS + INT_ARREARS) - ADVANCE
    const expectedOutstanding = (totalArrears + totalIntArrears) - totalAdvance;
    
    // Check if the validation passes (values are equal)
    const isBalanced = Math.abs(totalOutstanding - expectedOutstanding) < 0.01; // Allow for small rounding differences
    
    return {
      totalOutstanding,
      totalArrears,
      totalIntArrears,
      totalAdvance,
      expectedOutstanding,
      isBalanced,
      difference: totalOutstanding - expectedOutstanding
    };
  };

  const financialStats = calculateFinancialStats();

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return modifiedData;
    
    return [...modifiedData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      // Handle numeric sorting
      if (!isNaN(aVal) && !isNaN(bVal)) {
        return sortConfig.direction === 'asc' 
          ? parseFloat(aVal) - parseFloat(bVal)
          : parseFloat(bVal) - parseFloat(aVal);
      }
      
      // Handle string sorting
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [modifiedData, sortConfig]);

  // Column management - now uses dynamic column detection
  const allHeaders = getUniqueColumns(modifiedData);
  const displayHeaders = showAllColumns ? allHeaders : allHeaders.slice(0, 8);
  const maxRows = 20;

  // Identify extra columns for highlighting
  const standardColumns = ['MONTH_FROM', 'MONTH_TO', 'YEAR', 'CODE_NO', 'FLAT_NO', 'NAME', 'TOTAL', 'GR_TOTAL', 'BILL_NO', 'ARREARS', 'ADVANCE', 'OUTST_BAL'];
  const extraColumns = allHeaders.filter(col => !standardColumns.includes(col));

  // Get step status badge
  const getStepBadge = () => {
    if (isImported) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Imported Data
        </span>
      );
    }

    const stepColors = {
      0: 'bg-gray-100 text-gray-600',
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-purple-100 text-purple-800',
      3: 'bg-green-100 text-green-800',
      4: 'bg-emerald-100 text-emerald-800'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${stepColors[currentStep] || stepColors[0]}`}>
        Step {currentStep} Processed
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Financial Validation Statistics - Only show if showStats is true AND after Step 3 */}
      {showStats && financialStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Outstanding Balance</p>
                <p className="text-2xl font-bold">₹{financialStats.totalOutstanding.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Total Arrears</p>
                <p className="text-2xl font-bold">₹{financialStats.totalArrears.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Interest Arrears</p>
                <p className="text-2xl font-bold">₹{financialStats.totalIntArrears.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-red-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Advance</p>
                <p className="text-2xl font-bold">₹{financialStats.totalAdvance.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-200" />
            </div>
          </div>
        </div>
      )}

      {/* Financial Validation Alert - Only show if showStats is true AND after Step 3 */}
      {showStats && financialStats && (
        <div className={`rounded-lg p-4 border ${
          financialStats.isBalanced 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {financialStats.isBalanced ? (
                <div className="flex items-center gap-2 text-green-800">
                  <Check className="w-5 h-5" />
                  <div>
                    <h4 className="font-medium">Financial Validation: PASSED</h4>
                    <p className="text-sm text-green-600">
                      Outstanding Balance matches calculation: (Arrears + Interest) - Advance = ₹{financialStats.expectedOutstanding.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <h4 className="font-medium">Financial Validation: FAILED</h4>
                    <p className="text-sm text-red-600">
                      Outstanding Balance (₹{financialStats.totalOutstanding.toLocaleString()}) does not match 
                      expected calculation (₹{financialStats.expectedOutstanding.toLocaleString()})
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Difference: ₹{Math.abs(financialStats.difference).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">Formula Validation</div>
              <div className="text-xs text-gray-600">
                OUTST_BAL = (ARREARS + INT_ARREAR) - ADVANCE
              </div>
              <div className={`text-xs font-mono ${
                financialStats.isBalanced ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{financialStats.totalOutstanding.toLocaleString()} = 
                (₹{financialStats.totalArrears.toLocaleString()} + 
                ₹{financialStats.totalIntArrears.toLocaleString()}) - 
                ₹{financialStats.totalAdvance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={saveAllChanges}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium shadow-sm"
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
              
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-orange-800">Unsaved Changes</h4>
                  <p className="text-sm text-orange-600">You have modified data that hasn't been saved yet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {isImported ? 'Imported' : 'Processed'} Data 
                {hasUnsavedChanges && <span className="text-orange-600">*</span>}
              </h2>
              {getStepBadge()}
              <span className="text-sm text-gray-500">
                ({sortedData.length} records)
              </span>
              
              {/* Controls */}
              {financialStats && (
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {showStats ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showStats ? 'Hide Validation' : 'Show Validation'}
                </button>
              )}
              
              {/* Show All Columns Button */}
              <button
                onClick={() => setShowAllColumns(!showAllColumns)}
                className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showAllColumns ? `Show Less (${displayHeaders.length}/${allHeaders.length})` : `Show All (${allHeaders.length})`}
              </button>
              
              {/* Extra columns indicator */}
              {extraColumns.length > 0 && (
                <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  +{extraColumns.length} extra column{extraColumns.length > 1 ? 's' : ''}
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={onExportExcel}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </button>
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${isImported ? 'imported' : 'processed'} data...`}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        {/* Table Container with Horizontal Scroll */}
        <div className={`${showAllColumns ? 'overflow-x-auto' : 'overflow-x-hidden'}`}>
          <div className={`${showAllColumns ? 'min-w-max' : ''}`}>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {displayHeaders.map((header) => {
                    const isExtraColumn = extraColumns.includes(header);
                    return (
                      <th
                        key={header}
                        onClick={() => handleSort(header)}
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors ${
                          showAllColumns ? 'min-w-[120px] whitespace-nowrap' : ''
                        } ${isExtraColumn ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
                        title={isExtraColumn ? 'Extra column not in standard template' : ''}
                      >
                        <div className="flex items-center gap-1">
                          {header}
                          {isExtraColumn && (
                            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full" title="Extra column" />
                          )}
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          {sortConfig.key === header && (
                            <span className="text-blue-600">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedData.slice(0, maxRows).map((row, rowIndex) => (
                  <tr key={row._rowIndex || rowIndex} className="hover:bg-blue-50 transition-colors">
                    {displayHeaders.map((header, cellIndex) => {
                      const isEditing = editingCell.rowIndex === rowIndex && editingCell.column === header;
                      const isExtraColumn = extraColumns.includes(header);
                      
                      return (
                        <td
                          key={cellIndex}
                          className={`px-4 py-3 text-sm border-b border-gray-100 ${
                            showAllColumns ? 'min-w-[120px] whitespace-nowrap' : ''
                          } ${isExtraColumn ? 'bg-blue-25' : ''}`}
                        >
                          <EditableCell
                            value={row[header] || ''}
                            onSave={(newValue) => handleCellEdit(rowIndex, header, newValue)}
                            column={header}
                            rowIndex={rowIndex}
                            isEditing={isEditing}
                            onStartEdit={() => handleStartEdit(rowIndex, header)}
                            onCancelEdit={handleCancelEdit}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
            <div>
              Showing {Math.min(maxRows, sortedData.length)} of {sortedData.length} records
              {allHeaders.length > displayHeaders.length && (
                <span className="ml-2">
                  • {displayHeaders.length} of {allHeaders.length} columns
                </span>
              )}
              {extraColumns.length > 0 && (
                <span className="ml-2 text-blue-600">
                  • {extraColumns.length} extra column{extraColumns.length > 1 ? 's' : ''}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="ml-2 text-orange-600 font-medium">
                  • Unsaved changes
                </span>
              )}
              {financialStats && (
                <span className={`ml-2 font-medium ${
                  financialStats.isBalanced ? 'text-green-600' : 'text-red-600'
                }`}>
                  • Financial validation: {financialStats.isBalanced ? 'PASSED' : 'FAILED'}
                </span>
              )}
            </div>
            
            {sortConfig.key && (
              <div className="flex items-center gap-2">
                <span>Sorted by {sortConfig.key}</span>
                <button
                  onClick={() => setSortConfig({ key: null, direction: 'asc' })}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear Sort
                </button>
              </div>
            )}
          </div>
          
          {/* Editing Instructions */}
          <div className="mt-2 text-xs text-gray-500">
            💡 <strong>Tip:</strong> Click on any cell to edit its value. Press Enter to save or Escape to cancel.
            {showAllColumns && (
              <span className="ml-2">
                📋 <strong>Scroll horizontally</strong> to view all columns when "Show All" is enabled.
              </span>
            )}
            {extraColumns.length > 0 && (
              <span className="ml-2 text-blue-600">
                🆕 <strong>Extra columns:</strong> {extraColumns.slice(0, 3).join(', ')}{extraColumns.length > 3 ? '...' : ''}
              </span>
            )}
            {financialStats && (
              <span className="ml-2">
                🔍 <strong>Financial Validation:</strong> OUTST_BAL = (ARREARS + INT_ARREAR) - ADVANCE
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessedDataView;