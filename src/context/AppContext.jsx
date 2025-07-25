// src/context/AppContext.jsx - Updated with Delete Society Action
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import societyService from '../services/societyService';

const AppContext = createContext();

// Action types
const ACTION_TYPES = {
  SET_SOCIETIES: 'SET_SOCIETIES',
  SET_SELECTED_SOCIETY: 'SET_SELECTED_SOCIETY',
  SET_SOCIETY_DETAILS: 'SET_SOCIETY_DETAILS',
  SET_IMPORTED_DATA: 'SET_IMPORTED_DATA',
  SET_PROCESSED_DATA: 'SET_PROCESSED_DATA',
  SET_FILTERED_DATA: 'SET_FILTERED_DATA',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SUCCESS: 'SET_SUCCESS',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_PARSED_RULES: 'SET_PARSED_RULES',
  SET_STEP_RULES: 'SET_STEP_RULES',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  SET_SOCIETY_STATISTICS: 'SET_SOCIETY_STATISTICS'
};

// Initial state
const initialState = {
  societies: [],
  selectedSociety: '',
  societyDetails: {}, // Store society details: { societyName: { regNo, address } }
  societyStatistics: null, // Society statistics
  importedData: [],
  processedData: [],
  filteredData: [],
  currentStep: 0,
  searchTerm: '',
  isLoading: false,
  error: '',
  success: '',
  activeTab: 'import',
  parsedRules: [],
  stepRules: {
    step1: null,
    step2: null,
    step3: null,
    step4: null
  }
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_SOCIETIES:
      return { ...state, societies: action.payload };
    
    case ACTION_TYPES.SET_SELECTED_SOCIETY:
      return { ...state, selectedSociety: action.payload };
    
    case ACTION_TYPES.SET_SOCIETY_DETAILS:
      return { 
        ...state, 
        societyDetails: {
          ...state.societyDetails,
          [action.payload.societyName]: action.payload.details
        }
      };
    
    case ACTION_TYPES.SET_SOCIETY_STATISTICS:
      return { ...state, societyStatistics: action.payload };
    
    case ACTION_TYPES.SET_IMPORTED_DATA:
      return { 
        ...state, 
        importedData: action.payload,
        filteredData: action.payload,
        processedData: [],
        currentStep: 0
      };
    
    case ACTION_TYPES.SET_PROCESSED_DATA:
      return { 
        ...state, 
        processedData: action.payload,
        filteredData: action.payload
      };
    
    case ACTION_TYPES.SET_FILTERED_DATA:
      return { ...state, filteredData: action.payload };
    
    case ACTION_TYPES.SET_CURRENT_STEP:
      return { ...state, currentStep: action.payload };
    
    case ACTION_TYPES.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };
    
    case ACTION_TYPES.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, success: '' };
    
    case ACTION_TYPES.SET_SUCCESS:
      return { ...state, success: action.payload, error: '' };
    
    case ACTION_TYPES.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
    
    case ACTION_TYPES.SET_PARSED_RULES:
      return { ...state, parsedRules: action.payload };
    
    case ACTION_TYPES.SET_STEP_RULES:
      return { 
        ...state, 
        stepRules: {
          ...state.stepRules,
          [action.payload.step]: action.payload.rules
        }
      };
    
    case ACTION_TYPES.CLEAR_MESSAGES:
      return { ...state, error: '', success: '' };
    
    default:
      return state;
  }
};

// Context Provider Component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize societies from the society service
  const initializeSocieties = useCallback(async () => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      
      // Initialize the society service
      await societyService.initialize();
      
      // Get all societies (default + user-added)
      const societies = await societyService.getAllSocieties();
      const societyNames = societies.map(s => s.name);
      
      // Get statistics
      const stats = await societyService.getStatistics();
      
      dispatch({ type: ACTION_TYPES.SET_SOCIETIES, payload: societyNames });
      dispatch({ type: ACTION_TYPES.SET_SOCIETY_STATISTICS, payload: stats });
      
      // Load society details into memory for quick access
      const societyDetailsMap = {};
      societies.forEach(society => {
        societyDetailsMap[society.name] = {
          regNo: society.regNo || '',
          address: society.address || '',
          isDefault: society.isDefault || false,
          id: society.id,
          createdAt: society.createdAt,
          updatedAt: society.updatedAt
        };
      });

      // Update state with all society details
      Object.entries(societyDetailsMap).forEach(([societyName, details]) => {
        dispatch({ 
          type: ACTION_TYPES.SET_SOCIETY_DETAILS, 
          payload: { societyName, details }
        });
      });

      console.log(`Loaded ${societies.length} societies (${stats.default} default, ${stats.userAdded} user-added)`);
      
    } catch (error) {
      console.error('Error initializing societies:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: 'Failed to load societies. Please refresh the page.' });
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  }, []);

  // Initialize societies on app start
  useEffect(() => {
    initializeSocieties();
  }, [initializeSocieties]);

  // Load saved data for selected society
  useEffect(() => {
    if (state.selectedSociety) {
      const savedData = localStorage.getItem(`gawde_data_${state.selectedSociety}`);
      const savedProcessedData = localStorage.getItem(`gawde_processed_${state.selectedSociety}`);
      const savedStep = localStorage.getItem(`gawde_step_${state.selectedSociety}`);
      const savedStepRules = localStorage.getItem(`gawde_step_rules_${state.selectedSociety}`);
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          dispatch({ type: ACTION_TYPES.SET_IMPORTED_DATA, payload: Array.isArray(parsedData) ? parsedData : [] });
        } catch (error) {
          console.error('Error parsing saved data:', error);
          dispatch({ type: ACTION_TYPES.SET_IMPORTED_DATA, payload: [] });
        }
      } else {
        dispatch({ type: ACTION_TYPES.SET_IMPORTED_DATA, payload: [] });
      }

      if (savedProcessedData) {
        try {
          const parsedProcessedData = JSON.parse(savedProcessedData);
          dispatch({ type: ACTION_TYPES.SET_PROCESSED_DATA, payload: Array.isArray(parsedProcessedData) ? parsedProcessedData : [] });
        } catch (error) {
          console.error('Error parsing processed data:', error);
          dispatch({ type: ACTION_TYPES.SET_PROCESSED_DATA, payload: [] });
        }
      } else {
        dispatch({ type: ACTION_TYPES.SET_PROCESSED_DATA, payload: [] });
      }

      if (savedStepRules) {
        try {
          const parsedStepRules = JSON.parse(savedStepRules);
          if (parsedStepRules && typeof parsedStepRules === 'object') {
            Object.entries(parsedStepRules).forEach(([step, rules]) => {
              dispatch({ 
                type: ACTION_TYPES.SET_STEP_RULES, 
                payload: { step, rules: rules || null }
              });
            });
          }
        } catch (error) {
          console.error('Error parsing step rules:', error);
        }
      } else {
        // Initialize with null values if no saved rules
        ['step1', 'step2', 'step3', 'step4'].forEach(step => {
          dispatch({ 
            type: ACTION_TYPES.SET_STEP_RULES, 
            payload: { step, rules: null }
          });
        });
      }

      dispatch({ 
        type: ACTION_TYPES.SET_CURRENT_STEP, 
        payload: savedStep ? parseInt(savedStep) || 0 : 0 
      });
    }
  }, [state.selectedSociety]);

  // Save data to localStorage
  useEffect(() => {
    if (state.selectedSociety && state.importedData.length > 0) {
      localStorage.setItem(`gawde_data_${state.selectedSociety}`, JSON.stringify(state.importedData));
    }
  }, [state.importedData, state.selectedSociety]);

  useEffect(() => {
    if (state.selectedSociety && state.processedData.length > 0) {
      localStorage.setItem(`gawde_processed_${state.selectedSociety}`, JSON.stringify(state.processedData));
    }
  }, [state.processedData, state.selectedSociety]);

  useEffect(() => {
    if (state.selectedSociety) {
      localStorage.setItem(`gawde_step_${state.selectedSociety}`, state.currentStep.toString());
    }
  }, [state.currentStep, state.selectedSociety]);

  useEffect(() => {
    if (state.selectedSociety && Object.values(state.stepRules).some(rules => 
      (Array.isArray(rules) && rules.length > 0) || 
      (rules && typeof rules === 'object' && !Array.isArray(rules))
    )) {
      localStorage.setItem(`gawde_step_rules_${state.selectedSociety}`, JSON.stringify(state.stepRules));
    }
  }, [state.stepRules, state.selectedSociety]);

  // Filter data based on search term
  useEffect(() => {
    const dataToFilter = state.processedData.length > 0 ? state.processedData : state.importedData;
    if (!state.searchTerm) {
      dispatch({ type: ACTION_TYPES.SET_FILTERED_DATA, payload: dataToFilter });
    } else {
      const filtered = dataToFilter.filter(row =>
        Object.values(row || {}).some(value =>
          String(value || '').toLowerCase().includes(state.searchTerm.toLowerCase())
        )
      );
      dispatch({ type: ACTION_TYPES.SET_FILTERED_DATA, payload: filtered });
    }
  }, [state.searchTerm, state.importedData, state.processedData]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (state.success || state.error) {
      const timer = setTimeout(() => {
        dispatch({ type: ACTION_TYPES.CLEAR_MESSAGES });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.success, state.error]);

  // Action creators
  const actions = {
    setSocieties: (societies) => dispatch({ type: ACTION_TYPES.SET_SOCIETIES, payload: Array.isArray(societies) ? societies : [] }),
    setSelectedSociety: (society) => dispatch({ type: ACTION_TYPES.SET_SELECTED_SOCIETY, payload: society || '' }),
    setSocietyDetails: (societyName, details) => {
      if (societyName && details) {
        dispatch({ 
          type: ACTION_TYPES.SET_SOCIETY_DETAILS, 
          payload: { societyName, details }
        });
      }
    },
    setImportedData: (data) => dispatch({ type: ACTION_TYPES.SET_IMPORTED_DATA, payload: Array.isArray(data) ? data : [] }),
    setProcessedData: (data) => dispatch({ type: ACTION_TYPES.SET_PROCESSED_DATA, payload: Array.isArray(data) ? data : [] }),
    setCurrentStep: (step) => dispatch({ type: ACTION_TYPES.SET_CURRENT_STEP, payload: parseInt(step) || 0 }),
    setSearchTerm: (term) => dispatch({ type: ACTION_TYPES.SET_SEARCH_TERM, payload: term || '' }),
    setLoading: (loading) => dispatch({ type: ACTION_TYPES.SET_LOADING, payload: Boolean(loading) }),
    setError: (error) => dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error || '' }),
    setSuccess: (success) => dispatch({ type: ACTION_TYPES.SET_SUCCESS, payload: success || '' }),
    setActiveTab: (tab) => dispatch({ type: ACTION_TYPES.SET_ACTIVE_TAB, payload: tab || 'import' }),
    setParsedRules: (rules) => dispatch({ type: ACTION_TYPES.SET_PARSED_RULES, payload: Array.isArray(rules) ? rules : [] }),
    setStepRules: (step, rules) => {
      console.log(`Setting rules for ${step}:`, rules); // Debug log
      if (step) {
        dispatch({ 
          type: ACTION_TYPES.SET_STEP_RULES, 
          payload: { step, rules: rules || null }
        });
      }
    },
    clearMessages: () => dispatch({ type: ACTION_TYPES.CLEAR_MESSAGES }),
    
    // Enhanced society actions using societyService
    addSociety: async (societyName, societyDetails = {}) => {
      try {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
        
        const result = await societyService.addSociety({
          name: societyName,
          ...societyDetails
        });

        if (result.success) {
          // Refresh societies list
          await initializeSocieties();
          dispatch({ type: ACTION_TYPES.SET_SUCCESS, payload: result.message });
          return result.society;
        } else {
          dispatch({ type: ACTION_TYPES.SET_ERROR, payload: result.error });
          return null;
        }
      } catch (error) {
        console.error('Error adding society:', error);
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: 'Failed to add society. Please try again.' });
        return null;
      } finally {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
      }
    },

    updateSocietyDetails: async (societyName, details) => {
      try {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
        
        const result = await societyService.updateSociety(societyName, details);

        if (result.success) {
          // Update local state immediately
          dispatch({ 
            type: ACTION_TYPES.SET_SOCIETY_DETAILS, 
            payload: { societyName, details }
          });
          
          // Refresh societies list to get updated data
          await initializeSocieties();
          dispatch({ type: ACTION_TYPES.SET_SUCCESS, payload: result.message });
          return true;
        } else {
          dispatch({ type: ACTION_TYPES.SET_ERROR, payload: result.error });
          return false;
        }
      } catch (error) {
        console.error('Error updating society details:', error);
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: 'Failed to update society details. Please try again.' });
        return false;
      } finally {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
      }
    },

    // NEW: Delete Society Action
    deleteSociety: async (societyName) => {
      try {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
        
        const result = await societyService.deleteSociety(societyName);

        if (result.success) {
          // If the deleted society was selected, clear selection
          if (state.selectedSociety === societyName) {
            dispatch({ type: ACTION_TYPES.SET_SELECTED_SOCIETY, payload: '' });
            // Clear data for the deleted society
            dispatch({ type: ACTION_TYPES.SET_IMPORTED_DATA, payload: [] });
            dispatch({ type: ACTION_TYPES.SET_PROCESSED_DATA, payload: [] });
            dispatch({ type: ACTION_TYPES.SET_CURRENT_STEP, payload: 0 });
            ['step1', 'step2', 'step3', 'step4'].forEach(step => {
              dispatch({ 
                type: ACTION_TYPES.SET_STEP_RULES, 
                payload: { step, rules: null }
              });
            });
          }
          
          // Remove society details from state
          const updatedSocietyDetails = { ...state.societyDetails };
          delete updatedSocietyDetails[societyName];
          Object.entries(updatedSocietyDetails).forEach(([name, details]) => {
            dispatch({ 
              type: ACTION_TYPES.SET_SOCIETY_DETAILS, 
              payload: { societyName: name, details }
            });
          });
          
          // Refresh societies list
          await initializeSocieties();
          dispatch({ type: ACTION_TYPES.SET_SUCCESS, payload: result.message });
          return true;
        } else {
          dispatch({ type: ACTION_TYPES.SET_ERROR, payload: result.error });
          return false;
        }
      } catch (error) {
        console.error('Error deleting society:', error);
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: 'Failed to delete society. Please try again.' });
        return false;
      } finally {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
      }
    },

    searchSocieties: async (searchTerm) => {
      try {
        const results = await societyService.searchSocieties(searchTerm);
        const societyNames = results.map(s => s.name);
        dispatch({ type: ACTION_TYPES.SET_SOCIETIES, payload: societyNames });
        return results;
      } catch (error) {
        console.error('Error searching societies:', error);
        return [];
      }
    },

    refreshSocieties: async () => {
      try {
        await initializeSocieties();
        return true;
      } catch (error) {
        console.error('Error refreshing societies:', error);
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: 'Failed to refresh societies list.' });
        return false;
      }
    },

    exportSocietiesData: async () => {
      try {
        const result = await societyService.exportSocietiesData();
        if (result.success) {
          // Create and download the export file
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { 
            type: 'application/json' 
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `societies_export_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          dispatch({ type: ACTION_TYPES.SET_SUCCESS, payload: 'Societies data exported successfully!' });
          return true;
        } else {
          dispatch({ type: ACTION_TYPES.SET_ERROR, payload: result.error });
          return false;
        }
      } catch (error) {
        console.error('Error exporting societies data:', error);
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: 'Failed to export societies data.' });
        return false;
      }
    },
    
    clearData: () => {
      if (state.selectedSociety) {
        localStorage.removeItem(`gawde_data_${state.selectedSociety}`);
        localStorage.removeItem(`gawde_processed_${state.selectedSociety}`);
        localStorage.removeItem(`gawde_step_${state.selectedSociety}`);
        localStorage.removeItem(`gawde_step_rules_${state.selectedSociety}`);
        dispatch({ type: ACTION_TYPES.SET_IMPORTED_DATA, payload: [] });
        dispatch({ type: ACTION_TYPES.SET_PROCESSED_DATA, payload: [] });
        dispatch({ type: ACTION_TYPES.SET_CURRENT_STEP, payload: 0 });
        ['step1', 'step2', 'step3', 'step4'].forEach(step => {
          dispatch({ 
            type: ACTION_TYPES.SET_STEP_RULES, 
            payload: { step, rules: null }
          });
        });
        dispatch({ type: ACTION_TYPES.SET_SUCCESS, payload: 'Data cleared successfully!' });
      }
    }
  };

  const value = {
    state,
    actions,
    societyService // Expose service for advanced usage
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;