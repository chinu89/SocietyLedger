// src/services/billRegisterService.js - Dedicated Bill Register Service with Dynamic Column Range
import * as ExcelJS from 'exceljs';

class BillRegisterService {
  constructor() {
    this.societyDetails = null;
    this.templateStructure = null;
    this.headerMergeRange = null; // Store user-defined merge range
    this.selectedTotalFields = []; // NEW: Store user-selected fields to total
  }

  setSocietyDetails(societyName, details) {
    this.societyDetails = {
      societyName,
      ...details
    };
  }

  // Set the header merge range
  setHeaderMergeRange(range) {
    this.headerMergeRange = range;
  }

  // NEW: Set the selected total fields
  setSelectedTotalFields(fields) {
    this.selectedTotalFields = fields || [];
  }

  async generateBillRegister({
    data,
    template,
    outputMode = 'single',
    societyName,
    societyDetails = {},
    headerMergeRange = 'A:J', // Default to A:J for bills (wider than receipts)
    selectedTotalFields = [] // NEW: User-selected fields to total
  }) {
    try {
      console.log('📋 Generating Bill Register...');
      console.log(`📋 Output Mode: ${outputMode}`);
      console.log(`📋 Header Merge Range: ${headerMergeRange}`);

      this.setSocietyDetails(societyName, societyDetails);
      this.setHeaderMergeRange(headerMergeRange);
      this.setSelectedTotalFields(selectedTotalFields); // NEW: Store selected fields
      
      const templateWorkbook = await this.processTemplate(template);
      await this.analyzeTemplateStructure(templateWorkbook);
      
      // For bill register, include ALL records (no filtering like receipt register)
      const billData = this.prepareBillData(data);
      
      if (billData.length === 0) {
        throw new Error('No bill data found. Please ensure you have imported billing data.');
      }

      const outputWorkbook = new ExcelJS.Workbook();
      outputWorkbook.creator = 'Gawde Account Service - Bill Register';
      outputWorkbook.created = new Date();

      if (outputMode === 'multi') {
        await this.generateMultiSheetBillRegister(outputWorkbook, templateWorkbook, billData);
      } else {
        await this.generateSingleSheetBillRegister(outputWorkbook, templateWorkbook, billData);
      }

      const filename = this.generateFilename(societyName, outputMode);
      const buffer = await outputWorkbook.xlsx.writeBuffer();
      
      this.downloadExcelFile(buffer, filename);

      return {
        success: true,
        filename,
        recordCount: billData.length,
        reportType: 'Bill Register',
        outputMode,
        worksheetCount: outputWorkbook.worksheets.length,
        totalAmount: this.calculateTotalBillAmount(billData),
        headerMergeRange: this.headerMergeRange
      };

    } catch (error) {
      console.error('❌ Bill register generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processTemplate(templateFile) {
    const arrayBuffer = await templateFile.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    return workbook;
  }

  async analyzeTemplateStructure(templateWorkbook) {
    const templateSheet = templateWorkbook.worksheets[0];
    
    // Analyze template structure for bills
    const headerEndRow = this.findHeaderEndRow(templateSheet);
    const dataStartRow = this.findDataStartRow(templateSheet, headerEndRow);
    const dataTemplateRow = this.findDataTemplateRow(templateSheet, dataStartRow);
    const totalRow = this.findTotalRow(templateSheet);
    
    this.templateStructure = {
      headerEndRow,
      dataStartRow,
      dataTemplateRow,
      totalRow,
      hasTotal: totalRow > 0
    };

    console.log(`📋 Bill Template analysis: DataStart=${dataStartRow}, TotalRow=${totalRow}`);
  }

  findHeaderEndRow(templateSheet) {
    // Look for header rows (typically 1-3 rows at top)
    for (let rowNum = 1; rowNum <= 5; rowNum++) {
      const row = templateSheet.getRow(rowNum);
      let hasData = false;
      
      row.eachCell((cell) => {
        const value = this.getCellValue(cell);
        if (value && value.toString().trim().length > 0) {
          hasData = true;
        }
      });
      
      if (!hasData) {
        return rowNum - 1;
      }
    }
    return 3; // Default header end
  }

  findDataStartRow(templateSheet, headerEndRow) {
    // Look for the first row with template variables after header
    for (let rowNum = headerEndRow + 1; rowNum <= templateSheet.rowCount; rowNum++) {
      const row = templateSheet.getRow(rowNum);
      let hasTemplateVars = false;
      
      row.eachCell((cell) => {
        const value = this.getCellValue(cell);
        if (typeof value === 'string' && value.includes('${')) {
          hasTemplateVars = true;
        }
      });
      
      if (hasTemplateVars) {
        return rowNum;
      }
    }
    return headerEndRow + 2; // Default data start
  }

  findDataTemplateRow(templateSheet, dataStartRow) {
    // Find the main data template row
    for (let rowNum = dataStartRow; rowNum <= dataStartRow + 3; rowNum++) {
      const row = templateSheet.getRow(rowNum);
      let templateVarCount = 0;
      
      row.eachCell((cell) => {
        const value = this.getCellValue(cell);
        if (typeof value === 'string' && value.includes('${')) {
          templateVarCount++;
        }
      });
      
      if (templateVarCount >= 3) { // Main data row should have multiple variables
        return rowNum;
      }
    }
    return dataStartRow;
  }

  findTotalRow(templateSheet) {
    // Look for total row (usually has "Total" text and SUM formulas)
    for (let rowNum = templateSheet.rowCount; rowNum >= 1; rowNum--) {
      const row = templateSheet.getRow(rowNum);
      let hasTotal = false;
      
      row.eachCell((cell) => {
        const value = this.getCellValue(cell);
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          if (lowerValue.includes('total') || lowerValue.includes('sum')) {
            hasTotal = true;
          }
        }
        // Check for SUM formulas
        if (cell.value && typeof cell.value === 'object' && cell.value.formula) {
          if (cell.value.formula.toUpperCase().includes('SUM')) {
            hasTotal = true;
          }
        }
      });
      
      if (hasTotal) {
        return rowNum;
      }
    }
    return 0; // No total row found
  }

  prepareBillData(data) {
    // For bill register, include ALL records (no filtering)
    // Sort by CODE_NO or FLAT_NO for consistent order
    return data.sort((a, b) => {
      const aCode = a.CODE_NO || a.FLAT_NO || '';
      const bCode = b.CODE_NO || b.FLAT_NO || '';
      return aCode.localeCompare(bCode);
    });
  }

  async generateSingleSheetBillRegister(outputWorkbook, templateWorkbook, billData) {
    const templateSheet = templateWorkbook.worksheets[0];
    const newSheet = outputWorkbook.addWorksheet('Bill Register');
    
    this.copyPageSetup(templateSheet, newSheet);
    this.copyColumnProperties(templateSheet, newSheet);
    
    let currentRowIndex = 1;
    
    // 1. Create header rows with dynamic merge range
    this.createBillHeaderRows(newSheet, templateSheet, currentRowIndex);
    currentRowIndex += this.templateStructure.headerEndRow;
    
    // 2. Copy column headers
    this.copyRow(templateSheet, newSheet, this.templateStructure.dataStartRow - 1, currentRowIndex, null);
    currentRowIndex++;
    
    // 3. Generate data rows
    const dataStartRowIndex = currentRowIndex;
    for (let recordIndex = 0; recordIndex < billData.length; recordIndex++) {
      const record = billData[recordIndex];
      console.log(`📄 Processing bill ${recordIndex + 1}/${billData.length}: CODE_NO ${record.CODE_NO}`);
      
      this.copyRow(templateSheet, newSheet, this.templateStructure.dataTemplateRow, currentRowIndex, record);
      currentRowIndex++;
    }
    
    // 4. Add total row if template has one
    if (this.templateStructure.hasTotal) {
      this.createTotalRow(newSheet, templateSheet, currentRowIndex, dataStartRowIndex, billData.length);
    }
    
    console.log(`✅ Bill register generated: ${billData.length} records`);
  }

  async generateMultiSheetBillRegister(outputWorkbook, templateWorkbook, billData) {
    const templateSheet = templateWorkbook.worksheets[0];

    for (let i = 0; i < billData.length; i++) {
      const record = billData[i];
      const sheetName = this.generateSheetName(record, i + 1);
      
      console.log(`📄 Creating bill sheet ${i + 1}/${billData.length}: ${sheetName}`);
      
      const newSheet = outputWorkbook.addWorksheet(sheetName);
      await this.createSingleBillSheet(templateSheet, newSheet, record);
    }
  }

  async createSingleBillSheet(templateSheet, newSheet, record) {
    // Copy sheet properties
    this.copyPageSetup(templateSheet, newSheet);
    this.copyColumnProperties(templateSheet, newSheet);
    
    // Copy all rows with record data
    templateSheet.eachRow({ includeEmpty: true }, (templateRow, rowNumber) => {
      this.copyRow(templateSheet, newSheet, rowNumber, rowNumber, record);
    });
    
    // Copy merged cells
    this.copyMergedCells(templateSheet, newSheet);
  }

  // Create bill header rows with dynamic merge range
  createBillHeaderRows(newSheet, templateSheet, startRowIndex) {
    console.log(`📋 Creating bill header rows starting at ${startRowIndex}`);
    console.log(`📋 Using merge range: ${this.headerMergeRange}`);
    
    for (let rowNum = 1; rowNum <= this.templateStructure.headerEndRow; rowNum++) {
      const templateRow = templateSheet.getRow(rowNum);
      const newRow = newSheet.getRow(startRowIndex + rowNum - 1);
      
      if (templateRow.height) {
        newRow.height = templateRow.height;
      }
      
      // Process header text with society variables
      let rowText = '';
      templateRow.eachCell({ includeEmpty: false }, (cell) => {
        if (!rowText && cell.value) {
          const cellValue = this.getCellValue(cell);
          rowText = this.replaceVariables(cellValue, {});
          return false; // Stop after first cell
        }
      });
      
      // Set text in first column
      if (rowText) {
        const firstCell = newRow.getCell(1);
        firstCell.value = rowText;
        
        // Copy styling
        const templateFirstCell = templateRow.getCell(1);
        if (templateFirstCell.style) {
          firstCell.style = this.copyStyle(templateFirstCell.style);
        }
        
        console.log(`📋 Header Row ${rowNum}: "${rowText}"`);
      }
      
      newRow.commit();
    }
    
    // Merge header rows using dynamic range
    const [startCol, endCol] = this.parseMergeRange(this.headerMergeRange || 'A:J');
    
    // Merge each header row
    for (let rowOffset = 0; rowOffset < this.templateStructure.headerEndRow; rowOffset++) {
      const currentRow = startRowIndex + rowOffset;
      try {
        const mergeAddress = `${startCol}${currentRow}:${endCol}${currentRow}`;
        newSheet.mergeCells(mergeAddress);
        console.log(`📋 Merged header row ${currentRow}: ${mergeAddress}`);
      } catch (e) {
        console.warn(`Could not merge header row ${currentRow}:`, e.message);
      }
    }
  }

  // Create total row with SUM formulas and bold formatting - UPDATED to use user selection with VALUE() conversion
  createTotalRow(newSheet, templateSheet, totalRowIndex, dataStartRowIndex, recordCount) {
    console.log(`📊 Creating total row at ${totalRowIndex} for ${recordCount} records`);
    console.log(`📊 Selected total fields: ${this.selectedTotalFields.join(', ')}`);
    
    const templateTotalRow = templateSheet.getRow(this.templateStructure.totalRow);
    const newTotalRow = newSheet.getRow(totalRowIndex);
    
    if (templateTotalRow.height) {
      newTotalRow.height = templateTotalRow.height;
    }
    
    templateTotalRow.eachCell({ includeEmpty: true }, (templateCell, colNumber) => {
      const newCell = newTotalRow.getCell(colNumber);
      
      // Copy base style and make bold
      if (templateCell.style) {
        newCell.style = this.copyStyle(templateCell.style);
      }
      
      // Make the total row bold
      newCell.font = { 
        ...newCell.font, 
        bold: true 
      };
      
      const cellValue = this.getCellValue(templateCell);
      
      // Check if this cell should contain a total based on user selection
      let shouldCreateTotal = false;
      let fieldName = null;
      
      // Extract field name from template variable
      if (typeof cellValue === 'string' && cellValue.includes('${')) {
        const variableMatch = cellValue.match(/\$\{([A-Z_][A-Z0-9_]*)\}/);
        if (variableMatch) {
          fieldName = variableMatch[1];
          
          // Only create total if user selected this field
          if (this.selectedTotalFields.includes(fieldName)) {
            shouldCreateTotal = true;
          }
        }
      }
      
      // Check if cell already has SUM formula (from original template) and user has selections
      if (templateCell.value && typeof templateCell.value === 'object' && templateCell.value.formula) {
        if (templateCell.value.formula.toUpperCase().includes('SUM') && this.selectedTotalFields.length > 0) {
          // Only keep SUM if we have user selections
          shouldCreateTotal = true;
        }
      }
      
      if (shouldCreateTotal) {
        // NEW: Create SUM formula with VALUE() function to convert text to numbers
        const sumRange = `${this.getColumnLetter(colNumber)}${dataStartRowIndex}:${this.getColumnLetter(colNumber)}${totalRowIndex - 1}`;
        
        // Use SUMPRODUCT with VALUE to handle text-to-number conversion
        // This formula converts text numbers to actual numbers before summing
        const formula = `SUMPRODUCT(--ISNUMBER(VALUE(${sumRange})),VALUE(${sumRange}))`;
        newCell.value = { formula: formula };
        
        // Set currency formatting for amount columns
        if (this.isCurrencyColumn(colNumber, templateCell, fieldName)) {
          newCell.numFmt = '#,##0.00';
        }
        
        console.log(`📊 Added VALUE-enabled SUM formula for ${fieldName}: ${formula}`);
      } else if (cellValue && typeof cellValue === 'string' && cellValue.toLowerCase().includes('total')) {
        // This is likely the "Total" label cell
        newCell.value = cellValue;
        console.log(`📊 Added total label: ${cellValue}`);
      } else if (fieldName && !this.selectedTotalFields.includes(fieldName)) {
        // For fields not selected for totaling, just put empty or dash
        newCell.value = '';
        console.log(`📊 Skipped total for unselected field: ${fieldName}`);
      } else {
        // Copy original value for other cells
        newCell.value = templateCell.value;
      }
    });
    
    newTotalRow.commit();
  }

  // Helper method to get column letter from number
  getColumnLetter(colNumber) {
    let result = '';
    while (colNumber > 0) {
      colNumber--;
      result = String.fromCharCode(65 + (colNumber % 26)) + result;
      colNumber = Math.floor(colNumber / 26);
    }
    return result;
  }

  // Check if column should have currency formatting
  isCurrencyColumn(colNumber, templateCell, fieldName = null) {
    // If we have the field name, use it for better detection
    if (fieldName && this.isCurrencyField(fieldName)) {
      return true;
    }
    
    const cellValue = this.getCellValue(templateCell);
    
    // Check if template cell has currency formatting
    if (templateCell.style && templateCell.style.numFmt) {
      const numFmt = templateCell.style.numFmt;
      if (typeof numFmt === 'string' && (numFmt.includes('#,##0') || numFmt.includes('0.00'))) {
        return true;
      }
    }
    
    // Check if cell contains currency field variables
    if (typeof cellValue === 'string' && cellValue.includes('${')) {
      const variableMatch = cellValue.match(/\$\{([A-Z_][A-Z0-9_]*)\}/);
      if (variableMatch) {
        return this.isCurrencyField(variableMatch[1]);
      }
    }
    
    return false;
  }

  generateSheetName(record, index) {
    if (record.FLAT_NO) {
      return `Bill_Flat_${record.FLAT_NO}`;
    }
    if (record.CODE_NO) {
      return `Bill_Code_${record.CODE_NO}`;
    }
    if (record.NAME) {
      const safeName = String(record.NAME).replace(/[^\w\s]/g, '').substring(0, 15);
      return `Bill_${safeName}` || `Bill_${index}`;
    }
    return `Bill_${index}`;
  }

  // Helper method to parse merge range like "A:J" or "A:K"
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
      console.warn('Invalid merge range format, using A:J as fallback:', range);
      return ['A', 'J'];
    }
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
    const societyVars = this.getSocietyVariables();
    
    return text.replace(variableRegex, (match, fieldName) => {
      // Check society variables first
      if (societyVars.hasOwnProperty(fieldName)) {
        return societyVars[fieldName] || '';
      }
      
      // Check record data
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

  getSocietyVariables() {
    if (!this.societyDetails) {
      return {
        SOCIETY_NAME: '',
        SOCIETY_REG_NO: '',
        SOCIETY_ADDRESS: '',
        BILL_MONTH_FROM: '',
        BILL_MONTH_TO: '',
        BILL_YEAR: ''
      };
    }

    return {
      SOCIETY_NAME: this.societyDetails.societyName || '',
      SOCIETY_REG_NO: this.societyDetails.regNo || '',
      SOCIETY_ADDRESS: this.societyDetails.address || '',
      BILL_MONTH_FROM: this.societyDetails.billMonthFrom || '',
      BILL_MONTH_TO: this.societyDetails.billMonthTo || '',
      BILL_YEAR: this.societyDetails.billYear ? String(this.societyDetails.billYear) : ''
    };
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

  copyMergedCells(templateSheet, newSheet) {
    try {
      if (templateSheet.model && templateSheet.model.merges) {
        templateSheet.model.merges.forEach(merge => {
          try {
            newSheet.mergeCells(merge);
          } catch (e) {
            console.warn('Could not merge cells:', merge);
          }
        });
      }
    } catch (e) {
      console.warn('Could not copy merged cells:', e.message);
    }
  }

  isCurrencyField(fieldName) {
    const currencyFields = [
      'MAINT_CHG', 'WATER_CHG', 'BMC_TAX', 'ELECT_CHG', 'SALARY',
      'OTHER_CHG1', 'OTHER_CHG2', 'SINK_FUND', 'REP_FUND', 'LET_OUT_CH',
      'PARK_CHG', 'BLDG_FUND', 'LEGAL_CHG', 'PAINT_FD', 'MAPLE_CHG',
      'LIFT_MAINT', 'INT_ARREAR', 'TOTAL', 'GR_TOTAL', 'ARREARS', 
      'ADVANCE', 'OUTST_BAL', 'REC_AMT', 'REC_AMT1', 'REC_AMT2', 'REC_AMT3'
    ];
    return currencyFields.includes(fieldName);
  }

  isDateField(fieldName) {
    const dateFields = [
      'BILL_DATE', 'DUE_DATE', 'REC_DATE', 'CHEQUE_DT1', 'CHEQUE_DT2', 'CHEQUE_DT3'
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

  calculateTotalBillAmount(billData) {
    return billData.reduce((total, record) => {
      const billTotal = parseFloat(record.TOTAL) || 0;
      return total + billTotal;
    }, 0);
  }

  generateFilename(societyName, outputMode) {
    const date = new Date().toISOString().split('T')[0];
    const society = societyName ? societyName.replace(/[^a-zA-Z0-9]/g, '_') : 'Society';
    const mode = outputMode === 'multi' ? 'MultiSheet' : 'SingleSheet';
    return `${society}_BillRegister_${mode}_${date}.xlsx`;
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

// Export function for use in components
export const generateBillRegister = async (config) => {
  const service = new BillRegisterService();
  return await service.generateBillRegister(config);
};

export default BillRegisterService;