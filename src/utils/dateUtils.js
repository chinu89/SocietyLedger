// src/utils/dateUtils.js
export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const formatDateForDisplay = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateForFilename = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};