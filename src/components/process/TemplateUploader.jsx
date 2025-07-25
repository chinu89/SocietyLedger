// src/components/process/TemplateUploader.jsx - SMART TEMPLATE UPLOADER
import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Eye, EyeOff, CheckCircle, AlertTriangle, Download, Settings, Zap, Table, FileText } from 'lucide-react';
import { excelTemplateService } from '../../services/excelTemplateService';
import { downloadSocietyBillTemplate } from '../../utils/societyBillTemplateGenerator';

const TemplateUploader = ({ 
  currentData, 
  onTemplateLoad, 
  onExcelGenerate,
  societyName,
  societyDetails = {},
  disabled = false 
}) => {
  const [templateInfo, setTemplateInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  
  // Generation options
  const [generationMode, setGenerationMode] = useState('auto');
  
  const fileInputRef = useRef(null);

  // Set society details in the service when component mounts or details change
  React.useEffect(() => {
    if (societyName && societyDetails) {
      console.log('🏢 Setting society details in template service:', societyName, societyDetails);
      excelTemplateService.setSocietyDetails(societyName, societyDetails);
    }
  }, [societyName, societyDetails]);

  const handleDownloadSampleTemplate = async () => {
    try {
      setError('');
      setSuccessMessage('');
      const result = await downloadSocietyBillTemplate();
      if (result.success) {
        setSuccessMessage('Sample FORM template downloaded! This is a full bill format that repeats for each record.');
      }
    } catch (error) {
      setError(`Failed to download sample template: ${error.message}`);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setSuccessMessage('');
    setTemplateInfo(null);
    setValidationResult(null);

    try {
      console.log('📤 Processing template file:', file.name);
      
      // Process Excel template file using the smart service
      const result = await excelTemplateService.processTemplateFile(file);
      
      if (result.success) {
        console.log('✅ Template processed successfully:', result);
        setTemplateInfo(result.template);
        
        // Validate template variables against current data
        if (currentData && currentData.length > 0) {
          const dataFields = Object.keys(currentData[0]);
          const validation = excelTemplateService.validateTemplateVariables(
            result.template.variables, 
            dataFields
          );
          setValidationResult(validation);
          console.log('🔍 Template validation result:', validation);
        }

        // Notify parent component
        if (onTemplateLoad) {
          onTemplateLoad(result.template);
        }

        setSuccessMessage(
          `${result.template.templateType} template loaded successfully! ` +
          `Found ${result.variableCount} variables. ` +
          `${getTemplateTypeDescription(result.template.templateType)}`
        );
      }

    } catch (error) {
      console.error('❌ Template processing error:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleGenerateExcel = async () => {
    if (!templateInfo || !currentData || currentData.length === 0) {
      setError('Template and data are required for Excel generation');
      return;
    }

    setIsGeneratingExcel(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('🚀 Starting Excel generation...');
      console.log('📊 Data records:', currentData.length);
      console.log('📋 Template type:', templateInfo.templateType);
      console.log('⚙️ Generation mode:', generationMode);

      // Prepare options based on template type and user selection
      const options = {
        mode: generationMode === 'auto' ? getAutoMode(templateInfo.templateType, currentData.length) : generationMode
      };

      console.log('🎯 Final options:', options);

      // Generate and download Excel using the smart service
      const result = await excelTemplateService.generateAndDownloadExcel(
        currentData, 
        societyName,
        options
      );

      console.log('✅ Excel generation completed:', result);

      if (onExcelGenerate) {
        onExcelGenerate(result);
      }

      setSuccessMessage(
        `${result.templateType} Excel generated successfully! ` +
        `${result.filename} with ${result.recordCount} records across ${result.worksheetCount} worksheet(s).`
      );

    } catch (error) {
      console.error('❌ Excel generation failed:', error);
      setError(`Excel generation failed: ${error.message}`);
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const getAutoMode = (templateType, recordCount) => {
    if (templateType === 'TABLE') {
      return 'single_sheet'; // Table templates always single sheet
    } else if (templateType === 'FORM') {
      return recordCount <= 5 ? 'multiple_sheets' : 'single_sheet'; // Auto-decide for forms
    }
    return 'single_sheet';
  };

  const getTemplateTypeDescription = (templateType) => {
    switch (templateType) {
      case 'TABLE':
        return 'This is a table/summary format where data rows repeat but headers stay fixed.';
      case 'FORM':
        return 'This is a form/bill format where the entire template repeats for each record.';
      default:
        return 'Template type auto-detected.';
    }
  };

  const getTemplateTypeIcon = (templateType) => {
    switch (templateType) {
      case 'TABLE':
        return <Table className="w-5 h-5 text-blue-600" />;
      case 'FORM':
        return <FileText className="w-5 h-5 text-green-600" />;
      default:
        return <FileSpreadsheet className="w-5 h-5 text-gray-600" />;
    }
  };

  const getValidationIcon = () => {
    if (!validationResult) return null;
    
    if (validationResult.isValid) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const getValidationMessage = () => {
    if (!validationResult) return '';
    
    if (validationResult.isValid) {
      return `All ${validationResult.totalVariables} template variables are valid`;
    } else {
      return `${validationResult.missingFields.length} variables not found in data`;
    }
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  return (
    <div className="space-y-6">
      {/* Template Upload Section */}
      <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 bg-orange-50">
        <div className="text-center">
          <FileSpreadsheet className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <h4 className="text-md font-medium text-orange-900 mb-2">
            Upload Excel Template (Auto-Detects Type)
          </h4>
          <p className="text-sm text-orange-600 mb-4">
            Upload either TABLE format (like Ack Template) or FORM format (like Full Bill). 
            The system will automatically detect the type and process accordingly.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={disabled || isProcessing}
            className="hidden"
            id="smart-excel-template-upload"
          />
          
          <div className="flex gap-3 justify-center">
            <label
              htmlFor="smart-excel-template-upload"
              className={`inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 cursor-pointer transition-colors ${
                disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <Zap className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? 'Auto-Detecting...' : 'Choose Excel Template'}
            </label>
            
            <button
              onClick={handleDownloadSampleTemplate}
              disabled={disabled}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Sample FORM Template
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h5 className="font-medium text-green-900">Success!</h5>
          </div>
          <p className="text-sm text-green-700 mt-1">{successMessage}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h5 className="font-medium text-red-900">Template Error</h5>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Template Info Display */}
      {templateInfo && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-orange-600" />
              <div>
                <h5 className="font-medium text-gray-900">{templateInfo.name}</h5>
                <p className="text-sm text-gray-600">
                  {Math.round(templateInfo.size / 1024)} KB • {templateInfo.variables.length} variables • {templateInfo.worksheetCount} worksheets
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getTemplateTypeIcon(templateInfo.templateType)}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  templateInfo.templateType === 'TABLE' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {templateInfo.templateType} Template
                </span>
              </div>
              {validationResult && (
                <div className="flex items-center gap-2">
                  {getValidationIcon()}
                  <span className={`text-sm ${validationResult.isValid ? 'text-green-700' : 'text-red-700'}`}>
                    {getValidationMessage()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Template Type Explanation */}
          <div className={`mb-4 p-3 rounded-lg ${
            templateInfo.templateType === 'TABLE' 
              ? 'bg-blue-50 border border-blue-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {getTemplateTypeIcon(templateInfo.templateType)}
              <h6 className={`font-medium ${
                templateInfo.templateType === 'TABLE' ? 'text-blue-900' : 'text-green-900'
              }`}>
                {templateInfo.templateType} Template Detected
              </h6>
            </div>
            <p className={`text-sm ${
              templateInfo.templateType === 'TABLE' ? 'text-blue-800' : 'text-green-800'
            }`}>
              {getTemplateTypeDescription(templateInfo.templateType)}
            </p>
            
            {templateInfo.templateType === 'TABLE' && (
              <div className="mt-2 text-xs text-blue-600">
                💡 Perfect for acknowledgment receipts, summary reports, and tabular data where only the data rows change.
              </div>
            )}
            
            {templateInfo.templateType === 'FORM' && (
              <div className="mt-2 text-xs text-green-600">
                💡 Perfect for individual bills, invoices, and detailed forms where each record needs the complete template.
              </div>
            )}
          </div>

          {/* Template Variables */}
          {templateInfo.variables.length > 0 && (
            <div className="mb-4">
              <h6 className="font-medium text-gray-800 mb-2">Template Variables Found:</h6>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {templateInfo.variables.map(variable => {
                  const isValid = validationResult?.availableFields.includes(variable);
                  return (
                    <span
                      key={variable}
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        isValid 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                    >
                      ${'{'}${variable}{'}'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Missing Variables Warning */}
          {validationResult && !validationResult.isValid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <h6 className="font-medium text-yellow-800 mb-1">Missing Variables:</h6>
              <p className="text-sm text-yellow-700">
                The following variables are in the template but not found in your data: 
                <strong> {validationResult.missingFields.join(', ')}</strong>
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                These variables will be replaced with empty values in the generated Excel file.
              </p>
            </div>
          )}

          {/* Generation Options */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h6 className="font-medium text-gray-800">Generation Options</h6>
              <button
                onClick={toggleOptions}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4 mr-1" />
                {showOptions ? 'Hide Options' : 'Show Options'}
              </button>
            </div>

            {showOptions && (
              <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generation Mode
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="generationMode"
                        value="auto"
                        checked={generationMode === 'auto'}
                        onChange={(e) => setGenerationMode(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        <strong>Auto</strong> - System decides best format based on template type and record count
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="generationMode"
                        value="single_sheet"
                        checked={generationMode === 'single_sheet'}
                        onChange={(e) => setGenerationMode(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Single Sheet - All records in one worksheet
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="generationMode"
                        value="multiple_sheets"
                        checked={generationMode === 'multiple_sheets'}
                        onChange={(e) => setGenerationMode(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Multiple Sheets - Separate worksheet for each record
                      </span>
                    </label>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    {generationMode === 'auto' && templateInfo.templateType === 'TABLE' && 
                      '🎯 Auto mode will use single sheet (best for table templates)'}
                    {generationMode === 'auto' && templateInfo.templateType === 'FORM' && 
                      '🎯 Auto mode will choose based on record count (≤5: multiple sheets, >5: single sheet)'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generate Excel Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateExcel}
              disabled={!currentData || currentData.length === 0 || isGeneratingExcel}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingExcel ? (
                <Zap className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isGeneratingExcel ? 'Generating...' : `Generate ${templateInfo.templateType} Excel (${currentData?.length || 0} records)`}
            </button>

            <div className="text-sm text-gray-600">
              Type: {templateInfo.templateType} • 
              Mode: {generationMode === 'auto' ? `Auto (${getAutoMode(templateInfo.templateType, currentData?.length || 0)})` : generationMode}
            </div>
          </div>

          {/* Society Details Integration */}
          {societyName && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h6 className="font-medium text-blue-900 mb-1">🏢 Society Integration Active</h6>
              <div className="text-sm text-blue-800 space-y-1">
                <div><strong>Society:</strong> {societyName}</div>
                {societyDetails.regNo && <div><strong>Registration:</strong> {societyDetails.regNo}</div>}
                {societyDetails.address && <div><strong>Address:</strong> {societyDetails.address}</div>}
                <div className="mt-2 text-xs text-blue-600">
                  💡 Society variables like ${'{SOCIETY_NAME}'}, ${'{SOCIETY_REG_NO}'}, ${'{SOCIETY_ADDRESS}'} are automatically available.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Types Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200 rounded-lg p-4">
        <h6 className="font-medium text-gray-900 mb-3">📋 Template Types Guide</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* TABLE Template */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Table className="w-5 h-5 text-blue-600" />
              <h6 className="font-medium text-blue-900">TABLE Template</h6>
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>Best for:</strong> Acknowledgment receipts, summary reports</div>
              <div><strong>Structure:</strong> Fixed headers + repeating data rows</div>
              <div><strong>Example:</strong> Ack Template (society header + member list)</div>
              <div><strong>Output:</strong> Always single sheet with data rows</div>
            </div>
          </div>

          {/* FORM Template */}
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-green-600" />
              <h6 className="font-medium text-green-900">FORM Template</h6>
            </div>
            <div className="text-sm text-green-800 space-y-1">
              <div><strong>Best for:</strong> Individual bills, detailed invoices</div>
              <div><strong>Structure:</strong> Complete form repeats per record</div>
              <div><strong>Example:</strong> Full Society Bill (entire bill per member)</div>
              <div><strong>Output:</strong> Multiple sheets OR single sheet with page breaks</div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-600">
          💡 <strong>Smart Detection:</strong> The system automatically detects your template type and chooses the best processing method.
        </div>
      </div>

      {/* Data Summary */}
      {currentData && currentData.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h6 className="font-medium text-gray-900 mb-2">Data Summary:</h6>
          <div className="text-sm text-gray-700 grid grid-cols-2 gap-4">
            <div>📊 <strong>Records:</strong> {currentData.length}</div>
            <div>📋 <strong>Available Fields:</strong> {Object.keys(currentData[0]).length}</div>
            <div>🏢 <strong>Society:</strong> {societyName || 'Not specified'}</div>
            <div>📁 <strong>Expected Output:</strong> {templateInfo?.templateType || 'Auto-detected'} format</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateUploader;