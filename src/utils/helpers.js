// src/utils/helpers.js

// Input validation and sanitization
export const sanitizeInput = (input) => {
  if (input === null || input === undefined) return '';
  return String(input).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if value is numeric
export const isNumeric = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

// Convert string to title case
export const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Group array by key
export const groupBy = (array, key) => {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {});
};

// Remove duplicates from array
export const removeDuplicates = (array, key) => {
  return array.filter((item, index, self) => 
    index === self.findIndex(t => t[key] === item[key])
  );
};

// Sort array by multiple keys
export const sortBy = (array, ...keys) => {
  return array.sort((a, b) => {
    for (let key of keys) {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
};