// src/hooks/useReceiptProcessor.js - Receipt Processing Hook
import { useState } from 'react';
import { processReceiptFile } from '../services/receiptProcessor';

export const useReceiptProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState(null);

  const processReceipts = async (file, currentData) => {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!currentData || currentData.length === 0) {
      throw new Error('No current data to update. Please import data first.');
    }

    setIsProcessing(true);
    setProcessingResults(null);

    try {
      console.log('🧾 Starting receipt processing...');
      
      // Validate file type
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        throw new Error('Please upload only Excel files (.xlsx or .xls)');
      }

      // Process the receipt file
      const result = await processReceiptFile(file, currentData);
      
      setProcessingResults(result);
      
      if (result.success) {
        console.log('✅ Receipt processing completed successfully');
        return result;
      } else {
        console.error('❌ Receipt processing failed:', result.error);
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Receipt processing error:', error);
      const errorResult = {
        success: false,
        error: error.message,
        processingSummary: {
          totalRecordsInFile: 0,
          processedCodeNos: 0,
          updatedRecords: 0,
          skippedRecords: 0,
          updatedColumns: [],
          warnings: [],
          errors: [error.message]
        }
      };
      setProcessingResults(errorResult);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const validateReceiptFile = async (file) => {
    try {
      // Basic file validation
      if (!file) {
        return { isValid: false, errors: ['No file selected'] };
      }

      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        return { 
          isValid: false, 
          errors: ['Invalid file type. Please upload Excel files (.xlsx or .xls) only.'] 
        };
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return { 
          isValid: false, 
          errors: ['File size too large. Maximum size is 10MB.'] 
        };
      }

      // TODO: Could add more sophisticated validation here
      // For now, basic validation is sufficient

      return { isValid: true, errors: [] };

    } catch (error) {
      return { 
        isValid: false, 
        errors: [`File validation error: ${error.message}`] 
      };
    }
  };

  const getReceiptProcessingSummary = () => {
    if (!processingResults) return null;
    
    return {
      ...processingResults.processingSummary,
      success: processingResults.success,
      hasWarnings: processingResults.processingSummary?.warnings?.length > 0,
      hasErrors: processingResults.processingSummary?.errors?.length > 0
    };
  };

  const resetProcessingState = () => {
    setProcessingResults(null);
  };

  return {
    isProcessing,
    processingResults,
    processReceipts,
    validateReceiptFile,
    getReceiptProcessingSummary,
    resetProcessingState
  };
};