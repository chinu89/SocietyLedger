// src/components/common/ExportButtons.jsx
import React from 'react';
import { Download } from 'lucide-react';

const ExportButtons = ({ onExportCSV, onExportExcel, disabled = false }) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExportExcel}
        disabled={disabled}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Export Excel
      </button>
    </div>
  );
};

export default ExportButtons;