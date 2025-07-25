// src/services/reportGenerationService.js - Updated with Bill Register Service Support and Selected Total Fields
import * as ExcelJS from 'exceljs';
import { generateReceiptRegister } from './receiptRegisterService';
import { generateBillRegister } from './billRegisterService';

class ReportGenerationService {
  constructor() {
    this.societyDetails = null;
  }

  /**
   * Set society details for template variable replacement
   */
  setSocietyDetails(societyName, details) {
    this.societyDetails = {
      societyName,
      ...details
    };
  }

  /**
   * Main report generation function with specialized receipt and bill handling
   * UPDATED: Now supports headerMergeRange parameter for both receipt and bill reports
   * NEW: Supports selectedTotalFields for bill reports
   */
  async generateSpecializedReport({
    data,
    template,
    outputMode,
    reportType,
    societyName,
    societyDetails = {},
    headerMergeRange, // Header merge range parameter for receipt and bill reports
    selectedTotalFields // NEW: Selected fields to total for bill reports
  }) {
    try {
      console.log(`🚀 Generating ${reportType} report in ${outputMode} mode`);
      if (headerMergeRange) {
        console.log(`📊 Header merge range: ${headerMergeRange}`);
      }
      if (selectedTotalFields && selectedTotalFields.length > 0) {
        console.log(`📊 Selected total fields: ${selectedTotalFields.join(', ')}`);
      }

      // Set society details
      this.setSocietyDetails(societyName, societyDetails);

      // Use specialized services for receipt and bill reports
      if (reportType === 'receipt') {
        console.log('📋 Using specialized receipt register service...');
        
        const receiptConfig = {
          data,
          template,
          societyName,
          societyDetails
        };

        // Add headerMergeRange if provided
        if (headerMergeRange) {
          receiptConfig.headerMergeRange = headerMergeRange;
          console.log(`📊 Passing header merge range to receipt service: ${headerMergeRange}`);
        }
        
        return await generateReceiptRegister(receiptConfig);
      }

      // NEW: Use specialized bill register service for bill reports
      if (reportType === 'bill') {
        console.log('📋 Using specialized bill register service...');
        
        const billConfig = {
          data,
          template,
          outputMode,
          societyName,
          societyDetails
        };

        // Add headerMergeRange if provided
        if (headerMergeRange) {
          billConfig.headerMergeRange = headerMergeRange;
          console.log(`📊 Passing header merge range to bill service: ${headerMergeRange}`);
        }
        
        // NEW: Add selectedTotalFields if provided
        if (selectedTotalFields && selectedTotalFields.length > 0) {
          billConfig.selectedTotalFields = selectedTotalFields;
          console.log(`📊 Passing selected total fields to bill service: ${selectedTotalFields.join(', ')}`);
        }
        
        return await generateBillRegister(billConfig);
      }

      // For non-receipt and non-bill reports, use the existing general service
      return await this.generateGeneralReport({
        data,
        template,
        outputMode,
        reportType,
        societyName,
        societyDetails
      });

    } catch (error) {
      console.error('❌ Report generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * General report generation (for member reports and other non-specialized reports)
   */
  async generateGeneralReport({
    data,
    template,
    outputMode,
    reportType,
    societyName,
    societyDetails = {}
  }) {
    // Process template
    const templateWorkbook = await this.processTemplate(template);
    
    // Filter and prepare data based on report type
    const processedData = this.prepareDataForReport(data, reportType);
    
    if (processedData.length === 0) {
      throw new Error(`No suitable data found for ${reportType} report`);
    }

    // Generate Excel based on output mode
    const outputWorkbook = new ExcelJS.Workbook();
    outputWorkbook.creator = 'Gawde Account Service';
    outputWorkbook.created = new Date();

    if (outputMode === 'multi') {
      await this.generateMultiSheetReport(outputWorkbook, templateWorkbook, processedData, reportType);
    } else {
      await this.generateSingleSheetReport(outputWorkbook, templateWorkbook, processedData, reportType);
    }

    // Generate filename and download
    const filename = this.generateFilename(societyName, reportType, outputMode);
    const buffer = await outputWorkbook.xlsx.writeBuffer();
    
    this.downloadExcelFile(buffer, filename);

    return {
      success: true,
      filename,
      recordCount: processedData.length,
      reportType: this.getReportDisplayName(reportType),
      outputMode,
      worksheetCount: outputWorkbook.worksheets.length
    };
  }

  /**
   * Process uploaded template file
   */
  async processTemplate(templateFile) {
    const arrayBuffer = await templateFile.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    return workbook;
  }

  /**
   * Prepare data based on report type
   */
  prepareDataForReport(data, reportType) {
    switch (reportType) {
      case 'member':
        // For member detail, include all records (individual sheets will be created)
        return data;

      case 'bill':
        // This shouldn't be called as bill reports now use specialized service
        console.warn('Bill report should use specialized service');
        return data;

      case 'receipt':
        // This shouldn't be called as receipt reports use specialized service
        console.warn('Receipt report should use specialized service');
        return data.filter(row => {
          const recAmt = parseFloat(row.REC_AMT) || 0;
          const recAmt1 = parseFloat(row.REC_AMT1) || 0;
          const recAmt2 = parseFloat(row.REC_AMT2) || 0;
          const recAmt3 = parseFloat(row.REC_AMT3) || 0;
          return recAmt > 0 || recAmt1 > 0 || recAmt2 > 0 || recAmt3 > 0;
        });

      default:
        return data;
    }
  }

  /**
   * Generate multi-sheet report (separate sheet per record)
   */
  async generateMultiSheetReport(outputWorkbook, templateWorkbook, data, reportType) {
    const templateSheet = templateWorkbook.worksheets[0];

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const sheetName = this.generateSheetName(record, i + 1, reportType);
      
      console.log(`📄 Creating sheet ${i + 1}/${data.length}: ${sheetName}`);
      
      const newSheet = outputWorkbook.addWorksheet(sheetName);
      await this.createSheetFromTemplate(templateSheet, newSheet, record);
    }
  }

  /**
   * Generate single sheet report (all data in one sheet)
   */
  async generateSingleSheetReport(outputWorkbook, templateWorkbook, data, reportType) {
    const templateSheet = templateWorkbook.worksheets[0];
    const newSheet = outputWorkbook.addWorksheet(this.getReportDisplayName(reportType));
    
    // Copy page setup and column properties
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
  }

  /**
   * Create a single sheet from template with record data
   */
  async createSheetFromTemplate(templateSheet, newSheet, record) {
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
   * Utility helper methods
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

  generateSheetName(record, index, reportType) {
    switch (reportType) {
      case 'bill':
        // Bill reports now use specialized service, shouldn't reach here
        if (record.FLAT_NO) {
          return `Bill_Flat_${record.FLAT_NO}`;
        }
        if (record.CODE_NO) {
          return `Bill_Code_${record.CODE_NO}`;
        }
        return `Bill_${index}`;

      case 'member':
        if (record.NAME) {
          const safeName = String(record.NAME).replace(/[^\w\s]/g, '').substring(0, 20);
          return safeName || `Member_${index}`;
        }
        if (record.FLAT_NO) {
          return `Member_Flat_${record.FLAT_NO}`;
        }
        return `Member_${index}`;

      case 'receipt':
        // Receipt reports use specialized service, shouldn't reach here
        if (record.FLAT_NO) {
          return `Receipt_Flat_${record.FLAT_NO}`;
        }
        return `Receipt_${index}`;

      default:
        return `Record_${index}`;
    }
  }

  generateFilename(societyName, reportType, outputMode) {
    const date = new Date().toISOString().split('T')[0];
    const society = societyName ? societyName.replace(/[^a-zA-Z0-9]/g, '_') : 'Society';
    const reportName = this.getReportDisplayName(reportType);
    const mode = outputMode === 'multi' ? 'MultiSheet' : 'SingleSheet';
    
    return `${society}_${reportName}_${mode}_${date}.xlsx`;
  }

  getReportDisplayName(reportType) {
    switch (reportType) {
      case 'receipt':
        return 'ReceiptRegister';
      case 'bill':
        return 'BillRegister';
      case 'member':
        return 'MemberDetail';
      default:
        return 'Report';
    }
  }

  // Field type detection
  isCurrencyField(fieldName) {
    const currencyFields = [
      'TOTAL', 'GR_TOTAL', 'ARREARS', 'ADVANCE', 'INTEREST', 'OUTST_BAL',
      'REC_AMT', 'REC_AMT1', 'REC_AMT2', 'REC_AMT3', 'MAINT_CHG', 'WATER_CHG',
      'BMC_TAX', 'ELECT_CHG', 'SALARY', 'OTHER_CHG1', 'OTHER_CHG2', 'SINK_FUND',
      'REP_FUND', 'LET_OUT_CH', 'PARK_CHG', 'BLDG_FUND', 'LEGAL_CHG', 'PAINT_FD',
      'MAPLE_CHG', 'LIFT_MAINT', 'INT_ARREAR'
    ];
    return currencyFields.includes(fieldName);
  }

  isDateField(fieldName) {
    const dateFields = [
      'BILL_DATE', 'REC_DATE', 'DUE_DATE', 'CHEQUE_DT1', 'CHEQUE_DT2', 'CHEQUE_DT3'
    ];
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

// Export the main function for use in components
export const generateSpecializedReport = async (config) => {
  const service = new ReportGenerationService();
  return await service.generateSpecializedReport(config);
};

// Export the service class for advanced usage
export default ReportGenerationService;