// src/utils/sampleExcelTemplateGenerator.js - Generate Sample Excel Template
import * as ExcelJS from 'exceljs';

export const generateSampleExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'Gawde Account Service';
  workbook.lastModifiedBy = 'Template Generator';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.date1904 = false;

  // Create Invoice Template Worksheet
  const invoiceSheet = workbook.addWorksheet('Invoice Template');
  
  // Set page setup for printing
  invoiceSheet.pageSetup.paperSize = 9; // A4
  invoiceSheet.pageSetup.orientation = 'portrait';
  invoiceSheet.pageSetup.margins = {
    left: 0.7, right: 0.7, top: 0.75, bottom: 0.75,
    header: 0.3, footer: 0.3
  };

  // Set column widths
  invoiceSheet.columns = [
    { width: 3 },   // A - margin
    { width: 20 },  // B - labels
    { width: 25 },  // C - values
    { width: 20 },  // D - labels
    { width: 25 },  // E - values
    { width: 3 }    // F - margin
  ];

  // Header Section
  const headerRow1 = invoiceSheet.getRow(2);
  headerRow1.getCell('B').value = 'SOCIETY BILLING INVOICE';
  headerRow1.getCell('B').font = { bold: true, size: 16, color: { argb: 'FF2E5090' } };
  headerRow1.getCell('B').alignment = { horizontal: 'left', vertical: 'middle' };
  invoiceSheet.mergeCells('B2:E2');

  const headerRow2 = invoiceSheet.getRow(3);
  headerRow2.getCell('B').value = '${NAME}';
  headerRow2.getCell('B').font = { bold: true, size: 14 };
  headerRow2.getCell('B').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F8FF' } };
  invoiceSheet.mergeCells('B3:E3');

  // Add border to header
  ['B2', 'B3'].forEach(cell => {
    invoiceSheet.getCell(cell).border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  // Billing Information Section
  let currentRow = 5;
  
  // Society Details
  const societySection = [
    ['Flat Number:', '${FLAT_NO}', 'Code Number:', '${CODE_NO}'],
    ['Month From:', '${MONTH_FROM}', 'Month To:', '${MONTH_TO}'],
    ['Year:', '${YEAR}', 'Bill Number:', '${BILL_NO}'],
    ['Bill Date:', '${BILL_DATE}', 'Due Date:', '${DUE_DATE}']
  ];

  societySection.forEach(rowData => {
    const row = invoiceSheet.getRow(currentRow);
    row.getCell('B').value = rowData[0];
    row.getCell('C').value = rowData[1];
    row.getCell('D').value = rowData[2];
    row.getCell('E').value = rowData[3];
    
    // Style labels
    row.getCell('B').font = { bold: true, color: { argb: 'FF333333' } };
    row.getCell('D').font = { bold: true, color: { argb: 'FF333333' } };
    
    // Style values with template variables
    row.getCell('C').font = { color: { argb: 'FF0066CC' } };
    row.getCell('E').font = { color: { argb: 'FF0066CC' } };
    
    currentRow++;
  });

  currentRow += 1; // Add spacing

  // Charges Section
  const chargesHeaderRow = invoiceSheet.getRow(currentRow);
  chargesHeaderRow.getCell('B').value = 'CHARGES BREAKDOWN';
  chargesHeaderRow.getCell('B').font = { bold: true, size: 12, color: { argb: 'FF2E5090' } };
  chargesHeaderRow.getCell('B').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } };
  invoiceSheet.mergeCells(`B${currentRow}:E${currentRow}`);
  
  // Add border
  chargesHeaderRow.getCell('B').border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' }
  };
  
  currentRow += 1;

  // Charges Details
  const charges = [
    ['BMC Tax:', '${BMC_TAX}', 'Maintenance:', '${MAINT_CHG}'],
    ['Water Charges:', '${WATER_CHG}', 'Sinking Fund:', '${SINK_FUND}'],
    ['Repair Fund:', '${REP_FUND}', 'Lift Maintenance:', '${LIFT_MAINT}'],
    ['Parking Charges:', '${PARK_CHG}', 'Salary:', '${SALARY}'],
    ['Other Charges 1:', '${OTHER_CHG1}', 'Other Charges 2:', '${OTHER_CHG2}'],
    ['Interest:', '${INTEREST}', 'Building Fund:', '${BLDG_FUND}']
  ];

  charges.forEach(rowData => {
    const row = invoiceSheet.getRow(currentRow);
    row.getCell('B').value = rowData[0];
    row.getCell('C').value = rowData[1];
    row.getCell('D').value = rowData[2];
    row.getCell('E').value = rowData[3];
    
    // Style labels
    row.getCell('B').font = { color: { argb: 'FF666666' } };
    row.getCell('D').font = { color: { argb: 'FF666666' } };
    
    // Style currency values
    row.getCell('C').font = { color: { argb: 'FF009900' } };
    row.getCell('E').font = { color: { argb: 'FF009900' } };
    row.getCell('C').numFmt = '"₹"#,##0.00';
    row.getCell('E').numFmt = '"₹"#,##0.00';
    
    currentRow++;
  });

  currentRow += 1; // Add spacing

  // Totals Section
  const totalsSection = [
    ['TOTAL CHARGES:', '${TOTAL}', '', ''],
    ['Previous Arrears:', '${ARREARS}', 'Interest on Arrears:', '${INT_ARREAR}'],
    ['Less: Advance:', '${ADVANCE}', '', ''],
    ['GRAND TOTAL:', '${GR_TOTAL}', '', '']
  ];

  totalsSection.forEach((rowData, index) => {
    const row = invoiceSheet.getRow(currentRow);
    row.getCell('B').value = rowData[0];
    row.getCell('C').value = rowData[1];
    row.getCell('D').value = rowData[2];
    row.getCell('E').value = rowData[3];
    
    if (index === 0 || index === 3) { // Total and Grand Total rows
      row.getCell('B').font = { bold: true, size: 12, color: { argb: 'FF2E5090' } };
      row.getCell('C').font = { bold: true, size: 12, color: { argb: 'FF2E5090' } };
      row.getCell('C').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
    } else {
      row.getCell('B').font = { color: { argb: 'FF666666' } };
      row.getCell('D').font = { color: { argb: 'FF666666' } };
    }
    
    // Currency formatting
    if (rowData[1]) {
      row.getCell('C').numFmt = '"₹"#,##0.00';
    }
    if (rowData[3]) {
      row.getCell('E').numFmt = '"₹"#,##0.00';
    }
    
    currentRow++;
  });

  currentRow += 1; // Add spacing

  // Payment Section
  const paymentHeaderRow = invoiceSheet.getRow(currentRow);
  paymentHeaderRow.getCell('B').value = 'PAYMENT DETAILS';
  paymentHeaderRow.getCell('B').font = { bold: true, size: 12, color: { argb: 'FF2E5090' } };
  paymentHeaderRow.getCell('B').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } };
  invoiceSheet.mergeCells(`B${currentRow}:E${currentRow}`);
  
  // Add border
  paymentHeaderRow.getCell('B').border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' }
  };
  
  currentRow += 1;

  // Payment Details
  const paymentDetails = [
    ['Receipt Amount:', '${REC_AMT}', 'Receipt Number:', '${REC_NO}'],
    ['Receipt Date:', '${REC_DATE}', 'Outstanding Balance:', '${OUTST_BAL}'],
    ['Amount in Words:', '${REC_WORD}', '', '']
  ];

  paymentDetails.forEach(rowData => {
    const row = invoiceSheet.getRow(currentRow);
    row.getCell('B').value = rowData[0];
    row.getCell('C').value = rowData[1];
    row.getCell('D').value = rowData[2];
    row.getCell('E').value = rowData[3];
    
    // Style labels
    row.getCell('B').font = { color: { argb: 'FF666666' } };
    row.getCell('D').font = { color: { argb: 'FF666666' } };
    
    // Special formatting for amount in words
    if (rowData[0].includes('Words')) {
      invoiceSheet.mergeCells(`C${currentRow}:E${currentRow}`);
      row.getCell('C').font = { italic: true, color: { argb: 'FF0066CC' } };
    } else {
      row.getCell('C').font = { color: { argb: 'FF0066CC' } };
      row.getCell('E').font = { color: { argb: 'FF0066CC' } };
    }
    
    currentRow++;
  });

  currentRow += 2; // Add spacing

  // Footer
  const footerRow = invoiceSheet.getRow(currentRow);
  footerRow.getCell('B').value = 'Thank you for your prompt payment!';
  footerRow.getCell('B').font = { italic: true, color: { argb: 'FF666666' } };
  footerRow.getCell('B').alignment = { horizontal: 'center' };
  invoiceSheet.mergeCells(`B${currentRow}:E${currentRow}`);

  // Create Receipt Template Worksheet
  const receiptSheet = workbook.addWorksheet('Receipt Template');
  
  // Set page setup for receipt
  receiptSheet.pageSetup.paperSize = 9; // A4
  receiptSheet.pageSetup.orientation = 'portrait';
  receiptSheet.pageSetup.margins = {
    left: 1, right: 1, top: 1, bottom: 1,
    header: 0.3, footer: 0.3
  };

  // Receipt columns
  receiptSheet.columns = [
    { width: 5 },   // A - margin
    { width: 15 },  // B - labels
    { width: 20 },  // C - values
    { width: 15 },  // D - labels
    { width: 20 },  // E - values
    { width: 5 }    // F - margin
  ];

  // Receipt Header
  let receiptRow = 2;
  const receiptHeaderRow = receiptSheet.getRow(receiptRow);
  receiptHeaderRow.getCell('B').value = 'PAYMENT RECEIPT';
  receiptHeaderRow.getCell('B').font = { bold: true, size: 16, color: { argb: 'FF2E5090' } };
  receiptHeaderRow.getCell('B').alignment = { horizontal: 'center' };
  receiptSheet.mergeCells(`B${receiptRow}:E${receiptRow}`);
  receiptRow += 2;

  // Receipt Details
  const receiptDetails = [
    ['Receipt No:', '${REC_NO}', 'Date:', '${REC_DATE}'],
    ['Received From:', '${NAME}', 'Flat No:', '${FLAT_NO}'],
    ['Amount:', '${REC_AMT}', 'Mode:', 'Cash/Cheque'],
    ['Amount in Words:', '${REC_WORD}', '', ''],
    ['For Period:', '${MONTH_FROM} to ${MONTH_TO} ${YEAR}', '', ''],
    ['Balance:', '${OUTST_BAL}', 'Status:', 'Paid']
  ];

  receiptDetails.forEach(rowData => {
    const row = receiptSheet.getRow(receiptRow);
    row.getCell('B').value = rowData[0];
    row.getCell('C').value = rowData[1];
    row.getCell('D').value = rowData[2];
    row.getCell('E').value = rowData[3];
    
    // Style labels
    row.getCell('B').font = { bold: true, color: { argb: 'FF333333' } };
    row.getCell('D').font = { bold: true, color: { argb: 'FF333333' } };
    
    // Special handling for merged cells
    if (rowData[0].includes('Words') || rowData[0].includes('Period')) {
      receiptSheet.mergeCells(`C${receiptRow}:E${receiptRow}`);
      row.getCell('C').font = { color: { argb: 'FF0066CC' } };
    } else {
      row.getCell('C').font = { color: { argb: 'FF0066CC' } };
      row.getCell('E').font = { color: { argb: 'FF0066CC' } };
    }
    
    receiptRow++;
  });

  // Add signature section
  receiptRow += 2;
  const signatureRow = receiptSheet.getRow(receiptRow);
  signatureRow.getCell('B').value = 'Authorized Signature';
  signatureRow.getCell('E').value = 'Date: ___________';
  signatureRow.getCell('B').font = { color: { argb: 'FF666666' } };
  signatureRow.getCell('E').font = { color: { argb: 'FF666666' } };

  // Create Summary Report Template
  const summarySheet = workbook.addWorksheet('Summary Report');
  
  // Summary sheet setup
  summarySheet.pageSetup.paperSize = 9; // A4
  summarySheet.pageSetup.orientation = 'landscape';
  
  // Summary columns
  summarySheet.columns = [
    { header: 'Flat No', key: 'flatNo', width: 10 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Month', key: 'month', width: 12 },
    { header: 'Total Charges', key: 'total', width: 15 },
    { header: 'Arrears', key: 'arrears', width: 12 },
    { header: 'Grand Total', key: 'grandTotal', width: 15 },
    { header: 'Received', key: 'received', width: 15 },
    { header: 'Outstanding', key: 'outstanding', width: 15 },
    { header: 'Status', key: 'status', width: 12 }
  ];

  // Summary header row
  const summaryHeaderRow = summarySheet.getRow(1);
  summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summaryHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5090' } };
  summaryHeaderRow.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' }
  };

  // Add sample data row with variables
  const sampleDataRow = summarySheet.getRow(2);
  sampleDataRow.getCell(1).value = '${FLAT_NO}';
  sampleDataRow.getCell(2).value = '${NAME}';
  sampleDataRow.getCell(3).value = '${MONTH_FROM}-${MONTH_TO} ${YEAR}';
  sampleDataRow.getCell(4).value = '${TOTAL}';
  sampleDataRow.getCell(5).value = '${ARREARS}';
  sampleDataRow.getCell(6).value = '${GR_TOTAL}';
  sampleDataRow.getCell(7).value = '${REC_AMT}';
  sampleDataRow.getCell(8).value = '${OUTST_BAL}';
  sampleDataRow.getCell(9).value = '=IF(H2=0,"Paid","Pending")'; // Excel formula

  // Format currency columns
  [4, 5, 6, 7, 8].forEach(colNum => {
    sampleDataRow.getCell(colNum).numFmt = '"₹"#,##0.00';
  });

  // Create Instructions Sheet
  const instructionsSheet = workbook.addWorksheet('Instructions');
  
  // Instructions content
  const instructions = [
    ['Excel Template Usage Instructions', '', ''],
    ['', '', ''],
    ['1. Variable Syntax:', 'Use ${FIELD_NAME} for dynamic content', ''],
    ['2. Available Fields:', 'NAME, FLAT_NO, CODE_NO, TOTAL, GR_TOTAL, etc.', ''],
    ['3. Currency Fields:', 'Automatically formatted with ₹ symbol', ''],
    ['4. Date Fields:', 'Formatted as DD MMM YYYY', ''],
    ['5. Multiple Sheets:', 'Each sheet can contain templates', ''],
    ['6. Excel Features:', 'Formulas, formatting, styles preserved', ''],
    ['', '', ''],
    ['Common Variables:', '', ''],
    ['${NAME}', 'Customer name', ''],
    ['${FLAT_NO}', 'Flat number', ''],
    ['${CODE_NO}', 'Code number', ''],
    ['${MONTH_FROM}', 'Billing month from', ''],
    ['${MONTH_TO}', 'Billing month to', ''],
    ['${YEAR}', 'Billing year', ''],
    ['${TOTAL}', 'Total charges', ''],
    ['${ARREARS}', 'Previous arrears', ''],
    ['${GR_TOTAL}', 'Grand total amount', ''],
    ['${REC_AMT}', 'Receipt amount', ''],
    ['${OUTST_BAL}', 'Outstanding balance', ''],
    ['${BILL_DATE}', 'Bill date', ''],
    ['${DUE_DATE}', 'Due date', ''],
    ['${REC_WORD}', 'Amount in words', '']
  ];

  instructions.forEach((instruction, index) => {
    const row = instructionsSheet.getRow(index + 1);
    row.getCell('A').value = instruction[0];
    row.getCell('B').value = instruction[1];
    row.getCell('C').value = instruction[2];
    
    if (index === 0) {
      row.font = { bold: true, size: 14 };
    } else if (instruction[0].includes(':')) {
      row.getCell('A').font = { bold: true };
    }
  });

  instructionsSheet.columns = [
    { width: 25 },
    { width: 40 },
    { width: 20 }
  ];

  return workbook;
};

export const downloadSampleTemplate = async () => {
  try {
    const workbook = await generateSampleExcelTemplate();
    const buffer = await workbook.xlsx.writeBuffer();
    
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Society_Report_Template_Sample.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('Sample Excel template downloaded successfully');
    return { success: true, message: 'Sample template downloaded successfully' };
  } catch (error) {
    console.error('Error generating sample template:', error);
    throw new Error(`Failed to generate sample template: ${error.message}`);
  }
};