// src/components/view/ReportGenerationModal.jsx - Updated with Bill Register Support
import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Receipt, User, Download, AlertCircle, Check, Info, Columns } from 'lucide-react';

const ReportGenerationModal = ({ 
  isOpen, 
  onClose, 
  reportType, 
  onGenerate, 
  isGenerating = false 
}) => {
  const [template, setTemplate] = useState(null);
  const [outputMode, setOutputMode] = useState('single'); // 'single' or 'multi'
  const [headerMergeRange, setHeaderMergeRange] = useState('A:H'); // Default for receipts
  const [error, setError] = useState('');
  const [templateVariables, setTemplateVariables] = useState([]); // NEW: Detected variables
  const [selectedTotalFields, setSelectedTotalFields] = useState([]); // NEW: Fields to total

  // NEW: Analyze template for variables
  const analyzeTemplateVariables = async (templateFile) => {
    const ExcelJS = await import('exceljs');
    const arrayBuffer = await templateFile.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    const worksheet = workbook.worksheets[0];
    const variables = new Set();
    
    // Scan all cells for ${VARIABLE} patterns
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const cellValue = getCellValue(cell);
        if (typeof cellValue === 'string' && cellValue.includes('${')) {
          const matches = cellValue.match(/\$\{([A-Z_][A-Z0-9_]*)\}/g);
          if (matches) {
            matches.forEach(match => {
              const variable = match.replace('${', '').replace('}', '');
              variables.add(variable);
            });
          }
        }
      });
    });
    
    return Array.from(variables).sort();
  };

  // Helper function to get cell value (similar to service)
  const getCellValue = (cell) => {
    if (!cell || !cell.value) return '';
    
    if (typeof cell.value === 'string') {
      return cell.value;
    }
    
    if (cell.value && typeof cell.value === 'object') {
      if (cell.value.richText && Array.isArray(cell.value.richText)) {
        return cell.value.richText.map(part => part.text || '').join('');
      }
      if (cell.value.text) return cell.value.text;
      if (cell.value.result !== undefined) return String(cell.value.result);
    }
    
    return String(cell.value);
  };

  // NEW: Handle total field selection
  const handleTotalFieldToggle = (fieldName) => {
    setSelectedTotalFields(prev => {
      if (prev.includes(fieldName)) {
        return prev.filter(f => f !== fieldName);
      } else {
        return [...prev, fieldName];
      }
    });
  };

  const handleTemplateUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setTemplate(file);
    setError('');
    
    // NEW: Analyze template for variables if it's a bill report
    if (reportType === 'bill') {
      try {
        const variables = await analyzeTemplateVariables(file);
        setTemplateVariables(variables);
        
        // Auto-select common currency fields
        const defaultCurrencyFields = [
          'MAINT_CHG', 'WATER_CHG', 'BMC_TAX', 'ELECT_CHG', 'SALARY',
          'OTHER_CHG1', 'OTHER_CHG2', 'SINK_FUND', 'REP_FUND', 'LET_OUT_CH',
          'PARK_CHG', 'BLDG_FUND', 'LEGAL_CHG', 'PAINT_FD', 'MAPLE_CHG',
          'LIFT_MAINT', 'INT_ARREAR', 'TOTAL', 'ARREARS', 'ADVANCE', 'OUTST_BAL',
          'INTEREST', 'REC_AMT', 'REC_AMT1', 'REC_AMT2', 'REC_AMT3', 'GR_TOTAL'
        ];
        
        const autoSelected = variables.filter(variable => 
          defaultCurrencyFields.includes(variable)
        );
        setSelectedTotalFields(autoSelected);
        
      } catch (error) {
        console.warn('Could not analyze template variables:', error);
        setTemplateVariables([]);
        setSelectedTotalFields([]);
      }
    }
    
    event.target.value = ''; // Reset file input
  };

  // Validate header merge range
  const validateMergeRange = (range) => {
    if (!range) return false;
    
    // Allow formats like "A:H", "A:K", "H", etc.
    const rangePattern = /^[A-Z]+(:?[A-Z]+)?$/i;
    return rangePattern.test(range.trim());
  };

  const handleMergeRangeChange = (event) => {
    const value = event.target.value.toUpperCase().trim();
    setHeaderMergeRange(value);
    
    if (value && !validateMergeRange(value)) {
      setError('Invalid column range format. Use formats like "A:H", "A:K", or just "H"');
    } else {
      setError('');
    }
  };

  // Update default header merge range based on report type
  useEffect(() => {
    if (reportType === 'bill') {
      setHeaderMergeRange('A:J'); // Wider default for bills
    } else if (reportType === 'receipt') {
      setHeaderMergeRange('A:H'); // Standard default for receipts
    }
  }, [reportType]);

  const handleGenerate = () => {
    if (!template) {
      setError('Please upload a template file first');
      return;
    }

    // Validate merge range for receipt and bill reports
    if ((reportType === 'receipt' || reportType === 'bill') && headerMergeRange && !validateMergeRange(headerMergeRange)) {
      setError('Please enter a valid column range (e.g., A:H, A:K, or just H)');
      return;
    }

    const config = {
      template,
      outputMode: reportType === 'receipt' ? 'single' : outputMode, // Force single for receipt
      reportType,
      headerMergeRange: (reportType === 'receipt' || reportType === 'bill') ? headerMergeRange : undefined // Pass merge range for both receipt and bill
    };

    // NEW: Add selected total fields for bill reports
    if (reportType === 'bill' && selectedTotalFields.length > 0) {
      config.selectedTotalFields = selectedTotalFields;
    }

    onGenerate(config);
  };

  const handleClose = () => {
    setTemplate(null);
    setOutputMode('single');
    setHeaderMergeRange('A:H'); // Reset to default
    setError('');
    setTemplateVariables([]); // NEW: Reset variables
    setSelectedTotalFields([]); // NEW: Reset selected fields
    onClose();
  };

  const getReportInfo = () => {
    switch (reportType) {
      case 'receipt':
        return {
          title: 'Receipt Register Report',
          icon: <Receipt className="w-6 h-6 text-green-600" />,
          description: 'Generate a comprehensive receipt register with all payment details',
          bgColor: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          features: [
            'Single sheet format with header section once',
            'Auto-detection of template flavor (single/multi row per CODE_NO)',
            'Filters records with receipt amounts > 0',
            'Supports quarterly summary and monthly detail formats',
            'Customizable header merge range for different template widths',
            'Proper receipt amount and date formatting'
          ]
        };
      case 'bill':
        return {
          title: 'Bill Register Report',
          icon: <FileText className="w-6 h-6 text-blue-600" />,
          description: 'Generate a complete bill register for the entire month',
          bgColor: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          features: [
            'Complete monthly billing data for all members',
            'Individual bills or consolidated register format',
            'All billing components included (maintenance, water, electricity, etc.)',
            'Automatic total calculations with bold formatting',
            'Customizable header merge range for different template widths',
            'Professional bill formatting with society details',
            'Support for both single-sheet and multi-sheet outputs'
          ]
        };
      case 'member':
        return {
          title: 'Member Detail Report',
          icon: <User className="w-6 h-6 text-purple-600" />,
          description: 'Generate detailed individual member reports',
          bgColor: 'from-purple-50 to-violet-50',
          borderColor: 'border-purple-200',
          features: [
            'Individual member details',
            'Complete billing history',
            'Payment status and arrears',
            'Customizable member templates'
          ]
        };
      default:
        return {
          title: 'Report Generation',
          icon: <FileText className="w-6 h-6 text-gray-600" />,
          description: 'Generate report from processed data',
          bgColor: 'from-gray-50 to-slate-50',
          borderColor: 'border-gray-200',
          features: []
        };
    }
  };

  const reportInfo = getReportInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${reportInfo.bgColor} border-b ${reportInfo.borderColor} p-6 rounded-t-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {reportInfo.icon}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {reportInfo.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {reportInfo.description}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isGenerating}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bill Register Special Features */}
          {reportType === 'bill' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Bill Register Features
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    {reportInfo.features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Receipt Register Special Features */}
          {reportType === 'receipt' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    Receipt Register Features
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    {reportInfo.features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Template Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Excel Template *
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleTemplateUpload}
                disabled={isGenerating}
                className="hidden"
                id="template-upload"
              />
              <label
                htmlFor="template-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {template ? template.name : 'Choose Excel template file'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  .xlsx or .xls files only (max 10MB)
                </span>
              </label>
            </div>
            
            {template && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span>Template uploaded: {template.name}</span>
              </div>
            )}
          </div>

          {/* NEW: Total Fields Selection - Only for Bill Register with template uploaded */}
          {reportType === 'bill' && template && templateVariables.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Fields to Total (Optional)
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {templateVariables.map((variable) => (
                    <label key={variable} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTotalFields.includes(variable)}
                        onChange={() => handleTotalFieldToggle(variable)}
                        disabled={isGenerating}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {variable}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 mt-0.5" />
                  <div>
                    <p><strong>Instructions:</strong></p>
                    <p>• Select fields that contain numeric values you want to total at the bottom</p>
                    <p>• Typically currency fields like MAINT_CHG, WATER_CHG, TOTAL, etc.</p>
                    <p>• Don't select text fields like NAME, CODE_NO, BILL_NO</p>
                    <p>• {selectedTotalFields.length} field(s) selected for totaling</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header Merge Range Input - For Receipt Register and Bill Register */}
          {(reportType === 'receipt' || reportType === 'bill') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Header Merge Range
              </label>
              <div className="relative">
                <Columns className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={headerMergeRange}
                  onChange={handleMergeRangeChange}
                  disabled={isGenerating}
                  placeholder={reportType === 'bill' ? "A:J" : "A:H"}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 mt-0.5" />
                  <div>
                    <p><strong>Examples for {reportType === 'bill' ? 'Bill Register' : 'Receipt Register'}:</strong></p>
                    {reportType === 'bill' ? (
                      <>
                        <p>• <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">A:J</code> - Merge from column A to J (recommended for bills)</p>
                        <p>• <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">A:L</code> - Merge from column A to L (wider bills)</p>
                        <p>• <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">K</code> - Merge from column A to K</p>
                      </>
                    ) : (
                      <>
                        <p>• <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">A:H</code> - Merge from column A to H</p>
                        <p>• <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">A:K</code> - Merge from column A to K</p>
                        <p>• <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">H</code> - Merge from column A to H</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Output Mode Selection - Hidden for Receipt Register */}
          {reportType !== 'receipt' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Output Format
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="outputMode"
                    value="single"
                    checked={outputMode === 'single'}
                    onChange={(e) => setOutputMode(e.target.value)}
                    disabled={isGenerating}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    <strong>Single Sheet</strong> - All data in one sheet with page breaks
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="outputMode"
                    value="multi"
                    checked={outputMode === 'multi'}
                    onChange={(e) => setOutputMode(e.target.value)}
                    disabled={isGenerating}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    <strong>Multiple Sheets</strong> - Separate sheet for each record
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Special Report Notes */}
          {reportType === 'receipt' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Receipt registers are always generated as single sheet with header section appearing once. The header merge range controls how wide the society name and title rows are merged.
                </span>
              </div>
            </div>
          )}

          {reportType === 'bill' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Bill registers include all billing data with automatic total calculations. Single sheet mode adds totals at the bottom. Multi-sheet mode creates individual bills per member.
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleGenerate}
              disabled={!template || isGenerating || ((reportType === 'receipt' || reportType === 'bill') && headerMergeRange && !validateMergeRange(headerMergeRange))}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate {reportInfo.title}
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={isGenerating}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerationModal;