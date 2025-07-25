// src/hooks/useFileHandler.js - Updated with better column handling
import { useState } from 'react';
import { 
  parseCSV, 
  parseExcel, 
  validateFileData, 
  sanitizeData,
  logColumnInfo,
  getAllColumnsFromData,
  categorizeColumns
} from '../services/dataParser';
import { FILE_TYPES } from '../utils/constants';

export const useFileHandler = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const validateFile = (file) => {
    if (!FILE_TYPES.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Please upload only Excel (.xlsx) or CSV files');
    }

    if (file.size > FILE_TYPES.MAX_SIZE) {
      throw new Error('File size should not exceed 10MB');
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.match(FILE_TYPES.EXTENSIONS)) {
      throw new Error('Invalid file extension. Only .xlsx, .xls, and .csv files are allowed');
    }
  };

  const validateRuleFile = (file) => {
    const fileName = file.name.toLowerCase();
    const isJsonFile = file.type === 'application/json' || fileName.endsWith('.json');
    
    if (!isJsonFile) {
      throw new Error('Please upload only .json rule files');
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit for rule files
      throw new Error('Rule file size should not exceed 5MB');
    }
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    
    try {
      validateFile(file);
      
      let jsonData = [];

      jsonData = await parseExcel(file);

      // ✅ NEW: Log column information before validation
      console.log(`📋 Processing file: ${file.name}`);
      const columnInfo = logColumnInfo(jsonData, file.name);
      
      validateFileData(jsonData);
      const sanitizedData = sanitizeData(jsonData);
      
      // ✅ NEW: Log final column information after sanitization
      const finalColumns = getAllColumnsFromData(sanitizedData);
      const finalCategorized = categorizeColumns(finalColumns);
      
      console.log(`✅ Final processed data:`);
      console.log(`   Total columns preserved: ${finalCategorized.total}`);
      console.log(`   Predefined: ${finalCategorized.predefined.length}`);
      console.log(`   Extra: ${finalCategorized.extra.length}`);
      
      if (finalCategorized.extra.length > 0) {
        console.log(`   🎉 Extra columns successfully preserved:`, finalCategorized.extra);
      }
      
      // ✅ NEW: Add column metadata to the result
      return {
        data: sanitizedData,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          totalRows: sanitizedData.length,
          totalColumns: finalCategorized.total,
          predefinedColumns: finalCategorized.predefined.length,
          extraColumns: finalCategorized.extra.length,
          extraColumnNames: finalCategorized.extra,
          allColumns: finalColumns
        }
      };
      
    } catch (error) {
      throw new Error(`Error processing file: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processRuleFile = async (file) => {
    try {
      validateRuleFile(file);
      
      const text = await file.text();
      const fileName = file.name.toLowerCase();
      
      // Only support JSON format
      let ruleContent = text;
      let fileFormat = 'unknown';
      
      if (fileName.endsWith('.json') || file.type === 'application/json') {
        // Validate JSON format
        try {
          const parsed = JSON.parse(text);
          if (parsed.rules && Array.isArray(parsed.rules)) {
            fileFormat = 'json';
            ruleContent = text; // Keep as string for parsing in rule engine
          } else {
            throw new Error('JSON file must contain a "rules" array property');
          }
        } catch (jsonError) {
          throw new Error(`Invalid JSON format: ${jsonError.message}`);
        }
      } else {
        throw new Error('Only JSON rule files are supported');
      }
      
      return {
        content: ruleContent,
        format: fileFormat,
        fileName: file.name
      };
    } catch (error) {
      throw new Error(`Error reading rule file: ${error.message}`);
    }
  };

  return {
    isProcessing,
    processFile,
    processRuleFile
  };
};