// src/services/excelService.js
import * as ExcelJS from 'exceljs';
import { NUMERIC_COLUMNS, DATE_COLUMNS } from '../utils/constants';

export const exportToExcel = async (data, filename) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Society Data');
  
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);
  
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' }
  };
  
  data.forEach((row, rowIndex) => {
    const values = headers.map((header, colIndex) => {
      let value = row[header] || '';
      
      if (NUMERIC_COLUMNS.includes(header)) {
        if (value === '' || value === null || value === undefined) {
          return 0;
        }
        const numValue = parseFloat(value);
        return isNaN(numValue) ? 0 : numValue;
      }
      
      if (DATE_COLUMNS.includes(header)) {
        if (value && value !== '' && value !== ' ') {
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            return dateValue;
          }
        }
        return value;
      }
      
      return value;
    });
    
    const excelRow = worksheet.addRow(values);
    
    headers.forEach((header, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      
      if (NUMERIC_COLUMNS.includes(header)) {
        if (header.includes('AMT') || header.includes('CHG') || header.includes('TAX') || 
            header === 'TOTAL' || header === 'GR_TOTAL' || header === 'ARREARS' || 
            header === 'ADVANCE' || header === 'INTEREST' || header === 'OUTST_BAL') {
          cell.numFmt = '#,##0.00';
        } else {
          cell.numFmt = '0';
        }
      } else if (DATE_COLUMNS.includes(header)) {
        cell.numFmt = 'dd/mm/yyyy';
      }
    });
  });
  
  worksheet.columns.forEach((column, index) => {
    let maxLength = 0;
    const header = headers[index];
    
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    
    if (NUMERIC_COLUMNS.includes(header)) {
      column.width = Math.max(Math.min(maxLength + 2, 50), 12);
    } else {
      column.width = Math.min(maxLength + 2, 50);
    }
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
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
};