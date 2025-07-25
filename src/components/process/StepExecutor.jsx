// src/components/process/StepExecutor.jsx - Updated with Compact Mode Support
import React from 'react';
import { Play, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const StepExecutor = ({ 
  stepNumber, 
  title, 
  description, 
  canExecute, 
  isLoading, 
  onExecute, 
  isCompleted,
  isStep4 = false, // New prop to identify Step 4
  compact = false // New prop for compact mode
}) => {
  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <div className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </div>
      );
    }
    
    if (canExecute) {
      return (
        <div className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Play className="w-3 h-3 mr-1" />
          Ready
        </div>
      );
    }
    
    return (
      <div className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pending
      </div>
    );
  };

  const getExecuteButton = () => {
    if (!canExecute && !isCompleted) {
      return (
        <div className="text-sm text-gray-500">
          {stepNumber === 1 && 'Import data and upload rule file to proceed'}
          {stepNumber === 2 && 'Complete Step 1 and upload Step 2 rule file'}
          {stepNumber === 3 && 'Complete Step 2 and upload Step 3 rule file'}
          {stepNumber === 4 && 'Complete Step 3 to proceed to Excel generation'}
        </div>
      );
    }

    if (isCompleted) {
      return (
        <button
          onClick={onExecute}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isStep4 ? 'Prepare Data Again' : `Re-run Step ${stepNumber}`}
        </button>
      );
    }
    
    return (
      <button
        onClick={onExecute}
        disabled={!canExecute || isLoading}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Play className="w-4 h-4 mr-2" />
        )}
        {isStep4 ? 'Prepare Data for Excel' : `Execute Step ${stepNumber}`}
      </button>
    );
  };

  const getStepColor = () => {
    if (isCompleted) return 'green';
    if (canExecute) return 'blue';
    return 'gray';
  };

  const getStepIcon = () => {
    const icons = {
      1: '🚀',
      2: '💰',
      3: '📄',
      4: '📊'
    };
    return icons[stepNumber] || '⚙️';
  };

  // Compact mode rendering for use inside collapsible containers
  if (compact) {
    return (
      <div className="space-y-4">
        {/* Compact Status and Execute Section */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">{getStepIcon()}</span>
            <div>
              <div className="font-medium text-gray-900 text-sm">
                Execute {title}
              </div>
              {getStatusBadge()}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!canExecute && !isCompleted && (
              <div className="text-xs text-gray-500 max-w-xs text-right">
                {stepNumber === 1 && 'Need rule file'}
                {stepNumber === 2 && 'Need Step 1 + rule file'}
                {stepNumber === 3 && 'Need Step 2 + rule file'}
                {stepNumber === 4 && 'Need Step 3'}
              </div>
            )}
            {getExecuteButton()}
          </div>
        </div>

        {/* Compact Loading State */}
        {isLoading && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">
                {isStep4 ? 'Preparing data for Excel generation...' : `Processing Step ${stepNumber}... Please wait.`}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full mode rendering (original functionality)
  const color = getStepColor();

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStepIcon()}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Step {stepNumber}: {title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className={`flex items-center justify-between p-4 bg-${color}-50 rounded-lg border border-${color}-100`}>
        <div className="flex-1">
          {canExecute && !isCompleted && (
            <div>
              <h5 className={`font-medium text-${color}-900 mb-1`}>Ready to Process</h5>
              <p className={`text-sm text-${color}-700`}>
                {isStep4 ? 'Data is ready for Excel template processing' : 'All requirements met for this step'}
              </p>
            </div>
          )}
          
          {isCompleted && (
            <div>
              <h5 className={`font-medium text-${color}-900 mb-1`}>
                {isStep4 ? 'Data Prepared for Excel' : 'Step Completed'}
              </h5>
              <p className={`text-sm text-${color}-700`}>
                {isStep4 ? 'Upload template to generate Excel reports' : 'You can re-run this step if needed'}
              </p>
            </div>
          )}
          
          {!canExecute && !isCompleted && (
            <div>
              <h5 className={`font-medium text-${color}-900 mb-1`}>Requirements Not Met</h5>
              <p className={`text-sm text-${color}-700`}>Complete prerequisites to continue</p>
            </div>
          )}
        </div>
        <div className="ml-4">
          {getExecuteButton()}
        </div>
      </div>

      {isLoading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-blue-700">
              {isStep4 ? 'Preparing data for Excel generation...' : `Processing Step ${stepNumber}... Please wait.`}
            </span>
          </div>
        </div>
      )}

      {/* Step 4 specific information */}
      {stepNumber === 4 && !isLoading && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-orange-600 text-lg">📊</span>
            <div>
              <h6 className="font-medium text-orange-900 mb-1">Step 4: Excel Report Generation</h6>
              <div className="text-sm text-orange-800 space-y-1">
                <p><strong>✨ Excel Template System:</strong> Generate professional Excel reports from your processed data</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Upload custom Excel templates with variable placeholders</li>
                  <li>Smart template detection (Table vs Form templates)</li>
                  <li>Auto-formatted currency and date fields</li>
                  <li>Professional Excel output with all records</li>
                  <li>Much smaller file sizes compared to PDF alternatives</li>
                  <li>Rule files are optional for Step 4</li>
                </ul>
                <p className="mt-2 text-orange-600">
                  💡 After executing Step 4, use the Template Uploader below to create Excel reports!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepExecutor;