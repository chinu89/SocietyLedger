// src/services/enhancedRuleEngine.js - FIXED: Sequential conditional rule execution
import { MONTH_MAPPING } from '../utils/constants';
import { numberToWords } from '../utils/numberToWords';

export class EnhancedRuleEngine {
  constructor(rules = [], variables = {}) {
    this.rules = rules;
    this.customFunctions = new Map();
    this.variables = new Map();
    this.builtInFunctions = this.initializeBuiltInFunctions();
    this.businessFunctions = this.initializeBusinessFunctions();
    this.dateFormats = {
      short: 'DD/MM/YYYY',
      long: 'DD MMM YYYY',
      iso: 'YYYY-MM-DD'
    };
    
    if (variables && Object.keys(variables).length > 0) {
      this.loadVariables(variables);
    }
  }

  // FIXED: Enhanced executeRule method with proper sequential execution
  async executeRule(data, rule, context) {
    console.log(`🔧 Executing rule: ${rule.id} (${rule.type})`);
    
    switch (rule.type) {
      case 'batch_update':
        return this.executeBatchUpdate(data, rule, context);
      case 'conditional_logic':
        return this.executeConditionalLogicFixed(data, rule, context);
      case 'financial_calculation':
        return this.executeFinancialCalculation(data, rule, context);
      case 'date_operation':
        return this.executeDateOperation(data, rule, context);
      case 'validation':
        return this.executeValidation(data, rule, context);
      default:
        if (rule.operations) {
          return this.executeBatchUpdate(data, rule, context);
        }
        throw new Error(`Unknown rule type: ${rule.type}`);
    }
  }

  // FIXED: New conditional logic execution that ensures proper evaluation
  executeConditionalLogicFixed(data, rule, context) {
    console.log(`🔍 Processing conditional rule: ${rule.id}`);
    
    return data.map((row, rowIndex) => {
      const updatedRow = { ...row };
      
      // Process each condition in the rule
      for (const condition of rule.conditions) {
        let conditionMet = false;
        
        // Evaluate the condition
        if (condition.if && condition.if.expression) {
          conditionMet = this.evaluateExpressionSafely(condition.if.expression, updatedRow, context);
          console.log(`   Row ${rowIndex + 1}: Condition "${condition.if.expression}" = ${conditionMet}`);
          
          if (conditionMet && condition.then) {
            // Apply all actions in the 'then' clause
            condition.then.forEach(action => {
              const oldValue = updatedRow[action.field];
              const newValue = this.evaluateValue(action.value, updatedRow, context);
              updatedRow[action.field] = newValue;
              console.log(`   Row ${rowIndex + 1}: ${action.field}: ${oldValue} → ${newValue}`);
            });
            
            // For single-condition rules, break after applying the action
            break;
          }
        } else if (condition.elseif && condition.elseif.expression) {
          conditionMet = this.evaluateExpressionSafely(condition.elseif.expression, updatedRow, context);
          if (conditionMet && condition.then) {
            condition.then.forEach(action => {
              const newValue = this.evaluateValue(action.value, updatedRow, context);
              updatedRow[action.field] = newValue;
            });
            break;
          }
        } else if (condition.else) {
          // Apply else actions
          condition.else.forEach(action => {
            const newValue = this.evaluateValue(action.value, updatedRow, context);
            updatedRow[action.field] = newValue;
          });
          break;
        }
      }
      
      return updatedRow;
    });
  }

  // FIXED: Safe expression evaluation with better error handling
  evaluateExpressionSafely(expression, row, context = {}) {
    try {
      const result = this.evaluateExpression(expression, row, context);
      
      // Convert result to boolean for condition evaluation
      if (typeof result === 'boolean') {
        return result;
      }
      
      // Convert numeric results to boolean (0 = false, non-zero = true)
      if (typeof result === 'number') {
        return result !== 0;
      }
      
      // Convert string results to boolean
      if (typeof result === 'string') {
        return result !== '' && result !== '0' && result.toLowerCase() !== 'false';
      }
      
      return !!result; // Convert anything else to boolean
      
    } catch (error) {
      console.error(`❌ Error evaluating expression "${expression}":`, error.message);
      console.error('Row data:', Object.keys(row));
      return false; // Return false on error to avoid breaking the flow
    }
  }

  // FIXED: Enhanced executeRules method with better rule sequencing
  async executeRules(data, ruleSet, stepNumber = 1) {
    try {
      console.log(`🚀 Enhanced Rule Engine: Executing Step ${stepNumber} with ${ruleSet.rules.length} rules`);
      
      const context = this.createExecutionContext(data, stepNumber);
      
      if (ruleSet.variables) {
        this.loadVariables(ruleSet.variables);
      }

      let processedData = [...data];
      
      // Apply preprocessing for the step
      processedData = await this.preprocessForStep(processedData, stepNumber);
      console.log(`✅ Preprocessing completed for Step ${stepNumber}`);

      // Execute rules sequentially (very important for Step 2)
      for (let i = 0; i < ruleSet.rules.length; i++) {
        const rule = ruleSet.rules[i];
        
        if (rule.enabled === false) {
          console.log(`⏭️  Skipping disabled rule: ${rule.id}`);
          continue;
        }
        
        console.log(`🔧 [${i + 1}/${ruleSet.rules.length}] Executing: ${rule.id}`);
        
        const beforeCount = processedData.length;
        processedData = await this.executeRule(processedData, rule, context);
        
        if (processedData.length !== beforeCount) {
          console.warn(`⚠️  Row count changed after rule ${rule.id}: ${beforeCount} → ${processedData.length}`);
        }
        
        // For Step 2, log some key values after each rule for debugging
        if (stepNumber === 2 && i < 3 && processedData.length > 0) {
          const sample = processedData[0];
          console.log(`   Sample values: ARREARS=${sample.ARREARS}, ADVANCE=${sample.ADVANCE}, REC_AMT=${sample.REC_AMT}`);
        }
      }

      // Apply postprocessing for the step
      processedData = await this.postprocessForStep(processedData, stepNumber);
      console.log(`✅ Postprocessing completed for Step ${stepNumber}`);

      // Final validation
      if (stepNumber === 2) {
        this.validateStep2Results(processedData);
      }

      return processedData;
    } catch (error) {
      console.error(`❌ Rule execution failed for Step ${stepNumber}:`, error);
      throw new Error(`Rule execution failed: ${error.message}`);
    }
  }

  // NEW: Validate Step 2 results to catch issues
  validateStep2Results(data) {
    console.log(`🔍 Validating Step 2 results for ${data.length} rows...`);
    
    let issuesFound = 0;
    data.forEach((row, index) => {
      const arrears = parseFloat(row.ARREARS) || 0;
      const advance = parseFloat(row.ADVANCE) || 0;
      
      // Check for negative arrears (should not happen after Step 2)
      if (arrears < 0) {
        console.error(`❌ Row ${index + 1}: ARREARS is negative (${arrears}) - this should be fixed by rules`);
        issuesFound++;
      }
      
      // Check if both arrears and advance are positive (shouldn't happen)
      if (arrears > 0 && advance > 0) {
        console.warn(`⚠️  Row ${index + 1}: Both ARREARS (${arrears}) and ADVANCE (${advance}) are positive`);
      }
    });
    
    if (issuesFound > 0) {
      console.error(`❌ Step 2 validation failed: ${issuesFound} issues found`);
    } else {
      console.log(`✅ Step 2 validation passed: All arrears values are non-negative`);
    }
  }

  // FIXED: Enhanced expression evaluation with better debugging
  evaluateExpression(expression, row, context = {}) {
    try {
      // Handle null/undefined expressions
      if (!expression && expression !== 0) {
        return '';
      }

      // Convert to string for processing
      let processedExpression = String(expression);

      // Handle variable substitution first
      if (processedExpression.includes('${')) {
        processedExpression = this.replaceVariables(processedExpression);
      }
      
      // Simple column reference
      if (/^[A-Z_][A-Z0-9_]*$/.test(processedExpression.trim()) && row.hasOwnProperty(processedExpression.trim())) {
        const columnValue = row[processedExpression.trim()];
        return this.getNumericValue(columnValue);
      }
      
      // Handle function calls
      if (processedExpression.includes('WORDS(')) {
        const wordsMatch = processedExpression.match(/WORDS\(([A-Z_]+)\)/);
        if (wordsMatch) {
          const columnName = wordsMatch[1];
          const columnValue = parseFloat(row[columnName]) || 0;
          return this.convertToWords(columnValue);
        }
      }
      
      if (processedExpression.includes('INT(')) {
        const intMatch = processedExpression.match(/INT\(([^)]+)\)/);
        if (intMatch) {
          const innerExpression = intMatch[1];
          const evaluatedInner = this.evaluateExpression(innerExpression, row, context);
          return Math.round(parseFloat(evaluatedInner) + 0.5);
        }
      }
      
      // Handle negative column references like -(COLUMN)
      processedExpression = processedExpression.replace(/-\(([A-Z_]+)\)/g, (match, columnName) => {
        const value = this.getNumericValue(row[columnName]);
        return `(-1*${value})`;
      });
      
      // Get all column names and sort by length (longest first)
      const allColumnNames = Object.keys(row).filter(key => 
        /^[A-Z_][A-Z0-9_]*$/.test(key) && key !== '_rowIndex'
      ).sort((a, b) => b.length - a.length);
      
      // Replace column names with their numeric values
      for (const columnName of allColumnNames) {
        if (processedExpression.includes(columnName)) {
          const value = this.getNumericValue(row[columnName]);
          const regex = new RegExp(`\\b${columnName}\\b`, 'g');
          processedExpression = processedExpression.replace(regex, value.toString());
        }
      }
      
      processedExpression = processedExpression.trim();
      
      // Return empty for empty expressions
      if (!processedExpression || processedExpression === '') {
        return 0;
      }
      
      // Return simple numeric values immediately
      if (/^-?\d*\.?\d+$/.test(processedExpression)) {
        return parseFloat(processedExpression);
      }
      
      // Return non-mathematical expressions as-is
      if (!/[\+\-\*\/\(\)\<\>\=\!]/.test(processedExpression)) {
        return processedExpression;
      }
      
      // FIXED: Handle comparison operations with better logic
      if (processedExpression.includes('<=') || processedExpression.includes('>=') || 
          processedExpression.includes('==') || processedExpression.includes('!=') ||
          processedExpression.includes('<') || processedExpression.includes('>')) {
        
        return this.evaluateComparison(processedExpression);
      }
      
      // Evaluate mathematical expressions
      try {
        if (/^[\d\s+\-*/().]+$/.test(processedExpression)) {
          const result = Function('"use strict"; return (' + processedExpression + ')')();
          
          if (isNaN(result) || !isFinite(result)) {
            console.warn('Expression evaluation resulted in NaN or Infinity:', processedExpression);
            return 0;
          }
          
          return result;
        } else {
          return processedExpression;
        }
      } catch (mathError) {
        console.warn('Math evaluation failed for:', processedExpression, mathError);
        return processedExpression;
      }
      
    } catch (error) {
      console.error('❌ Error evaluating expression:', expression, 'Error:', error.message);
      return expression; // Return original expression on error
    }
  }

  // NEW: Better comparison evaluation
  evaluateComparison(expression) {
    try {
      let result;
      
      if (expression.includes('<=')) {
        const [left, right] = expression.split('<=');
        result = parseFloat(left.trim()) <= parseFloat(right.trim());
      } else if (expression.includes('>=')) {
        const [left, right] = expression.split('>=');
        result = parseFloat(left.trim()) >= parseFloat(right.trim());
      } else if (expression.includes('==')) {
        const [left, right] = expression.split('==');
        result = parseFloat(left.trim()) === parseFloat(right.trim());
      } else if (expression.includes('!=')) {
        const [left, right] = expression.split('!=');
        result = parseFloat(left.trim()) !== parseFloat(right.trim());
      } else if (expression.includes('<')) {
        const [left, right] = expression.split('<');
        result = parseFloat(left.trim()) < parseFloat(right.trim());
      } else if (expression.includes('>')) {
        const [left, right] = expression.split('>');
        result = parseFloat(left.trim()) > parseFloat(right.trim());
      }
      
      console.log(`🔍 Comparison: ${expression} = ${result}`);
      return result;
      
    } catch (error) {
      console.error('❌ Error in comparison evaluation:', expression, error);
      return false;
    }
  }

  // Keep all other existing methods unchanged...
  parseRuleFile(ruleContent) {
    try {
      if (ruleContent.trim().startsWith('{')) {
        return this.parseJSONRules(ruleContent);
      } else {
        throw new Error('Only JSON rule format is supported. Please convert your text rules to JSON format using the Rule Converter.');
      }
    } catch (error) {
      throw new Error(`Failed to parse rule file: ${error.message}`);
    }
  }

  parseJSONRules(jsonContent) {
    const ruleSet = JSON.parse(jsonContent);
    this.validateRuleSet(ruleSet);
    
    if (ruleSet.variables) {
      this.loadVariables(ruleSet.variables);
    }
    
    return {
      format: 'json',
      metadata: ruleSet.metadata || {},
      rules: ruleSet.rules || [],
      customFunctions: ruleSet.custom_functions || {},
      variables: ruleSet.variables || {}
    };
  }

  executeBatchUpdate(data, rule, context) {
    const operations = rule.operations || [rule];
    
    return data.map(row => {
      const updatedRow = { ...row };
      
      operations.forEach(operation => {
        if (this.checkCondition(updatedRow, operation.condition, context)) {
          const newValue = this.evaluateValue(operation.value, updatedRow, context);
          updatedRow[operation.field] = newValue;
        }
      });
      
      return updatedRow;
    });
  }

  // Keep all other existing methods from the original file...
  initializeBuiltInFunctions() {
    return {
      ROUND: (value, decimals = 0) => Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals),
      INT: (value) => Math.round(parseFloat(value) + 0.5),
      ABS: (value) => Math.abs(value),
      MAX: (...values) => Math.max(...values),
      MIN: (...values) => Math.min(...values),
      SUM: (values) => Array.isArray(values) ? values.reduce((a, b) => a + b, 0) : values,
      AVG: (values) => Array.isArray(values) ? values.reduce((a, b) => a + b, 0) / values.length : values,
      IF: (condition, trueValue, falseValue) => condition ? trueValue : falseValue,
      WORDS: (amount) => numberToWords(amount),
      TODAY: () => new Date().toISOString().split('T')[0],
      TRIM: (str) => String(str).trim(),
      UPPER: (str) => String(str).toUpperCase(),
      LOWER: (str) => String(str).toLowerCase()
    };
  }

  initializeBusinessFunctions() {
    return {
      INCREMENT_MONTH: (month, increment = 3) => this.incrementMonth(month, new Date().getFullYear(), increment),
      IS_FINANCIAL_YEAR_CHANGE: (oldMonth, newMonth) => this.isFinancialYearChange(oldMonth, newMonth),
      CALCULATE_INTEREST: (principal, rate = 0.21, period = 4) => Math.round(principal * rate / period),
      CALCULATE_DUE_DATE: (billDate, days = 30) => this.addDaysToDate(billDate, days),
      GENERATE_BILL_NUMBER: (currentNumber, isNewYear = false) => isNewYear ? 1 : currentNumber + 1,
      FORMAT_DATE: (date, format = 'short') => this.formatDate(date, format),
      GENERATE_RECEIPT_NUMBER: (index, date) => this.generateReceiptNumber(index, date)
    };
  }

  async preprocessForStep(data, stepNumber) {
    switch (stepNumber) {
      case 1:
        return this.preprocessStep1(data);
      case 2:
        return this.preprocessStep2(data);
      case 3:
        return this.preprocessStep3(data);
      case 4:
        return this.preprocessStep4(data);
      default:
        return data;
    }
  }

  async postprocessForStep(data, stepNumber) {
    switch (stepNumber) {
      case 2:
        return this.postprocessStep2(data);
      case 3:
        return this.postprocessStep3(data);
      case 4:
        return this.postprocessStep4(data);
      default:
        return data;
    }
  }

  preprocessStep1(data) {
    const lastBillNumber = this.getLastBillNumber(data);
    let currentBillNumber = lastBillNumber;
    let isNewFinancialYear = false;

    return data.map((row, index) => {
      const updatedRow = { ...row };
      const currentYear = parseInt(row.YEAR) || new Date().getFullYear();
      let newYear = currentYear;
      const originalMonthFrom = row.MONTH_FROM;

      updatedRow.PREV_BL_NO = row.BILL_NO;

      if (row.MONTH_FROM) {
        const incrementResult = this.incrementMonth(row.MONTH_FROM, currentYear);
        
        if (index === 0 && this.isFinancialYearChange(originalMonthFrom, incrementResult.month)) {
          isNewFinancialYear = true;
        }
        
        updatedRow.MONTH_FROM = incrementResult.month;
        if (incrementResult.year !== currentYear) {
          newYear = incrementResult.year;
        }
      }

      if (row.MONTH_TO) {
        const incrementResult = this.incrementMonth(row.MONTH_TO, currentYear);
        updatedRow.MONTH_TO = incrementResult.month;
        if (incrementResult.year !== currentYear) {
          newYear = incrementResult.year;
        }
      }

      if (newYear !== currentYear) {
        updatedRow.YEAR = newYear.toString();
      }

      if (isNewFinancialYear) {
        updatedRow.BILL_NO = (index + 1).toString();
      } else {
        currentBillNumber = currentBillNumber + 1;
        updatedRow.BILL_NO = currentBillNumber.toString();
      }

      return updatedRow;
    });
  }

  preprocessStep2(data) {
    console.log(`🔧 Step 2 Preprocessing: Calculating REC_AMT for ${data.length} rows`);
    
    return data.map((row, index) => {
      const updatedRow = { ...row };
      
      const recAmt1 = Math.max(parseFloat(updatedRow.REC_AMT1) || 0, 0);
      const recAmt2 = Math.max(parseFloat(updatedRow.REC_AMT2) || 0, 0);
      const recAmt3 = Math.max(parseFloat(updatedRow.REC_AMT3) || 0, 0);
      
      updatedRow.REC_AMT1 = recAmt1;
      updatedRow.REC_AMT2 = recAmt2;
      updatedRow.REC_AMT3 = recAmt3;
      updatedRow.REC_AMT = recAmt1 + recAmt2 + recAmt3;
      
      if (index < 3) { // Log first few rows for debugging
        console.log(`   Row ${index + 1}: REC_AMT = ${recAmt1} + ${recAmt2} + ${recAmt3} = ${updatedRow.REC_AMT}`);
      }
      
      return updatedRow;
    });
  }

  postprocessStep2(data) {
    console.log(`🔧 Step 2 Postprocessing: Generating receipt words for ${data.length} rows`);
    
    return data.map((row, index) => {
      const updatedRow = { ...row };
      
      if (parseFloat(updatedRow.REC_AMT) > 0) {
        updatedRow.REC_WORD = numberToWords(parseFloat(updatedRow.REC_AMT));
      } else {
        updatedRow.REC_WORD = '';
      }
      
      if (parseFloat(updatedRow.REC_AMT) <= 0) {
        updatedRow.BANK1 = '';
        updatedRow.BANK2 = '';
        updatedRow.BANK3 = '';
        updatedRow.REC_NO = '';
      }
      
      return updatedRow;
    });
  }

  preprocessStep3(data) {
    return data.map(row => {
      const updatedRow = { ...row };
      
      if (!updatedRow.BILL_DATE) updatedRow.BILL_DATE = '';
      if (!updatedRow.REC_DATE) updatedRow.REC_DATE = '';
      if (!updatedRow.DUE_DATE) updatedRow.DUE_DATE = '';
      if (!updatedRow.REC_NO) updatedRow.REC_NO = '';
      
      return updatedRow;
    });
  }

  postprocessStep3(data) {
    return data.map((row, index) => {
      const updatedRow = { ...row };
      const today = new Date();
      
      updatedRow.BILL_DATE = this.formatDate(today, 'short');
      
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);
      updatedRow.DUE_DATE = this.formatDate(dueDate, 'short');
      
      if (parseFloat(updatedRow.REC_AMT) > 0) {
        updatedRow.REC_DATE = this.formatDate(today, 'short');
        if (!updatedRow.REC_NO) {
          updatedRow.REC_NO = this.generateReceiptNumber(index + 1, today);
        }
      }
      
      return updatedRow;
    });
  }

  preprocessStep4(data) {
    return data.map(row => {
      const updatedRow = { ...row };
      
      const numericFields = ['TOTAL', 'GR_TOTAL', 'ARREARS', 'ADVANCE', 'INTEREST', 'INT_ARREAR', 'REC_AMT'];
      numericFields.forEach(field => {
        if (updatedRow[field] !== undefined) {
          updatedRow[field] = Math.round(parseFloat(updatedRow[field]) || 0);
        }
      });
      
      return updatedRow;
    });
  }

  postprocessStep4(data) {
    return data.map(row => {
      const updatedRow = { ...row };
      
      Object.keys(updatedRow).forEach(key => {
        if (updatedRow[key] === null || updatedRow[key] === undefined) {
          updatedRow[key] = '';
        }
      });
      
      if (parseFloat(updatedRow.REC_AMT) > 0 && !updatedRow.REC_WORD) {
        updatedRow.REC_WORD = numberToWords(parseFloat(updatedRow.REC_AMT));
      }
      
      return updatedRow;
    });
  }

  getLastBillNumber(data) {
    return Math.max(...data.map(row => parseInt(row.BILL_NO) || 0));
  }

  incrementMonth(month, currentYear, increment = 3) {
    const monthUpper = month.toUpperCase();
    
    if (typeof MONTH_MAPPING !== 'undefined' && MONTH_MAPPING[monthUpper]) {
      const monthInfo = MONTH_MAPPING[monthUpper];
      return {
        month: monthInfo.next3,
        year: monthInfo.yearIncrement ? currentYear + 1 : currentYear
      };
    } else {
      const monthMap = {
        'JAN': { next3: 'APR', yearIncrement: false },
        'FEB': { next3: 'MAY', yearIncrement: false },
        'MAR': { next3: 'JUN', yearIncrement: false },
        'APR': { next3: 'JUL', yearIncrement: false },
        'MAY': { next3: 'AUG', yearIncrement: false },
        'JUN': { next3: 'SEP', yearIncrement: false },
        'JUL': { next3: 'OCT', yearIncrement: false },
        'AUG': { next3: 'NOV', yearIncrement: false },
        'SEP': { next3: 'DEC', yearIncrement: false },
        'OCT': { next3: 'JAN', yearIncrement: true },
        'NOV': { next3: 'FEB', yearIncrement: true },
        'DEC': { next3: 'MAR', yearIncrement: true }
      };
      
      const monthInfo = monthMap[monthUpper];
      if (monthInfo) {
        return {
          month: monthInfo.next3,
          year: monthInfo.yearIncrement ? currentYear + 1 : currentYear
        };
      }
    }
    
    console.warn(`Month ${monthUpper} not found in mapping, returning original`);
    return { month, year: currentYear };
  }

  isFinancialYearChange(originalMonth, newMonth) {
    return newMonth === 'APR';
  }

  addDaysToDate(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  formatDate(date, format = 'short') {
    const d = new Date(date);
    
    switch (format) {
      case 'short':
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      case 'long':
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
      case 'iso':
        return d.toISOString().split('T')[0];
      default:
        return d.toLocaleDateString();
    }
  }

  generateReceiptNumber(index, date) {
    const d = new Date(date);
    const year = d.getFullYear().toString().slice(-2);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `REC${year}${month}${index.toString().padStart(3, '0')}`;
  }

  convertToWords(amount) {
    if (amount === 0) return "RUPEES ZERO ONLY";
    
    const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
    const teens = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
    const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
    
    function convertBelowThousand(num) {
      let result = "";
      
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + " HUNDRED ";
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)];
        if (num % 10 !== 0) {
          result += " " + ones[num % 10];
        }
      } else if (num >= 10) {
        result += teens[num - 10];
      } else if (num > 0) {
        result += ones[num];
      }
      
      return result.trim();
    }
    
    amount = Math.round(amount);
    let result = "";
    
    if (amount >= 10000000) {
      const crores = Math.floor(amount / 10000000);
      result += convertBelowThousand(crores) + " CRORE ";
      amount %= 10000000;
    }
    
    if (amount >= 100000) {
      const lakhs = Math.floor(amount / 100000);
      result += convertBelowThousand(lakhs) + " LAKH ";
      amount %= 100000;
    }
    
    if (amount >= 1000) {
      const thousands = Math.floor(amount / 1000);
      result += convertBelowThousand(thousands) + " THOUSAND ";
      amount %= 1000;
    }
    
    if (amount > 0) {
      result += convertBelowThousand(amount);
    }
    
    return "RUPEES " + result.trim() + " ONLY";
  }

  evaluateValue(value, row, context) {
    if (typeof value === 'string' && value.includes('${')) {
      value = this.replaceVariables(value);
    }
    
    if (typeof value === 'string' && (
      /[A-Z_]+/.test(value) ||
      /[+\-*/()]/.test(value) ||
      value.includes('WORDS(') ||
      value.includes('INT(')
    )) {
      return this.evaluateExpression(value, row, context);
    }
    
    return value;
  }

  replaceVariables(expression) {
    try {
      return expression.replace(/\$\{(\w+)\}/g, (match, varName) => {
        const variableValue = this.variables.get(varName);
        if (variableValue !== undefined) {
          return variableValue;
        } else {
          console.warn(`Variable ${varName} not found, using 0`);
          return '0';
        }
      });
    } catch (error) {
      console.warn('Error replacing variables in expression:', expression, error);
      return expression;
    }
  }

  loadVariables(variables) {
    Object.entries(variables).forEach(([key, value]) => {
      this.variables.set(key, value);
    });
  }

  createExecutionContext(data, stepNumber) {
    return {
      stepNumber,
      totalRows: data.length,
      currentDate: new Date().toISOString().split('T')[0],
      variables: this.variables,
      functions: { ...this.builtInFunctions, ...this.businessFunctions },
      validationErrors: []
    };
  }

  validateRuleSet(ruleSet) {
    if (!ruleSet.rules || !Array.isArray(ruleSet.rules)) {
      throw new Error('Rule set must contain a "rules" array');
    }
  }

  checkCondition(row, condition, context = {}) {
    if (!condition) return true;
    
    if (condition.originalCondition && (condition.originalCondition.includes(' AND ') || condition.originalCondition.includes(' OR '))) {
      return this.evaluateComplexCondition(condition.originalCondition, row, context);
    }
    
    let fieldValue = row[condition.field];
    let conditionValue = condition.value;
    
    if (/[A-Z_]+/.test(conditionValue)) {
      const columnNames = conditionValue.match(/[A-Z_]+/g) || [];
      for (const columnName of columnNames) {
        if (row.hasOwnProperty(columnName)) {
          const value = parseFloat(row[columnName]) || 0;
          const regex = new RegExp(`\\b${columnName}\\b`, 'g');
          conditionValue = conditionValue.replace(regex, value.toString());
        }
      }
    }
    
    const numFieldValue = parseFloat(fieldValue) || 0;
    const numConditionValue = parseFloat(conditionValue) || 0;
    
    const isNumeric = !isNaN(numFieldValue) && !isNaN(numConditionValue);
    
    switch (condition.operator) {
      case '=':
        return isNumeric ? numFieldValue === numConditionValue : fieldValue === conditionValue;
      case '!=':
        return isNumeric ? numFieldValue !== numConditionValue : fieldValue !== conditionValue;
      case '<':
        return isNumeric ? numFieldValue < numConditionValue : fieldValue < conditionValue;
      case '>':
        return isNumeric ? numFieldValue > numConditionValue : fieldValue > conditionValue;
      case '<=':
        return isNumeric ? numFieldValue <= numConditionValue : fieldValue <= conditionValue;
      case '>=':
        return isNumeric ? numFieldValue >= numConditionValue : fieldValue >= conditionValue;
      default:
        return false;
    }
  }

  getNumericValue(value) {
    if (value === null || value === undefined || value === '' || value === ' ' || value === 'NULL') {
      return 0;
    }
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' || trimmed === 'NULL' || trimmed === 'null') {
        return 0;
      }
      const parsed = parseFloat(trimmed);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
}

export const enhancedRuleEngine = new EnhancedRuleEngine();

export const parseRuleFile = (ruleContent) => {
  try {
    if (ruleContent.trim().startsWith('{')) {
      const engine = new EnhancedRuleEngine();
      return engine.parseJSONRules(ruleContent);
    } else {
      throw new Error('Only JSON rule format is supported. Please use the Rule Converter to convert text rules to JSON format.');
    }
  } catch (error) {
    throw new Error(`Failed to parse rule file: ${error.message}`);
  }
};

export const applyRules = async (data, rules, stepNumber = 1) => {
  try {
    console.log(`🚀 Enhanced Rule Engine: Executing Step ${stepNumber}`);
    console.log('Rule format:', rules.format || 'legacy');

    if (!data || data.length === 0) {
      throw new Error('No data provided for processing');
    }

    let ruleEngine;
    
    if (rules.format === 'json') {
      ruleEngine = new EnhancedRuleEngine(rules.rules, rules.variables);
      console.log(`✅ Loaded ${rules.rules.length} JSON rules for step ${stepNumber}`);
      
      // Use the full executeRules pipeline for proper preprocessing
      console.log(`🔧 Using full executeRules pipeline for Step ${stepNumber}`);
      const processedData = await ruleEngine.executeRules(data, rules, stepNumber);
      
      console.log(`✅ Step ${stepNumber} completed successfully with enhanced rule engine`);
      console.log('Processed records:', processedData.length);
      
      return processedData;
    } else if (Array.isArray(rules)) {
      ruleEngine = new EnhancedRuleEngine(rules);
      console.log(`✅ Loaded ${rules.length} legacy rules for step ${stepNumber}`);
    } else {
      ruleEngine = new EnhancedRuleEngine(rules.rules || []);
      console.log(`✅ Loaded ${(rules.rules || []).length} converted legacy rules for step ${stepNumber}`);
    }

    // For legacy rules, use the original row-by-row processing
    console.log(`🔧 Using legacy row-by-row processing for Step ${stepNumber}`);
    
    let processedData = [...data];
    
    if (stepNumber === 1) {
      console.log('Applying Step 1 preprocessing (month increment)...');
      processedData = await ruleEngine.preprocessForStep(processedData, stepNumber);
    }
    
    if (stepNumber === 2) {
      console.log('Step 2: Calculating REC_AMT = REC_AMT1 + REC_AMT2 + REC_AMT3');
      processedData.forEach(row => {
        const amt1 = parseFloat(row.REC_AMT1) || 0;
        const amt2 = parseFloat(row.REC_AMT2) || 0;
        const amt3 = parseFloat(row.REC_AMT3) || 0;
        row.REC_AMT = amt1 + amt2 + amt3;
        
        if (row.REC_AMT < 0) {
          row.REC_AMT = 0;
        }
      });
    }

    // Apply rules row by row
    processedData = processedData.map(row => {
      try {
        return ruleEngine.processRow(row);
      } catch (error) {
        console.error('Error processing row:', error);
        return row;
      }
    });

    // Add postprocessing for all steps
    processedData = await ruleEngine.postprocessForStep(processedData, stepNumber);

    console.log(`✅ Step ${stepNumber} completed successfully with enhanced rule engine`);
    console.log('Processed records:', processedData.length);

    return processedData;

  } catch (error) {
    console.error(`❌ Error in step ${stepNumber}:`, error);
    throw error;
  }
};

export default EnhancedRuleEngine;