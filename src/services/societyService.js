// src/services/societyService.js - Society Management Service (Bill Period Removed)
import defaultSocietiesConfig from '../config/defaultSocieties.json';

class SocietyService {
  constructor() {
    this.storageKey = 'gawde_societies_v2';
    this.detailsStorageKey = 'gawde_society_details_v2';
    this.defaultSocieties = defaultSocietiesConfig.societies || [];
  }

  /**
   * Generate a unique ID for a society
   */
  generateSocietyId(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  /**
   * Get all societies (default + user-added)
   */
  async getAllSocieties() {
    try {
      // Get user-added societies from localStorage
      const userSocieties = this.getUserSocieties();
      
      // Combine default and user societies
      const allSocieties = [...this.defaultSocieties, ...userSocieties];
      
      // Sort by name for better UX
      return allSocieties.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting all societies:', error);
      return this.defaultSocieties;
    }
  }

  /**
   * Get user-added societies from localStorage
   */
  getUserSocieties() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading user societies from localStorage:', error);
      return [];
    }
  }

  /**
   * Save user societies to localStorage
   */
  saveUserSocieties(societies) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(societies));
      return true;
    } catch (error) {
      console.error('Error saving user societies to localStorage:', error);
      return false;
    }
  }

  /**
   * Add a new society
   */
  async addSociety(societyData) {
    try {
      const { name, regNo = '', address = '' } = societyData;
      
      // Validate required data
      if (!name || !name.trim()) {
        throw new Error('Society name is required');
      }

      const trimmedName = name.trim();
      
      // Check if society already exists
      const allSocieties = await this.getAllSocieties();
      const existingSociety = allSocieties.find(s => 
        s.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (existingSociety) {
        throw new Error('A society with this name already exists');
      }

      // Create new society object
      const newSociety = {
        id: this.generateSocietyId(trimmedName),
        name: trimmedName,
        regNo: regNo.trim(),
        address: address.trim(),
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Get current user societies and add the new one
      const userSocieties = this.getUserSocieties();
      userSocieties.push(newSociety);

      // Save to localStorage
      const saved = this.saveUserSocieties(userSocieties);
      if (!saved) {
        throw new Error('Failed to save society to storage');
      }

      console.log('Society added successfully:', newSociety);
      return {
        success: true,
        society: newSociety,
        message: 'Society added successfully'
      };

    } catch (error) {
      console.error('Error adding society:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an existing society
   */
  async updateSociety(societyName, updateData) {
    try {
      if (!societyName) {
        throw new Error('Society name is required');
      }

      const allSocieties = await this.getAllSocieties();
      const society = allSocieties.find(s => s.name === societyName);

      if (!society) {
        throw new Error('Society not found');
      }

      // For default societies, don't allow updates to core data
      if (society.isDefault) {
        throw new Error('Default societies cannot be modified');
      }

      // For user-added societies, allow full updates
      const userSocieties = this.getUserSocieties();
      const societyIndex = userSocieties.findIndex(s => s.name === societyName);

      if (societyIndex === -1) {
        throw new Error('User society not found');
      }

      // Update the society
      const updatedSociety = {
        ...userSocieties[societyIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // If name is being changed, update the ID too
      if (updateData.name && updateData.name !== societyName) {
        updatedSociety.id = this.generateSocietyId(updateData.name);
      }

      userSocieties[societyIndex] = updatedSociety;

      // Save to localStorage
      const saved = this.saveUserSocieties(userSocieties);
      if (!saved) {
        throw new Error('Failed to save society updates');
      }

      return {
        success: true,
        society: updatedSociety,
        message: 'Society updated successfully'
      };

    } catch (error) {
      console.error('Error updating society:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get society details
   */
  async getSocietyDetails(societyName) {
    try {
      const allSocieties = await this.getAllSocieties();
      const society = allSocieties.find(s => s.name === societyName);

      if (!society) {
        return null;
      }

      return society;
    } catch (error) {
      console.error('Error getting society details:', error);
      return null;
    }
  }

  /**
   * Delete a society (only user-added societies can be deleted)
   */
  async deleteSociety(societyName) {
    try {
      if (!societyName) {
        throw new Error('Society name is required');
      }

      // Check if it's a default society
      const defaultSociety = this.defaultSocieties.find(s => s.name === societyName);
      if (defaultSociety) {
        throw new Error('Default societies cannot be deleted');
      }

      // Remove from user societies
      const userSocieties = this.getUserSocieties();
      const filteredSocieties = userSocieties.filter(s => s.name !== societyName);

      if (filteredSocieties.length === userSocieties.length) {
        throw new Error('Society not found');
      }

      // Save updated list
      const saved = this.saveUserSocieties(filteredSocieties);
      if (!saved) {
        throw new Error('Failed to delete society from storage');
      }

      // Also clean up any related data
      this.cleanupSocietyData(societyName);

      return {
        success: true,
        message: 'Society deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting society:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up related data when a society is deleted
   */
  cleanupSocietyData(societyName) {
    try {
      // Remove society-specific data from localStorage
      const keysToRemove = [
        `gawde_data_${societyName}`,
        `gawde_processed_${societyName}`,
        `gawde_step_${societyName}`,
        `gawde_step_rules_${societyName}`
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`Cleaned up data for society: ${societyName}`);
    } catch (error) {
      console.error('Error cleaning up society data:', error);
    }
  }

  /**
   * Get society names only (for dropdown)
   */
  async getSocietyNames() {
    try {
      const allSocieties = await this.getAllSocieties();
      return allSocieties.map(s => s.name);
    } catch (error) {
      console.error('Error getting society names:', error);
      return this.defaultSocieties.map(s => s.name);
    }
  }

  /**
   * Search societies by name
   */
  async searchSocieties(searchTerm) {
    try {
      if (!searchTerm || !searchTerm.trim()) {
        return await this.getAllSocieties();
      }

      const allSocieties = await this.getAllSocieties();
      const lowercaseSearch = searchTerm.toLowerCase();

      return allSocieties.filter(society =>
        society.name.toLowerCase().includes(lowercaseSearch) ||
        society.regNo.toLowerCase().includes(lowercaseSearch) ||
        society.address.toLowerCase().includes(lowercaseSearch)
      );
    } catch (error) {
      console.error('Error searching societies:', error);
      return [];
    }
  }

  /**
   * Export all societies data
   */
  async exportSocietiesData() {
    try {
      const allSocieties = await this.getAllSocieties();

      const exportData = {
        societies: allSocieties,
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '2.0.0',
          totalSocieties: allSocieties.length,
          userAddedSocieties: allSocieties.filter(s => !s.isDefault).length,
          defaultSocieties: allSocieties.filter(s => s.isDefault).length
        }
      };

      return {
        success: true,
        data: exportData
      };
    } catch (error) {
      console.error('Error exporting societies data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get statistics about societies
   */
  async getStatistics() {
    try {
      const allSocieties = await this.getAllSocieties();
      const userSocieties = this.getUserSocieties();

      return {
        total: allSocieties.length,
        default: this.defaultSocieties.length,
        userAdded: userSocieties.length,
        recentlyAdded: userSocieties.filter(s => {
          const createdDate = new Date(s.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdDate > thirtyDaysAgo;
        }).length
      };
    } catch (error) {
      console.error('Error getting society statistics:', error);
      return {
        total: 0,
        default: 0,
        userAdded: 0,
        recentlyAdded: 0
      };
    }
  }

  /**
   * Initialize the service (for testing or setup)
   */
  async initialize() {
    try {
      console.log('Initializing Society Service...');
      const stats = await this.getStatistics();
      console.log('Society Service Statistics:', stats);
      return true;
    } catch (error) {
      console.error('Error initializing Society Service:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
export const societyService = new SocietyService();
export default societyService;