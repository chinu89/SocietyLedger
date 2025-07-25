// src/hooks/useRuleProcessor.js - Updated for Enhanced Rule Engine with JSON support and Step 4 Excel
import { useState } from 'react';
import { parseRuleFile, applyRules } from '../services/enhancedRuleEngine';

export const useRuleProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Replace your existing processRules function with this
  const processRules = async (data, rules, stepNumber, onProgress) => {
    try {
      console.log(`Enhanced Rule Engine: Executing Step ${stepNumber}`);
      console.log('Rule format:', rules.format || 'legacy');

      if (!data || data.length === 0) {
        throw new Error('No data provided for processing');
      }

      // Import the applyRules function from your enhanced rule engine
      const { applyRules } = await import('../services/enhancedRuleEngine');
      
      // Use applyRules for processing
      const processedData = await applyRules(data, rules, stepNumber);

      console.log(`Step ${stepNumber} completed successfully with enhanced rule engine`);
      console.log('Processed records:', processedData.length);

      return processedData;

    } catch (error) {
      console.error(`Error in step ${stepNumber}:`, error);
      throw error;
    }
  };

  const executeStep1 = async (importedData, parsedRules) => {
    if (!importedData.length) {
      throw new Error('No data to process. Please import data first.');
    }

    if (!parsedRules || (Array.isArray(parsedRules) && parsedRules.length === 0) || 
        (parsedRules.rules && parsedRules.rules.length === 0)) {
      throw new Error('No rule file loaded. Please upload a rule file first.');
    }

    setIsProcessing(true);

    try {
      console.log('Enhanced Rule Engine: Executing Step 1');
      console.log('Rule format:', parsedRules.format || 'legacy');
      
      // The enhanced applyRules function handles both formats automatically
      const processed = await applyRules(importedData, parsedRules, 1);
      
      console.log('Step 1 completed successfully with enhanced rule engine');
      console.log('Processed records:', processed.length);
      
      return processed;
    } catch (error) {
      throw new Error(`Error processing Step 1: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeStep2 = async (processedData, parsedRules) => {
    if (!processedData.length) {
      throw new Error('No processed data from Step 1. Please complete Step 1 first.');
    }

    if (!parsedRules || (Array.isArray(parsedRules) && parsedRules.length === 0) || 
        (parsedRules.rules && parsedRules.rules.length === 0)) {
      throw new Error('No rule file loaded for Step 2. Please upload a rule file.');
    }

    setIsProcessing(true);

    try {
      console.log('Enhanced Rule Engine: Executing Step 2 with automatic REC_AMT calculation');
      console.log('Rule format:', parsedRules.format || 'legacy');
      
      // Enhanced rule engine automatically handles preprocessing for Step 2
      const processed = await applyRules(processedData, parsedRules, 2);
      
      console.log('Step 2 completed successfully with enhanced rule engine');
      console.log('Processed records:', processed.length);
      
      // Log some sample calculations for verification
      if (processed.length > 0) {
        const sample = processed[0];
        console.log('Sample calculations:');
        console.log('- REC_AMT:', sample.REC_AMT);
        console.log('- OUTST_BAL:', sample.OUTST_BAL);
        console.log('- ARREARS:', sample.ARREARS);
        console.log('- ADVANCE:', sample.ADVANCE);
        console.log('- REC_WORD:', sample.REC_WORD?.substring(0, 50) + '...');
      }
      
      return processed;
    } catch (error) {
      throw new Error(`Error processing Step 2: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeStep3 = async (processedData, parsedRules) => {
    if (!processedData.length) {
      throw new Error('No processed data from Step 2. Please complete Step 2 first.');
    }

    if (!parsedRules || (Array.isArray(parsedRules) && parsedRules.length === 0) || 
        (parsedRules.rules && parsedRules.rules.length === 0)) {
      throw new Error('No rule file loaded for Step 3. Please upload a rule file.');
    }

    setIsProcessing(true);

    try {
      console.log('Enhanced Rule Engine: Executing Step 3');
      console.log('Rule format:', parsedRules.format || 'legacy');
      
      // Enhanced rule engine provides advanced Step 3 capabilities
      const processed = await applyRules(processedData, parsedRules, 3);
      
      console.log('Step 3 completed successfully with enhanced rule engine');
      console.log('Processed records:', processed.length);
      
      // Log some sample Step 3 results
      if (processed.length > 0) {
        const sample = processed[0];
        console.log('Sample Step 3 results:');
        console.log('- BILL_DATE:', sample.BILL_DATE);
        console.log('- DUE_DATE:', sample.DUE_DATE);
        console.log('- INTEREST:', sample.INTEREST);
        console.log('- TOTAL:', sample.TOTAL);
        console.log('- GR_TOTAL:', sample.GR_TOTAL);
      }
      
      return processed;
    } catch (error) {
      throw new Error(`Error processing Step 3: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeStep4 = async (processedData, parsedRules = null, onProgress = null) => {
    if (!processedData.length) {
      throw new Error('No processed data from Step 3. Please complete Step 3 first.');
    }

    setIsProcessing(true);

    try {
      console.log('Step 4: Final validation and Excel data preparation');
      
      // Update progress
      if (onProgress) onProgress(20, 1, 5);

      // Step 4 focuses on final data validation and preparation for Excel generation
      // Apply any optional rules if provided (but rules are not required for Step 4)
      let processed = [...processedData];
      
      if (parsedRules && 
          ((Array.isArray(parsedRules) && parsedRules.length > 0) || 
           (parsedRules.rules && parsedRules.rules.length > 0))) {
        console.log('Applying optional Step 4 rules...');
        processed = await applyRules(processedData, parsedRules, 4);
        if (onProgress) onProgress(50, 2, 5);
      } else {
        console.log('No rules provided for Step 4 - proceeding with data validation and finalization');
        if (onProgress) onProgress(40, 2, 5);
      }

      // Data finalization and validation for Excel output
      if (onProgress) onProgress(70, 3, 5);
      
      processed = processed.map(row => {
        const finalizedRow = { ...row };
        
        // Ensure all numeric fields are properly formatted
        const numericFields = ['TOTAL', 'GR_TOTAL', 'ARREARS', 'ADVANCE', 'INTEREST', 'INT_ARREAR', 'REC_AMT', 'OUTST_BAL'];
        numericFields.forEach(field => {
          if (finalizedRow[field] !== undefined && finalizedRow[field] !== null) {
            const numValue = parseFloat(finalizedRow[field]);
            finalizedRow[field] = isNaN(numValue) ? 0 : Math.round(numValue * 100) / 100; // Round to 2 decimal places
          }
        });
        
        // Ensure all date fields are properly formatted
        const dateFields = ['BILL_DATE', 'DUE_DATE', 'REC_DATE'];
        dateFields.forEach(field => {
          if (finalizedRow[field] && finalizedRow[field] !== '') {
            // Validate and standardize date format
            try {
              const date = new Date(finalizedRow[field]);
              if (!isNaN(date.getTime())) {
                finalizedRow[field] = date.toISOString().split('T')[0]; // YYYY-MM-DD format
              }
            } catch (error) {
              console.warn(`Invalid date in field ${field}:`, finalizedRow[field]);
            }
          }
        });
        
        // Clean up null/undefined values
        Object.keys(finalizedRow).forEach(key => {
          if (finalizedRow[key] === null || finalizedRow[key] === undefined) {
            finalizedRow[key] = '';
          }
        });
        
        return finalizedRow;
      });

      if (onProgress) onProgress(90, 4, 5);
      
      console.log('Step 4 completed successfully - Data ready for Excel generation');
      console.log('Final processed records:', processed.length);
      
      // Final data quality validation
      if (processed.length > 0) {
        const sample = processed[0];
        const requiredFields = ['BILL_NO', 'GR_TOTAL', 'NAME', 'FLAT_NO'];
        const hasAllRequiredFields = requiredFields.every(field => 
          sample[field] !== undefined && sample[field] !== null && sample[field] !== ''
        );
        
        console.log('Final data quality check:');
        console.log('- Has required fields:', hasAllRequiredFields);
        console.log('- Sample BILL_NO:', sample.BILL_NO);
        console.log('- Sample GR_TOTAL:', sample.GR_TOTAL);
        console.log('- Sample NAME:', sample.NAME);
        console.log('- Available fields:', Object.keys(sample).length);
        
        if (!hasAllRequiredFields) {
          console.warn('Some required fields are missing - Excel generation may have issues');
        }
      }
      
      if (onProgress) onProgress(100, 5, 5);
      
      return processed;
    } catch (error) {
      throw new Error(`Error processing Step 4: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to get rule format info
  const getRuleInfo = (parsedRules) => {
    if (!parsedRules) return null;
    
    if (parsedRules.format === 'json') {
      return {
        format: 'JSON Enhanced',
        ruleCount: parsedRules.rules?.length || 0,
        hasMetadata: !!parsedRules.metadata,
        hasVariables: !!parsedRules.variables,
        hasCustomFunctions: !!parsedRules.customFunctions,
        stepNumber: parsedRules.metadata?.step,
        name: parsedRules.metadata?.name,
        description: parsedRules.metadata?.description
      };
    } else if (Array.isArray(parsedRules)) {
      return {
        format: 'Text Legacy',
        ruleCount: parsedRules.length,
        hasMetadata: false,
        hasVariables: false,
        hasCustomFunctions: false,
        stepNumber: null,
        name: 'Legacy Rules',
        description: 'Simple UPDATE statements'
      };
    }
    
    return null;
  };

  // Optimized processing for large datasets
  const processDataInChunks = async (data, ruleEngine, onProgress) => {
    const CHUNK_SIZE = 50; // Process 50 rows at a time
    const totalRows = data.length;
    let processedRows = 0;
    const results = [];

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      
      // Process chunk
      const processedChunk = chunk.map(row => {
        try {
          return ruleEngine.processRow(row);
        } catch (error) {
          console.error('Error processing row:', error);
          return row; // Return original row if error
        }
      });

      results.push(...processedChunk);
      processedRows += chunk.length;

      // Update progress
      const progress = Math.round((processedRows / totalRows) * 100);
      if (onProgress) {
        onProgress(progress, processedRows, totalRows);
      }

      // Allow UI to update between chunks
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return results;
  };

  // Validate rule compatibility with step
  const validateRuleForStep = (parsedRules, stepNumber) => {
    const warnings = [];
    const errors = [];
    
    if (!parsedRules) {
      errors.push('No rules provided');
      return { isValid: false, errors, warnings };
    }
    
    // Check if JSON rules specify a different step
    if (parsedRules.format === 'json' && parsedRules.metadata?.step) {
      if (parsedRules.metadata.step !== stepNumber) {
        warnings.push(
          `Rule file is designed for Step ${parsedRules.metadata.step} but being used for Step ${stepNumber}`
        );
      }
    }
    
    // Step-specific validations
    if (stepNumber === 2) {
      const ruleInfo = getRuleInfo(parsedRules);
      if (ruleInfo.format === 'JSON Enhanced') {
        console.log('✅ Using enhanced JSON rules for Step 2 - automatic REC_AMT processing enabled');
      } else {
        warnings.push('Consider using JSON rules for Step 2 to get automatic REC_WORD generation and better financial logic');
      }
    }
    
    if (stepNumber === 4) {
      console.log('✅ Step 4 - Data will be prepared for Excel template generation');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      ruleInfo: getRuleInfo(parsedRules)
    };
  };

  return {
    isProcessing,
    processRules,
    executeStep1,
    executeStep2,
    executeStep3,
    executeStep4,
    getRuleInfo,
    validateRuleForStep
  };
};