// src/App.jsx - Updated with View Data Tab Handler
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SessionProvider } from './context/SessionContext';
import { ThemeProvider } from './theme/ThemeContext';
import { useFileHandler } from './hooks/useFileHandler';
import { useRuleProcessor } from './hooks/useRuleProcessor';
import { useDataExport } from './hooks/useDataExport';

// UI Components
import Header from './components/ui/Header';
import Sidebar from './components/ui/Sidebar';
import AlertMessage from './components/ui/AlertMessage';
import HorizontalNavBar from './components/ui/HorizontalNavBar';

// Feature Components
import SocietySelector from './components/import/SocietySelector';
import FileUploader from './components/import/FileUploader';
import DataTable from './components/import/DataTable';
import ProcessedDataView from './components/process/ProcessedDataView';
import DataUpdateImporter from './components/process/DataUpdateImporter';
import ProcessingSteps from './components/process/ProcessingSteps';
import RuleFileUploader from './components/process/RuleFileUploader';
import StepExecutor from './components/process/StepExecutor';
import TemplateUploader from './components/process/TemplateUploader';

// Receipt Importer Component
import ReceiptImporter from './components/process/ReceiptImporter';

// Collapsible Step Container
import CollapsibleStepContainer from './components/process/CollapsibleStepContainer';

// New Components
import RuleConverterTab from './components/tools/RuleConverterTab';
import ViewDataTab from './components/view/ViewDataTab'; // NEW IMPORT

// Settings Components
import SessionSettings from './components/settings/SessionSettings';
import ThemeSettings from './components/settings/ThemeSettings';

// Utilities
import { validateProcessingRequirements } from './utils/validation';
import { handleError } from './utils/errorHandling';

const AppContent = () => {
  const { state, actions } = useApp();
  const { processFile, processRuleFile, isProcessing: isFileProcessing } = useFileHandler();
  const { 
    executeStep1, 
    executeStep2, 
    executeStep3, 
    executeStep4, 
    isProcessing: isRuleProcessing 
  } = useRuleProcessor();
  const { exportData, isExporting } = useDataExport();

  // Progress tracking state
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingStep, setProcessingStep] = React.useState(null);
  const [processingProgress, setProcessingProgress] = React.useState(0);
  
  // Step 4 Excel generation state
  const [step4Template, setStep4Template] = React.useState(null);
  const [excelGenerationResult, setExcelGenerationResult] = React.useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Collapse state for steps
  const [expandedSteps, setExpandedSteps] = React.useState({
    step1: true,  // Start with step 1 expanded
    step2: false,
    step3: false,
    step4: false
  });

  // Load sidebar preference from localStorage
  React.useEffect(() => {
    const savedCollapsed = localStorage.getItem('gawde_sidebar_collapsed');
    if (savedCollapsed !== null) {
      setSidebarCollapsed(JSON.parse(savedCollapsed));
    }
    
    // Auto-collapse on mobile
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save sidebar preference
  React.useEffect(() => {
    localStorage.setItem('gawde_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // File upload handler
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!state.selectedSociety) {
      actions.setError('Please select a society first');
      return;
    }

    try {
      actions.setLoading(true);
      actions.setError('');
      
      const result = await processFile(file);
      const sanitizedData = result.data || result;
      const metadata = result.metadata;
      
      actions.setImportedData(sanitizedData);
      
      let successMessage = `Data imported successfully! ${sanitizedData.length} records processed.`;
      
      if (metadata && metadata.extraColumns > 0) {
        successMessage += ` Found ${metadata.extraColumns} extra column(s): ${metadata.extraColumnNames.join(', ')}.`;
      }
      
      successMessage += ' You can now edit any values by clicking on cells, then proceed with processing.';
      
      actions.setSuccess(successMessage);
    } catch (error) {
      actions.setError(handleError(error, 'file upload'));
    } finally {
      actions.setLoading(false);
      event.target.value = '';
    }
  };

  // Simplified hasValidRules function
  const hasValidRules = (rules) => {
    if (!rules) return false;
    
    if (Array.isArray(rules)) {
      return rules.length > 0;
    }
    
    if (typeof rules === 'object') {
      if (rules.rules && Array.isArray(rules.rules)) {
        return rules.rules.length > 0;
      }
      return Object.keys(rules).length > 0;
    }
    
    return false;
  };

  // Rule file upload handler for different steps
  const handleRuleFileUpload = async (event, stepNumber) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      actions.setError('');
      
      const ruleFileInfo = await processRuleFile(file);
      const { parseRuleFile } = await import('./services/enhancedRuleEngine');
      const rules = parseRuleFile(ruleFileInfo.content);
      
      console.log(`Step ${stepNumber} rules parsed:`, rules);
      
      actions.setStepRules(`step${stepNumber}`, rules);
      actions.setParsedRules(rules);
      
      const formatLabel = ruleFileInfo.format === 'json' ? 'Enhanced JSON' : 'Legacy Text';
      const ruleCount = Array.isArray(rules) ? rules.length : (rules && rules.rules ? rules.rules.length : 0);
      
      actions.setSuccess(
        `Step ${stepNumber} rule file loaded successfully! ` +
        `Format: ${formatLabel} • Rules: ${ruleCount} • ` +
        `File: ${ruleFileInfo.fileName}`
      );
      
      setProcessingStep(null);
      
    } catch (error) {
      console.error('Rule file upload error:', error);
      actions.setError(handleError(error, 'rule file upload'));
    }

    event.target.value = '';
  };

  // Data update handler
  const handleDataUpdate = (updatedData) => {
    if (state.processedData.length > 0) {
      actions.setProcessedData(updatedData);
      actions.setSuccess('Data updated successfully!');
    } else {
      actions.setImportedData(updatedData);
      actions.setSuccess('Imported data updated successfully!');
    }
  };

  // Step 4 handlers for Excel templates
  const handleStep4TemplateLoad = (template) => {
    setStep4Template(template);
    console.log('Step 4 Excel template loaded:', template.name);
  };

  const handleStep4ExcelGenerate = (result) => {
    setExcelGenerationResult(result);
    actions.setSuccess(`Excel file generated successfully! ${result.filename} with ${result.recordCount} records.`);
    console.log('Excel generation completed:', result);
  };

  // Step execution handler with progress tracking
  const handleExecuteStep = async (stepNumber) => {
    if (!getStepRequirements(stepNumber).canExecute) return;

    setIsProcessing(true);
    setProcessingStep(stepNumber);
    setProcessingProgress(0);

    // Auto-expand the current step and collapse others
    setExpandedSteps(prev => ({
      ...prev,
      [`step${stepNumber}`]: true
    }));

    try {
      const stepKey = `step${stepNumber}`;
      const rules = state.stepRules && state.stepRules[stepKey] ? state.stepRules[stepKey] : null;
      
      // Step 4 doesn't require rules
      if (stepNumber !== 4 && !rules) {
        throw new Error(`No rules loaded for step ${stepNumber}`);
      }

      console.log(`Executing step ${stepNumber}...`);
      
      // Progress callback
      const onProgress = (progress, current, total) => {
        setProcessingProgress(progress);
        console.log(`Processing: ${current}/${total} (${progress}%)`);
      };

      // Use the correct hook functions with progress tracking
      let result;
      const currentData = state.processedData.length > 0 ? state.processedData : state.importedData;
      
      switch (stepNumber) {
        case 1:
          result = await executeStep1(currentData, rules, onProgress);
          break;
        case 2:
          result = await executeStep2(currentData, rules, onProgress);
          break;
        case 3:
          result = await executeStep3(currentData, rules, onProgress);
          break;
        case 4:
          result = await executeStep4(currentData, rules, onProgress);
          break;
        default:
          throw new Error(`Invalid step number: ${stepNumber}`);
      }

      // Update state using actions
      actions.setProcessedData(result);
      actions.setCurrentStep(stepNumber);
      actions.setSuccess(`Step ${stepNumber} completed successfully with ${result.length} records processed.`);

      // Auto-expand next step after completion
      if (stepNumber < 4) {
        setTimeout(() => {
          setExpandedSteps(prev => ({
            ...prev,
            [`step${stepNumber + 1}`]: true
          }));
        }, 1000);
      }

      console.log(`Step ${stepNumber} completed successfully`);

    } catch (error) {
      console.error(`Error executing step ${stepNumber}:`, error);
      actions.setError(`Error in step ${stepNumber}: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
      setProcessingProgress(0);
    }
  };

  // Export handler - UPDATED: Only supports Excel now
  const handleExport = async (format) => {
    try {
      if (format !== 'excel') {
        throw new Error('Only Excel export is supported');
      }
      const dataToExport = state.processedData.length > 0 ? state.filteredData : state.importedData;
      const stepLabel = state.processedData.length > 0 ? state.currentStep : 0;
      await exportData(dataToExport, format, state.selectedSociety, stepLabel);
    } catch (error) {
      actions.setError(handleError(error, 'export'));
    }
  };

  // Add society handler
  const handleAddSociety = (societyName) => {
    actions.addSociety(societyName);
  };

  // Update society details handler
  const handleUpdateSocietyDetails = (societyName, details) => {
    actions.updateSocietyDetails(societyName, details);
  };

  // Delete society handler
  const handleDeleteSociety = async (societyName) => {
    return await actions.deleteSociety(societyName);
  };

  // Fixed get step requirements and status with proper state handling
  const getStepRequirements = (stepNumber) => {
    const stepKey = `step${stepNumber}`;
    const stepRules = state.stepRules && state.stepRules[stepKey] ? state.stepRules[stepKey] : null;
    
    console.log(`Step ${stepNumber} requirements check:`, {
      stepKey,
      stepRules,
      stepRulesType: typeof stepRules,
      isArray: Array.isArray(stepRules),
      arrayLength: Array.isArray(stepRules) ? stepRules.length : 'N/A',
      hasValidRules: hasValidRules(stepRules),
      importedDataLength: state.importedData.length,
      currentStep: state.currentStep,
      allStepRules: state.stepRules
    });
    
    // Temporary: More lenient validation for step 1
    const hasRulesForStep1 = stepNumber === 1 ? 
      (stepRules !== null && stepRules !== undefined) : 
      hasValidRules(stepRules);
    
    switch (stepNumber) {
      case 1:
        return {
          canExecute: state.importedData.length > 0 && hasRulesForStep1,
          requiresRules: true,
          description: 'Apply rule file and increment months (+3) with year handling'
        };
      case 2:
        return {
          canExecute: state.currentStep >= 1 && hasValidRules(stepRules),
          requiresRules: true,
          description: 'Calculate outstanding balances, arrears, and financial adjustments'
        };
      case 3:
        return {
          canExecute: state.currentStep >= 2 && hasValidRules(stepRules),
          requiresRules: true,
          description: 'Generate bill numbers, dates, and receipt processing'
        };
      case 4:
        return {
          canExecute: state.currentStep >= 3,
          requiresRules: false,
          description: 'Prepare data for Excel template generation and create reports'
        };
      default:
        return {
          canExecute: false,
          requiresRules: false,
          description: 'Step not defined'
        };
    }
  };

  // Check if data update is available for current context
  const canShowDataUpdate = () => {
    return (state.importedData.length > 0 || state.processedData.length > 0) && state.selectedSociety;
  };

  // Get current data for update context
  const getCurrentDataForUpdate = () => {
    return state.processedData.length > 0 ? state.processedData : state.importedData;
  };

  // Toggle step expansion
  const toggleStepExpansion = (stepNumber) => {
    setExpandedSteps(prev => ({
      ...prev,
      [`step${stepNumber}`]: !prev[`step${stepNumber}`]
    }));
  };

  // Render import tab
  const renderImportTab = () => (
    <div className="space-y-6">
      <SocietySelector
        societies={state.societies}
        selectedSociety={state.selectedSociety}
        onSelectSociety={actions.setSelectedSociety}
        onAddSociety={handleAddSociety}
        onDeleteSociety={handleDeleteSociety}
        societyDetails={state.societyDetails}
        onUpdateSocietyDetails={handleUpdateSocietyDetails}
      />

      <FileUploader
        onFileUpload={handleFileUpload}
        isLoading={state.isLoading}
        disabled={!state.selectedSociety}
      />

      {state.importedData.length > 0 && (
        <div className="space-y-4">
          {/* Enhanced Information Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center">
                <div className="text-blue-600 dark:text-blue-400 text-xl">📊</div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Imported Data is Editable
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Click on any cell in the table below to edit its value. Changes are highlighted and can be saved or discarded.
                  This allows you to correct any data issues before processing.
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                    Click any cell to start editing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                    Press Enter to save, Escape to cancel
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                    Orange dot indicates unsaved changes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                    Save all changes before proceeding
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Update Import Feature */}
          {canShowDataUpdate() && (
            <DataUpdateImporter
              currentData={state.importedData}
              onDataUpdate={handleDataUpdate}
              stepNumber={0}
              disabled={state.isLoading}
            />
          )}

          <DataTable
            data={state.importedData}
            title="Imported Data"
            searchTerm={state.searchTerm}
            onSearchChange={actions.setSearchTerm}
            onExportExcel={() => handleExport('excel')}
            maxRows={15}
            maxColumns={8}
            editable={true}
          />
        </div>
      )}
    </div>
  );

  // Render process tab with collapsible steps
  const renderProcessTab = () => {
    if (!state.selectedSociety) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select a Society First
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Please select a society and import data before processing.
            </p>
            <button
              onClick={() => actions.setActiveTab('import')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Go to Import Data
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <ProcessingSteps currentStep={state.currentStep} />

        {/* Enhanced Information Card for Processing */}
        {state.importedData.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center">
                <div className="text-green-600 dark:text-green-400 text-xl">⚙️</div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Processing with Editable Results
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Each processing step will generate results that you can review and edit before continuing to the next step.
                  This ensures data accuracy throughout the entire workflow.
                </p>
                <ul className="text-xs text-green-600 dark:text-green-400 space-y-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Click step headers to expand/collapse
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Review processed data after each step
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Edit any calculated values if needed
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Save changes before proceeding
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Use data update import for bulk changes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Re-run steps if adjustments needed
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Step 1 */}
        <CollapsibleStepContainer
          stepNumber={1}
          title="Initialize Data with Rules"
          description={getStepRequirements(1).description}
          isCompleted={state.currentStep >= 1}
          isActive={processingStep === 1}
          canExecute={getStepRequirements(1).canExecute}
          defaultExpanded={expandedSteps.step1}
        >
          <StepExecutor
            stepNumber={1}
            title="Initialize Data with Rules"
            description={getStepRequirements(1).description}
            canExecute={getStepRequirements(1).canExecute}
            isLoading={isProcessing && processingStep === 1}
            onExecute={() => handleExecuteStep(1)}
            isCompleted={state.currentStep >= 1}
            compact={true}
          />

          {/* Rule File Uploader - Show when we have imported data */}
          {state.importedData.length > 0 && (
            <RuleFileUploader
              onRuleFileUpload={(e) => handleRuleFileUpload(e, 1)}
              parsedRules={state.stepRules && state.stepRules.step1 ? state.stepRules.step1 : null}
              stepNumber={1}
            />
          )}

          {/* Receipt Importer - Show after Step 1 is completed and before Step 2 */}
          {state.currentStep >= 1 && (
            <div data-receipt-importer>
              <ReceiptImporter
                currentData={getCurrentDataForUpdate()}
                onDataUpdate={handleDataUpdate}
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Data Update Import for Step 1 - Show after step is completed */}
          {canShowDataUpdate() && state.currentStep >= 1 && (
            <DataUpdateImporter
              currentData={getCurrentDataForUpdate()}
              onDataUpdate={handleDataUpdate}
              stepNumber={1}
              disabled={isProcessing}
            />
          )}
        </CollapsibleStepContainer>

        {/* Collapsible Step 2 */}
        <CollapsibleStepContainer
          stepNumber={2}
          title="Calculate Financial Balances"
          description={getStepRequirements(2).description}
          isCompleted={state.currentStep >= 2}
          isActive={processingStep === 2}
          canExecute={getStepRequirements(2).canExecute}
          defaultExpanded={expandedSteps.step2}
        >
          <StepExecutor
            stepNumber={2}
            title="Calculate Financial Balances"
            description={getStepRequirements(2).description}
            canExecute={getStepRequirements(2).canExecute}
            isLoading={isProcessing && processingStep === 2}
            onExecute={() => handleExecuteStep(2)}
            isCompleted={state.currentStep >= 2}
            compact={true}
          />

          {/* Rule File Uploader - Show when Step 1 is completed */}
          {state.currentStep >= 1 && (
            <RuleFileUploader
              onRuleFileUpload={(e) => handleRuleFileUpload(e, 2)}
              parsedRules={state.stepRules && state.stepRules.step2 ? state.stepRules.step2 : null}
              stepNumber={2}
            />
          )}

          {/* Data Update Import for Step 2 - Show after step is completed */}
          {canShowDataUpdate() && state.currentStep >= 2 && (
            <DataUpdateImporter
              currentData={getCurrentDataForUpdate()}
              onDataUpdate={handleDataUpdate}
              stepNumber={2}
              disabled={isProcessing}
            />
          )}
        </CollapsibleStepContainer>

        {/* Collapsible Step 3 */}
        <CollapsibleStepContainer
          stepNumber={3}
          title="Generate Bills and Receipts"
          description={getStepRequirements(3).description}
          isCompleted={state.currentStep >= 3}
          isActive={processingStep === 3}
          canExecute={getStepRequirements(3).canExecute}
          defaultExpanded={expandedSteps.step3}
        >
          <StepExecutor
            stepNumber={3}
            title="Generate Bills and Receipts"
            description={getStepRequirements(3).description}
            canExecute={getStepRequirements(3).canExecute}
            isLoading={isProcessing && processingStep === 3}
            onExecute={() => handleExecuteStep(3)}
            isCompleted={state.currentStep >= 3}
            compact={true}
          />

          {/* Rule File Uploader - Show when Step 2 is completed */}
          {state.currentStep >= 2 && (
            <RuleFileUploader
              onRuleFileUpload={(e) => handleRuleFileUpload(e, 3)}
              parsedRules={state.stepRules && state.stepRules.step3 ? state.stepRules.step3 : null}
              stepNumber={3}
            />
          )}

          {/* Data Update Import for Step 3 - Show after step is completed */}
          {canShowDataUpdate() && state.currentStep >= 3 && (
            <DataUpdateImporter
              currentData={getCurrentDataForUpdate()}
              onDataUpdate={handleDataUpdate}
              stepNumber={3}
              disabled={isProcessing}
            />
          )}
        </CollapsibleStepContainer>

        {/* Collapsible Step 4 - Excel Template Generation Only */}
        <CollapsibleStepContainer
          stepNumber={4}
          title="Prepare Data & Generate Excel Reports"
          description={getStepRequirements(4).description}
          isCompleted={state.currentStep >= 4}
          isActive={processingStep === 4}
          canExecute={getStepRequirements(4).canExecute}
          defaultExpanded={expandedSteps.step4}
        >
          <StepExecutor
            stepNumber={4}
            title="Prepare Data & Generate Excel Reports"
            description={getStepRequirements(4).description}
            canExecute={getStepRequirements(4).canExecute}
            isLoading={isProcessing && processingStep === 4}
            onExecute={() => handleExecuteStep(4)}
            isCompleted={state.currentStep >= 4}
            isStep4={true}
            compact={true}
          />

          {/* Excel Template Uploader - Show after step 3 is completed */}
          {state.currentStep >= 3 && (
            <TemplateUploader
              currentData={getCurrentDataForUpdate()}
              onTemplateLoad={handleStep4TemplateLoad}
              onExcelGenerate={handleStep4ExcelGenerate}
              societyName={state.selectedSociety}
              societyDetails={state.societyDetails && state.societyDetails[state.selectedSociety] ? state.societyDetails[state.selectedSociety] : {}}
              disabled={isProcessing}
            />
          )}
        </CollapsibleStepContainer>

        {/* Processed Data View with Editing and Horizontal Scrolling */}
        {state.processedData.length > 0 && (
          <ProcessedDataView
            data={state.filteredData}
            currentStep={state.currentStep}
            searchTerm={state.searchTerm}
            onSearchChange={actions.setSearchTerm}
            onExportExcel={() => handleExport('excel')}
            isImported={false}
          />
        )}
      </div>
    );
  };

  // NEW: Render view data tab
  const renderViewDataTab = () => (
    <ViewDataTab />
  );

  // Render rule converter tab
  const renderRuleConverterTab = () => (
    <RuleConverterTab />
  );

  // Render settings tab with session management and theme settings
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <SessionSettings />
      <ThemeSettings />
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header
        selectedSociety={state.selectedSociety}
        importedData={state.importedData}
        processedData={state.processedData}
        currentStep={state.currentStep}
      />

      <HorizontalNavBar
        activeTab={state.activeTab}
        setActiveTab={actions.setActiveTab}
        isVisible={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />

      <div className="flex">
        <Sidebar
          activeTab={state.activeTab}
          setActiveTab={actions.setActiveTab}
          selectedSociety={state.selectedSociety}
          hasData={state.filteredData.length > 0 || state.processedData.length > 0}
          onExport={handleExport}
          onClearData={actions.clearData}
          isCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        <main className="flex-1 p-6">
          <AlertMessage
            type="success"
            message={state.success}
            onClose={actions.clearMessages}
          />

          <AlertMessage
            type="error"
            message={state.error}
            onClose={actions.clearMessages}
          />

          {state.activeTab === 'import' && renderImportTab()}
          {state.activeTab === 'process' && renderProcessTab()}
          {state.activeTab === 'view' && renderViewDataTab()} {/* NEW TAB HANDLER */}
          {state.activeTab === 'converter' && renderRuleConverterTab()}
          {state.activeTab === 'settings' && renderSettingsTab()}
        </main>
      </div>

      {/* Enhanced Progress Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Processing Step {processingStep}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {processingStep === 1 && "Initializing data with rules..."}
                  {processingStep === 2 && "Calculating financial balances..."}
                  {processingStep === 3 && "Generating bills and receipts..."}
                  {processingStep === 4 && "Preparing data for Excel generation..."}
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {processingProgress}%
              </div>
              
              {processingProgress > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Please wait while we process your data...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App component with all providers
const SecureGawdeAccountService = () => {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SessionProvider>
    </ThemeProvider>
  );
};

export default SecureGawdeAccountService;