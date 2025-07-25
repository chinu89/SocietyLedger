// src/components/process/DataUpdateImporter.jsx - Import Update Feature
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import * as ExcelJS from 'exceljs';

const UPDATABLE_COLUMNS = [
  'BMC_TAX', 'DIFPRP_TAX', 'TAX_DIF', 'MAINT_CHG', 'WATER_CHG', 'SINK_FUND', 'LIFT_MAINT',
  'REP_FUND', 'LET_OUT_CH', 'PARK_CHG', 'SALARY', 'ELECT_CHG', 'BLDG_FUND', 'LEGAL_CHG',
  'PAINT_FD', 'MAPLE_CHG', 'OTHER_CHG1', 'OTHER_CHG2', 'INTEREST', 'TOTAL', 'ARREARS',
  'INT_ARREAR', 'ADVANCE', 'GR_TOTAL', 'BILL_NO', 'PREV_BL_NO', 'CHEQUE_NO1', 'CHEQUE_DT1',
  'BANK1', 'REC_AMT1', 'CHEQUE_NO2', 'CHEQUE_DT2', 'BANK2', 'REC_AMT2', 'CHEQUE_NO3',
  'CHEQUE_DT3', 'BANK3', 'REC_AMT3', 'REC_AMT', 'REC_NO', 'REC_WORD', 'EXTRA', 'OUTST_BAL',
  'REMARKS1', 'REMARKS2', 'BILL_DATE', 'REC_DATE', 'DUE_DATE'
];

const DataUpdateImporter = ({ 
  currentData, 
  onDataUpdate, 
  stepNumber = 1,
  disabled = false 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const parseExcelFile = async (file) => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheet found in Excel file');
      }
      
      const headers = [];
      const jsonData = [];
      
      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        if (cell.value) {
          headers[colNumber - 1] = String(cell.value).trim().toUpperCase();
        }
      });
      
      if (headers.length === 0) {
        throw new Error('No headers found in Excel file');
      }
      
      // Check if FLAT_NO exists
      if (!headers.includes('FLAT_NO')) {
        throw new Error('FLAT_NO column is required in the import file');
      }
      
      // Parse data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        const rowData = {};
        let hasData = false;
        
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            let cellValue = '';
            
            if (cell.value !== null && cell.value !== undefined) {
              if (cell.value instanceof Date) {
                cellValue = cell.value.toISOString().split('T')[0];
              } else if (typeof cell.value === 'object' && cell.value.result !== undefined) {
                cellValue = String(cell.value.result);
              } else {
                cellValue = String(cell.value).trim();
              }
            }
            
            rowData[header] = cellValue;
            if (cellValue && header !== 'FLAT_NO') hasData = true;
          }
        });
        
        // Only add rows that have FLAT_NO and at least one other field with data
        if (rowData.FLAT_NO && hasData) {
          jsonData.push(rowData);
        }
      });
      
      return jsonData;
      
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  };

  const processDataUpdate = (importData, currentData) => {
    const results = {
      totalImportRows: importData.length,
      matchedRecords: 0,
      skippedRecords: 0,
      updatedFields: 0,
      skippedFlatNos: [],
      updatedColumns: new Set(),
      errors: []
    };

    // Create a map of current data by FLAT_NO for quick lookup
    const dataMap = new Map();
    currentData.forEach((row, index) => {
      const flatNo = String(row.FLAT_NO || '').trim();
      if (flatNo) {
        dataMap.set(flatNo, { row, index });
      }
    });

    const updatedData = [...currentData];

    importData.forEach(importRow => {
      const importFlatNo = String(importRow.FLAT_NO || '').trim();
      
      if (!dataMap.has(importFlatNo)) {
        // FLAT_NO doesn't exist in current data, skip
        results.skippedRecords++;
        results.skippedFlatNos.push(importFlatNo);
        return;
      }

      const { row: currentRow, index: currentIndex } = dataMap.get(importFlatNo);
      results.matchedRecords++;
      
      let rowUpdated = false;

      // Update only fields that have values in the import data and are updatable
      Object.keys(importRow).forEach(column => {
        if (column === 'FLAT_NO') return; // Skip FLAT_NO as it's the key
        
        const importValue = importRow[column];
        
        // Only update if the import value is not empty and the column is updatable
        if (importValue !== null && importValue !== undefined && importValue !== '' && 
            UPDATABLE_COLUMNS.includes(column)) {
          
          // Update the value in our data
          updatedData[currentIndex] = {
            ...updatedData[currentIndex],
            [column]: importValue
          };
          
          results.updatedFields++;
          results.updatedColumns.add(column);
          rowUpdated = true;
        }
      });

      if (!rowUpdated) {
        // If no fields were updated for this FLAT_NO, it might be due to empty values
        console.log(`No fields updated for FLAT_NO ${importFlatNo} - all import values were empty or non-updatable`);
      }
    });

    return { updatedData, results };
  };

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
      // Parse the Excel file
      const importData = await parseExcelFile(file);
      
      if (importData.length === 0) {
        throw new Error('No valid data found in the import file');
      }

      // Process the data update
      const { updatedData, results } = processDataUpdate(importData, currentData);

      // Set results for display
      setImportResults({
        success: true,
        results,
        updatedData
      });
      setShowResults(true);

      // Update the parent component with new data
      if (results.updatedFields > 0) {
        onDataUpdate(updatedData);
      }

    } catch (error) {
      setImportResults({
        success: false,
        error: error.message,
        results: null
      });
      setShowResults(true);
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const getStepColor = (step) => {
    const colors = {
      1: 'purple',
      2: 'blue', 
      3: 'green',
      4: 'orange'
    };
    return colors[step] || 'gray';
  };

  const color = getStepColor(stepNumber);

  return (
    <div className="space-y-4">
      {/* Import Section */}
      <div className={`border-2 border-dashed border-${color}-300 rounded-lg p-6 bg-${color}-50`}>
        <div className="text-center">
          <FileSpreadsheet className={`w-10 h-10 text-${color}-400 mx-auto mb-3`} />
          <h4 className={`text-md font-medium text-${color}-900 mb-2`}>
            Import Data Updates for Step {stepNumber}
          </h4>
          <p className={`text-sm text-${color}-600 mb-4`}>
            Upload Excel file with FLAT_NO and updatable columns to update existing data
          </p>
          
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={disabled || isProcessing}
            className="hidden"
            id={`data-update-upload-step-${stepNumber}`}
          />
          
          <label
            htmlFor={`data-update-upload-step-${stepNumber}`}
            className={`inline-flex items-center px-4 py-2 bg-${color}-600 text-white rounded-md hover:bg-${color}-700 cursor-pointer transition-colors ${
              disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isProcessing ? 'Processing...' : 'Choose Excel File'}
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
              Import {importResults.success ? 'Completed' : 'Failed'}
            </h5>
          </div>

          {importResults.success && importResults.results && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-gray-700">
                  <span className="font-medium">Import Rows:</span> {importResults.results.totalImportRows}
                </div>
                <div className="text-green-700">
                  <span className="font-medium">Matched:</span> {importResults.results.matchedRecords}
                </div>
                <div className="text-yellow-700">
                  <span className="font-medium">Skipped:</span> {importResults.results.skippedRecords}
                </div>
                <div className="text-blue-700">
                  <span className="font-medium">Fields Updated:</span> {importResults.results.updatedFields}
                </div>
              </div>

              {importResults.results.updatedColumns.size > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-green-900 mb-2">Updated Columns:</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(importResults.results.updatedColumns).map(column => (
                      <span key={column} className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">
                        {column}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {importResults.results.skippedFlatNos.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-yellow-900 mb-2">
                    Skipped FLAT_NO (not found in current data):
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                    {importResults.results.skippedFlatNos.slice(0, 10).map(flatNo => (
                      <span key={flatNo} className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                        {flatNo}
                      </span>
                    ))}
                    {importResults.results.skippedFlatNos.length > 10 && (
                      <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                        +{importResults.results.skippedFlatNos.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {importResults.results.updatedFields === 0 && (
                <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ No fields were updated. This could be because:
                    <br />• All import values were empty
                    <br />• No FLAT_NO matches were found
                    <br />• Only non-updatable columns were provided
                  </p>
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
        <h6 className="font-medium text-blue-900 mb-2">Import File Requirements:</h6>
        <div className="text-xs text-blue-800 space-y-1">
          <div>• Excel file (.xlsx or .xls) with FLAT_NO column as the key</div>
          <div>• Include any updatable columns with new values</div>
          <div>• Empty cells in import file will be ignored (won't overwrite existing data)</div>
          <div>• Only records with matching FLAT_NO will be updated</div>
          <div>• Records with FLAT_NO not found in current data will be skipped</div>
        </div>
        
        <div className="mt-3">
          <p className="text-xs font-medium text-blue-900 mb-1">Updatable Columns Include:</p>
          <div className="text-xs text-blue-700 grid grid-cols-3 gap-1 max-h-24 overflow-y-auto">
            {UPDATABLE_COLUMNS.slice(0, 12).map(col => (
              <span key={col}>{col}</span>
            ))}
            <span className="italic">...and {UPDATABLE_COLUMNS.length - 12} more</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUpdateImporter;