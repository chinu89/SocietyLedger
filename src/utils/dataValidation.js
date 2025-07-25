// src/utils/dataValidation.js - Fixed with consistent DD/MM/YYYY date formatting
import { KNOWN_POSSIBLE_COLUMNS, DATE_COLUMNS, getColumnType } from './constants';

export const validateCellValue = (column, value, dataType) => {
  const errors = [];

  // Handle empty values
  if (!value && value !== 0) {
    return { isValid: true, errors: [], sanitizedValue: '' };
  }

  let sanitizedValue = value;

  try {
    // 🔧 UPDATED: Use dynamic column type detection
    const detectedType = dataType || getColumnType(column);
    
    switch (detectedType) {
      case 'numeric':
      case 'currency':
        // Validate numeric fields
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push(`${column} must be a valid number`);
        } else {
          sanitizedValue = numValue;
          
          // Additional validations for specific fields
          if (column === 'CODE_NO' && numValue < 0) {
            errors.push('Code number cannot be negative');
          }
          if (column === 'FLAT_NO' && numValue < 0) {
            errors.push('Flat number cannot be negative');
          }
          if (column === 'YEAR' && (numValue < 1900 || numValue > 2100)) {
            errors.push('Year must be between 1900 and 2100');
          }
          if (column.includes('AMT') && numValue < 0) {
            // Allow negative amounts for adjustments
            sanitizedValue = numValue;
          }
        }
        break;

      case 'date':
        // Validate date fields
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push(`${column} must be a valid date`);
        } else {
          sanitizedValue = dateValue.toISOString().split('T')[0];
        }
        break;

      case 'text':
      default:
        // Text validation
        sanitizedValue = String(value).trim();
        
        // Length validations
        if (column === 'NAME' && sanitizedValue.length > 100) {
          errors.push('Name cannot exceed 100 characters');
        }
        if (column.includes('REMARKS') && sanitizedValue.length > 255) {
          errors.push('Remarks cannot exceed 255 characters');
        }
        
        // Month validation
        if (column === 'MONTH_FROM' || column === 'MONTH_TO') {
          const validMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                              'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
          const upperValue = sanitizedValue.toUpperCase();
          if (sanitizedValue && !validMonths.includes(upperValue)) {
            errors.push(`${column} must be a valid month (JAN, FEB, etc.)`);
          } else if (sanitizedValue) {
            sanitizedValue = upperValue;
          }
        }
        
        // 🆕 NEW: Wing/Building validation for common extra columns
        if (column === 'WING' && sanitizedValue) {
          // Wings are usually single characters A, B, C, etc.
          if (sanitizedValue.length > 5) {
            errors.push('Wing designation should be short (e.g., A, B, C)');
          }
          sanitizedValue = sanitizedValue.toUpperCase();
        }
        
        if (column === 'TOWER' && sanitizedValue) {
          if (sanitizedValue.length > 10) {
            errors.push('Tower designation should be short');
          }
        }
        
        break;
    }
  } catch (error) {
    errors.push(`Invalid value for ${column}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
    warnings: getValidationWarnings(column, sanitizedValue)
  };
};

export const getValidationWarnings = (column, value) => {
  const warnings = [];
  const columnType = getColumnType(column);

  // Business logic warnings (not errors, but good to know)
  if (columnType === 'numeric') {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      if (column === 'TOTAL' && numValue > 50000) {
        warnings.push('Large total amount - please verify');
      }
      
      if (column === 'ARREARS' && numValue > 100000) {
        warnings.push('High arrears amount - please verify');
      }
      
      if (column === 'ADVANCE' && numValue > 50000) {
        warnings.push('Large advance amount - please verify');
      }
      
      if (column === 'INTEREST' && numValue > 10000) {
        warnings.push('High interest amount - please verify');
      }
      
      // 🆕 NEW: Warnings for extra numeric columns
      if (column === 'AREA_SQFT' && (numValue < 200 || numValue > 5000)) {
        warnings.push('Unusual area size - please verify');
      }
      
      if (column === 'FLOOR' && (numValue < 0 || numValue > 50)) {
        warnings.push('Unusual floor number - please verify');
      }
    }
  }

  // Date warnings
  if (columnType === 'date' && value) {
    const date = new Date(value);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearAhead = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    if (date < oneYearAgo) {
      warnings.push('Date is more than a year old');
    }
    if (date > oneYearAhead) {
      warnings.push('Date is more than a year in the future');
    }
  }

  return warnings;
};

export const validateRowData = (rowData) => {
  const errors = [];
  const warnings = [];

  // Cross-field validations
  const total = parseFloat(rowData.TOTAL || 0);
  const grTotal = parseFloat(rowData.GR_TOTAL || 0);
  const arrears = parseFloat(rowData.ARREARS || 0);
  const advance = parseFloat(rowData.ADVANCE || 0);

  // Business rule validations
  if (grTotal < total && total > 0) {
    warnings.push('GR_TOTAL is less than TOTAL - please verify');
  }

  if (arrears < 0 && advance <= 0) {
    warnings.push('Negative arrears without advance - please verify');
  }

  // Date sequence validation
  const billDate = rowData.BILL_DATE ? new Date(rowData.BILL_DATE) : null;
  const dueDate = rowData.DUE_DATE ? new Date(rowData.DUE_DATE) : null;
  const recDate = rowData.REC_DATE ? new Date(rowData.REC_DATE) : null;

  if (billDate && dueDate && dueDate <= billDate) {
    errors.push('Due date must be after bill date');
  }

  if (billDate && recDate && recDate < billDate) {
    warnings.push('Receipt date is before bill date - please verify');
  }

  // Receipt amount validations
  const recAmt1 = parseFloat(rowData.REC_AMT1 || 0);
  const recAmt2 = parseFloat(rowData.REC_AMT2 || 0);
  const recAmt3 = parseFloat(rowData.REC_AMT3 || 0);
  const totalRecAmt = parseFloat(rowData.REC_AMT || 0);
  const calculatedRecAmt = recAmt1 + recAmt2 + recAmt3;

  if (Math.abs(totalRecAmt - calculatedRecAmt) > 0.01 && (recAmt1 || recAmt2 || recAmt3)) {
    warnings.push('REC_AMT does not match sum of REC_AMT1, REC_AMT2, REC_AMT3');
  }

  // Outstanding balance validation
  const outstandingBal = parseFloat(rowData.OUTST_BAL || 0);
  const calculatedOutstanding = grTotal - totalRecAmt;
  
  if (Math.abs(outstandingBal - calculatedOutstanding) > 0.01 && grTotal > 0) {
    warnings.push('OUTST_BAL does not match GR_TOTAL - REC_AMT');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasBusinessLogicIssues: warnings.length > 0
  };
};

// 🔧 UPDATED: Use dynamic column type detection
export const getColumnDisplayType = (column) => {
  return getColumnType(column);
};

// 🎯 FIXED: Consistent date formatting function
const formatDateToDDMMYYYY = (dateValue) => {
  try {
    // Handle different input types
    let date;
    
    if (typeof dateValue === 'string') {
      // Handle DD/MM/YYYY format
      if (dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        return dateValue; // Already in correct format
      }
      
      // Handle DD-MM-YYYY format
      if (dateValue.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
        const parts = dateValue.split('-');
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      
      // Handle YYYY-MM-DD format
      if (dateValue.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
        const parts = dateValue.split('-');
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      
      // Try to parse other string formats
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'number') {
      // Excel serial date
      date = new Date((dateValue - 25569) * 86400 * 1000);
    } else {
      date = new Date(dateValue);
    }
    
    if (isNaN(date.getTime())) {
      return String(dateValue); // Return original if can't parse
    }
    
    // Format as DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
    
  } catch (error) {
    return String(dateValue); // Return original if error
  }
};

export const formatDisplayValue = (value, column) => {
  if (!value && value !== 0) return '';
  
  const displayType = getColumnDisplayType(column);
  
  switch (displayType) {
    case 'numeric':
      // 🆕 NEW: Special handling for currency vs regular numeric
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return value;
      
      // Currency fields
      if (column.includes('AMT') || column.includes('CHG') || column.includes('TAX') || 
          column === 'TOTAL' || column === 'GR_TOTAL' || column === 'ARREARS' || 
          column === 'ADVANCE' || column === 'INTEREST' || column === 'OUTST_BAL') {
        return `${numValue.toLocaleString('en-IN', { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 2 
        })}`;
      }
      
      // Regular numbers
      return numValue.toLocaleString('en-IN');
      
    case 'date':
      // 🎯 FIXED: Always use DD/MM/YYYY format
      return formatDateToDDMMYYYY(value);
      
    case 'text':
    default:
      return String(value);
  }
};

export const sanitizeForSave = (value, column) => {
  const displayType = getColumnDisplayType(column);
  
  switch (displayType) {
    case 'numeric':
      const numValue = parseFloat(value);
      return isNaN(numValue) ? 0 : numValue;
      
    case 'date':
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
      } catch {
        return '';
      }
      
    case 'text':
    default:
      return String(value).trim();
  }
};

// 🔧 UPDATED: Use KNOWN_POSSIBLE_COLUMNS instead of ALL_POSSIBLE_COLUMNS
export const getStepValidationRules = (stepNumber) => {
  switch (stepNumber) {
    case 1:
      return {
        requiredFields: ['MONTH_FROM', 'MONTH_TO', 'YEAR', 'CODE_NO', 'FLAT_NO', 'NAME'],
        description: 'Step 1 requires basic billing information',
        criticalFields: ['BILL_NO', 'PREV_BL_NO'] // These are auto-generated but important
      };
      
    case 2:
      return {
        requiredFields: ['GR_TOTAL', 'REC_AMT'],
        description: 'Step 2 requires total amounts for financial calculations',
        criticalFields: ['OUTST_BAL', 'ARREARS', 'REC_WORD']
      };
      
    case 3:
      return {
        requiredFields: ['BILL_NO', 'OUTST_BAL'],
        description: 'Step 3 requires bill numbers and outstanding balances',
        criticalFields: ['BILL_DATE', 'DUE_DATE', 'REC_NO']
      };
      
    case 4:
      return {
        requiredFields: ['BILL_NO', 'GR_TOTAL'],
        description: 'Step 4 requires complete billing information',
        criticalFields: ['BILL_DATE', 'DUE_DATE', 'OUTST_BAL']
      };
      
    default:
      return {
        requiredFields: ['MONTH_FROM', 'MONTH_TO', 'YEAR', 'CODE_NO', 'FLAT_NO', 'NAME'],
        description: 'Basic validation',
        criticalFields: []
      };
  }
};

export const validateDataForStep = (data, stepNumber) => {
  const rules = getStepValidationRules(stepNumber);
  const errors = [];
  const warnings = [];
  
  data.forEach((row, index) => {
    // Check required fields
    rules.requiredFields.forEach(field => {
      if (!row[field] && row[field] !== 0) {
        errors.push(`Row ${index + 1}: Missing required field ${field}`);
      }
    });
    
    // Validate individual row
    const rowValidation = validateRowData(row);
    if (!rowValidation.isValid) {
      rowValidation.errors.forEach(error => {
        errors.push(`Row ${index + 1}: ${error}`);
      });
    }
    
    rowValidation.warnings.forEach(warning => {
      warnings.push(`Row ${index + 1}: ${warning}`);
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canProceed: errors.length === 0,
    stepNumber,
    totalRows: data.length,
    validatedRows: data.length - errors.length
  };
};

export const getUniqueColumns = (data) => {
  if (!data || data.length === 0) return [];
  
  // Get columns from first row to preserve order
  const firstRowColumns = Object.keys(data[0]).filter(key => key !== '_rowIndex');
  const allColumns = new Set(firstRowColumns);
  
  // Add any extra columns from other rows at the end
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      if (key !== '_rowIndex') {
        allColumns.add(key);
      }
    });
  });
  
  const extraColumns = Array.from(allColumns).filter(col => !firstRowColumns.includes(col));
  return [...firstRowColumns, ...extraColumns]; // Original order preserved!
};

export const getPrioritizedColumns = (columns) => {
  return columns; // Keep original order
};

// Export all validation functions
export default {
  validateCellValue,
  getValidationWarnings,
  validateRowData,
  getColumnDisplayType,
  formatDisplayValue,
  sanitizeForSave,
  getStepValidationRules,
  validateDataForStep,
  getUniqueColumns,
  getPrioritizedColumns
};