// src/services/excelTemplateService.js - SMART TEMPLATE SERVICE
// Handles both TABLE and FORM template types automatically
import * as ExcelJS from 'exceljs';

class SmartExcelTemplateService {
  constructor() {
    this.currentTemplate = null;
    this.templateWorkbook = null;
    this.societyDetails = null;
    this.templateType = null; // 'TABLE' or 'FORM'
    this.dataRowsInfo = null; // For table templates
  }

  /**
   * Set society details for template variable replacement
   */
  setSocietyDetails(societyName, details) {
    this.societyDetails = {
      societyName,
      ...details
    };
    console.log('🏢 Society details set:', this.societyDetails);
  }

  /**
   * Process uploaded Excel template file and detect type
   */
  async processTemplateFile(file) {
    try {
      if (!file) {
        throw new Error('No template file provided');
      }

      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        throw new Error('Template file must be in Excel format (.xlsx or .xls)');
      }

      console.log('📂 Processing template file:', file.name);

      // Read the Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // Extract variables and detect template type
      const variables = this.extractVariablesFromWorkbook(workbook);
      const templateAnalysis = this.analyzeTemplateType(workbook);

      this.currentTemplate = {
        name: file.name,
        workbook: workbook,
        variables: variables,
        size: file.size,
        worksheetCount: workbook.worksheets.length,
        uploadedAt: new Date().toISOString(),
        templateType: templateAnalysis.type,
        analysis: templateAnalysis
      };

      this.templateWorkbook = workbook;
      this.templateType = templateAnalysis.type;
      this.dataRowsInfo = templateAnalysis.dataRowsInfo;

      console.log('✅ Template processed:', {
        name: this.currentTemplate.name,
        type: this.templateType,
        variables: variables.length,
        analysis: templateAnalysis
      });

      return {
        success: true,
        template: {
          name: this.currentTemplate.name,
          variables: this.currentTemplate.variables,
          size: this.currentTemplate.size,
          worksheetCount: this.currentTemplate.worksheetCount,
          templateType: this.templateType,
          uploadedAt: this.currentTemplate.uploadedAt
        },
        variableCount: variables.length,
        message: `${this.templateType} template loaded with ${variables.length} variables`
      };

    } catch (error) {
      throw new Error(`Template processing failed: ${error.message}`);
    }
  }

  /**
   * SMART TEMPLATE TYPE DETECTION
   */
  analyzeTemplateType(workbook) {
    const worksheet = workbook.worksheets[0];
    let variableRowCount = 0;
    let headerRowFound = false;
    let repeatingPattern = false;
    let dataRowStart = null;
    let templateRowCount = worksheet.rowCount;

    console.log('🔍 Analyzing template type...');

    // Scan through rows to understand structure
    for (let rowNum = 1; rowNum <= Math.min(50, templateRowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);
      let hasVariables = false;
      let hasHeaders = false;

      row.eachCell((cell, colNumber) => {
        const cellValue = this.getCellTextValue(cell);
        if (typeof cellValue === 'string') {
          if (cellValue.includes('${')) {
            hasVariables = true;
          }
          // Check for common header patterns
          if (cellValue.toLowerCase().includes('name') || 
              cellValue.toLowerCase().includes('amount') || 
              cellValue.toLowerCase().includes('bill') ||
              cellValue.toLowerCase().includes('code')) {
            hasHeaders = true;
          }
        }
      });

      if (hasVariables) {
        variableRowCount++;
        if (!dataRowStart) dataRowStart = rowNum;
      }

      if (hasHeaders && !headerRowFound) {
        headerRowFound = true;
        console.log(`📋 Header row detected at row ${rowNum}`);
      }
    }

    // Determine template type based on analysis
    if (headerRowFound && variableRowCount <= 3 && dataRowStart) {
      // TABLE template: Has headers and few variable rows (like Ack Template)
      console.log('📊 Detected TABLE template (acknowledgment/summary style)');
      return {
        type: 'TABLE',
        dataRowsInfo: {
          startRow: dataRowStart,
          templateRows: 1, // Usually just one data row template
          hasHeaders: true
        },
        description: 'Table format - data rows repeat, headers stay fixed'
      };
    } else if (variableRowCount > 10) {
      // FORM template: Many variables throughout (like Full Bill Template)
      console.log('📋 Detected FORM template (full bill style)');
      return {
        type: 'FORM',
        dataRowsInfo: null,
        description: 'Form format - entire template repeats per record'
      };
    } else {
      // Default to FORM if unclear
      console.log('🤔 Unknown pattern, defaulting to FORM template');
      return {
        type: 'FORM',
        dataRowsInfo: null,
        description: 'Form format - entire template repeats per record'
      };
    }
  }

  /**
   * Extract variables from workbook
   */
  extractVariablesFromWorkbook(workbook) {
    const variableSet = new Set();
    const variableRegex = /\$\{([A-Z_][A-Z0-9_]*)\}/g;

    workbook.worksheets.forEach(worksheet => {
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          const cellValue = this.getCellTextValue(cell);
          
          if (typeof cellValue === 'string') {
            let match;
            while ((match = variableRegex.exec(cellValue)) !== null) {
              variableSet.add(match[1]);
            }
          }
        });
      });
    });

    return Array.from(variableSet).sort();
  }

  /**
   * Get text value from any cell type
   */
  getCellTextValue(cell) {
    if (!cell || !cell.value) return '';
    
    if (typeof cell.value === 'string') {
      return cell.value;
    }
    
    if (cell.value && typeof cell.value === 'object') {
      if (cell.value.richText) {
        return cell.value.richText.map(rt => rt.text || '').join('');
      }
      
      if (cell.value.formula) {
        return cell.value.formula;
      }
      
      if (cell.value.hyperlink) {
        return cell.value.text || '';
      }
      
      if (cell.value.text) {
        return cell.value.text;
      }
    }
    
    return String(cell.value);
  }

  /**
   * MAIN GENERATION METHOD - Routes to appropriate handler
   */
  async generateExcelFromTemplate(data, options = {}) {
    try {
      if (!this.templateWorkbook) {
        throw new Error('No template loaded. Please upload a template first.');
      }

      if (!data || data.length === 0) {
        throw new Error('No data provided for Excel generation');
      }

      console.log(`🚀 Generating Excel with ${this.templateType} template for ${data.length} records`);

      const outputWorkbook = new ExcelJS.Workbook();
      outputWorkbook.creator = 'Gawde Account Service';
      outputWorkbook.created = new Date();

      let mode = options.mode || 'auto';

      // Route to appropriate generation method based on template type
      if (this.templateType === 'TABLE') {
        console.log('📊 Using TABLE template processing...');
        await this.generateTableTemplate(outputWorkbook, data, options);
      } else if (this.templateType === 'FORM') {
        console.log('📋 Using FORM template processing...');
        if (mode === 'multiple_sheets' || data.length === 1) {
          await this.generateFormTemplateMultiSheet(outputWorkbook, data, options);
        } else {
          await this.generateFormTemplateSingleSheet(outputWorkbook, data, options);
        }
      }

      const buffer = await outputWorkbook.xlsx.writeBuffer();

      console.log('✅ Excel generation completed successfully');
      return {
        success: true,
        buffer: buffer,
        recordCount: data.length,
        worksheetCount: outputWorkbook.worksheets.length,
        templateType: this.templateType,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Excel generation error:', error);
      throw new Error(`Excel generation failed: ${error.message}`);
    }
  }

  /**
   * Generate TABLE template (like Ack Template)
   * Headers stay fixed, only data rows repeat
   */
  async generateTableTemplate(outputWorkbook, data, options) {
    console.log('📊 Processing TABLE template...');
    
    const templateSheet = this.templateWorkbook.worksheets[0];
    const newSheet = outputWorkbook.addWorksheet('Report');
    
    // Copy page setup
    this.copyPageSetup(templateSheet, newSheet);
    
    // Copy column properties
    this.copyColumnProperties(templateSheet, newSheet);
    
    const dataRowStart = this.dataRowsInfo.startRow;
    let currentOutputRow = 1;
    
    // Copy everything before data rows (headers, titles, etc.)
    for (let rowNum = 1; rowNum < dataRowStart; rowNum++) {
      this.copyRow(templateSheet, newSheet, rowNum, currentOutputRow, data[0]);
      currentOutputRow++;
    }
    
    // Generate data rows for each record
    for (let recordIndex = 0; recordIndex < data.length; recordIndex++) {
      const record = data[recordIndex];
      console.log(`📄 Processing record ${recordIndex + 1}: ${record.NAME || record.CODE_NO}`);
      
      // Copy the data row template with current record data
      this.copyRow(templateSheet, newSheet, dataRowStart, currentOutputRow, record);
      currentOutputRow++;
    }
    
    // Copy everything after data rows (if any)
    for (let rowNum = dataRowStart + 1; rowNum <= templateSheet.rowCount; rowNum++) {
      this.copyRow(templateSheet, newSheet, rowNum, currentOutputRow, data[0]);
      currentOutputRow++;
    }
    
    console.log('✅ TABLE template generated successfully');
  }

  /**
   * Generate FORM template - Multiple sheets (one per record)
   */
  async generateFormTemplateMultiSheet(outputWorkbook, data, options) {
    console.log('📋 Processing FORM template - Multiple sheets...');
    
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const sheetName = this.generateSheetName(record, i + 1);
      console.log(`📄 Creating sheet ${i + 1}/${data.length}: ${sheetName}`);
      
      await this.createFormSheet(outputWorkbook, this.templateWorkbook.worksheets[0], record, sheetName);
    }
    
    console.log('✅ FORM template - Multiple sheets generated successfully');
  }

  /**
   * Generate FORM template - Single sheet with page breaks
   */
  async generateFormTemplateSingleSheet(outputWorkbook, data, options) {
    console.log('📋 Processing FORM template - Single sheet...');
    
    const templateSheet = this.templateWorkbook.worksheets[0];
    const newSheet = outputWorkbook.addWorksheet('Report');
    
    // Set up for multiple forms in one sheet
    this.copyPageSetup(templateSheet, newSheet);
    this.copyColumnProperties(templateSheet, newSheet);
    
    let currentRowIndex = 1;
    const templateRowCount = templateSheet.rowCount;
    
    for (let recordIndex = 0; recordIndex < data.length; recordIndex++) {
      const record = data[recordIndex];
      console.log(`📄 Processing record ${recordIndex + 1}/${data.length} at row ${currentRowIndex}`);
      
      // Copy entire template for this record
      for (let templateRowNum = 1; templateRowNum <= templateRowCount; templateRowNum++) {
        this.copyRow(templateSheet, newSheet, templateRowNum, currentRowIndex, record);
        currentRowIndex++;
      }
      
      // Add page break between records (except last)
      if (recordIndex < data.length - 1) {
        try {
          newSheet.getRow(currentRowIndex - 1).addPageBreak = true;
          currentRowIndex += 2; // Add some spacing
        } catch (e) {
          currentRowIndex += 2; // Still add spacing even if page break fails
        }
      }
    }
    
    console.log('✅ FORM template - Single sheet generated successfully');
  }

  /**
   * Create a single form sheet from template
   */
  async createFormSheet(outputWorkbook, templateSheet, record, sheetName) {
    const newSheet = outputWorkbook.addWorksheet(sheetName);
    
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

  /**
   * Copy a single row from template to output with data processing
   */
  copyRow(templateSheet, newSheet, templateRowNum, outputRowNum, record) {
    const templateRow = templateSheet.getRow(templateRowNum);
    const newRow = newSheet.getRow(outputRowNum);
    
    // Copy row height
    if (templateRow.height) {
      newRow.height = templateRow.height;
    }
    
    // Copy each cell
    templateRow.eachCell({ includeEmpty: true }, (templateCell, colNumber) => {
      const newCell = newRow.getCell(colNumber);
      
      // Copy style
      if (templateCell.style) {
        newCell.style = this.copyStyle(templateCell.style);
      }
      
      // Process and set value
      const processedValue = this.processTemplateValue(templateCell.value, record);
      if (processedValue !== null && processedValue !== undefined) {
        newCell.value = processedValue;
      }
      
      // Copy other properties
      this.copyOtherCellProperties(templateCell, newCell);
    });
    
    newRow.commit();
  }

  /**
   * Process template value with proper variable replacement
   */
  processTemplateValue(templateValue, record) {
    if (!templateValue) return '';

    // Handle string values with variables
    if (typeof templateValue === 'string') {
      if (templateValue.includes('${')) {
        return this.replaceVariables(templateValue, record);
      } else {
        return templateValue;
      }
    }

    // Handle rich text
    if (templateValue && typeof templateValue === 'object' && templateValue.richText) {
      const processedRichText = templateValue.richText.map(textRun => {
        if (textRun.text && typeof textRun.text === 'string' && textRun.text.includes('${')) {
          return {
            ...textRun,
            text: this.replaceVariables(textRun.text, record)
          };
        }
        return textRun;
      });
      
      return { richText: processedRichText };
    }

    // Handle formulas
    if (templateValue && typeof templateValue === 'object' && templateValue.formula) {
      if (templateValue.formula.includes('${')) {
        try {
          const processedFormula = this.replaceVariables(templateValue.formula, record);
          return { formula: processedFormula };
        } catch (e) {
          return templateValue.result || '';
        }
      } else {
        return templateValue.result !== undefined ? templateValue.result : templateValue;
      }
    }

    // Handle other object types
    if (templateValue && typeof templateValue === 'object') {
      if (templateValue.text && templateValue.text.includes('${')) {
        return {
          ...templateValue,
          text: this.replaceVariables(templateValue.text, record)
        };
      }
      if (templateValue.result !== undefined) {
        return templateValue.result;
      }
    }

    return templateValue;
  }

  /**
   * Replace variables in text with actual values
   */
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
      
      // Format based on field type
      if (this.isCurrencyField(fieldName)) {
        return this.formatCurrency(value);
      }
      
      if (this.isDateField(fieldName)) {
        return this.formatDate(value);
      }
      
      return String(value);
    });
  }

  /**
   * Get society variables
   */
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

  /**
   * Helper methods
   */
  copyPageSetup(templateSheet, newSheet) {
    try {
      if (templateSheet.pageSetup) {
        newSheet.pageSetup = JSON.parse(JSON.stringify(templateSheet.pageSetup));
      }
    } catch (e) {
      console.warn('Could not copy page setup:', e.message);
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
          console.warn(`Could not copy column ${index + 1}:`, e.message);
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

  copyOtherCellProperties(templateCell, newCell) {
    try {
      if (templateCell.dataValidation) {
        newCell.dataValidation = JSON.parse(JSON.stringify(templateCell.dataValidation));
      }
      if (templateCell.hyperlink) {
        newCell.hyperlink = templateCell.hyperlink;
      }
      if (templateCell.note) {
        newCell.note = templateCell.note;
      }
    } catch (e) {
      // Ignore property copy errors
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

  generateSheetName(record, index) {
    if (record.FLAT_NO) {
      return `Flat_${record.FLAT_NO}`;
    }
    if (record.CODE_NO) {
      return `Code_${record.CODE_NO}`;
    }
    if (record.NAME) {
      const safeName = String(record.NAME).replace(/[^\w\s]/g, '').substring(0, 20);
      return safeName || `Record_${index}`;
    }
    return `Record_${index}`;
  }

  // Field type detection
  isCurrencyField(fieldName) {
    const currencyFields = [
      'TOTAL', 'GR_TOTAL', 'ARREARS', 'ADVANCE', 'INTEREST', 'OUTST_BAL',
      'REC_AMT', 'REC_AMT1', 'REC_AMT2', 'REC_AMT3', 'MAINT_CHG', 'WATER_CHG',
      'BMC_TAX', 'ELECT_CHG', 'SALARY', 'OTHER_CHG1', 'OTHER_CHG2'
    ];
    return currencyFields.includes(fieldName);
  }

  isDateField(fieldName) {
    const dateFields = ['BILL_DATE', 'REC_DATE', 'DUE_DATE'];
    return dateFields.includes(fieldName);
  }

  formatCurrency(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return `${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
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

  /**
   * Validate template variables
   */
  validateTemplateVariables(templateVariables, dataFields) {
    const societyVariables = Object.keys(this.getSocietyVariables());
    const allAvailableFields = [...dataFields, ...societyVariables];

    const missingFields = templateVariables.filter(variable => 
      !allAvailableFields.includes(variable)
    );

    return {
      isValid: missingFields.length === 0,
      missingFields,
      availableFields: templateVariables.filter(variable => 
        allAvailableFields.includes(variable)
      ),
      totalVariables: templateVariables.length
    };
  }

  /**
   * Generate and download Excel
   */
  async generateAndDownloadExcel(data, societyName, options = {}) {
    try {
      console.log('🚀 Generating and downloading Excel...');
      
      const result = await this.generateExcelFromTemplate(data, options);
      const filename = this.generateFilename(societyName, options);
      
      this.downloadExcelFile(result.buffer, filename);
      
      return {
        success: true,
        message: `${this.templateType} template Excel generated: ${filename}`,
        filename: filename,
        recordCount: data.length,
        templateType: this.templateType,
        worksheetCount: result.worksheetCount
      };

    } catch (error) {
      console.error('❌ Excel generation failed:', error);
      throw error;
    }
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

  generateFilename(societyName, options = {}) {
    const date = new Date().toISOString().split('T')[0];
    const society = societyName ? societyName.replace(/[^a-zA-Z0-9]/g, '_') : 'Society';
    const type = this.templateType || 'Template';
    return `${society}_${type}_Report_${date}.xlsx`;
  }

  // Utility methods
  hasTemplate() {
    return this.currentTemplate !== null && this.templateWorkbook !== null;
  }

  getCurrentTemplate() {
    return this.currentTemplate;
  }

  getTemplateType() {
    return this.templateType;
  }

  reset() {
    this.currentTemplate = null;
    this.templateWorkbook = null;
    this.societyDetails = null;
    this.templateType = null;
    this.dataRowsInfo = null;
  }
}

// Create singleton instance
export const excelTemplateService = new SmartExcelTemplateService();
export default excelTemplateService;