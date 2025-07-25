// src/components/ui/HorizontalNavBar.jsx - UPDATED WITH VIEW DATA OPTION
import React from 'react';
import { 
  Upload, 
  RefreshCw, 
  Code, 
  Settings,
  Menu,
  BarChart3
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'import', label: 'Import Data', icon: Upload, gradient: 'from-blue-500 to-blue-600' },
  { id: 'process', label: 'Process Data', icon: RefreshCw, gradient: 'from-green-500 to-green-600' },
  { id: 'view', label: 'View Data', icon: BarChart3, gradient: 'from-purple-500 to-purple-600' }, // NEW
  { id: 'converter', label: 'Rule Converter', icon: Code, gradient: 'from-orange-500 to-orange-600' },
  { id: 'settings', label: 'Settings', icon: Settings, gradient: 'from-gray-500 to-gray-600' }
];

const HorizontalNavBar = ({ activeTab, setActiveTab, isVisible, toggleSidebar }) => {
  if (!isVisible) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200">
      <div className="px-6 py-3">
        <nav className="flex items-center gap-2">
          {/* Show Sidebar Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 group mr-4"
            title="Show sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
          </button>
          
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-md transform scale-105'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:transform hover:scale-105'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default HorizontalNavBar;