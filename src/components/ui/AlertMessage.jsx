// src/components/ui/AlertMessage.jsx
import React from 'react';

const AlertMessage = ({ type, message, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';

  return (
    <div className={`mb-6 p-4 ${bgColor} border rounded-lg relative`}>
      <p className={`${textColor} text-sm`}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 ${textColor} hover:opacity-70`}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default AlertMessage;