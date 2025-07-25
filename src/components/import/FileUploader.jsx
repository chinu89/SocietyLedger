// src/components/import/FileUploader.jsx
import React from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

const FileUploader = ({ onFileUpload, isLoading, disabled = false }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Data File</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload your Excel or CSV file
        </h3>
        <p className="text-gray-500 mb-4">
          Essential columns: MONTH_FROM, MONTH_TO, YEAR, FLAT_NO, NAME, etc. • Max 10MB
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFileUpload}
          className="hidden"
          id="file-upload"
          disabled={disabled}
        />
        <label
          htmlFor="file-upload"
          className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose File
        </label>
      </div>

      {isLoading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <LoadingSpinner message="Processing file securely..." />
        </div>
      )}
    </div>
  );
};

export default FileUploader;