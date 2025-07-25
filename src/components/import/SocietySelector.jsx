// src/components/import/SocietySelector.jsx - Enhanced with Delete Functionality
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Calendar, Building, Search, Trash2, Database, Download, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i);
  }
  return years;
};

const SocietySelector = ({ 
  societies = [], 
  selectedSociety = '', 
  onSelectSociety, 
  onAddSociety,
  onDeleteSociety, // NEW PROP
  societyDetails = {},
  onUpdateSocietyDetails
}) => {
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // NEW STATE
  
  // Form states
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSocieties, setFilteredSocieties] = useState(societies);
  const [societyToDelete, setSocietyToDelete] = useState(null); // NEW STATE
  
  // Add society form
  const [addSocietyForm, setAddSocietyForm] = useState({
    name: '',
    regNo: '',
    address: ''
  });
  
  // Edit society form
  const [editSocietyForm, setEditSocietyForm] = useState({
    name: '',
    regNo: '',
    address: ''
  });

  // Society statistics
  const [societyStats, setSocietyStats] = useState(null);

  // Load society details when selectedSociety changes
  useEffect(() => {
    if (selectedSociety && societyDetails[selectedSociety]) {
      const details = societyDetails[selectedSociety];
      setEditSocietyForm({
        name: selectedSociety,
        regNo: details.regNo || '',
        address: details.address || ''
      });
    }
  }, [selectedSociety, societyDetails]);

  // Filter societies based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSocieties(societies);
    } else {
      const filtered = societies.filter(society =>
        society.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSocieties(filtered);
    }
  }, [societies, searchTerm]);

  // Load society statistics
  const loadSocietyStats = async () => {
    try {
      // This would come from the context/service
      const stats = {
        total: societies.length,
        default: societies.filter(s => societyDetails[s]?.isDefault).length,
        userAdded: societies.filter(s => !societyDetails[s]?.isDefault).length,
        recentlyAdded: 2 // This would be calculated from the service
      };
      setSocietyStats(stats);
    } catch (error) {
      console.error('Error loading society stats:', error);
    }
  };

  useEffect(() => {
    loadSocietyStats();
  }, [societies, societyDetails]);

  const handleAddSociety = async () => {
    const trimmedName = addSocietyForm.name.trim();
    
    // Validation
    if (!trimmedName) {
      setError('Society name cannot be empty');
      return;
    }

    if (trimmedName.length > 100) {
      setError('Society name too long (max 100 characters)');
      return;
    }

    if (societies.includes(trimmedName)) {
      setError('Society already exists');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call the enhanced addSociety action
      if (onAddSociety) {
        const result = await onAddSociety(trimmedName, {
          regNo: addSocietyForm.regNo.trim(),
          address: addSocietyForm.address.trim()
        });

        if (result) {
          // Reset form and close modal
          setAddSocietyForm({
            name: '',
            regNo: '',
            address: ''
          });
          setShowAddModal(false);
        }
      }
    } catch (error) {
      setError('Failed to add society. Please try again.');
      console.error('Add society error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSocietyDetails = async () => {
    if (!editSocietyForm.name.trim()) {
      setError('Society name cannot be empty');
      return;
    }

    if (editSocietyForm.address.length > 500) {
      setError('Address too long (max 500 characters)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const details = {
        regNo: editSocietyForm.regNo.trim(),
        address: editSocietyForm.address.trim()
      };

      if (onUpdateSocietyDetails) {
        const success = await onUpdateSocietyDetails(editSocietyForm.name, details);
        if (success) {
          setShowEditModal(false);
        }
      }
    } catch (error) {
      setError('Failed to update society details. Please try again.');
      console.error('Update society error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Handle delete society
  const handleDeleteSociety = async () => {
    if (!societyToDelete) return;

    setIsLoading(true);
    setError('');

    try {
      if (onDeleteSociety) {
        const success = await onDeleteSociety(societyToDelete);
        if (success) {
          setShowDeleteModal(false);
          setSocietyToDelete(null);
        }
      }
    } catch (error) {
      setError('Failed to delete society. Please try again.');
      console.error('Delete society error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Open delete confirmation modal
  const openDeleteModal = (societyName) => {
    const details = societyDetails[societyName];
    if (details && details.isDefault) {
      setError('Default societies cannot be deleted');
      return;
    }
    setSocietyToDelete(societyName);
    setShowDeleteModal(true);
  };

  const handleExportSocieties = async () => {
    try {
      // This would call the export action from context
      console.log('Exporting societies data...');
    } catch (error) {
      setError('Failed to export societies data.');
      console.error('Export error:', error);
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddSocietyForm({
      name: '',
      regNo: '',
      address: ''
    });
    setError('');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setError('');
    // Reset form to current society details
    if (selectedSociety && societyDetails[selectedSociety]) {
      const details = societyDetails[selectedSociety];
      setEditSocietyForm({
        name: selectedSociety,
        regNo: details.regNo || '',
        address: details.address || ''
      });
    }
  };

  const handleSocietyChange = (e) => {
    const society = e.target.value;
    if (onSelectSociety) {
      onSelectSociety(society);
    }
  };

  const getCurrentSocietyDetails = () => {
    if (!selectedSociety || !societyDetails[selectedSociety]) return null;
    return societyDetails[selectedSociety];
  };

  const getSocietyVariables = () => {
    const details = getCurrentSocietyDetails();
    if (!details) {
      return {
        SOCIETY_NAME: selectedSociety || '',
        SOCIETY_REG_NO: '',
        SOCIETY_ADDRESS: '',
        BILL_MONTH_FROM: '',
        BILL_MONTH_TO: '',
        BILL_YEAR: ''
      };
    }

    return {
      SOCIETY_NAME: selectedSociety || '',
      SOCIETY_REG_NO: details.regNo || '',
      SOCIETY_ADDRESS: details.address || ''
    };
  };

  const currentDetails = getCurrentSocietyDetails();
  const societyVars = getSocietyVariables();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Society Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStatsModal(true)}
            className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            title="View Statistics"
          >
            <Database className="w-4 h-4 mr-2" />
            Stats
          </button>
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            title="Search Societies"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </button>
          {selectedSociety && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Details
              </button>
              {/* NEW: Delete Button */}
              {selectedSociety && !currentDetails?.isDefault && (
                <button
                  onClick={() => openDeleteModal(selectedSociety)}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  title="Delete Society"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Society
          </button>
        </div>
      </div>
      
      {/* Society Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Society ({societies.length} available)
        </label>
        <select
          value={selectedSociety}
          onChange={handleSocietyChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          disabled={isLoading}
        >
          <option value="">Select a society...</option>
          {Array.isArray(societies) && societies.map((society) => (
            <option key={society} value={society}>
              {society} {societyDetails[society]?.isDefault ? '(Default)' : '(Custom)'}
            </option>
          ))}
        </select>
      </div>

      {/* Current Society Details Display */}
      {selectedSociety && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-blue-900 dark:text-blue-100">Current Society Details</h3>
            {currentDetails?.isDefault && (
              <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                Default
              </span>
            )}
            {!currentDetails?.isDefault && (
              <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                Custom
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="mb-2">
                <span className="font-medium text-blue-800 dark:text-blue-200">Name:</span>
                <div className="text-blue-700 dark:text-blue-300">{selectedSociety}</div>
              </div>
              <div className="mb-2">
                <span className="font-medium text-blue-800 dark:text-blue-200">Registration No:</span>
                <div className="text-blue-700 dark:text-blue-300">{currentDetails?.regNo || 'Not set'}</div>
              </div>
              <div className="mb-2">
                <span className="font-medium text-blue-800 dark:text-blue-200">Address:</span>
                <div className="text-blue-700 dark:text-blue-300 text-xs">{currentDetails?.address || 'Not set'}</div>
              </div>
            </div>
            
            <div>              
              <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-800 rounded">
                <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">Template Variables:</div>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <div>${'{SOCIETY_NAME}'} → {societyVars.SOCIETY_NAME || 'Not set'}</div>
                  <div>${'{SOCIETY_REG_NO}'} → {societyVars.SOCIETY_REG_NO || 'Not set'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Society Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="Add New Society"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Society Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Society Name *
            </label>
            <input
              type="text"
              value={addSocietyForm.name}
              onChange={(e) => setAddSocietyForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter society name (max 100 characters)"
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading}
            />
          </div>

          {/* Registration Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Registration Number
            </label>
            <input
              type="text"
              value={addSocietyForm.regNo}
              onChange={(e) => setAddSocietyForm(prev => ({ ...prev, regNo: e.target.value }))}
              placeholder="e.g., MH/123/2020"
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Society Address
            </label>
            <textarea
              value={addSocietyForm.address}
              onChange={(e) => setAddSocietyForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter complete society address"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddSociety}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add Society'}
            </button>
            <button
              onClick={handleCloseAddModal}
              disabled={isLoading}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Society Details Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Edit Society Details"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Society Name (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Society Name
            </label>
            <input
              type="text"
              value={editSocietyForm.name}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
            />
            {currentDetails?.isDefault && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Note: This is a default society. Only bill period can be modified.
              </p>
            )}
          </div>

          {/* Registration Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Registration Number
            </label>
            <input
              type="text"
              value={editSocietyForm.regNo}
              onChange={(e) => setEditSocietyForm(prev => ({ ...prev, regNo: e.target.value }))}
              placeholder="e.g., MH/123/2020"
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading || currentDetails?.isDefault}
            />
            {currentDetails?.isDefault && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Registration number cannot be changed for default societies</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Society Address
            </label>
            <textarea
              value={editSocietyForm.address}
              onChange={(e) => setEditSocietyForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter complete society address"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading || currentDetails?.isDefault}
            />
            {currentDetails?.isDefault && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Address cannot be changed for default societies</p>
            )}
          </div>

          {/* Template Variables Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-3">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Template Variables Preview:</h5>
            <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
              <div>${'{SOCIETY_NAME}'} → {editSocietyForm.name}</div>
              <div>${'{SOCIETY_REG_NO}'} → {editSocietyForm.regNo || 'Empty'}</div>
              <div>${'{SOCIETY_ADDRESS}'} → {editSocietyForm.address || 'Empty'}</div>
            </div>
          </div>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpdateSocietyDetails}
              disabled={isLoading}
              className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Details'}
            </button>
            <button
              onClick={handleCloseEditModal}
              disabled={isLoading}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* NEW: Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Society"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">Warning: Permanent Action</h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                This action cannot be undone and will permanently delete all associated data.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Society to be deleted:</h4>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div><strong>Name:</strong> {societyToDelete}</div>
              {societyDetails[societyToDelete]?.regNo && (
                <div><strong>Registration No:</strong> {societyDetails[societyToDelete].regNo}</div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">What will be deleted:</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Society details and configuration</li>
              <li>• All imported data for this society</li>
              <li>• All processed data and calculations</li>
              <li>• All step rules and configurations</li>
              <li>• All related application data</li>
            </ul>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <div className="text-blue-600 dark:text-blue-400">ℹ️</div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> Consider exporting your data before deletion if you want to keep a backup.
            </p>
          </div>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDeleteSociety}
              disabled={isLoading}
              className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {isLoading ? 'Deleting...' : 'Delete Society'}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={isLoading}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Society Statistics"
      >
        <div className="space-y-4">
          {societyStats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{societyStats.total}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total Societies</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{societyStats.default}</div>
                <div className="text-sm text-green-700 dark:text-green-300">Default Societies</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{societyStats.userAdded}</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">User Added</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{societyStats.recentlyAdded}</div>
                <div className="text-sm text-orange-700 dark:text-orange-300">Recently Added</div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleExportSocieties}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Societies Data
            </button>
          </div>
        </div>
      </Modal>

      {/* Search Modal */}
      <Modal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="Search Societies"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search by name, registration number, or address
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {filteredSocieties.length} of {societies.length} societies
            </div>
            
            {filteredSocieties.map((society) => (
              <div
                key={society}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg mb-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{society}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {societyDetails[society]?.regNo || 'No registration number'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {societyDetails[society]?.isDefault ? (
                      <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        Default
                      </span>
                    ) : (
                      <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectSociety && onSelectSociety(society);
                      setShowSearchModal(false);
                    }}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Select
                  </button>
                  
                  {/* Show delete button for custom societies only */}
                  {!societyDetails[society]?.isDefault && (
                    <button
                      onClick={() => {
                        setShowSearchModal(false);
                        openDeleteModal(society);
                      }}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      title="Delete Society"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredSocieties.length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No societies found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SocietySelector;