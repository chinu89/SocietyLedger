// src/services/receiptRegisterService.js - UPDATED WITH DYNAMIC COLUMN RANGE
import * as ExcelJS from 'exceljs';

class ReceiptRegisterService {
  constructor() {
    this.societyDetails = null;
    this.templateStructure = null;
    this.headerMergeRange = null; // NEW: Store user-defined merge range
  }

  setSocietyDetails(societyName, details) {
    this.societyDetails = {
      societyName,
      ...details
    };
  }

  // NEW: Set the header merge range
  setHeaderMergeRange(range) {
    this.headerMergeRange = range;
  }

  async generateReceiptRegister({
    data,
    template,
    societyName,
    societyDetails = {},
    headerMergeRange = 'A:H' // NEW: Default to A:H but allow override
  }) {
    try {
      console.log('🧾 Generating Receipt Register...');

      this.setSocietyDetails(societyName, societyDetails);
      this.setHeaderMergeRange(headerMergeRange); // NEW: Set the merge range
      
      const templateWorkbook = await this.processTemplate(template);
      await this.analyzeTemplateStructure(templateWorkbook);
      
      const receiptData = this.prepareReceiptData(data);
      
      if (receiptData.length === 0) {
        throw new Error('No receipt data found. Please ensure records have receipt amounts greater than 0.');
      }

      const outputWorkbook = new ExcelJS.Workbook();
      outputWorkbook.creator = 'Gawde Account Service - Receipt Register';
      outputWorkbook.created = new Date();

      await this.generateReceiptRegisterSheet(outputWorkbook, templateWorkbook, receiptData);

      const filename = this.generateFilename(societyName);
      const buffer = await outputWorkbook.xlsx.writeBuffer();
      
      this.downloadExcelFile(buffer, filename);

      return {
        success: true,
        filename,
        recordCount: receiptData.length,
        reportType: 'Receipt Register',
        templateFlavor: this.templateStructure.flavor,
        totalReceiptAmount: this.calculateTotalReceipts(receiptData),
        headerMergeRange: this.headerMergeRange // NEW: Return the range used
      };

    } catch (error) {
      console.error('❌ Receipt register generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ... (processTemplate, analyzeTemplateStructure, determineTemplateFlavor, getDataTemplateRows, prepareReceiptData methods remain the same)

  async processTemplate(templateFile) {
    const arrayBuffer = await templateFile.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    return workbook;
  }

  async analyzeTemplateStructure(templateWorkbook) {
    const templateSheet = templateWorkbook.worksheets[0];
    
    const headerEndRow = 3;
    const dataStartRow = 5;
    const flavor = this.determineTemplateFlavor(templateSheet, dataStartRow);
    const dataTemplateRows = this.getDataTemplateRows(templateSheet, dataStartRow, flavor);
    
    this.templateStructure = {
      headerEndRow,
      dataStartRow,
      dataTemplateRows,
      flavor
    };

    console.log(`📋 Template analysis: Flavor=${flavor}, DataStart=${dataStartRow}`);
  }

  determineTemplateFlavor(templateSheet, dataStartRow) {
    let consecutiveTemplateRows = 0;
    
    for (let rowNum = dataStartRow; rowNum <= dataStartRow + 4; rowNum++) {
      const row = templateSheet.getRow(rowNum);
      let hasTemplateVars = false;
      
      row.eachCell((cell) => {
        const value = this.getCellValue(cell);
        if (typeof value === 'string' && value.includes('${')) {
          hasTemplateVars = true;
        }
      });
      
      if (hasTemplateVars) {
        consecutiveTemplateRows++;
      } else if (consecutiveTemplateRows > 0) {
        break;
      }
    }
    
    console.log(`🔍 Found ${consecutiveTemplateRows} consecutive template rows`);
    return consecutiveTemplateRows >= 3 ? 'multi' : 'single';
  }

  getDataTemplateRows(templateSheet, dataStartRow, flavor) {
    const templateRows = [];
    
    if (flavor === 'multi') {
      for (let i = 0; i < 5; i++) {
        const rowNum = dataStartRow + i;
        if (rowNum <= templateSheet.rowCount) {
          const row = templateSheet.getRow(rowNum);
          let hasTemplateVars = false;
          
          row.eachCell((cell) => {
            const value = this.getCellValue(cell);
            if (typeof value === 'string' && value.includes('${')) {
              hasTemplateVars = true;
            }
          });
          
          if (hasTemplateVars) {
            templateRows.push(rowNum);
          } else if (templateRows.length > 0) {
            break;
          }
        }
      }
      
      if (templateRows.length < 3) {
        templateRows.length = 0;
        for (let i = 0; i < 3; i++) {
          templateRows.push(dataStartRow + i);
        }
      }
    } else {
      templateRows.push(dataStartRow);
    }
    
    return templateRows;
  }

  prepareReceiptData(data) {
    return data.filter(row => {
      const recAmt = parseFloat(row.REC_AMT) || 0;
      const recAmt1 = parseFloat(row.REC_AMT1) || 0;
      const recAmt2 = parseFloat(row.REC_AMT2) || 0;
      const recAmt3 = parseFloat(row.REC_AMT3) || 0;
      
      return recAmt > 0 || recAmt1 > 0 || recAmt2 > 0 || recAmt3 > 0;
    });
  }

  async generateReceiptRegisterSheet(outputWorkbook, templateWorkbook, receiptData) {
    const templateSheet = templateWorkbook.worksheets[0];
    const newSheet = outputWorkbook.addWorksheet('Receipt Register');
    
    this.copyPageSetup(templateSheet, newSheet);
    this.copyColumnProperties(templateSheet, newSheet);
    
    let currentRowIndex = 1;
    
    // 1. Create simple header rows (no merged cells)
    this.createSimpleHeaderRows(newSheet, templateSheet, currentRowIndex);
    currentRowIndex += 3;
    
    // 2. Copy column headers from row 4
    this.copyRow(templateSheet, newSheet, 4, currentRowIndex, null);
    currentRowIndex++;
    
    // 3. Generate data rows
    for (let recordIndex = 0; recordIndex < receiptData.length; recordIndex++) {
      const record = receiptData[recordIndex];
      console.log(`📄 Processing record ${recordIndex + 1}/${receiptData.length}: CODE_NO ${record.CODE_NO}`);
      
      if (this.templateStructure.flavor === 'single') {
        this.copyRow(templateSheet, newSheet, this.templateStructure.dataStartRow, currentRowIndex, record);
        currentRowIndex++;
      } else {
        const rowsAdded = this.generateMultiRowReceipt(templateSheet, newSheet, record, currentRowIndex);
        currentRowIndex += rowsAdded;
      }
    }
    
    console.log(`✅ Receipt register generated: ${receiptData.length} records`);
  }

  // NEW: Updated createSimpleHeaderRows to use dynamic column range
  createSimpleHeaderRows(newSheet, templateSheet, startRowIndex) {
    console.log(`📋 Creating simple header rows starting at ${startRowIndex}`);
    console.log(`📋 Using merge range: ${this.headerMergeRange}`);
    
    for (let rowNum = 1; rowNum <= 3; rowNum++) {
      const templateRow = templateSheet.getRow(rowNum);
      const newRow = newSheet.getRow(startRowIndex + rowNum - 1);
      
      if (templateRow.height) {
        newRow.height = templateRow.height;
      }
      
      // Get text from first cell with content
      let rowText = '';
      templateRow.eachCell({ includeEmpty: false }, (cell) => {
        if (!rowText && cell.value) {
          rowText = this.getCellValue(cell);
          return false; // Stop after first cell
        }
      });
      
      // Set text in first column only
      if (rowText) {
        const firstCell = newRow.getCell(1);
        firstCell.value = rowText;
        
        // Copy basic styling
        const templateFirstCell = templateRow.getCell(1);
        if (templateFirstCell.style) {
          firstCell.style = this.copyStyle(templateFirstCell.style);
        }
        
        console.log(`📋 Row ${rowNum}: "${rowText}"`);
      }
      
      newRow.commit();
    }
    
    // NEW: Now merge the header rows AFTER setting the content - using dynamic range
    const currentRow = startRowIndex;
    const mergeRange = this.headerMergeRange || 'A:H'; // Fallback to A:H if not set
    
    // Parse the merge range (e.g., "A:H" or "A:K")
    const [startCol, endCol] = this.parseMergeRange(mergeRange);
    
    // Merge row 1 (society name) across specified columns
    try {
      const mergeAddress = `${startCol}${currentRow}:${endCol}${currentRow}`;
      newSheet.mergeCells(mergeAddress);
      console.log(`📋 Merged row ${currentRow} society name ${mergeAddress}`);
    } catch (e) {
      console.warn('Could not merge society name row:', e.message);
    }
    
    // Merge row 2 (register title) across specified columns
    try {
      const mergeAddress = `${startCol}${currentRow + 1}:${endCol}${currentRow + 1}`;
      newSheet.mergeCells(mergeAddress);
      console.log(`📋 Merged row ${currentRow + 1} register title ${mergeAddress}`);
    } catch (e) {
      console.warn('Could not merge register title row:', e.message);
    }
    
    // Row 3 is usually empty spacing, no merge needed
  }

  // NEW: Helper method to parse merge range like "A:H" or "A:K"
  parseMergeRange(range) {
    try {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        return [start.trim(), end.trim()];
      } else {
        // If single column provided, assume A to that column
        return ['A', range.trim()];
      }
    } catch (e) {
      console.warn('Invalid merge range format, using A:H as fallback:', range);
      return ['A', 'H'];
    }
  }

  // ... (rest of the methods remain the same)

  generateMultiRowReceipt(templateSheet, newSheet, record, startRowIndex) {
    const templateRows = this.templateStructure.dataTemplateRows;
    let rowsAdded = 0;
    
    console.log(`🔄 Generating 3 rows for CODE_NO ${record.CODE_NO}`);
    
    for (let monthIndex = 0; monthIndex < 3; monthIndex++) {
      const templateRowIndex = Math.min(monthIndex, templateRows.length - 1);
      const templateRowNum = templateRows[templateRowIndex];
      const monthRecord = this.createMonthRecord(record, monthIndex + 1);
      
      this.copyRow(templateSheet, newSheet, templateRowNum, startRowIndex + rowsAdded, monthRecord);
      rowsAdded++;
    }
    
    return rowsAdded;
  }

  createMonthRecord(record, monthNumber) {
    const monthRecord = { ...record };
    
    const chequeNoField = `CHEQUE_NO${monthNumber}`;
    const chequeDateField = `CHEQUE_DT${monthNumber}`;
    const bankField = `BANK${monthNumber}`;
    const amountField = `REC_AMT${monthNumber}`;
    
    monthRecord.CHEQUE_NO = record[chequeNoField] || '';
    monthRecord.CHEQUE_DT = record[chequeDateField] || '';
    monthRecord.CHQ_DATE = record[chequeDateField] || '';
    monthRecord.BANK = record[bankField] || '';
    monthRecord.REC_AMT = record[amountField] || '';
    monthRecord.RECEIPT_AMOUNT = record[amountField] || '';
    
    if (monthNumber > 1) {
      monthRecord.CODE_NO = '';
      monthRecord.FLAT_NO = '';
      monthRecord.NAME = '';
    }
    
    return monthRecord;
  }

  copyRow(templateSheet, newSheet, templateRowNum, outputRowNum, record) {
    const templateRow = templateSheet.getRow(templateRowNum);
    const newRow = newSheet.getRow(outputRowNum);
    
    if (templateRow.height) {
      newRow.height = templateRow.height;
    }
    
    templateRow.eachCell({ includeEmpty: true }, (templateCell, colNumber) => {
      const newCell = newRow.getCell(colNumber);
      
      if (templateCell.style) {
        newCell.style = this.copyStyle(templateCell.style);
      }
      
      let processedValue;
      if (record) {
        processedValue = this.processTemplateValue(templateCell.value, record);
      } else {
        processedValue = templateCell.value;
      }
      
      if (processedValue !== null && processedValue !== undefined) {
        newCell.value = processedValue;
      }
    });
    
    newRow.commit();
  }

  processTemplateValue(templateValue, record) {
    if (!templateValue) return '';
    if (!record) return templateValue;

    if (typeof templateValue === 'string' && templateValue.includes('${')) {
      return this.replaceVariables(templateValue, record);
    }

    return templateValue;
  }

  replaceVariables(text, record) {
    if (typeof text !== 'string') return text;

    const variableRegex = /\$\{([A-Z_][A-Z0-9_]*)\}/g;
    
    return text.replace(variableRegex, (match, fieldName) => {
      const value = record[fieldName];
      
      if (value === null || value === undefined || value === '') {
        return '';
      }
      
      if (this.isCurrencyField(fieldName)) {
        return this.formatCurrency(value);
      }
      
      if (this.isDateField(fieldName)) {
        return this.formatDate(value);
      }
      
      return String(value);
    });
  }

  getCellValue(cell) {
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
  }

  copyPageSetup(templateSheet, newSheet) {
    try {
      if (templateSheet.pageSetup) {
        newSheet.pageSetup = JSON.parse(JSON.stringify(templateSheet.pageSetup));
      }
    } catch (e) {
      console.warn('Could not copy page setup');
    }
  }

  copyColumnProperties(templateSheet, newSheet) {
    templateSheet.columns.forEach((col, index) => {
      if (col) {
        try {
          const newCol = newSheet.getColumn(index + 1);
          if (col.width) newCol.width = col.width;
          if (col.hidden) newCol.hidden = col.hidden;
        } catch (e) {
          console.warn(`Could not copy column ${index + 1}`);
        }
      }
    });
  }

  copyStyle(originalStyle) {
    try {
      const style = {};
      
      if (originalStyle.font) style.font = { ...originalStyle.font };
      if (originalStyle.alignment) style.alignment = { ...originalStyle.alignment };
      if (originalStyle.border) style.border = JSON.parse(JSON.stringify(originalStyle.border));
      if (originalStyle.fill) style.fill = JSON.parse(JSON.stringify(originalStyle.fill));
      if (originalStyle.numFmt) style.numFmt = originalStyle.numFmt;
      
      return style;
    } catch (e) {
      return {};
    }
  }

  isCurrencyField(fieldName) {
    const currencyFields = [
      'REC_AMT', 'REC_AMT1', 'REC_AMT2', 'REC_AMT3', 'RECEIPT_AMOUNT',
      'TOTAL', 'GR_TOTAL', 'ARREARS', 'ADVANCE', 'OUTST_BAL'
    ];
    return currencyFields.includes(fieldName);
  }

  isDateField(fieldName) {
    const dateFields = [
      'REC_DATE', 'CHEQUE_DT', 'CHEQUE_DT1', 'CHEQUE_DT2', 'CHEQUE_DT3', 'CHQ_DATE'
    ];
    return dateFields.includes(fieldName);
  }

  formatCurrency(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  formatDate(value) {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      return date.toLocaleDateString('en-IN');
    } catch {
      return value;
    }
  }

  calculateTotalReceipts(receiptData) {
    return receiptData.reduce((total, record) => {
      const recAmt = parseFloat(record.REC_AMT) || 0;
      const recAmt1 = parseFloat(record.REC_AMT1) || 0;
      const recAmt2 = parseFloat(record.REC_AMT2) || 0;
      const recAmt3 = parseFloat(record.REC_AMT3) || 0;
      return total + recAmt + recAmt1 + recAmt2 + recAmt3;
    }, 0);
  }

  generateFilename(societyName) {
    const date = new Date().toISOString().split('T')[0];
    const society = societyName ? societyName.replace(/[^a-zA-Z0-9]/g, '_') : 'Society';
    return `${society}_ReceiptRegister_${date}.xlsx`;
  }

  downloadExcelFile(buffer, filename) {
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// NEW: Updated export function to accept headerMergeRange parameter
export const generateReceiptRegister = async (config) => {
  const service = new ReceiptRegisterService();
  return await service.generateReceiptRegister(config);
};

export default ReceiptRegisterService;