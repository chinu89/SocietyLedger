// src/components/process/ProcessingSteps.jsx - Updated without PDF references
import React from 'react';
import { FileCode, Calculator, FileText, FileSpreadsheet } from 'lucide-react';

const PROCESSING_STEPS = [
  { id: 1, name: 'Initialize Data', icon: FileCode, description: 'Apply rule file and increment months' },
  { id: 2, name: 'Calculate Charges', icon: Calculator, description: 'Calculate financial balances and arrears' },
  { id: 3, name: 'Generate Bills', icon: FileText, description: 'Generate bill numbers and dates' },
  { id: 4, name: 'Excel Reports', icon: FileSpreadsheet, description: 'Generate Excel reports with templates' }
];

const ProcessingSteps = ({ currentStep }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">4-Step Processing Workflow</h2>
      <div className="flex items-center justify-between">
        {PROCESSING_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep >= step.id;
          const isCurrent = currentStep + 1 === step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isCurrent 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className={`text-sm font-medium ${
                  isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < PROCESSING_STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessingSteps;