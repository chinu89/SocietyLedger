// src/utils/validation.js - Updated to support JSON rule files only
import { ESSENTIAL_COLUMNS, FILE_TYPES } from './constants';

export const validateSocietyName = (name) => {
  const errors = [];
  
  if (!name || !name.trim()) {
    errors.push('Society name cannot be empty');
  }
  
  if (name && name.trim().length > 100) {
    errors.push('Society name too long (max 100 characters)');
  }
  
  return errors;
};

export const validateFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file selected');
    return errors;
  }
  
  if (!FILE_TYPES.ALLOWED_TYPES.includes(file.type)) {
    errors.push('Please upload only Excel (.xlsx) or CSV files');
  }
  
  if (file.size > FILE_TYPES.MAX_SIZE) {
    errors.push('File size should not exceed 10MB');
  }
  
  const fileName = file.name.toLowerCase();
  if (!fileName.match(FILE_TYPES.EXTENSIONS)) {
    errors.push('Invalid file extension. Only .xlsx, .xls, and .csv files are allowed');
  }
  
  return errors;
};

export const validateDataColumns = (data) => {
  if (!data || data.length === 0) {
    return ['File is empty or has no valid data'];
  }
  
  const fileColumns = Object.keys(data[0]);
  const missingColumns = ESSENTIAL_COLUMNS.filter(col => !fileColumns.includes(col));
  
  if (missingColumns.length > 0) {
    return [`Missing essential columns: ${missingColumns.join(', ')}`];
  }
  
  return [];
};

export const validateRuleFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('No rule file selected');
    return errors;
  }
  
  const fileName = file.name.toLowerCase();
  const isJsonFile = file.type === 'application/json' || fileName.endsWith('.json');
  
  if (!isJsonFile) {
    errors.push('Please upload a .json rule file only');
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    errors.push('Rule file size should not exceed 5MB');
  }
  
  return errors;
};

export const validateRuleContent = (content, format) => {
  const errors = [];
  
  try {
    if (format === 'json') {
      const parsed = JSON.parse(content);
      
      // Validate JSON structure
      if (!parsed.rules || !Array.isArray(parsed.rules)) {
        errors.push('JSON rule file must contain a "rules" array');
      }
      
      if (parsed.rules && parsed.rules.length === 0) {
        errors.push('Rule file contains no rules');
      }
      
      // Validate each rule has required properties
      if (parsed.rules) {
        parsed.rules.forEach((rule, index) => {
          if (!rule.type) {
            errors.push(`Rule ${index + 1}: Missing "type" property`);
          }
          
          // Validate specific rule types
          if (rule.type === 'batch_update' && !rule.operations) {
            errors.push(`Rule ${index + 1}: batch_update rules must have "operations" array`);
          }
          
          if (rule.type === 'conditional_logic' && !rule.conditions) {
            errors.push(`Rule ${index + 1}: conditional_logic rules must have "conditions" array`);
          }
        });
      }
    } else {
      errors.push('Only JSON rule format is supported');
    }    
  } catch (parseError) {
    if (format === 'json') {
      errors.push(`JSON parsing error: ${parseError.message}`);
    } else {
      errors.push(`Rule parsing error: ${parseError.message}`);
    }
  }
  
  return errors;
};

export const validateProcessingRequirements = (importedData, parsedRules) => {
  const errors = [];
  
  if (!importedData || importedData.length === 0) {
    errors.push('No data to process. Please import data first.');
  }
  
  if (!parsedRules || 
      (Array.isArray(parsedRules) && parsedRules.length === 0) || 
      (parsedRules.rules && parsedRules.rules.length === 0)) {
    errors.push('No rule file loaded. Please upload a rule file first.');
  }
  
  return errors;
};

export const getRuleFileFormatInfo = (content) => {
  try {
    const trimmed = content.trim();
    
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (parsed.rules && Array.isArray(parsed.rules)) {
        return {
          format: 'json',
          isValid: true,
          ruleCount: parsed.rules.length,
          hasMetadata: !!parsed.metadata,
          hasVariables: !!parsed.variables,
          hasCustomFunctions: !!parsed.custom_functions
        };
      }
    }
    
    // No longer support text format
    return {
      format: 'unsupported',
      isValid: false,
      error: 'Only JSON rule format is supported'
    };
    
  } catch (error) {
    return {
      format: 'invalid',
      isValid: false,
      error: error.message
    };
  }
};

// Export all validation functions
export default {
  validateSocietyName,
  validateFile,
  validateDataColumns,
  validateRuleFile,
  validateRuleContent,
  validateProcessingRequirements,
  getRuleFileFormatInfo
};