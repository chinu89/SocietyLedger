// src/utils/numberToWords.js
// Complete Indian number system to words converter

const ones = [
  '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
];

const tens = [
  '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
];

/**
 * Convert numbers less than 1000 to words
 * @param {number} num - Number less than 1000
 * @returns {string} - Words representation
 */
const convertHundreds = (num) => {
  let result = '';
  
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' HUNDRED ';
    num %= 100;
  }
  
  if (num >= 20) {
    result += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  
  if (num > 0) {
    result += ones[num] + ' ';
  }
  
  return result.trim();
};

/**
 * Convert number to Indian number system words
 * @param {number} num - Number to convert
 * @returns {string} - Words representation without currency
 */
const convertToIndianWords = (num) => {
  if (num === 0) return 'ZERO';
  
  let result = '';
  
  // Handle crores (10,000,000)
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    result += convertHundreds(crores) + ' CRORE ';
    num %= 10000000;
  }
  
  // Handle lakhs (100,000)
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    result += convertHundreds(lakhs) + ' LAKH ';
    num %= 100000;
  }
  
  // Handle thousands (1,000)
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    result += convertHundreds(thousands) + ' THOUSAND ';
    num %= 1000;
  }
  
  // Handle remaining hundreds, tens, and ones
  if (num > 0) {
    result += convertHundreds(num);
  }
  
  return result.trim();
};

/**
 * Main function to convert number to rupees in words
 * @param {number|string} amount - Amount to convert
 * @returns {string} - Amount in words with "RUPEES" and "ONLY"
 */
export const numberToWords = (amount) => {
  try {
    // Handle edge cases
    if (amount === null || amount === undefined || amount === '') {
      return '';
    }
    
    // Convert to number and handle decimals
    let num = parseFloat(amount);
    
    if (isNaN(num)) {
      return '';
    }
    
    // Handle negative numbers
    if (num < 0) {
      return 'MINUS ' + numberToWords(Math.abs(num));
    }
    
    // Handle zero
    if (num === 0) {
      return 'RUPEES ZERO ONLY';
    }
    
    // Separate rupees and paise
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    
    let result = 'RUPEES ';
    
    // Convert rupees to words
    if (rupees > 0) {
      result += convertToIndianWords(rupees);
    }
    
    // Add paise if present
    if (paise > 0) {
      result += ' AND ' + convertToIndianWords(paise) + ' PAISE';
    }
    
    result += ' ONLY';
    
    return result;
    
  } catch (error) {
    console.error('Error converting number to words:', error);
    return '';
  }
};

/**
 * Convert number to words without currency prefix/suffix
 * @param {number|string} amount - Amount to convert
 * @returns {string} - Amount in words only
 */
export const numberToWordsOnly = (amount) => {
  try {
    let num = parseFloat(amount);
    
    if (isNaN(num) || num === null || num === undefined) {
      return '';
    }
    
    if (num < 0) {
      return 'MINUS ' + numberToWordsOnly(Math.abs(num));
    }
    
    if (num === 0) {
      return 'ZERO';
    }
    
    return convertToIndianWords(Math.floor(num));
    
  } catch (error) {
    console.error('Error converting number to words:', error);
    return '';
  }
};

/**
 * Test function to verify the conversion works correctly
 */
export const testNumberToWords = () => {
  const testCases = [
    { input: 0, expected: 'RUPEES ZERO ONLY' },
    { input: 1, expected: 'RUPEES ONE ONLY' },
    { input: 25, expected: 'RUPEES TWENTY FIVE ONLY' },
    { input: 100, expected: 'RUPEES ONE HUNDRED ONLY' },
    { input: 6375, expected: 'RUPEES SIX THOUSAND THREE HUNDRED SEVENTY FIVE ONLY' },
    { input: 12000, expected: 'RUPEES TWELVE THOUSAND ONLY' },
    { input: 100000, expected: 'RUPEES ONE LAKH ONLY' },
    { input: 1234567, expected: 'RUPEES TWELVE LAKH THIRTY FOUR THOUSAND FIVE HUNDRED SIXTY SEVEN ONLY' },
    { input: 12345678, expected: 'RUPEES ONE CRORE TWENTY THREE LAKH FORTY FIVE THOUSAND SIX HUNDRED SEVENTY EIGHT ONLY' },
    { input: 1234.56, expected: 'RUPEES ONE THOUSAND TWO HUNDRED THIRTY FOUR AND FIFTY SIX PAISE ONLY' }
  ];
  
  console.log('=== Number to Words Conversion Test ===');
  let allPassed = true;
  
  testCases.forEach(({ input, expected }, index) => {
    const result = numberToWords(input);
    const passed = result === expected;
    
    console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Input: ${input}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Got: ${result}`);
    console.log('');
    
    if (!passed) allPassed = false;
  });
  
  console.log(`Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  return allPassed;
};

/**
 * Format amount with Indian number system (for display)
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted amount with commas
 */
export const formatIndianCurrency = (amount) => {
  if (isNaN(amount)) return '0';
  
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
};

// Export as default
export default numberToWords;