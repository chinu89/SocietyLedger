// src/utils/errorHandling.js
export class AppError extends Error {
  constructor(message, code = 'GENERIC_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export const ERROR_CODES = {
  FILE_VALIDATION_ERROR: 'FILE_VALIDATION_ERROR',
  DATA_PARSING_ERROR: 'DATA_PARSING_ERROR',
  RULE_PARSING_ERROR: 'RULE_PARSING_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  EXPORT_ERROR: 'EXPORT_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR'
};

export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
  
  if (error instanceof AppError) {
    return error.message;
  }
  
  // Handle specific error types
  if (error.name === 'QuotaExceededError') {
    return 'Storage quota exceeded. Please clear some data and try again.';
  }
  
  if (error.message.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export const createErrorMessage = (code, details = '') => {
  const messages = {
    [ERROR_CODES.FILE_VALIDATION_ERROR]: 'File validation failed',
    [ERROR_CODES.DATA_PARSING_ERROR]: 'Failed to parse data file',
    [ERROR_CODES.RULE_PARSING_ERROR]: 'Failed to parse rule file',
    [ERROR_CODES.PROCESSING_ERROR]: 'Data processing failed',
    [ERROR_CODES.EXPORT_ERROR]: 'Export failed',
    [ERROR_CODES.STORAGE_ERROR]: 'Storage operation failed'
  };
  
  const baseMessage = messages[code] || 'Unknown error';
  return details ? `${baseMessage}: ${details}` : baseMessage;
};