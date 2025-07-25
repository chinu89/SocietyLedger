// src/components/process/RuleFileUploader.jsx - Updated to support JSON files only
import React, { useState } from 'react';
import { Upload, FileCode, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const RuleFileUploader = ({ 
  onRuleFileUpload, 
  parsedRules, 
  stepNumber = 1,
  optional = false 
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);

  // Safe rule validation - prevents null/undefined errors
  const safeRules = parsedRules || [];
  const rulesLength = Array.isArray(safeRules) ? safeRules.length : 
                     (safeRules && safeRules.rules && Array.isArray(safeRules.rules)) ? safeRules.rules.length : 0;

  const getStepDescription = (step) => {
    const descriptions = {
      1: 'Initialize data, increment months, and apply basic transformations',
      2: 'Calculate outstanding balances, arrears, and financial adjustments',
      3: 'Generate bill numbers, dates, and receipt processing',
      4: 'Final validation and cleanup (optional rules)'
    };
    return descriptions[step] || 'Apply custom rules';
  };

  const getStepStyles = (step) => {
    const styles = {
      1: {
        border: 'border-purple-300',
        bg: 'bg-purple-50',
        icon: 'text-purple-400',
        text: 'text-purple-900',
        textMuted: 'text-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700',
        borderAccent: 'border-purple-200',
        bgAccent: 'bg-purple-50',
        textAccent: 'text-purple-600',
        textAccentStrong: 'text-purple-900',
        bgHighlight: 'bg-purple-100',
        textHighlight: 'text-purple-800',
        badge: 'bg-purple-200 text-purple-800'
      },
      2: {
        border: 'border-blue-300',
        bg: 'bg-blue-50',
        icon: 'text-blue-400',
        text: 'text-blue-900',
        textMuted: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700',
        borderAccent: 'border-blue-200',
        bgAccent: 'bg-blue-50',
        textAccent: 'text-blue-600',
        textAccentStrong: 'text-blue-900',
        bgHighlight: 'bg-blue-100',
        textHighlight: 'text-blue-800',
        badge: 'bg-blue-200 text-blue-800'
      },
      3: {
        border: 'border-green-300',
        bg: 'bg-green-50',
        icon: 'text-green-400',
        text: 'text-green-900',
        textMuted: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700',
        borderAccent: 'border-green-200',
        bgAccent: 'bg-green-50',
        textAccent: 'text-green-600',
        textAccentStrong: 'text-green-900',
        bgHighlight: 'bg-green-100',
        textHighlight: 'text-green-800',
        badge: 'bg-green-200 text-green-800'
      },
      4: {
        border: 'border-orange-300',
        bg: 'bg-orange-50',
        icon: 'text-orange-400',
        text: 'text-orange-900',
        textMuted: 'text-orange-600',
        button: 'bg-orange-600 hover:bg-orange-700',
        borderAccent: 'border-orange-200',
        bgAccent: 'bg-orange-50',
        textAccent: 'text-orange-600',
        textAccentStrong: 'text-orange-900',
        bgHighlight: 'bg-orange-100',
        textHighlight: 'text-orange-800',
        badge: 'bg-orange-200 text-orange-800'
      }
    };
    return styles[step] || styles[1];
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Only JSON files are supported now
      const isJSON = file.name.toLowerCase().endsWith('.json');
      
      setFileInfo({
        name: file.name,
        size: file.size,
        type: isJSON ? 'JSON Enhanced' : 'Unknown',
        format: isJSON ? 'json' : 'unknown'
      });
    }
    
    // Call the original handler
    onRuleFileUpload(event);
  };

  const getFormatBadge = (format) => {
    const badges = {
      json: { label: 'JSON Enhanced', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    };
    
    const badge = badges[format] || { label: 'Unknown', color: 'bg-red-100 text-red-800 border-red-200' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const styles = getStepStyles(stepNumber);

  return (
    <div className="space-y-4">
      <div className={`border-2 border-dashed ${styles.border} rounded-lg p-6 ${styles.bg}`}>
        <div className="text-center">
          <FileCode className={`w-10 h-10 ${styles.icon} mx-auto mb-3`} />
          <h4 className={`text-md font-medium ${styles.text} mb-2`}>
            Step {stepNumber} Rule File {optional ? '(Optional)' : ''}
          </h4>
          <p className={`text-sm ${styles.textMuted} mb-4`}>
            {getStepDescription(stepNumber)}
          </p>
          
          {/* File Format Support Info - JSON Only */}
          <div className="mb-4 text-xs text-gray-600">
            <div className="flex justify-center gap-2 mb-2">
              <span className="bg-blue-100 px-2 py-1 rounded">Enhanced .json files only</span>
            </div>
            <p>Upload JSON rule files with advanced business logic and built-in functions</p>
          </div>

          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            id={`rule-file-upload-step-${stepNumber}`}
          />
          <label
            htmlFor={`rule-file-upload-step-${stepNumber}`}
            className={`inline-flex items-center px-4 py-2 ${styles.button} text-white rounded-md cursor-pointer transition-colors`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose JSON Rule File
          </label>
        </div>
      </div>

      {/* File Info Display */}
      {fileInfo && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900">{fileInfo.name}</span>
              {getFormatBadge(fileInfo.format)}
            </div>
            <span className="text-xs text-gray-500">
              {(fileInfo.size / 1024).toFixed(1)} KB
            </span>
          </div>
          
          {fileInfo.format === 'json' && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              ✨ Enhanced JSON rules detected! This file supports advanced business logic, complex conditions, and built-in functions.
            </div>
          )}

          {fileInfo.format === 'unknown' && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              ❌ Unsupported file format. Please upload a .json rule file.
            </div>
          )}
        </div>
      )}

      {/* Step 2 Specific Information */}
      {stepNumber === 2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h6 className="font-medium text-blue-900 mb-2">Step 2 Automatic Processing</h6>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>⚡ Auto-calculated before rule execution:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>REC_AMT1, REC_AMT2, REC_AMT3 negative values set to 0</li>
                  <li>REC_AMT = REC_AMT1 + REC_AMT2 + REC_AMT3</li>
                </ul>
                <p className="mt-2 text-xs text-blue-600">
                  💡 JSON rules handle this automatically in the enhanced engine!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Rules Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <h6 className="font-medium text-gray-900 mb-2">📋 JSON Rule Features</h6>
        <div className="text-xs">
          <div className="font-medium text-blue-800 mb-1">JSON Rules (.json) ✨</div>
          <ul className="text-blue-700 space-y-1">
            <li>• Advanced business logic</li>
            <li>• Complex AND/OR conditions</li>
            <li>• Built-in functions (WORDS, dates, etc.)</li>
            <li>• Step-specific preprocessing</li>
            <li>• Financial calculation types</li>
            <li>• Validation and error handling</li>
          </ul>
        </div>
      </div>

      {/* Rules Preview - FIXED: Using safe rules length check */}
      {rulesLength > 0 && (
        <div className={`border ${styles.borderAccent} rounded-lg p-4 ${styles.bgAccent}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-5 h-5 ${styles.textAccent}`} />
              <h5 className={`font-medium ${styles.textAccentStrong}`}>
                Step {stepNumber} Rules Loaded ({rulesLength})
              </h5>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`text-sm ${styles.textAccent} hover:${styles.textHighlight}`}
            >
              {showPreview ? 'Hide' : 'Show'} Rules
            </button>
          </div>
          
          {showPreview && (
            <div className={`${styles.bgHighlight} rounded p-3 max-h-40 overflow-y-auto`}>
              {/* FIXED: Safe iteration over rules */}
              {Array.isArray(safeRules) ? (
                safeRules.map((rule, index) => (
                  <div key={index} className={`text-xs font-mono ${styles.textHighlight} mb-1`}>
                    {rule.originalLine || JSON.stringify(rule, null, 2)}
                  </div>
                ))
              ) : safeRules && safeRules.rules && Array.isArray(safeRules.rules) ? (
                safeRules.rules.map((rule, index) => (
                  <div key={index} className={`text-xs font-mono ${styles.textHighlight} mb-1`}>
                    {rule.originalLine || JSON.stringify(rule, null, 2)}
                  </div>
                ))
              ) : (
                <div className={`text-xs ${styles.textHighlight}`}>No rules to display</div>
              )}
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-600">
            <p><strong>Rule Types Detected:</strong></p>
            <div className="flex flex-wrap gap-2 mt-1">
              {/* FIXED: Safe rule type extraction */}
              {(() => {
                const rules = Array.isArray(safeRules) ? safeRules : 
                             (safeRules && safeRules.rules && Array.isArray(safeRules.rules)) ? safeRules.rules : [];
                const ruleTypes = Array.from(new Set(rules.map(rule => rule.column || rule.type || 'Unknown').filter(Boolean)));
                
                return ruleTypes.slice(0, 6).map(type => (
                  <span key={type} className={`px-2 py-1 ${styles.badge} rounded text-xs`}>
                    {type}
                  </span>
                ));
              })()}
              {(() => {
                const rules = Array.isArray(safeRules) ? safeRules : 
                             (safeRules && safeRules.rules && Array.isArray(safeRules.rules)) ? safeRules.rules : [];
                const ruleTypes = Array.from(new Set(rules.map(rule => rule.column || rule.type || 'Unknown').filter(Boolean)));
                
                if (ruleTypes.length > 6) {
                  return (
                    <span className={`px-2 py-1 ${styles.badge} rounded text-xs`}>
                      +{ruleTypes.length - 6} more
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}
      
      {stepNumber === 2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h6 className="font-medium text-blue-900 mb-2">Step 2 Rule Example:</h6>
          <div>
            <div className="text-xs font-medium text-blue-700 mb-1">JSON Format (.json) ✨:</div>
            <div className="text-xs font-mono text-blue-800 space-y-1 bg-blue-100 p-2 rounded">
              <div>{`{"type": "financial_calculation",`}</div>
              <div>{` "calculation_type": "arrears_management"}`}</div>
              <div>{`{"type": "batch_update",`}</div>
              <div>{` "operations": [{"field": "REC_WORD",`}</div>
              <div>{`  "value": "WORDS(REC_AMT)"}]}`}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleFileUploader;