// src/hooks/useDataExport.js
import { useState } from 'react';
import { exportToExcel } from '../services/excelService';

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const generateFilename = (societyName, step, format) => {
    const date = new Date().toISOString().split('T')[0];
    const society = societyName || 'Society';
    const extension = format === 'excel' ? 'xlsx' : 'csv';
    return `${society}_Data_Step${step}_${date}.${extension}`;
  };

  const exportData = async (data, format, societyName, currentStep) => {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    setIsExporting(true);

    try {
      const cleanData = data.map(row => {
        const cleanRow = { ...row };
        delete cleanRow._rowIndex;
        return cleanRow;
      });

      const filename = generateFilename(societyName, currentStep, format);

      if (format === 'excel') {
        await exportToExcel(cleanData, filename);
      } else {
        exportToCSV(cleanData, filename);
      }
    } catch (error) {
      throw new Error('Error exporting data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportData
  };
};