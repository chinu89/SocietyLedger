// src/services/receiptProcessor.js - Enhanced with Code No inheritance
import * as ExcelJS from 'exceljs';

// Column mapping - handles various naming conventions
const COLUMN_MAPPING = {
  // Code number variations
  'CODE NO': 'CODE_NO',
  'CODE_NO': 'CODE_NO', 
  'CODENO': 'CODE_NO',
  'CODE NUMBER': 'CODE_NO',
  'FLAT NO': 'CODE_NO',
  'FLAT_NO': 'CODE_NO',
  
  // Cheque number variations
  'CHEQUE NO': 'CHEQUE_NO',
  'CHEQUE_NO': 'CHEQUE_NO',
  'CHQ NO': 'CHEQUE_NO',
  'CHQ_NO': 'CHEQUE_NO',
  'CHECK NO': 'CHEQUE_NO',
  
  // Date variations
  'CHQ.DATE': 'CHEQUE_DT',
  'CHQ DATE': 'CHEQUE_DT',
  'CHEQUE DATE': 'CHEQUE_DT',
  'CHEQUE_DATE': 'CHEQUE_DT',
  'DATE': 'CHEQUE_DT',
  
  // Bank variations
  'NAME OF BANK': 'BANK',
  'BANK NAME': 'BANK',
  'BANK_NAME': 'BANK',
  'BANK': 'BANK',
  
  // Amount variations
  'RECEIPT AMOUNT': 'REC_AMT',
  'AMOUNT': 'REC_AMT',
  'REC_AMT': 'REC_AMT',
  'RECEIVED AMOUNT': 'REC_AMT'
};

class ReceiptProcessor {
  constructor() {
    this.processingSummary = {
      totalRecordsInFile: 0,
      processedCodeNos: 0,
      updatedRecords: 0,
      skippedRecords: 0,
      updatedColumns: [],
      recNoGenerated: 0,
      recNoCleared: 0,
      oldMaxRecNo: 0,
      newMaxRecNo: 0,
      codeNoInherited: 0, // NEW: Track inherited Code No values
      warnings: [],
      errors: []
    };
  }

  async processReceiptFile(file, currentData) {
    try {
      console.log('🧾 Processing receipt file with Code No inheritance:', file.name);
      
      // Reset processing summary
      this.resetSummary();
      
      // Parse Excel file WITH Code No inheritance
      const receiptData = await this.parseExcelFileWithInheritance(file);
      
      if (receiptData.length === 0) {
        throw new Error('No data found in receipt file');
      }
      
      this.processingSummary.totalRecordsInFile = receiptData.length;
      
      // Find the maximum REC_NO from current data (for reference only)
      const maxRecNo = this.findMaxRecNo(currentData);
      this.processingSummary.oldMaxRecNo = maxRecNo;
      console.log(`📊 Previous maximum REC_NO found: ${maxRecNo} (will be cleared and regenerated)`);
      
      // Validate and process data
      const groupedData = this.groupReceiptsByCodeNo(receiptData);
      const updatedData = this.updateCurrentDataWithReceipts(currentData, groupedData, maxRecNo);
      
      console.log(`✅ REC_NO regeneration completed. Cleared all old REC_NO values and generated ${this.processingSummary.recNoGenerated} new sequential receipt numbers.`);
      console.log(`📈 New sequential REC_NO range: ${maxRecNo + 1} to ${this.processingSummary.newMaxRecNo}`);
      console.log(`🔄 Previous max was ${maxRecNo}, now continuing sequential numbering from ${maxRecNo + 1}`);
      console.log(`🧬 Code No inheritance: ${this.processingSummary.codeNoInherited} rows inherited Code No from previous row`);
      
      return {
        success: true,
        updatedData: updatedData,
        processingSummary: this.processingSummary
      };
      
    } catch (error) {
      console.error('❌ Receipt processing error:', error);
      return {
        success: false,
        error: error.message,
        processingSummary: this.processingSummary
      };
    }
  }

  // 🆕 NEW: Enhanced Excel parsing with Code No inheritance
  async parseExcelFileWithInheritance(file) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheet found in Excel file');
      }
      
      // Find header row (skip title rows)
      let headerRow = null;
      let headerRowIndex = 0;
      
      for (let rowNum = 1; rowNum <= Math.min(10, worksheet.rowCount); rowNum++) {
        const row = worksheet.getRow(rowNum);
        let hasRequiredColumns = false;
        
        row.eachCell((cell, colNumber) => {
          const cellValue = this.getCellValue(cell);
          if (cellValue && typeof cellValue === 'string') {
            const normalizedValue = cellValue.toUpperCase().trim();
            if (Object.keys(COLUMN_MAPPING).some(key => key === normalizedValue)) {
              hasRequiredColumns = true;
            }
          }
        });
        
        if (hasRequiredColumns) {
          headerRow = row;
          headerRowIndex = rowNum;
          break;
        }
      }
      
      if (!headerRow) {
        throw new Error('Could not find header row with required columns (Code No, Cheque No, Chq.Date, Name of Bank, Receipt Amount)');
      }
      
      // Extract headers
      const headers = [];
      headerRow.eachCell((cell, colNumber) => {
        const cellValue = this.getCellValue(cell);
        if (cellValue) {
          headers[colNumber - 1] = String(cellValue).trim();
        }
      });
      
      // Validate required columns (Code No still required but can be inherited)
      this.validateRequiredColumns(headers);
      
      // Find Code No column index for inheritance logic
      const codeNoColumn = this.findCodeNoColumn(headers);
      const codeNoColumnIndex = headers.indexOf(codeNoColumn);
      
      // Parse data rows WITH Code No inheritance
      const jsonData = [];
      let lastCodeNo = null; // Track the last valid Code No
      
      for (let rowNum = headerRowIndex + 1; rowNum <= worksheet.rowCount; rowNum++) {
        const row = worksheet.getRow(rowNum);
        const rowData = {};
        let hasData = false;
        
        // First pass: extract all cell values
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            const cellValue = this.getCellValue(cell);
            rowData[header] = cellValue;
            if (cellValue && cellValue !== 0) hasData = true;
          }
        });
        
        // 🆕 NEW: Code No inheritance logic
        if (hasData) {
          const currentCodeNo = rowData[codeNoColumn];
          
          if (currentCodeNo && currentCodeNo !== 0 && String(currentCodeNo).trim() !== '') {
            // Row has a Code No - use it and remember it
            lastCodeNo = parseInt(currentCodeNo) || null;
            console.log(`📍 Found Code No: ${lastCodeNo} at row ${rowNum}`);
          } else if (lastCodeNo !== null) {
            // Row missing Code No but we have a previous one - inherit it
            rowData[codeNoColumn] = lastCodeNo;
            this.processingSummary.codeNoInherited++;
            console.log(`🧬 Inherited Code No: ${lastCodeNo} for row ${rowNum}`);
            this.processingSummary.warnings.push(
              `Row ${rowNum}: Missing Code No, inherited ${lastCodeNo} from previous row`
            );
          } else {
            // No current Code No and no previous Code No to inherit
            console.warn(`⚠️ Row ${rowNum}: No Code No available (current or previous)`);
            this.processingSummary.warnings.push(
              `Row ${rowNum}: No Code No found and no previous Code No to inherit - skipping row`
            );
            continue; // Skip this row
          }
          
          // Only add rows that have some data and a valid Code No (original or inherited)
          if (rowData[codeNoColumn]) {
            jsonData.push(rowData);
          }
        }
      }
      
      console.log(`📊 Parsed ${jsonData.length} rows with ${this.processingSummary.codeNoInherited} Code No inheritances`);
      return jsonData;
      
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  // Find the maximum REC_NO in current data
  findMaxRecNo(currentData) {
    if (!currentData || currentData.length === 0) {
      console.log('⚠️ No current data provided, starting REC_NO from 0');
      return 0;
    }

    try {
      // Find all REC_NO values from the current data
      const recNos = currentData
        .map(row => {
          const recNo = row.REC_NO;
          if (recNo === null || recNo === undefined || recNo === '') {
            return 0;
          }
          const numericRecNo = parseInt(recNo, 10);
          return isNaN(numericRecNo) ? 0 : numericRecNo;
        })
        .filter(recNo => recNo > 0); // Only consider positive numbers

      if (recNos.length === 0) {
        console.log('⚠️ No valid REC_NO values found in current data, starting from 0');
        return 0;
      }

      // Find maximum using Math.max with spread operator
      const maxRecNo = Math.max(...recNos);
      console.log(`📊 Found ${recNos.length} valid REC_NO values, maximum: ${maxRecNo}`);
      
      return maxRecNo;

    } catch (error) {
      console.error('❌ Error finding max REC_NO:', error);
      this.processingSummary.warnings.push(`Error finding max REC_NO: ${error.message}. Starting from 0.`);
      return 0;
    }
  }

  getCellValue(cell) {
    if (!cell || cell.value === null || cell.value === undefined) {
      return '';
    }
    
    if (typeof cell.value === 'string') {
      return cell.value.trim();
    }
    
    if (cell.value instanceof Date) {
      return cell.value.toISOString().split('T')[0];
    }
    
    if (typeof cell.value === 'object') {
      if (cell.value.result !== undefined) {
        return cell.value.result;
      }
      if (cell.value.text !== undefined) {
        return cell.value.text;
      }
    }
    
    return String(cell.value);
  }

  validateRequiredColumns(headers) {
    const requiredMappings = ['CODE_NO', 'CHEQUE_NO', 'CHEQUE_DT', 'BANK', 'REC_AMT'];
    const foundMappings = new Set();
    
    headers.forEach(header => {
      const normalizedHeader = header.toUpperCase().trim();
      if (COLUMN_MAPPING[normalizedHeader]) {
        foundMappings.add(COLUMN_MAPPING[normalizedHeader]);
      }
    });
    
    const missingColumns = requiredMappings.filter(mapping => !foundMappings.has(mapping));
    
    if (missingColumns.length > 0) {
      const missingOriginal = missingColumns.map(mapping => {
        switch (mapping) {
          case 'CODE_NO': return 'Code No';
          case 'CHEQUE_NO': return 'Cheque No';
          case 'CHEQUE_DT': return 'Chq.Date';
          case 'BANK': return 'Name of Bank';
          case 'REC_AMT': return 'Receipt Amount';
          default: return mapping;
        }
      });
      throw new Error(`Missing required columns: ${missingOriginal.join(', ')}`);
    }
  }

  findCodeNoColumn(headers) {
    for (const header of headers) {
      const normalizedHeader = header.toUpperCase().trim();
      if (COLUMN_MAPPING[normalizedHeader] === 'CODE_NO') {
        return header;
      }
    }
    return null;
  }

  normalizeReceiptData(receiptData) {
    return receiptData.map(row => {
      const normalizedRow = {};
      
      Object.keys(row).forEach(originalKey => {
        const normalizedKey = originalKey.toUpperCase().trim();
        const mappedKey = COLUMN_MAPPING[normalizedKey];
        
        if (mappedKey) {
          let value = row[originalKey];
          
          // Handle specific data types
          if (mappedKey === 'CODE_NO') {
            value = parseInt(value) || 0;
          } else if (mappedKey === 'REC_AMT') {
            value = parseFloat(value) || 0;
          } else if (mappedKey === 'CHEQUE_DT') {
            value = this.normalizeDate(value);
          } else {
            value = value ? String(value).trim() : '';
          }
          
          normalizedRow[mappedKey] = value;
        }
      });
      
      return normalizedRow;
    });
  }

  normalizeDate(dateValue) {
    if (!dateValue || dateValue === 0 || dateValue === '0' || dateValue === '') {
      return '';
    }
    
    try {
      let date;
      
      console.log('🗓️ Normalizing date value:', dateValue, 'Type:', typeof dateValue);
      
      // Handle Excel serial number dates (numbers representing days since 1900-01-01)
      if (typeof dateValue === 'number') {
        // Excel date serial number
        date = new Date((dateValue - 25569) * 86400 * 1000);
        console.log('📅 Excel serial date converted:', date);
      }
      // Handle actual Date objects
      else if (dateValue instanceof Date) {
        date = dateValue;
        console.log('📅 Date object used directly:', date);
      }
      // Handle string dates
      else if (typeof dateValue === 'string') {
        const dateStr = dateValue.trim();
        console.log('📅 Processing string date:', dateStr);
        
        // Handle various string formats
        if (dateStr.includes('-') || dateStr.includes('/')) {
          const parts = dateStr.split(/[-\/]/);
          if (parts.length === 3) {
            // Determine format based on first part length
            if (parts[0].length === 4) {
              // YYYY-MM-DD or YYYY/MM/DD
              date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else if (parts[2].length === 4) {
              // DD-MM-YYYY or DD/MM/YYYY
              date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            } else {
              // Try MM-DD-YY or DD-MM-YY (assume DD-MM-YY for day > 12)
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]);
              const year = parseInt(parts[2]) + (parseInt(parts[2]) < 50 ? 2000 : 1900);
              
              if (day > 12) {
                // DD-MM-YY format
                date = new Date(year, month - 1, day);
              } else if (month > 12) {
                // MM-DD-YY format
                date = new Date(year, day - 1, month);
              } else {
                // Ambiguous - assume DD-MM-YY
                date = new Date(year, month - 1, day);
              }
            }
          }
        } 
        // Handle "3 Apr 2025" or "14 Jan 2025" format
        else if (dateStr.includes(' ')) {
          const parts = dateStr.split(' ');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const monthStr = parts[1].toLowerCase();
            const year = parseInt(parts[2]);
            
            // Month name mapping
            const monthNames = {
              'jan': 0, 'january': 0,
              'feb': 1, 'february': 1,
              'mar': 2, 'march': 2,
              'apr': 3, 'april': 3,
              'may': 4,
              'jun': 5, 'june': 5,
              'jul': 6, 'july': 6,
              'aug': 7, 'august': 7,
              'sep': 8, 'september': 8,
              'oct': 9, 'october': 9,
              'nov': 10, 'november': 10,
              'dec': 11, 'december': 11
            };
            
            const month = monthNames[monthStr];
            if (month !== undefined) {
              date = new Date(year, month, day);
            } else {
              // Fallback to standard parsing
              date = new Date(dateStr);
            }
          } else {
            // Fallback to standard parsing
            date = new Date(dateStr);
          }
        }
        // Try standard Date parsing as fallback
        else {
          date = new Date(dateStr);
        }
      }
      // Handle other types
      else {
        date = new Date(dateValue);
      }
      
      // Validate the date
      if (!date || isNaN(date.getTime())) {
        console.warn('❌ Invalid date after parsing:', dateValue);
        return String(dateValue); // Return original value as string if can't parse
      }
      
      // Return in DD/MM/YYYY format consistently
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      const formattedDate = `${day}/${month}/${year}`;
      console.log('✅ Date normalized to:', formattedDate);
      
      return formattedDate;
      
    } catch (error) {
      console.warn('❌ Date parsing error:', error, 'for value:', dateValue);
      return String(dateValue); // Return original value as string if error occurs
    }
  }

  groupReceiptsByCodeNo(receiptData) {
    const normalizedData = this.normalizeReceiptData(receiptData);
    const groupedData = new Map();
    
    normalizedData.forEach((row, index) => {
      const codeNo = row.CODE_NO;
      
      if (!codeNo) {
        this.processingSummary.warnings.push(`Row ${index + 1}: Missing Code No, skipping`);
        return;
      }
      
      if (!groupedData.has(codeNo)) {
        groupedData.set(codeNo, []);
      }
      
      groupedData.get(codeNo).push(row);
    });
    
    // Validate 3-row structure (but allow flexible grouping)
    const validatedData = new Map();
    
    groupedData.forEach((rows, codeNo) => {
      if (rows.length > 3) {
        this.processingSummary.warnings.push(
          `Code No ${codeNo}: Found ${rows.length} rows, using first 3 rows only.`
        );
        rows = rows.slice(0, 3); // Take only first 3 rows
      } else if (rows.length < 3) {
        this.processingSummary.warnings.push(
          `Code No ${codeNo}: Found ${rows.length} rows, padding with empty rows.`
        );
      }
      
      // Ensure we have exactly 3 rows, pad with empty rows if needed
      const paddedRows = [];
      for (let i = 0; i < 3; i++) {
        if (i < rows.length) {
          paddedRows.push(rows[i]);
        } else {
          paddedRows.push({
            CODE_NO: codeNo,
            CHEQUE_NO: '',
            CHEQUE_DT: '',
            BANK: '',
            REC_AMT: 0
          });
        }
      }
      
      validatedData.set(codeNo, paddedRows);
      this.processingSummary.processedCodeNos++;
    });
    
    return validatedData;
  }

  // Update with REC_NO regeneration (clears old REC_NO first, continues from max)
  updateCurrentDataWithReceipts(currentData, groupedReceipts, maxRecNo) {
    const updatedData = [...currentData];
    const updatedColumns = new Set();
    let currentMaxRecNo = maxRecNo;
    
    console.log('🔄 Starting REC_NO regeneration process...');
    console.log(`📊 Previous max REC_NO was: ${maxRecNo}, will continue numbering from ${maxRecNo + 1}`);
    
    // STEP 1: Clear ALL existing REC_NO values first
    updatedData.forEach(row => {
      row.REC_NO = '';
    });
    console.log('🧹 Cleared all existing REC_NO values');
    
    // STEP 2: Process new receipt data
    updatedData.forEach((row, index) => {
      const codeNo = parseInt(row.CODE_NO);
      
      if (groupedReceipts.has(codeNo)) {
        const receiptRows = groupedReceipts.get(codeNo);
        
        // Update receipt columns for each of the 3 months
        receiptRows.forEach((receiptRow, monthIndex) => {
          const suffix = monthIndex + 1; // 1, 2, 3
          
          // Update receipt data
          row[`CHEQUE_NO${suffix}`] = receiptRow.CHEQUE_NO || '';
          row[`CHEQUE_DT${suffix}`] = receiptRow.CHEQUE_DT || '';
          row[`BANK${suffix}`] = receiptRow.BANK || '';
          row[`REC_AMT${suffix}`] = receiptRow.REC_AMT || 0;
          
          // Track updated columns
          updatedColumns.add(`CHEQUE_NO${suffix}`);
          updatedColumns.add(`CHEQUE_DT${suffix}`);
          updatedColumns.add(`BANK${suffix}`);
          updatedColumns.add(`REC_AMT${suffix}`);
        });
        
        this.processingSummary.updatedRecords++;
      } else {
        this.processingSummary.skippedRecords++;
      }
    });
    
    // STEP 3: Regenerate REC_NO for ALL records with ANY payment data (old + new)
    console.log(`🔢 Regenerating REC_NO for all records with payment data, starting from ${maxRecNo + 1}...`);
    
    updatedData.forEach((row, index) => {
      // Check if this row has ANY payment data (across all REC_AMT fields)
      const hasAnyPayments = this.hasAnyPaymentData(row);
      
      if (hasAnyPayments) {
        currentMaxRecNo++;
        row.REC_NO = currentMaxRecNo.toString();
        updatedColumns.add('REC_NO');
        this.processingSummary.recNoGenerated++;
        
        console.log(`🧾 Assigned REC_NO ${currentMaxRecNo} to Code No ${row.CODE_NO} (has payments)`);
      } else {
        // Ensure REC_NO is empty for records with no payments
        row.REC_NO = '';
        console.log(`❌ No REC_NO for Code No ${row.CODE_NO} (no payments)`);
      }
    });
    
    // Update summary
    this.processingSummary.updatedColumns = Array.from(updatedColumns);
    this.processingSummary.newMaxRecNo = currentMaxRecNo;
    this.processingSummary.oldMaxRecNo = maxRecNo;
    this.processingSummary.recNoCleared = updatedData.length;
    
    // Add final summary info
    if (this.processingSummary.skippedRecords > 0) {
      this.processingSummary.warnings.push(
        `${this.processingSummary.skippedRecords} records in main data had no matching receipt data`
      );
    }
    
    this.processingSummary.warnings.push(
      `🔄 Regenerated REC_NO values: cleared ${this.processingSummary.recNoCleared} records, assigned ${this.processingSummary.recNoGenerated} new sequential numbers (${maxRecNo + 1} to ${currentMaxRecNo})`
    );
    
    if (this.processingSummary.codeNoInherited > 0) {
      this.processingSummary.warnings.push(
        `🧬 Code No inheritance: ${this.processingSummary.codeNoInherited} rows inherited Code No from previous row`
      );
    }
    
    console.log('✅ Receipt processing with Code No inheritance completed:', this.processingSummary);
    
    return updatedData;
  }

  // Helper function to check if a row has any payment data
  hasAnyPaymentData(row) {
    // Check all possible REC_AMT fields
    const recAmtFields = ['REC_AMT', 'REC_AMT1', 'REC_AMT2', 'REC_AMT3'];
    
    for (const field of recAmtFields) {
      const amount = parseFloat(row[field]) || 0;
      if (amount > 0) {
        return true;
      }
    }
    
    return false;
  }

  resetSummary() {
    this.processingSummary = {
      totalRecordsInFile: 0,
      processedCodeNos: 0,
      updatedRecords: 0,
      skippedRecords: 0,
      updatedColumns: [],
      recNoGenerated: 0,
      recNoCleared: 0,
      oldMaxRecNo: 0,
      newMaxRecNo: 0,
      codeNoInherited: 0, // NEW: Track inherited Code No values
      warnings: [],
      errors: []
    };
  }
}

// Create singleton instance
const receiptProcessor = new ReceiptProcessor();

// Export the main processing function
export const processReceiptFile = async (file, currentData) => {
  return await receiptProcessor.processReceiptFile(file, currentData);
};

export default receiptProcessor;