// src/components/ui/LoadingSpinner.jsx
import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
      <span className="text-gray-600">{message}</span>
    </div>
  );
};

export default LoadingSpinner;