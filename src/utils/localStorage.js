// src/utils/localStorage.js
export const STORAGE_KEYS = {
  SOCIETIES: 'gawde_societies',
  DATA: (society) => `gawde_data_${society}`,
  PROCESSED_DATA: (society) => `gawde_processed_${society}`,
  STEP: (society) => `gawde_step_${society}`,
};

export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

export const clearSocietyData = (society) => {
  removeFromLocalStorage(STORAGE_KEYS.DATA(society));
  removeFromLocalStorage(STORAGE_KEYS.PROCESSED_DATA(society));
  removeFromLocalStorage(STORAGE_KEYS.STEP(society));
};