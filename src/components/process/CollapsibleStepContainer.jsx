// src/components/process/CollapsibleStepContainer.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Clock, Circle } from 'lucide-react';

const CollapsibleStepContainer = ({ 
  stepNumber, 
  title, 
  description, 
  isCompleted, 
  isActive, 
  canExecute,
  children,
  defaultExpanded = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isActive);

  // Auto-expand when step becomes active
  React.useEffect(() => {
    if (isActive && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isActive, isExpanded]);

  const getStepIcon = () => {
    if (isCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (isActive) {
      return <Clock className="w-5 h-5 text-orange-600" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStatus = () => {
    if (isCompleted) return 'Completed';
    if (isActive) return 'In Progress';
    if (canExecute) return 'Ready';
    return 'Pending';
  };

  const getStepStatusColor = () => {
    if (isCompleted) return 'text-green-600 bg-green-50';
    if (isActive) return 'text-orange-600 bg-orange-50';
    if (canExecute) return 'text-blue-600 bg-blue-50';
    return 'text-gray-500 bg-gray-50';
  };

  const getBorderColor = () => {
    if (isCompleted) return 'border-green-200';
    if (isActive) return 'border-orange-200';
    if (canExecute) return 'border-blue-200';
    return 'border-gray-200';
  };

  const getBackgroundColor = () => {
    if (isCompleted) return 'bg-green-50';
    if (isActive) return 'bg-orange-50';
    return 'bg-white';
  };

  return (
    <div className={`border rounded-lg ${getBorderColor()} ${getBackgroundColor()} transition-all duration-200`}>
      {/* Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Step Icon */}
            {getStepIcon()}
            
            {/* Step Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-medium text-gray-900">
                  Step {stepNumber}: {title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStepStatusColor()}`}>
                  {getStepStatus()}
                </span>
              </div>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>

          {/* Expand/Collapse Icon */}
          <div className="ml-3 flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleStepContainer;