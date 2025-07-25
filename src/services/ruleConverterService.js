// src/services/ruleConverterService.js - Fixed Implementation
export class RuleConverterService {
  constructor() {
    this.stepTemplates = this.initializeStepTemplates();
  }

  /**
   * Main conversion function - maintains rule order and proper grouping
   */
  convertTextToJson(textRules, stepNumber = 1, options = {}) {
    try {
      console.log(`Converting rules for Step ${stepNumber}`);
      
      const lines = this.preprocessTextRules(textRules);
      console.log(`Preprocessed ${lines.length} lines`);
      
      const parsedRules = this.parseTextRulesInOrder(lines);
      console.log(`Parsed ${parsedRules.length} rules`);
      
      const jsonStructure = this.buildJsonStructureFromOrderedRules(parsedRules, stepNumber, options);
      
      return {
        success: true,
        result: jsonStructure,
        statistics: this.generateStatistics(jsonStructure, parsedRules)
      };
    } catch (error) {
      console.error('Conversion error:', error);
      return {
        success: false,
        error: error.message,
        details: error.stack
      };
    }
  }

  /**
   * Preprocess text rules - clean and filter lines
   */
  preprocessTextRules(textRules) {
    if (!textRules || typeof textRules !== 'string') {
      throw new Error('Invalid input: textRules must be a non-empty string');
    }

    return textRules
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
      .map((line, index) => ({ text: line, lineNumber: index + 1 }));
  }

  /**
   * Parse rules in order - maintain sequence for proper grouping
   */
  parseTextRulesInOrder(lines) {
    const parsedRules = [];
    
    for (const line of lines) {
      try {
        const rule = this.parseTextRule(line.text, line.lineNumber);
        if (rule) {
          parsedRules.push(rule);
        }
      } catch (error) {
        console.warn(`Warning: Failed to parse line ${line.lineNumber}: ${line.text}`, error);
        // Continue parsing other lines
      }
    }
    
    return parsedRules;
  }

  /**
   * Parse a single text rule line with proper operator handling
   */
  parseTextRule(ruleText, lineNumber) {
    // Enhanced regex patterns to handle various UPDATE formats
    const patterns = [
      /^UPDATE\s+ALL\s+(\w+)\s+WITH\s+(.+?)\s+FOR\s+(.+)$/i,  // UPDATE ALL FIELD WITH value FOR condition
      /^UPDATE\s+(\w+)\s+WITH\s+(.+?)\s+FOR\s+(.+)$/i,        // UPDATE FIELD WITH value FOR condition
      /^UPDATE\s+ALL\s+(\w+)\s+WITH\s+(.+)$/i,                // UPDATE ALL FIELD WITH value
      /^UPDATE\s+(\w+)\s+WITH\s+(.+)$/i                       // UPDATE FIELD WITH value
    ];

    for (const pattern of patterns) {
      const match = ruleText.match(pattern);
      if (match) {
        const hasCondition = match.length === 4;
        const cleanedValue = this.cleanValue(match[2].trim());
        
        return {
          field: match[1].trim(),
          value: cleanedValue,
          condition: hasCondition ? this.normalizeCondition(match[3].trim()) : null,
          lineNumber,
          originalLine: ruleText,
          type: this.determineRuleType(cleanedValue, hasCondition),
          hasCondition
        };
      }
    }

    throw new Error(`Unrecognized UPDATE pattern: ${ruleText}`);
  }

  /**
   * Clean and normalize rule values
   */
  cleanValue(value) {
    if (!value) return '';
    
    value = value.trim();
    
    // Remove surrounding quotes but preserve the content
    if ((value.startsWith("'") && value.endsWith("'")) || 
        (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    
    // Handle special empty values - these should become empty string
    if (value === "' '" || value === '" "' || value === ' ') {
      return '';
    }
    
    // Handle pure numeric values (not expressions)
    if (!isNaN(value) && !value.includes('+') && !value.includes('-') && 
        !value.includes('*') && !value.includes('/') && !value.includes('(') &&
        !value.includes('_') && !/[A-Z]/.test(value)) {
      return parseFloat(value);
    }
    
    return value;
  }

  /**
   * Normalize condition operators properly
   */
  normalizeCondition(condition) {
    if (!condition) return null;
    
    return condition
      .trim()
      .replace(/=</g, '<=')      // Fix =< to <=
      .replace(/=>/g, '>=')      // Fix => to >=
      .replace(/=([0-9A-Z_])/g, '==$1')  // Fix = to == for comparisons (but not in expressions)
      .replace(/\s+/g, ' ');     // Normalize whitespace
  }

  /**
   * Determine rule type more accurately
   */
  determineRuleType(value, hasCondition) {
    if (hasCondition) {
      return 'conditional';
    }
    
    if (this.isExpression(value)) {
      return 'calculation';
    }
    
    if (this.isFunctionCall(value)) {
      return 'function';
    }
    
    if (value === '' || value === 0) {
      return 'clearing';
    }
    
    return 'assignment';
  }

  /**
   * Check if value is a mathematical expression
   */
  isExpression(value) {
    return typeof value === 'string' && 
           /[+\-*/()]/.test(value) && 
           /[A-Z_]/.test(value);
  }

  /**
   * Check if value is a function call
   */
  isFunctionCall(value) {
    return typeof value === 'string' && 
           (/WORDS\(/i.test(value) || /INT\(/i.test(value) || /ROUND\(/i.test(value));
  }

  /**
   * Build JSON structure maintaining rule order and proper grouping
   */
  buildJsonStructureFromOrderedRules(parsedRules, stepNumber, options) {
    const template = this.stepTemplates[stepNumber] || this.stepTemplates.default;
    
    const jsonStructure = {
      metadata: {
        name: options.name || template.name,
        version: "1.0",
        description: options.description || template.description,
        author: options.author || "Rule Converter",
        created: new Date().toISOString().split('T')[0],
        step: stepNumber,
        converted_from: "text_input"
      },
      variables: options.variables || template.variables || {},
      rules: []
    };

    // Group consecutive rules of same type, but maintain order
    const ruleGroups = this.groupConsecutiveRules(parsedRules);
    
    for (const group of ruleGroups) {
      const rule = this.createRuleFromGroup(group);
      if (rule) {
        jsonStructure.rules.push(rule);
      }
    }

    return jsonStructure;
  }

  /**
   * Group consecutive rules of the same type while maintaining order
   */
  groupConsecutiveRules(parsedRules) {
    const groups = [];
    let currentGroup = [];
    let currentType = null;

    for (const rule of parsedRules) {
      // For conditional rules, each one gets its own group to maintain conditions
      if (rule.type === 'conditional') {
        // Finish current group if exists
        if (currentGroup.length > 0) {
          groups.push({
            type: currentType,
            rules: [...currentGroup]
          });
          currentGroup = [];
        }
        
        // Add conditional rule as its own group
        groups.push({
          type: 'conditional',
          rules: [rule]
        });
        currentType = null;
      } else {
        // For non-conditional rules, group consecutive ones of same type
        if (currentType === rule.type) {
          currentGroup.push(rule);
        } else {
          // Finish current group if exists
          if (currentGroup.length > 0) {
            groups.push({
              type: currentType,
              rules: [...currentGroup]
            });
          }
          
          // Start new group
          currentGroup = [rule];
          currentType = rule.type;
        }
      }
    }

    // Add final group if exists
    if (currentGroup.length > 0) {
      groups.push({
        type: currentType,
        rules: currentGroup
      });
    }

    return groups;
  }

  /**
   * Create a JSON rule from a group of similar rules
   */
  createRuleFromGroup(group) {
    if (!group || !group.rules || group.rules.length === 0) {
      return null;
    }

    const ruleId = this.generateRuleId(group.type, group.rules);
    
    switch (group.type) {
      case 'clearing':
        return {
          id: ruleId,
          type: "batch_update",
          description: "Clear and initialize fields",
          enabled: true,
          operations: group.rules.map(rule => ({
            field: rule.field,
            value: rule.value
          }))
        };

      case 'calculation':
        return {
          id: ruleId,
          type: "batch_update",
          description: "Mathematical calculations and expressions",
          enabled: true,
          operations: group.rules.map(rule => ({
            field: rule.field,
            value: rule.value
          }))
        };

      case 'function':
        return {
          id: ruleId,
          type: "batch_update",
          description: "Function calls and special operations",
          enabled: true,
          operations: group.rules.map(rule => ({
            field: rule.field,
            value: rule.value
          }))
        };

      case 'assignment':
        return {
          id: ruleId,
          type: "batch_update",
          description: "Value assignments",
          enabled: true,
          operations: group.rules.map(rule => ({
            field: rule.field,
            value: rule.value
          }))
        };

      case 'conditional':
        // Each conditional rule gets its own logic block
        const rule = group.rules[0]; // Should only be one rule in conditional groups
        return {
          id: ruleId,
          type: "conditional_logic",
          description: `Apply operation when ${rule.condition}`,
          enabled: true,
          conditions: [
            {
              if: {
                expression: rule.condition
              },
              then: [
                {
                  field: rule.field,
                  value: rule.value
                }
              ]
            }
          ]
        };

      default:
        return null;
    }
  }

  /**
   * Generate meaningful rule IDs
   */
  generateRuleId(type, rules) {
    const typeMap = {
      clearing: 'clear_fields',
      calculation: 'calculate_values',
      function: 'function_calls',
      assignment: 'assign_values',
      conditional: 'conditional_logic'
    };
    
    const baseId = typeMap[type] || 'custom_rule';
    
    if (type === 'conditional' && rules.length > 0) {
      const field = rules[0].field.toLowerCase();
      return `${baseId}_${field}`;
    }
    
    if (rules.length > 0) {
      const firstField = rules[0].field.toLowerCase();
      return `${baseId}_${firstField}`;
    }
    
    return baseId;
  }

  /**
   * Initialize step templates
   */
  initializeStepTemplates() {
    return {
      1: {
        name: "G&G Account Service - Step 1 Rules",
        description: "Data initialization, clear payment fields, and apply charges based on CODE_NO",
        variables: {
          PLUMBING_CHARGE: 300,
          PLUMBING_REMARKS: "PLUMBING CHARGES REPAIR EXP."
        }
      },
      2: {
        name: "G&G Account Service - Step 2 Financial Rules",
        description: "Financial calculations, outstanding balances, arrears management, and REC_WORD generation",
        variables: {
          EMPTY_VALUE: "",
          ZERO_VALUE: 0
        }
      },
      3: {
        name: "G&G Account Service - Step 3 Final Calculations",
        description: "Interest calculations, total computations, grand total, and final receipt processing",
        variables: {
          INTEREST_RATE: 0.21,
          QUARTERLY_DIVISOR: 4,
          BANKER_ROUNDING_OFFSET: 0.50,
          EMPTY_VALUE: ""
        }
      },
      default: {
        name: "G&G Account Service - Custom Rules",
        description: "Custom rule set generated from text input",
        variables: {}
      }
    };
  }

  /**
   * Generate conversion statistics
   */
  generateStatistics(jsonStructure, parsedRules) {
    const totalOperations = jsonStructure.rules.reduce((sum, rule) => {
      if (rule.operations) return sum + rule.operations.length;
      if (rule.conditions) {
        return sum + rule.conditions.reduce((condSum, cond) => {
          return condSum + (cond.then ? cond.then.length : 1);
        }, 0);
      }
      return sum + 1;
    }, 0);

    return {
      rulesCount: jsonStructure.rules.length,
      operationsCount: totalOperations,
      variablesCount: Object.keys(jsonStructure.variables || {}).length,
      originalLinesCount: parsedRules.length,
      conversionRate: parsedRules.length > 0 ? (totalOperations / parsedRules.length * 100).toFixed(1) : 0
    };
  }

  /**
   * Validate text rules before conversion
   */
  validateTextRules(textRules) {
    const errors = [];
    const warnings = [];
    
    if (!textRules || !textRules.trim()) {
      errors.push('No rules provided for conversion');
      return { isValid: false, errors, warnings };
    }

    try {
      const lines = this.preprocessTextRules(textRules);
      
      if (lines.length === 0) {
        errors.push('No valid rules found in input');
        return { isValid: false, errors, warnings };
      }

      // Validate each line
      for (const line of lines) {
        if (!line.text.toUpperCase().startsWith('UPDATE')) {
          warnings.push(`Line ${line.lineNumber}: Does not start with UPDATE - "${line.text}"`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        linesCount: lines.length
      };
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Get sample rules for each step
   */
  getSampleRules(stepNumber) {
    const samples = {
      1: `UPDATE ALL CHEQUE_NO1 WITH ' '
UPDATE ALL CHEQUE_DT1 WITH ' '
UPDATE ALL REC_AMT1 WITH 0
UPDATE ALL CHEQUE_NO2 WITH ' '
UPDATE ALL CHEQUE_DT2 WITH ' '
UPDATE ALL REC_AMT2 WITH 0
UPDATE ALL CHEQUE_NO3 WITH ' '
UPDATE ALL CHEQUE_DT3 WITH ' '
UPDATE ALL REC_AMT3 WITH 0
UPDATE ALL REC_AMT WITH 0
UPDATE ALL REMARKS1 WITH ' '
UPDATE ALL REMARKS2 WITH ' '
UPDATE ALL INT_ARREAR WITH INTEREST+INT_ARREAR
UPDATE ALL INT_ARREAR WITH 0 FOR INT_ARREAR<0
UPDATE ALL ADVANCE WITH 0
UPDATE ALL OTHER_CHG2 WITH 0
UPDATE ALL OTHER_CHG1 WITH 0
UPDATE ALL INTEREST WITH 0
UPDATE ALL OUTST_BAL WITH 0
UPDATE ALL OTHER_CHG1 WITH 300 FOR CODE_NO=<5
UPDATE ALL REMARKS1 WITH 'PLUMBING CHARGES REPAIR EXP.' FOR CODE_NO=<5 
UPDATE ALL BILL_DATE WITH ' '
UPDATE ALL REC_DATE WITH ' '
UPDATE ALL DUE_DATE WITH ' '`,

      2: `UPDATE ALL OUTST_BAL WITH GR_TOTAL-REC_AMT
UPDATE ALL ARREARS WITH OUTST_BAL
UPDATE ALL BANK1 WITH ' ' FOR REC_AMT=<0
UPDATE ALL BANK2 WITH ' ' FOR REC_AMT=<0
UPDATE ALL BANK3 WITH ' ' FOR REC_AMT=<0
UPDATE ALL REC_WORD WITH ' ' FOR REC_AMT=<0
UPDATE ADVANCE WITH -(ARREARS) FOR ARREARS<0
UPDATE ARREARS WITH 0 FOR ARREARS<0
UPDATE ALL INT_ARREAR WITH 0 FOR ARREARS=0
UPDATE ALL INT_ARREAR WITH 0 FOR (ARREARS>INT_ARREAR AND REC_AMT>INT_ARREAR)
UPDATE ALL INT_ARREAR WITH INT_ARREAR-REC_AMT FOR REC_AMT<INT_ARREAR
UPDATE ALL ARREARS WITH ARREARS-INT_ARREAR
UPDATE ALL ARREARS WITH INT_ARREAR FOR ARREARS<=0
UPDATE ALL INT_ARREAR WITH 0 FOR ARREARS=INT_ARREAR
UPDATE ALL INT_ARREAR WITH 0 FOR REC_AMT=>INT_ARREAR
UPDATE ALL REC_NO WITH ' ' FOR REC_AMT=0
UPDATE ALL REC_WORD WITH ' ' FOR REC_AMT=0
UPDATE ALL REC_WORD WITH WORDS(REC_AMT) FOR REC_AMT>0`,

      3: `UPDATE ALL INTEREST WITH ARREARS*.21/4
UPDATE ALL INTEREST WITH INT(INTEREST+.50)
UPDATE ALL INTEREST WITH 0 FOR INTEREST<0
UPDATE ALL TOTAL WITH BMC_TAX+MAINT_CHG+WATER_CHG+SINK_FUND+REP_FUND+LET_OUT_CH+PARK_CHG+BLDG_FUND+LEGAL_CHG+PAINT_FD+MAPLE_CHG+OTHER_CHG1+OTHER_CHG2+INTEREST+LIFT_MAINT+SALARY+ELECT_CHG
UPDATE ALL GR_TOTAL WITH TOTAL+ARREARS+INT_ARREAR-ADVANCE
UPDATE ALL REC_NO WITH ' ' FOR REC_AMT=0
UPDATE ALL REC_WORD WITH ' ' FOR REC_AMT=0
UPDATE ALL REC_WORD WITH WORDS(REC_AMT) FOR REC_AMT>0
UPDATE ALL BANK2 WITH ' ' FOR REC_AMT2=0
UPDATE ALL BANK3 WITH ' ' FOR REC_AMT3=0`
    };

    return samples[stepNumber] || '';
  }

  /**
   * Export JSON rules to file
   */
  exportToFile(jsonStructure, filename) {
    try {
      const jsonString = JSON.stringify(jsonStructure, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'converted_rules.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export file: ' + error.message);
    }
  }

  /**
   * Import and parse JSON rules
   */
  async importFromFile(file) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      if (!parsed.rules || !Array.isArray(parsed.rules)) {
        throw new Error('Invalid JSON rule file structure');
      }

      return {
        success: true,
        rules: parsed,
        metadata: parsed.metadata || {},
        rulesCount: parsed.rules.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
export const ruleConverterService = new RuleConverterService();
export default ruleConverterService;