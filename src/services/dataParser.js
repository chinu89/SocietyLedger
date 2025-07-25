// src/services/dataParser.js - FIXED to preserve extra columns
import * as ExcelJS from 'exceljs';
import { ESSENTIAL_COLUMNS, ALL_POSSIBLE_COLUMNS } from '../utils/constants';
import { sanitizeInput } from '../utils/helpers';

export const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('File must have headers and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const jsonData = lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  }).filter(row => Object.values(row).some(val => val));

  return jsonData;
};

export const parseExcel = async (file) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }
    
    const headers = [];
    const jsonData = [];
    
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      if (cell.value) {
        headers[colNumber - 1] = String(cell.value).trim();
      }
    });
    
    if (headers.length === 0) {
      throw new Error('No headers found in Excel file');
    }
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      
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
          if (cellValue) hasData = true;
        }
      });
      
      if (hasData) {
        jsonData.push(rowData);
      }
    });
    
    return jsonData;
    
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

export const validateFileData = (jsonData) => {
  if (jsonData.length === 0) {
    throw new Error('File is empty or has no valid data');
  }

  const fileColumns = Object.keys(jsonData[0]);
  const missingEssentialColumns = ESSENTIAL_COLUMNS.filter(col => !fileColumns.includes(col));
  
  if (missingEssentialColumns.length > 0) {
    throw new Error(`Missing essential columns: ${missingEssentialColumns.join(', ')}`);
  }

  return true;
};

// 🔧 FIXED: Modified to preserve ALL columns, not just predefined ones
export const sanitizeData = (jsonData) => {
  return jsonData.map((row, index) => {
    const sanitizedRow = {};
    
    // ✅ NEW: Get ALL columns from the actual data instead of just predefined ones
    const allActualColumns = Object.keys(row);
    
    // First, handle all known predefined columns
    ALL_POSSIBLE_COLUMNS.forEach(column => {
      const value = row[column];
      sanitizedRow[column] = value ? sanitizeInput(value) : '';
    });
    
    // ✅ NEW: Then handle any extra columns that aren't in the predefined list
    allActualColumns.forEach(column => {
      if (!ALL_POSSIBLE_COLUMNS.includes(column)) {
        console.log(`🆕 Preserving extra column: ${column}`);
        const value = row[column];
        sanitizedRow[column] = value ? sanitizeInput(value) : '';
      }
    });
    
    // Add row index for tracking
    sanitizedRow._rowIndex = index + 1;
    return sanitizedRow;
  });
};

// 🆕 NEW: Helper function to get all unique columns from dataset
export const getAllColumnsFromData = (jsonData) => {
  if (!jsonData || jsonData.length === 0) return [];
  
  const allColumns = new Set();
  
  // Collect all unique column names from all rows
  jsonData.forEach(row => {
    Object.keys(row).forEach(column => {
      if (column !== '_rowIndex') { // Exclude internal tracking column
        allColumns.add(column);
      }
    });
  });
  
  return Array.from(allColumns).sort();
};

// 🆕 NEW: Helper function to categorize columns
export const categorizeColumns = (columns) => {
  const predefined = [];
  const extra = [];
  
  columns.forEach(column => {
    if (ALL_POSSIBLE_COLUMNS.includes(column)) {
      predefined.push(column);
    } else {
      extra.push(column);
    }
  });
  
  return {
    predefined,
    extra,
    total: columns.length
  };
};

// 🆕 NEW: Function to log column information for debugging
export const logColumnInfo = (jsonData, fileName = 'Unknown') => {
  const allColumns = getAllColumnsFromData(jsonData);
  const categorized = categorizeColumns(allColumns);
  
  console.log(`📊 Column Analysis for ${fileName}:`);
  console.log(`   Total columns: ${categorized.total}`);
  console.log(`   Predefined columns: ${categorized.predefined.length}`);
  console.log(`   Extra columns: ${categorized.extra.length}`);
  
  if (categorized.extra.length > 0) {
    console.log(`   🆕 Extra columns found:`, categorized.extra);
  }
  
  return categorized;
};