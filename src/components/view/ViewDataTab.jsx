// src/components/view/ViewDataTab.jsx - Updated with Bill Register Header Merge Range Support
import React, { useState } from 'react';
import { BarChart3, Database, FileSpreadsheet, AlertCircle, TrendingUp, Receipt, FileText, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ProcessedDataView from '../process/ProcessedDataView';
import ReportGenerationModal from './ReportGenerationModal';

const ViewDataTab = () => {
  const { state, actions } = useApp();
  
  // Report generation state
  const [activeReportModal, setActiveReportModal] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Calculate summary statistics
  const getSummaryStats = () => {
    const stats = {
      importedCount: state.importedData.length,
      processedCount: state.processedData.length,
      currentStep: state.currentStep,
      hasData: state.importedData.length > 0 || state.processedData.length > 0
    };

    // Calculate financial summary for processed data
    if (state.processedData.length > 0) {
      const parseAmount = (value) => parseFloat(value) || 0;
      
      stats.totalOutstanding = state.processedData.reduce((sum, row) => 
        sum + parseAmount(row.OUTST_BAL), 0
      );
      stats.totalArrears = state.processedData.reduce((sum, row) => 
        sum + parseAmount(row.ARREARS), 0
      );
      stats.totalAdvance = state.processedData.reduce((sum, row) => 
        sum + parseAmount(row.ADVANCE), 0
      );
    }

    return stats;
  };

  const summaryStats = getSummaryStats();

  // Export handlers
  const handleExportImported = async () => {
    try {
      const { exportToExcel } = await import('../../services/excelService');
      
      if (!state.importedData || state.importedData.length === 0) {
        actions.setError('No imported data to export');
        return;
      }
      
      // Clean the data
      const cleanData = state.importedData.map(row => {
        const cleanRow = { ...row };
        delete cleanRow._rowIndex;
        delete cleanRow._id;
        return cleanRow;
      });
      
      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const societyName = state.selectedSociety ? state.selectedSociety.replace(/[^a-zA-Z0-9]/g, '_') : 'Society';
      const filename = `${societyName}_ImportedData_${date}.xlsx`;
      
      await exportToExcel(cleanData, filename);
      actions.setSuccess(`Imported data exported successfully! File: ${filename}`);
      
    } catch (error) {
      console.error('Export imported data error:', error);
      actions.setError(`Failed to export imported data: ${error.message}`);
    }
  };

  const handleExportProcessed = async () => {
    try {
      const { exportToExcel } = await import('../../services/excelService');
      
      if (!state.processedData || state.processedData.length === 0) {
        actions.setError('No processed data to export');
        return;
      }
      
      // Clean the data
      const cleanData = state.processedData.map(row => {
        const cleanRow = { ...row };
        delete cleanRow._rowIndex;
        delete cleanRow._id;
        return cleanRow;
      });
      
      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const societyName = state.selectedSociety ? state.selectedSociety.replace(/[^a-zA-Z0-9]/g, '_') : 'Society';
      const filename = `${societyName}_ProcessedData_Step${state.currentStep}_${date}.xlsx`;
      
      await exportToExcel(cleanData, filename);
      actions.setSuccess(`Processed data exported successfully! File: ${filename}`);
      
    } catch (error) {
      console.error('Export processed data error:', error);
      actions.setError(`Failed to export processed data: ${error.message}`);
    }
  };

  // Report Generation Handlers
  const handleReceiptRegisterReport = () => {
    setActiveReportModal('receipt');
  };

  const handleBillRegisterReport = () => {
    setActiveReportModal('bill');
  };

  const handleMemberDetailReport = () => {
    setActiveReportModal('member');
  };

  // UPDATED: Handle report generation with headerMergeRange support for both receipt and bill
  const handleGenerateReport = async (reportConfig) => {
    try {
      setIsGeneratingReport(true);
      
      // Import the report generation service
      const { generateSpecializedReport } = await import('../../services/reportGenerationService');
      
      // Get the processed data
      const dataToUse = state.processedData.length > 0 ? state.processedData : state.importedData;
      
      if (!dataToUse || dataToUse.length === 0) {
        actions.setError('No processed data available for report generation');
        return;
      }

      // Get society details for the selected society
      const currentSocietyDetails = state.societyDetails[state.selectedSociety] || {};
      
      console.log('🏢 Using society details for report generation:', {
        societyName: state.selectedSociety,
        details: currentSocietyDetails,
        headerMergeRange: reportConfig.headerMergeRange // Log the merge range
      });

      // UPDATED: Build config with headerMergeRange for receipt and bill reports
      const generationConfig = {
        data: dataToUse,
        template: reportConfig.template,
        outputMode: reportConfig.outputMode,
        reportType: reportConfig.reportType,
        societyName: state.selectedSociety,
        societyDetails: currentSocietyDetails
      };

      // NEW: Add headerMergeRange for receipt and bill reports
      if ((reportConfig.reportType === 'receipt' || reportConfig.reportType === 'bill') && reportConfig.headerMergeRange) {
        generationConfig.headerMergeRange = reportConfig.headerMergeRange;
        console.log(`📊 Setting header merge range for ${reportConfig.reportType}: ${reportConfig.headerMergeRange}`);
      }

      // NEW: Add selected total fields for bill reports
      if (reportConfig.reportType === 'bill' && reportConfig.selectedTotalFields) {
        generationConfig.selectedTotalFields = reportConfig.selectedTotalFields;
        console.log(`📊 Setting selected total fields for bill: ${reportConfig.selectedTotalFields.join(', ')}`);
      }

      // Generate the report
      const result = await generateSpecializedReport(generationConfig);

      if (result.success) {
        // NEW: Show the merge range used in success message for receipt and bill reports
        let successMessage = `${result.reportType} generated successfully! File: ${result.filename}`;
        if (result.headerMergeRange && (reportConfig.reportType === 'receipt' || reportConfig.reportType === 'bill')) {
          successMessage += ` (Header range: ${result.headerMergeRange})`;
        }
        
        actions.setSuccess(successMessage);
        setActiveReportModal(null);
      } else {
        actions.setError(result.error || 'Failed to generate report');
      }

    } catch (error) {
      console.error('Report generation error:', error);
      actions.setError(`Failed to generate report: ${error.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Helper function for ProcessedDataView export integration
  const createExportHandler = (dataType) => {
    return async () => {
      if (dataType === 'imported') {
        await handleExportImported();
      } else {
        await handleExportProcessed();
      }
    };
  };

  // Render empty state
  const renderEmptyState = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          No Data Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {!state.selectedSociety 
            ? "Please select a society first to view data."
            : "No data has been imported yet. Start by importing your Excel or CSV files."
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!state.selectedSociety ? (
            <button
              onClick={() => actions.setActiveTab('import')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Database className="w-5 h-5 mr-2" />
              Select Society
            </button>
          ) : (
            <button
              onClick={() => actions.setActiveTab('import')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Import Data
            </button>
          )}
          {state.selectedSociety && (
            <button
              onClick={() => actions.setActiveTab('process')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Process Data
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render summary statistics
  const renderSummaryStats = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Data Overview - {state.selectedSociety}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current data status and summary statistics
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Processing Step</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                Step {summaryStats.currentStep}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500 dark:text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );

  // Render 3 Report Generation Buttons (only show after Step 3)
  const renderReportButtons = () => {
    if (summaryStats.currentStep < 3 || summaryStats.processedCount === 0) {
      return null;
    }

    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Specialized Report Generation
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Generate specialized Excel reports from your processed data with custom templates
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={handleReceiptRegisterReport}
            className="flex items-center justify-center px-4 py-4 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
          >
            <div className="text-center">
              <Receipt className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-green-800 dark:text-green-200">Receipt Register</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">Payment receipts report</div>
            </div>
          </button>
          
          <button
            onClick={handleBillRegisterReport}
            className="flex items-center justify-center px-4 py-4 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
          >
            <div className="text-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-blue-800 dark:text-blue-200">Bill Register</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Monthly billing report</div>
            </div>
          </button>
          
          <button
            onClick={handleMemberDetailReport}
            className="flex items-center justify-center px-4 py-4 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
          >
            <div className="text-center">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-purple-800 dark:text-purple-200">Member Detail</div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Individual member reports</div>
            </div>
          </button>
        </div>
        
        <div className="mt-4 text-xs text-green-600 dark:text-green-400">
          💡 <strong>Tip:</strong> These reports will be generated with your currently processed data (Step {summaryStats.currentStep}). 
          Upload your own Excel templates for custom formatting. For Receipt Register and Bill Register, you can also specify the header merge range.
        </div>
      </div>
    );
  };

  // Main render
  if (!summaryStats.hasData) {
    return (
      <div className="space-y-6">
        {state.selectedSociety && renderSummaryStats()}
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      {renderSummaryStats()}

      {/* Processing Status Information */}
      {summaryStats.processedCount > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Data Processing Status
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Data has been processed through Step {summaryStats.currentStep}. 
                {summaryStats.currentStep < 4 
                  ? " You can continue processing or view the current results below."
                  : " All processing steps are complete. Data is ready for Excel generation."
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Report Generation Buttons */}
      {renderReportButtons()}

      {/* Processed Data Section */}
      {summaryStats.processedCount > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Processed Data (Step {summaryStats.currentStep})
            </h2>
            <button
              onClick={handleExportProcessed}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Processed
            </button>
          </div>
          
          <ProcessedDataView
            data={state.filteredData}
            currentStep={state.currentStep}
            searchTerm={state.searchTerm}
            onSearchChange={actions.setSearchTerm}
            onExportExcel={createExportHandler('processed')}
            isImported={false}
            defaultHideValidation={true}
          />
        </div>
      )}

      {/* Imported Data Section */}
      {summaryStats.importedCount > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Imported Data (Original)
            </h2>
            <button
              onClick={handleExportImported}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Imported
            </button>
          </div>
          
          <ProcessedDataView
            data={state.importedData}
            currentStep={0}
            searchTerm={state.searchTerm}
            onSearchChange={actions.setSearchTerm}
            onExportExcel={createExportHandler('imported')}
            isImported={true}
            defaultHideValidation={true}
          />
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">💡 Tips for Data Viewing</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Click on any cell to edit its value directly</li>
          <li>• Use the search box to filter records across all columns</li>
          <li>• Click column headers to sort data</li>
          <li>• Use "Show All" to view extra columns beyond the standard template</li>
          <li>• Export data in Excel format for external analysis</li>
          {summaryStats.processedCount > 0 && (
            <li>• Financial validation indicators show calculation accuracy</li>
          )}
          {summaryStats.currentStep >= 3 && (
            <li>• Use the 3 specialized report buttons above to generate Receipt Register, Bill Register, and Member Detail reports with custom templates</li>
          )}
          <li>• For Receipt Register and Bill Register: Specify header merge range (e.g., A:H for receipts, A:J for bills) to match your template width</li>
        </ul>
      </div>

      {/* Report Generation Modal */}
      <ReportGenerationModal
        isOpen={activeReportModal !== null}
        onClose={() => setActiveReportModal(null)}
        reportType={activeReportModal}
        onGenerate={handleGenerateReport}
        isGenerating={isGeneratingReport}
      />
    </div>
  );
};

export default ViewDataTab;