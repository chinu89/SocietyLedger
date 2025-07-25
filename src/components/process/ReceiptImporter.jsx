// src/components/process/ReceiptImporter.jsx - Enhanced with Code No inheritance display
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, RefreshCw, Receipt, Info } from 'lucide-react';

const ReceiptImporter = ({ 
  currentData, 
  onDataUpdate, 
  disabled = false 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
      setImportResults({
        success: false,
        error: 'Please upload only Excel files (.xlsx or .xls)',
        results: null
      });
      setShowResults(true);
      event.target.value = '';
      return;
    }

    setIsProcessing(true);
    setImportResults(null);
    setShowResults(false);

    try {
      // Import the receipt processor
      const { processReceiptFile } = await import('../../services/receiptProcessor');
      
      // Process the receipt file
      const result = await processReceiptFile(file, currentData);
      
      if (result.success) {
        // Update the parent component with new data
        onDataUpdate(result.updatedData);
        
        setImportResults({
          success: true,
          results: result.processingSummary,
          updatedData: result.updatedData
        });
      } else {
        setImportResults({
          success: false,
          error: result.error,
          results: result.processingSummary || null
        });
      }
      
      setShowResults(true);

    } catch (error) {
      setImportResults({
        success: false,
        error: `Receipt import failed: ${error.message}`,
        results: null
      });
      setShowResults(true);
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Import Section */}
      <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50">
        <div className="text-center">
          <Receipt className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <h4 className="text-md font-medium text-green-900 mb-2">
            Import Receipt Data for Step 1
          </h4>
          <p className="text-sm text-green-600 mb-4">
            Upload Excel file with receipt details to update existing data
          </p>
          
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={disabled || isProcessing}
            className="hidden"
            id="receipt-file-upload"
          />
          
          <label
            htmlFor="receipt-file-upload"
            className={`inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer transition-colors ${
              disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isProcessing ? 'Processing...' : 'Choose Receipt Excel File'}
          </label>
        </div>
      </div>

      {/* Results Section */}
      {showResults && importResults && (
        <div className={`border rounded-lg p-4 ${
          importResults.success 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {importResults.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <h5 className={`font-medium ${
              importResults.success ? 'text-green-900' : 'text-red-900'
            }`}>
              Receipt Import {importResults.success ? 'Completed' : 'Failed'}
            </h5>
          </div>

          {importResults.success && importResults.results && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-gray-700">
                  <span className="font-medium">Total Records:</span> {importResults.results.totalRecordsInFile}
                </div>
                <div className="text-green-700">
                  <span className="font-medium">Processed:</span> {importResults.results.processedCodeNos}
                </div>
                <div className="text-blue-700">
                  <span className="font-medium">Updated:</span> {importResults.results.updatedRecords}
                </div>
                <div className="text-yellow-700">
                  <span className="font-medium">Skipped:</span> {importResults.results.skippedRecords}
                </div>
              </div>

              {/* NEW: Code No Inheritance Display */}
              {importResults.results.codeNoInherited > 0 && (
                <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600 text-lg">🧬</span>
                    <span className="font-medium text-blue-900">Code No Inheritance Applied</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{importResults.results.codeNoInherited}</span> rows automatically inherited Code No from previous rows.
                    This allows you to specify Code No only once per group instead of repeating it for each row.
                  </p>
                </div>
              )}

              {/* REC_NO Generation Info */}
              {importResults.results.recNoGenerated > 0 && (
                <div className="mt-3 p-3 bg-purple-100 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-600 text-lg">🔢</span>
                    <span className="font-medium text-purple-900">REC_NO Sequential Generation</span>
                  </div>
                  <div className="text-sm text-purple-800 space-y-1">
                    <p><span className="font-medium">Generated:</span> {importResults.results.recNoGenerated} new receipt numbers</p>
                    <p><span className="font-medium">Range:</span> {importResults.results.oldMaxRecNo + 1} to {importResults.results.newMaxRecNo}</p>
                    <p><span className="font-medium">Previous Max:</span> {importResults.results.oldMaxRecNo} → <span className="font-medium">New Max:</span> {importResults.results.newMaxRecNo}</p>
                  </div>
                </div>
              )}

              {importResults.results.updatedColumns.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-green-900 mb-2">Updated Receipt Columns:</p>
                  <div className="flex flex-wrap gap-2">
                    {importResults.results.updatedColumns.map(column => (
                      <span key={column} className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">
                        {column}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {importResults.results.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-yellow-900 mb-2">Warnings:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResults.results.warnings.slice(0, 8).map((warning, index) => (
                      <div key={index} className="text-xs text-yellow-800 bg-yellow-100 px-2 py-1 rounded">
                        {warning}
                      </div>
                    ))}
                    {importResults.results.warnings.length > 8 && (
                      <div className="text-xs text-yellow-600">
                        ... and {importResults.results.warnings.length - 8} more warnings
                      </div>
                    )}
                  </div>
                </div>
              )}

              {importResults.results.errors.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-red-900 mb-2">Errors:</p>
                  <div className="space-y-1">
                    {importResults.results.errors.slice(0, 3).map((error, index) => (
                      <div key={index} className="text-xs text-red-800 bg-red-100 px-2 py-1 rounded">
                        {error}
                      </div>
                    ))}
                    {importResults.results.errors.length > 3 && (
                      <div className="text-xs text-red-600">
                        ... and {importResults.results.errors.length - 3} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!importResults.success && (
            <div className="text-red-700 text-sm">
              <p className="font-medium">Error:</p>
              <p>{importResults.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h6 className="font-medium text-blue-900 mb-2">Receipt File Requirements:</h6>
            <div className="text-xs text-blue-800 space-y-1">
              <div><strong>Required Columns:</strong> Code No, Cheque No, Chq.Date, Name of Bank, Receipt Amount</div>
              <div><strong>🆕 Flexible Code No:</strong> Only the first row needs Code No - subsequent rows inherit it automatically</div>
              <div><strong>Data Structure:</strong> Each Code No should have up to 3 rows (for 3 months in quarter)</div>
              <div><strong>Row Order:</strong> Rows should be in chronological order (Month 1, Month 2, Month 3)</div>
              <div><strong>Zero Values:</strong> Use 0 or leave empty for months with no receipts</div>
              <div><strong>File Format:</strong> Excel (.xlsx or .xls) files only</div>
              <div><strong>Additional Columns:</strong> Any extra columns will be ignored</div>
            </div>
            
            <div className="mt-3 text-xs text-blue-700">
              <p><strong>🆕 Enhanced Processing Logic:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Row 1 data → CHEQUE_NO1, CHEQUE_DT1, BANK1, REC_AMT1</li>
                <li>Row 2 data → CHEQUE_NO2, CHEQUE_DT2, BANK2, REC_AMT2</li>
                <li>Row 3 data → CHEQUE_NO3, CHEQUE_DT3, BANK3, REC_AMT3</li>
                <li><strong>🧬 Code No Inheritance:</strong> If rows 2 or 3 are missing Code No, they will automatically inherit from the previous row</li>
                <li><strong>💡 Tip:</strong> You can now put Code No only in the first row of each group</li>
              </ul>
            </div>

            {/* NEW: Example Section */}
            <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="font-medium text-blue-900 mb-2">📄 Example Excel Format:</p>
              <div className="text-xs text-blue-800 font-mono bg-white p-2 rounded border">
                <div className="grid grid-cols-5 gap-2 mb-1 font-bold border-b pb-1">
                  <span>Code No</span>
                  <span>Cheque No</span>
                  <span>Chq.Date</span>
                  <span>Name of Bank</span>
                  <span>Receipt Amount</span>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-1">
                  <span className="text-green-600">1</span>
                  <span>123456</span>
                  <span>01/01/2025</span>
                  <span>SBI</span>
                  <span>5000</span>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-1">
                  <span className="text-gray-400 italic">(empty)</span>
                  <span>123457</span>
                  <span>01/02/2025</span>
                  <span>HDFC</span>
                  <span>5000</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <span className="text-gray-400 italic">(empty)</span>
                  <span>123458</span>
                  <span>01/03/2025</span>
                  <span>ICICI</span>
                  <span>5000</span>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                ✅ Rows 2 & 3 will automatically inherit Code No "1" from the first row.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptImporter;