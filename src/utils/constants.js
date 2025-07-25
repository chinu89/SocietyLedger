// src/utils/constants.js - Updated for better column handling
export const ESSENTIAL_COLUMNS = [
  'MONTH_FROM', 'MONTH_TO', 'YEAR', 'CODE_NO', 'FLAT_NO', 'NAME', 
  'TOTAL', 'GR_TOTAL', 'BILL_NO'
];

// 🔧 UPDATED: Changed to KNOWN_POSSIBLE_COLUMNS to make it clear these are just known ones
export const KNOWN_POSSIBLE_COLUMNS = [
  'MONTH_FROM', 'MONTH_TO', 'YEAR', 'CODE_NO', 'FLAT_NO', 'NAME', 'BMC_TAX', 
  'DIFPRP_TAX', 'TAX_DIF', 'MAINT_CHG', 'WATER_CHG', 'SINK_FUND', 'LIFT_MAINT', 
  'REP_FUND', 'LET_OUT_CH', 'PARK_CHG', 'SALARY', 'ELECT_CHG', 'BLDG_FUND', 
  'LEGAL_CHG', 'PAINT_FD', 'MAPLE_CHG', 'OTHER_CHG1', 'OTHER_CHG2', 'INTEREST', 
  'TOTAL', 'ARREARS', 'INT_ARREAR', 'ADVANCE', 'GR_TOTAL', 'BILL_NO', 'PREV_BL_NO', 
  'CHEQUE_NO1', 'CHEQUE_DT1', 'BANK1', 'REC_AMT1', 'CHEQUE_NO2', 'CHEQUE_DT2', 
  'BANK2', 'REC_AMT2', 'CHEQUE_NO3', 'CHEQUE_DT3', 'BANK3', 'REC_AMT3', 'REC_AMT', 
  'REC_NO', 'REC_WORD', 'EXTRA', 'OUTST_BAL', 'REMARKS1', 'REMARKS2', 'BILL_DATE', 
  'REC_DATE', 'DUE_DATE', 'WING' // Added WING as an example extra column
];

// 🆕 NEW: Keep backward compatibility
export const ALL_POSSIBLE_COLUMNS = KNOWN_POSSIBLE_COLUMNS;

// 🆕 NEW: Common extra columns that might appear in society data
export const COMMON_EXTRA_COLUMNS = [
  'WING',           // Building wing (A, B, C, etc.)
  'TOWER',          // Tower number or name
  'BUILDING',       // Building name or number
  'FLOOR',          // Floor number
  'UNIT_TYPE',      // 1BHK, 2BHK, etc.
  'AREA_SQFT',      // Area in square feet
  'OWNER_NAME',     // Owner name (different from occupant)
  'MOBILE',         // Mobile number
  'EMAIL',          // Email address
  'PARKING',        // Parking spot number
  'VEHICLE_NO',     // Vehicle number
  'SOCIETY_ID',     // Internal society ID
  'MEMBER_ID',      // Member ID
  'CATEGORY',       // Member category (owner/tenant)
  'STATUS',         // Active/Inactive status
  'REGION',         // Geographical region
  'ZONE',           // Zone within society
  'BLOCK'           // Block designation
];

// 🆕 NEW: Column type definitions for better handling
export const COLUMN_TYPES = {
  NUMERIC: [
    'CODE_NO', 'FLAT_NO', 'BMC_TAX', 'DIFPRP_TAX', 'TAX_DIF', 'MAINT_CHG', 
    'WATER_CHG', 'SINK_FUND', 'LIFT_MAINT', 'REP_FUND', 'LET_OUT_CH', 'PARK_CHG', 
    'SALARY', 'ELECT_CHG', 'BLDG_FUND', 'LEGAL_CHG', 'PAINT_FD', 'MAPLE_CHG', 
    'OTHER_CHG1', 'OTHER_CHG2', 'INTEREST', 'TOTAL', 'ARREARS', 'INT_ARREAR', 
    'ADVANCE', 'GR_TOTAL', 'BILL_NO', 'PREV_BL_NO', 'REC_AMT1', 'REC_AMT2', 
    'REC_AMT3', 'REC_AMT', 'REC_NO', 'OUTST_BAL', 'YEAR', 'FLOOR', 'AREA_SQFT', 'PARKING'
  ],
  
  DATE: [
    'CHEQUE_DT1', 'CHEQUE_DT2', 'CHEQUE_DT3', 'BILL_DATE', 'REC_DATE', 'DUE_DATE'
  ],
  
  TEXT: [
    'MONTH_FROM', 'MONTH_TO', 'NAME', 'CHEQUE_NO1', 'CHEQUE_NO2', 'CHEQUE_NO3',
    'BANK1', 'BANK2', 'BANK3', 'REC_WORD', 'EXTRA', 'REMARKS1', 'REMARKS2',
    'WING', 'TOWER', 'BUILDING', 'UNIT_TYPE', 'OWNER_NAME', 'MOBILE', 'EMAIL',
    'VEHICLE_NO', 'SOCIETY_ID', 'MEMBER_ID', 'CATEGORY', 'STATUS', 'REGION', 'ZONE', 'BLOCK'
  ]
};

// 🆕 NEW: Function to determine column type
export const getColumnType = (columnName) => {
  if (COLUMN_TYPES.NUMERIC.includes(columnName)) return 'numeric';
  if (COLUMN_TYPES.DATE.includes(columnName)) return 'date';
  if (COLUMN_TYPES.TEXT.includes(columnName)) return 'text';
  
  // Auto-detect based on common patterns
  const upperColumn = columnName.toUpperCase();
  
  // Numeric patterns
  if (upperColumn.includes('AMT') || upperColumn.includes('CHG') || 
      upperColumn.includes('TAX') || upperColumn.includes('NO') ||
      upperColumn.includes('RATE') || upperColumn.includes('QTY') ||
      upperColumn.includes('COUNT') || upperColumn.includes('NUM')) {
    return 'numeric';
  }
  
  // Date patterns
  if (upperColumn.includes('DATE') || upperColumn.includes('DT') ||
      upperColumn.includes('TIME') || upperColumn.endsWith('_DATE')) {
    return 'date';
  }
  
  // Default to text
  return 'text';
};

export const MONTH_MAPPING = {
  'JAN': { order: 1, next3: 'APR' },
  'FEB': { order: 2, next3: 'MAY' },
  'MAR': { order: 3, next3: 'JUN' },
  'APR': { order: 4, next3: 'JUL' },
  'MAY': { order: 5, next3: 'AUG' },
  'JUN': { order: 6, next3: 'SEP' },
  'JUL': { order: 7, next3: 'OCT' },
  'AUG': { order: 8, next3: 'NOV' },
  'SEP': { order: 9, next3: 'DEC' },
  'OCT': { order: 10, next3: 'JAN', yearIncrement: true },
  'NOV': { order: 11, next3: 'FEB', yearIncrement: true },
  'DEC': { order: 12, next3: 'MAR', yearIncrement: true }
};

export const DEFAULT_SOCIETIES = [
  'Green Valley Apartments',
  'Sunrise Heights',
  'Golden Residency',
  'Royal Gardens',
  'Metro Heights'
];

export const PROCESSING_STEPS = [
  { id: 1, name: 'Initialize Data', description: 'Apply rule file and increment months' },
  { id: 2, name: 'Calculate Charges', description: 'Calculate financial balances and arrears' },
  { id: 3, name: 'Generate Bills', description: 'Generate bill numbers and dates' },
  { id: 4, name: 'Excel Reports', description: 'Generate Excel reports with templates' }
];

// 🔧 UPDATED: Use dynamic column type detection
export const NUMERIC_COLUMNS = COLUMN_TYPES.NUMERIC;
export const DATE_COLUMNS = COLUMN_TYPES.DATE;

export const NAV_ITEMS = [
  { id: 'import', label: 'Import Data' },
  { id: 'process', label: 'Process Data' }
];

export const FILE_TYPES = {
  ALLOWED_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ],
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  EXTENSIONS: /\.(xlsx|xls|csv)$/
};

// Rule file types support
export const RULE_FILE_TYPES = {
  ALLOWED_TYPES: [
    'application/json'
  ],
  ALLOWED_EXTENSIONS: ['.json'],
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  EXTENSIONS: /\.(json)$/
};

// Excel template file types
export const EXCEL_TEMPLATE_TYPES = {
  ALLOWED_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ],
  ALLOWED_EXTENSIONS: ['.xlsx', '.xls'],
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  EXTENSIONS: /\.(xlsx|xls)$/
};

// 🆕 NEW: Column display preferences
export const COLUMN_DISPLAY = {
  // Columns to always show first
  PRIORITY_COLUMNS: [
    'CODE_NO', 'FLAT_NO', 'NAME', 'WING', 'TOWER', 'BUILDING',
    'TOTAL', 'GR_TOTAL', 'BILL_NO'
  ],
  
  // Columns to show in compact view
  COMPACT_COLUMNS: [
    'CODE_NO', 'FLAT_NO', 'NAME', 'WING', 'TOTAL', 'GR_TOTAL', 'BILL_NO'
  ],
  
  // Columns that are less important and can be hidden by default
  OPTIONAL_COLUMNS: [
    'EXTRA', 'REMARKS1', 'REMARKS2', 'CHEQUE_NO1', 'CHEQUE_NO2', 'CHEQUE_NO3',
    'BANK1', 'BANK2', 'BANK3'
  ]
};

// JSON Rule validation schemas (unchanged)
export const RULE_SCHEMAS = {
  REQUIRED_PROPERTIES: {
    ROOT: ['rules'],
    BATCH_UPDATE: ['type', 'operations'],
    CONDITIONAL_LOGIC: ['type', 'conditions'],
    FINANCIAL_CALCULATION: ['type', 'calculation_type'],
    DATE_OPERATION: ['type', 'operation'],
    VALIDATION: ['type', 'validations']
  },
  
  VALID_RULE_TYPES: [
    'batch_update',
    'conditional_logic', 
    'financial_calculation',
    'date_operation',
    'validation',
    'expression',
    'custom_function'
  ],
  
  VALID_CALCULATION_TYPES: [
    'outstanding_balance',
    'arrears_management', 
    'interest_calculation',
    'total_calculation',
    'grand_total',
    'interest_arrear_adjustment'
  ],
  
  VALID_DATE_OPERATIONS: [
    'set_bill_date',
    'calculate_due_date',
    'set_receipt_date'
  ],
  
  VALID_VALIDATION_TYPES: [
    'required',
    'numeric',
    'positive',
    'range',
    'expression'
  ]
};

// Enhanced rule capabilities (unchanged)
export const ENHANCED_FEATURES = {
  JSON_RULES: {
    COMPLEX_CONDITIONS: true,
    BUILT_IN_FUNCTIONS: true,
    BUSINESS_LOGIC: true,
    VARIABLES: true,
    CUSTOM_FUNCTIONS: true,
    STEP_PREPROCESSING: true,
    VALIDATION: true,
    METADATA: true
  },
  
  TEXT_RULES: {
    SIMPLE_UPDATES: true,
    BASIC_CONDITIONS: true,
    MATHEMATICAL_EXPRESSIONS: true,
    BACKWARD_COMPATIBLE: true
  },

  EXCEL_TEMPLATES: {
    SMART_DETECTION: true,
    TABLE_TEMPLATES: true,
    FORM_TEMPLATES: true,
    VARIABLE_REPLACEMENT: true,
    CURRENCY_FORMATTING: true,
    DATE_FORMATTING: true,
    MERGED_CELLS: true,
    MULTIPLE_SHEETS: true
  }
};

// Sample JSON rule templates (unchanged)
export const SAMPLE_JSON_RULES = {
  STEP_1: {
    metadata: {
      name: "Step 1 - Data Initialization",
      step: 1,
      description: "Initialize data, increment months, apply basic transformations"
    },
    rules: [
      {
        type: "batch_update",
        operations: [
          { field: "CHEQUE_NO1", value: "" },
          { field: "REC_AMT1", value: 0 }
        ]
      }
    ]
  },
  
  STEP_2: {
    metadata: {
      name: "Step 2 - Financial Calculations", 
      step: 2,
      description: "Enhanced financial calculations with automatic preprocessing"
    },
    variables: {
      DEFAULT_INTEREST_RATE: 0.21,
      INTEREST_PERIOD: 4
    },
    rules: [
      {
        type: "financial_calculation",
        calculation_type: "arrears_management"
      },
      {
        type: "batch_update",
        operations: [
          {
            field: "REC_WORD",
            value: "WORDS(REC_AMT)",
            condition: {
              field: "REC_AMT",
              operator: ">",
              value: "0"
            }
          }
        ]
      }
    ]
  }
};

// Enhanced rule file format detection (unchanged)
export const RULE_FORMAT_DETECTION = {
  JSON_INDICATORS: ['{', 'rules', 'metadata', 'type'],
  TEXT_INDICATORS: ['UPDATE ALL', 'UPDATE ', 'WITH', 'FOR'],
  
  // Confidence levels for format detection
  HIGH_CONFIDENCE: 0.8,
  MEDIUM_CONFIDENCE: 0.6,
  LOW_CONFIDENCE: 0.4
};