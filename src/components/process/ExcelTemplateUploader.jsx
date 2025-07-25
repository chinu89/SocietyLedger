import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Eye, EyeOff, CheckCircle, AlertTriangle, Download, Settings, Zap } from 'lucide-react';
import { excelTemplateService } from '../../services/excelTemplateService';
import { downloadSocietyBillTemplate } from '../../utils/societyBillTemplateGenerator';

const ExcelTemplateUploader = ({ 
  currentData, 
  onTemplateLoad, 
  onExcelGenerate,
  societyName,
  disabled = false 
}) => {
  const [templateInfo, setTemplateInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState('');
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  
  // Generation options
  const [generationMode, setGenerationMode] = useState('single_sheet');
  const [singleRecordMode, setSingleRecordMode] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleDownloadSampleTemplate = async () => {
    try {
      setError('');
      setSuccessMessage('');
      const result = await downloadSocietyBillTemplate();
      if (result.success) {
        setSuccessMessage('Sample template downloaded! This template matches your excel_report.xlsx format with all required variables.');
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
    setTemplateInfo(null);
    setValidationResult(null);

    try {
      // Process Excel template file
      const result = await excelTemplateService.processTemplateFile(file);
      
      if (result.success) {
        setTemplateInfo(result.template);
        
        // Validate template variables against current data
        if (currentData && currentData.length > 0) {
          const dataFields = Object.keys(currentData[0]);
          const validation = excelTemplateService.validateTemplateVariables(
            result.template.variables, 
            dataFields
          );
          setValidationResult(validation);
        }

        // Notify parent component
        if (onTemplateLoad) {
          onTemplateLoad(result.template);
        }
      }

    } catch (error) {
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

    try {
      const options = {
        mode: generationMode,
        singleRecordMode: singleRecordMode
      };

      const result = await excelTemplateService.generateAndDownloadExcel(
        currentData, 
        societyName,
        options
      );

      if (onExcelGenerate) {
        onExcelGenerate(result);
      }

    } catch (error) {
      setError(`Excel generation failed: ${error.message}`);
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
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

  return (
    <div className="space-y-6">
      {/* Template Upload Section */}
      <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 bg-orange-50">
        <div className="text-center">
          <FileSpreadsheet className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <h4 className="text-md font-medium text-orange-900 mb-2">
            Upload Excel Report Template
          </h4>
          <p className="text-sm text-orange-600 mb-4">
            Upload an Excel file with `${'${FIELD_NAME}'}` placeholders for dynamic content replacement
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={disabled || isProcessing}
            className="hidden"
            id="excel-template-upload-step-4"
          />
          
          <div className="flex gap-3">
            <label
              htmlFor="excel-template-upload-step-4"
              className={`inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 cursor-pointer transition-colors ${
                disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <Zap className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? 'Processing...' : 'Choose Excel Template'}
            </label>
            
            <button
              onClick={handleDownloadSampleTemplate}
              disabled={disabled}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Sample Template
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

          {/* Template Variables */}
          {templateInfo.variables.length > 0 && (
            <div className="mb-4">
              <h6 className="font-medium text-gray-800 mb-2">Template Variables:</h6>
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
                </div>

                {generationMode === 'single_sheet' && (
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={singleRecordMode}
                        onChange={(e) => setSingleRecordMode(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Single Record Mode - Use only first record for template
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Enable this for templates designed for a single record (like invoices)
                    </p>
                  </div>
                )}
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
              {isGeneratingExcel ? 'Generating Excel...' : `Generate Excel (${currentData?.length || 0} records)`}
            </button>

            <div className="text-sm text-gray-600">
              Mode: {generationMode === 'multiple_sheets' ? 'Multi-Sheet' : 'Single Sheet'}
              {generationMode === 'single_sheet' && singleRecordMode && ' (Single Record)'}
            </div>
          </div>
        </div>
      )}

      {/* Template Requirements - Updated with Society Bill Format */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h6 className="font-medium text-blue-900 mb-2">Society Bill Template Requirements:</h6>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• Excel file format (.xlsx or .xls)</div>
          <div>• Use `${'${FIELD_NAME}'}` for dynamic content (e.g., `${'${NAME}'}`, `${'${TOTAL}'}`)</div>
          <div>• <strong>Download our sample template</strong> - it matches your excel_report.xlsx format!</div>
          <div>• Template includes society header, billing details, charges breakdown, and receipt</div>
          <div>• Two-column layout for charges (left and right sides)</div>
          <div>• Currency fields are automatically formatted (₹1,234.56)</div>
          <div>• Date fields are formatted as DD-MM-YYYY</div>
          <div>• Excel features preserved: formulas, formatting, merged cells</div>
        </div>
        
        <div className="mt-3">
          <p className="text-sm font-medium text-blue-900 mb-1">Key Template Variables (Society Bill Format):</p>
          <div className="text-xs font-mono text-blue-700 bg-blue-100 p-3 rounded grid grid-cols-2 gap-2">
            <div>
              <div className="font-bold mb-1">Basic Info:</div>
              <div>${'${SOCIETY_NAME}'}</div>
              <div>${'${NAME}'}</div>
              <div>${'${FLAT_NO}'}</div>
              <div>${'${CODE_NO}'}</div>
              <div>${'${BILL_NO}'}</div>
            </div>
            <div>
              <div className="font-bold mb-1">Charges:</div>
              <div>${'${MAINT_CHG}'}</div>
              <div>${'${WATER_CHG}'}</div>
              <div>${'${ELECT_CHG}'}</div>
              <div>${'${TOTAL}'}</div>
              <div>${'${GR_TOTAL}'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Template Download Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <h6 className="font-medium text-green-900 mb-2">🎯 Perfect Match Template Available!</h6>
        <div className="text-sm text-green-800 space-y-2">
          <div>✅ <strong>Ready-to-use template</strong> that generates output identical to your excel_report.xlsx</div>
          <div>✅ <strong>Two-column charges layout</strong> with proper formatting</div>
          <div>✅ <strong>Society header, bill details, and receipt section</strong></div>
          <div>✅ <strong>All variables pre-configured</strong> for your data fields</div>
          <div>✅ <strong>Professional formatting</strong> with borders, fonts, and number formatting</div>
          
          <div className="mt-3 p-3 bg-white rounded border border-green-300">
            <div className="font-medium text-green-900 mb-2">Template Features:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>📋 Society name header</div>
              <div>🏠 Flat and code details</div>
              <div>📅 Period and bill dates</div>
              <div>💰 Two-column charges layout</div>
              <div>🧮 Automatic totals calculation</div>
              <div>🧾 Built-in receipt section</div>
              <div>📝 Member notes section</div>
              <div>✍️ Signature areas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Features */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h6 className="font-medium text-green-900 mb-2">Advanced Features:</h6>
        <div className="text-sm text-green-800 space-y-1">
          <div>✅ <strong>Multiple Generation Modes:</strong> Single sheet or separate sheets per record</div>
          <div>✅ <strong>Excel Formatting Preserved:</strong> Fonts, colors, borders, cell formatting</div>
          <div>✅ <strong>Formula Support:</strong> Excel formulas are maintained and updated</div>
          <div>✅ <strong>Rich Text Support:</strong> Mixed formatting within cells</div>
          <div>✅ <strong>Merged Cells:</strong> Complex layouts with merged cell ranges</div>
          <div>✅ <strong>Conditional Formatting:</strong> Excel conditional formatting rules preserved</div>
          <div>✅ <strong>Print Ready:</strong> Page setup, headers, footers maintained</div>
          <div>✅ <strong>Much Smaller Files:</strong> ~50KB vs 200MB+ PDF files</div>
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
            <div>📁 <strong>Expected File Size:</strong> ~{Math.round(currentData.length * 0.5)}KB</div>
          </div>
        </div>
      )}

      {/* Advantages over PDF */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h6 className="font-medium text-purple-900 mb-2">Why Excel Templates vs PDF:</h6>
        <div className="text-sm text-purple-800 space-y-1">
          <div>🚀 <strong>Much Smaller Files:</strong> 50KB Excel vs 200MB+ PDF</div>
          <div>✏️ <strong>Editable:</strong> Customers can modify data if needed</div>
          <div>🧮 <strong>Excel Features:</strong> Formulas, sorting, filtering, calculations</div>
          <div>📊 <strong>Data Analysis:</strong> Built-in Excel tools for analysis</div>
          <div>🖨️ <strong>Better Printing:</strong> Excel handles pagination and print layouts</div>
          <div>💾 <strong>Easy Sharing:</strong> Smaller files, faster upload/download</div>
          <div>🔄 <strong>Format Conversion:</strong> Easily convert to PDF manually when needed</div>
        </div>
      </div>
    </div>
  );
};

export default ExcelTemplateUploader;