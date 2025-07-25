// src/utils/societyBillTemplateGenerator.js - Create Excel Template matching excel_report.xlsx
import * as ExcelJS from 'exceljs';

export const generateSocietyBillTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'Gawde Account Service';
  workbook.lastModifiedBy = 'Society Bill Template Generator';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.date1904 = false;

  // Create main worksheet
  const worksheet = workbook.addWorksheet('Society Bill');
  
  // Set page setup for A4 printing
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    margins: {
      left: 0.5, right: 0.5, top: 0.75, bottom: 0.75,
      header: 0.3, footer: 0.3
    },
    printArea: 'A1:J50'
  };

  // Set column widths to match the original format
  worksheet.columns = [
    { width: 8.89 },   // A - Sr.No/Labels
    { width: 7.22 },   // B - Details/Values  
    { width: 7.89 },   // C - Spacing
    { width: 8 },      // D - Spacing
    { width: 8 },      // E - Amount (left column)
    { width: 6.89 },   // F - Sr.No (right column)
    { width: 11.67 },  // G - Particulars (right column)
    { width: 10.44 },  // H - Spacing
    { width: 9 },      // I - Spacing
    { width: 12 }      // J - Amount (right column)
  ];

  // Row 1: Society Name Header (merged across A1:J1)
  const headerRow = worksheet.getRow(1);
  headerRow.getCell('A').value = '${SOCIETY_NAME}'; // Template variable for society name
  headerRow.getCell('A').font = { 
    bold: true, 
    size: 14, 
    color: { argb: 'FF000000' },
    name: 'Calibri'
  };
  headerRow.getCell('A').alignment = { 
    horizontal: 'center', 
    vertical: 'middle' 
  };
  headerRow.getCell('A').border = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' }
  };
  worksheet.mergeCells('A1:J1');
  headerRow.height = 20;

  // Rows 2-3: Empty spacing (merged)
  worksheet.mergeCells('A2:J2');
  worksheet.mergeCells('A3:J3');

  // Row 4: Flat/Shop and Bill No.
  const row4 = worksheet.getRow(4);
  row4.getCell('A').value = 'Flat/Shop';
  row4.getCell('B').value = '${FLAT_NO}';
  row4.getCell('G').value = 'Bill No. ';
  row4.getCell('H').value = '${BILL_PREFIX}';
  row4.getCell('I').value = '${BILL_NO}';
  
  // Style row 4
  row4.getCell('A').font = { bold: true };
  row4.getCell('G').font = { bold: true };
  row4.getCell('B').font = { color: { argb: 'FF0066CC' } };
  row4.getCell('H').font = { color: { argb: 'FF0066CC' } };
  row4.getCell('I').font = { color: { argb: 'FF0066CC' } };

  // Row 5: Code No. and Period
  const row5 = worksheet.getRow(5);
  row5.getCell('A').value = 'Code No.';
  row5.getCell('B').value = '${CODE_NO}';
  row5.getCell('F').value = 'Period';
  row5.getCell('G').value = '${MONTH_FROM}';
  row5.getCell('H').value = '${YEAR}';
  row5.getCell('I').value = '${MONTH_TO}';
  row5.getCell('J').value = '${YEAR}';
  
  // Style row 5
  row5.getCell('A').font = { bold: true };
  row5.getCell('F').font = { bold: true };
  ['B', 'G', 'H', 'I', 'J'].forEach(col => {
    row5.getCell(col).font = { color: { argb: 'FF0066CC' } };
  });

  // Row 6: Name and Bill Date
  const row6 = worksheet.getRow(6);
  row6.getCell('A').value = 'Name';
  row6.getCell('B').value = '${NAME}';
  row6.getCell('H').value = 'Bill Date';
  row6.getCell('I').value = '${BILL_DATE}';
  
  // Style row 6
  row6.getCell('A').font = { bold: true };
  row6.getCell('H').font = { bold: true };
  row6.getCell('B').font = { color: { argb: 'FF0066CC' } };
  row6.getCell('I').font = { color: { argb: 'FF0066CC' } };

  // Row 7: Headers for charges table
  const row7 = worksheet.getRow(7);
  row7.getCell('A').value = 'Sr.No.';
  row7.getCell('B').value = 'Particulars';
  row7.getCell('E').value = 'Amount';
  row7.getCell('F').value = 'Sr.No.';
  row7.getCell('G').value = 'Particulars';
  row7.getCell('J').value = 'Amount';
  
  // Style headers
  ['A', 'B', 'E', 'F', 'G', 'J'].forEach(col => {
    row7.getCell(col).font = { bold: true };
    row7.getCell(col).border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Define charges structure (matching the original layout)
  const chargesLeft = [
    { sr: 1, particular: 'BMC Property Tax', field: '${BMC_TAX}' },
    { sr: 2, particular: 'Maintenance Charges', field: '${MAINT_CHG}' },
    { sr: 3, particular: 'Water Charges', field: '${WATER_CHG}' },
    { sr: 4, particular: 'Sinking Fund Reserve', field: '${SINK_FUND}' },
    { sr: 5, particular: 'Building Repair Fund', field: '${REP_FUND}' },
    { sr: 6, particular: 'Parking Charges', field: '${PARK_CHG}' },
    { sr: 7, particular: 'Non Occupancy Charges', field: '${LET_OUT_CH}' },
    { sr: 8, particular: 'Electricity Charges', field: '${ELECT_CHG}' },
    { sr: 9, particular: 'Salary & Wages', field: '${SALARY}' }
  ];

  const chargesRight = [
    { sr: 10, particular: 'Lift Maintenance Charges', field: '${LIFT_MAINT}' },
    { sr: 11, particular: 'Maple Installation Charges', field: '${MAPLE_CHG}' },
    { sr: 12, particular: 'Painting & Major Repair', field: '${PAINT_FD}' },
    { sr: 13, particular: 'Legal & Professional Fees', field: '${LEGAL_CHG}' },
    { sr: 14, particular: 'Other Charges **', field: '${OTHER_CHG1}' },
    { sr: 15, particular: 'Other Charges ##', field: '${OTHER_CHG2}' },
    { sr: '', particular: 'Interest on Arrears', field: '${INTEREST}' }
  ];

  // Add charges rows (8-16)
  let currentRow = 8;
  for (let i = 0; i < Math.max(chargesLeft.length, chargesRight.length); i++) {
    const row = worksheet.getRow(currentRow);
    
    // Left side charges
    if (i < chargesLeft.length) {
      const leftCharge = chargesLeft[i];
      row.getCell('A').value = leftCharge.sr;
      row.getCell('B').value = leftCharge.particular;
      row.getCell('E').value = leftCharge.field;
      row.getCell('E').numFmt = '#,##0.00';
    }
    
    // Right side charges
    if (i < chargesRight.length) {
      const rightCharge = chargesRight[i];
      if (rightCharge.sr) {
        row.getCell('F').value = rightCharge.sr;
      }
      row.getCell('G').value = rightCharge.particular;
      row.getCell('J').value = rightCharge.field;
      row.getCell('J').numFmt = '#,##0.00';
    }
    
    // Style the row
    ['A', 'B', 'E', 'F', 'G', 'J'].forEach(col => {
      if (row.getCell(col).value) {
        row.getCell(col).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });
    
    currentRow++;
  }

  // Row 17: Other charges descriptions
  const row17 = worksheet.getRow(17);
  row17.getCell('A').value = '**';
  row17.getCell('B').value = '${OTHER_CHG1_DESC}'; // Template for other charges description
  row17.getCell('G').value = 'Current Month Total';
  row17.getCell('J').value = '${TOTAL}';
  row17.getCell('J').numFmt = '#,##0.00';
  
  // Style row 17
  row17.getCell('G').font = { bold: true };
  row17.getCell('J').font = { bold: true };

  // Row 18: Second other charges and arrears
  const row18 = worksheet.getRow(18);
  row18.getCell('A').value = '##';
  row18.getCell('B').value = '${OTHER_CHG2_DESC}'; // Template for other charges description
  row18.getCell('G').value = 'Add : Arrears of Maintenance';
  row18.getCell('J').value = '${ARREARS}';
  row18.getCell('J').numFmt = '#,##0.00';

  // Row 19: Interest arrears
  const row19 = worksheet.getRow(19);
  row19.getCell('G').value = 'Add : Interest Arrears';
  row19.getCell('J').value = '${INT_ARREAR}';
  row19.getCell('J').numFmt = '#,##0.00';

  // Row 20: Advance adjustment
  const row20 = worksheet.getRow(20);
  row20.getCell('G').value = 'Less : Advance/Adjustment';
  row20.getCell('J').value = '${ADVANCE}';
  row20.getCell('J').numFmt = '#,##0.00';

  // Row 21: Due date and total balance
  const row21 = worksheet.getRow(21);
  row21.getCell('A').value = 'DUE DATE';
  row21.getCell('B').value = '${DUE_DATE}';
  row21.getCell('G').value = 'Total Balance Due';
  row21.getCell('J').value = '${GR_TOTAL}';
  
  // Style row 21 (total row)
  row21.getCell('A').font = { bold: true };
  row21.getCell('G').font = { bold: true, color: { argb: 'FF0000FF' } };
  row21.getCell('J').font = { bold: true, color: { argb: 'FF0000FF' } };
  row21.getCell('J').numFmt = '#,##0.00';
  row21.getCell('J').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF99' }
  };

  // Add borders to the total row
  ['G', 'J'].forEach(col => {
    row21.getCell(col).border = {
      top: { style: 'thick' },
      bottom: { style: 'thick' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Row 22: Society signature
  const row22 = worksheet.getRow(22);
  row22.getCell('G').value = 'For ${SOCIETY_NAME}';
  row22.getCell('G').font = { italic: true };

  // Row 24: Signature designation
  const row24 = worksheet.getRow(24);
  row24.getCell('G').value = 'Hon.Secretary / Treasurer';
  row24.getCell('G').font = { bold: true };

  // Row 25: Member note
  const row25 = worksheet.getRow(25);
  row25.getCell('A').value = 'MEMBERS PLEASE NOTE :';
  row25.getCell('A').font = { bold: true, color: { argb: 'FF0000FF' } };

  // Add member notes (rows 26-35)
  const memberNotes = [
    'Please pay the above amount on or before due date.',
    'Failure to pay on time will attract penalty charges.',
    'For any queries, contact the society office.',
    'Payment can be made through cash or cheque.',
    'Cheques should be drawn in favor of the society.',
    'Please mention your flat number on the payment.',
    'Outstanding dues will be carried forward.',
    'Interest will be charged on overdue amounts.',
    'This bill is computer generated.'
  ];

  memberNotes.forEach((note, index) => {
    const noteRow = worksheet.getRow(26 + index);
    noteRow.getCell('A').value = `${index + 1}. ${note}`;
    noteRow.getCell('A').font = { size: 10 };
    worksheet.mergeCells(`A${26 + index}:J${26 + index}`);
  });

  // Receipt section (starting from row 36)
  const receiptStartRow = 36;
  
  // Receipt header (merged)
  const receiptHeaderRow = worksheet.getRow(receiptStartRow);
  receiptHeaderRow.getCell('A').value = 'PAYMENT RECEIPT';
  receiptHeaderRow.getCell('A').font = { 
    bold: true, 
    size: 14, 
    color: { argb: 'FF000000' } 
  };
  receiptHeaderRow.getCell('A').alignment = { 
    horizontal: 'center', 
    vertical: 'middle' 
  };
  receiptHeaderRow.getCell('A').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };
  worksheet.mergeCells(`A${receiptStartRow}:J${receiptStartRow}`);

  // Receipt details
  const receiptDetails = [
    { label: 'Receipt No.:', value: '${REC_NO}', label2: 'Date:', value2: '${REC_DATE}' },
    { label: 'Received From:', value: '${NAME}', label2: 'Flat No.:', value2: '${FLAT_NO}' },
    { label: 'Amount Received:', value: '${REC_AMT}', label2: 'Mode:', value2: 'Cash/Cheque' },
    { label: 'Amount in Words:', value: '${REC_WORD}', label2: '', value2: '' },
    { label: 'For Period:', value: '${MONTH_FROM} to ${MONTH_TO} ${YEAR}', label2: '', value2: '' },
    { label: 'Outstanding Balance:', value: '${OUTST_BAL}', label2: 'Status:', value2: 'Paid' }
  ];

  receiptDetails.forEach((detail, index) => {
    const row = worksheet.getRow(receiptStartRow + 2 + index);
    row.getCell('A').value = detail.label;
    row.getCell('B').value = detail.value;
    row.getCell('F').value = detail.label2;
    row.getCell('G').value = detail.value2;
    
    // Style
    row.getCell('A').font = { bold: true };
    row.getCell('F').font = { bold: true };
    row.getCell('B').font = { color: { argb: 'FF0066CC' } };
    row.getCell('G').font = { color: { argb: 'FF0066CC' } };
    
    // Currency formatting for amount
    if (detail.label.includes('Amount') && !detail.label.includes('Words')) {
      row.getCell('B').numFmt = '"₹"#,##0.00';
    }
    
    // Handle merged cells for long descriptions
    if (detail.label.includes('Words') || detail.label.includes('Period')) {
      worksheet.mergeCells(`B${receiptStartRow + 2 + index}:E${receiptStartRow + 2 + index}`);
    }
  });

  // Signature section for receipt
  const signatureRow = worksheet.getRow(receiptStartRow + 10);
  signatureRow.getCell('A').value = 'Authorized Signature';
  signatureRow.getCell('G').value = 'Date: ___________';
  signatureRow.getCell('A').font = { italic: true };
  signatureRow.getCell('G').font = { italic: true };

  return workbook;
};

// Helper function to download the template
export const downloadSocietyBillTemplate = async () => {
  try {
    const workbook = await generateSocietyBillTemplate();
    const buffer = await workbook.xlsx.writeBuffer();
    
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Society_Bill_Template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('Society bill template downloaded successfully');
    return { 
      success: true, 
      message: 'Society bill template downloaded successfully',
      templateFields: [
        'SOCIETY_NAME', 'FLAT_NO', 'CODE_NO', 'NAME', 'BILL_PREFIX', 'BILL_NO',
        'MONTH_FROM', 'MONTH_TO', 'YEAR', 'BILL_DATE', 'DUE_DATE',
        'BMC_TAX', 'MAINT_CHG', 'WATER_CHG', 'SINK_FUND', 'REP_FUND',
        'PARK_CHG', 'LET_OUT_CH', 'ELECT_CHG', 'SALARY', 'LIFT_MAINT',
        'MAPLE_CHG', 'PAINT_FD', 'LEGAL_CHG', 'OTHER_CHG1', 'OTHER_CHG2',
        'OTHER_CHG1_DESC', 'OTHER_CHG2_DESC', 'INTEREST', 'TOTAL',
        'ARREARS', 'INT_ARREAR', 'ADVANCE', 'GR_TOTAL',
        'REC_NO', 'REC_DATE', 'REC_AMT', 'REC_WORD', 'OUTST_BAL'
      ]
    };
  } catch (error) {
    console.error('Error generating society bill template:', error);
    throw new Error(`Failed to generate society bill template: ${error.message}`);
  }
};