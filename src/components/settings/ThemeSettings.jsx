// src/components/settings/ThemeSettings.jsx - Simple Fixed Version
import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Check,
  Sparkles,
  Zap,
  Settings as SettingsIcon
} from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';

const ThemeSettings = () => {
  const {
    currentTheme,
    themes,
    preferences,
    setTheme,
    toggleMode,
    updatePreferences,
    isDarkMode
  } = useTheme();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleThemeChange = (themeName) => {
    setTheme(themeName);
  };

  const handleSystemThemeToggle = () => {
    updatePreferences({ useSystemTheme: !preferences.useSystemTheme });
  };

  const handleAnimationsToggle = () => {
    updatePreferences({ animations: !preferences.animations });
  };

  const handleReducedMotionToggle = () => {
    updatePreferences({ reducedMotion: !preferences.reducedMotion });
  };

  const resetToDefaults = () => {
    setTheme('light');
    updatePreferences({
      useSystemTheme: false,
      animations: true,
      reducedMotion: false
    });
  };

  const getThemeIcon = (themeName) => {
    switch (themeName) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      default:
        return <Palette className="w-5 h-5" />;
    }
  };

  const getThemePreview = (themeName) => {
    const colors = themeName === 'dark' 
      ? ['#0f172a', '#3b82f6', '#22c55e']
      : ['#ffffff', '#3b82f6', '#10b981'];
    
    return (
      <div className="flex gap-1 mt-2">
        {colors.map((color, index) => (
          <div 
            key={index}
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Theme & Appearance
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customize the visual appearance of the application
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Theme Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Dark Mode
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Switch between light and dark themes
            </p>
          </div>
          <button
            onClick={toggleMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isDarkMode() 
                ? 'bg-purple-600' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDarkMode() ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
            <span className="sr-only">Toggle dark mode</span>
          </button>
        </div>

        {/* Theme Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Theme Selection
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(themes).map(([themeName, theme]) => (
              <button
                key={themeName}
                onClick={() => handleThemeChange(themeName)}
                className={`p-3 border-2 rounded-lg text-left transition-all hover:scale-105 ${
                  currentTheme === themeName
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getThemeIcon(themeName)}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {theme.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {theme.description}
                      </div>
                    </div>
                  </div>
                  {currentTheme === themeName && (
                    <Check className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                {getThemePreview(themeName)}
              </button>
            ))}
          </div>
        </div>

        {/* System Theme Integration */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Use System Theme
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Automatically switch based on system preference
              </div>
            </div>
          </div>
          <button
            onClick={handleSystemThemeToggle}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              preferences.useSystemTheme 
                ? 'bg-purple-600' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                preferences.useSystemTheme ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            {/* Animation Settings */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Enable Animations
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Smooth transitions and effects
                  </div>
                </div>
              </div>
              <button
                onClick={handleAnimationsToggle}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  preferences.animations 
                    ? 'bg-yellow-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    preferences.animations ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Reduce Motion
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Minimize animations for accessibility
                  </div>
                </div>
              </div>
              <button
                onClick={handleReducedMotionToggle}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  preferences.reducedMotion 
                    ? 'bg-orange-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    preferences.reducedMotion ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>

        {/* Current Theme Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Current Theme
            </span>
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <div>Mode: {themes[currentTheme]?.name || currentTheme}</div>
            <div>System Integration: {preferences.useSystemTheme ? 'Enabled' : 'Disabled'}</div>
            <div>Animations: {preferences.animations ? 'Enabled' : 'Disabled'}</div>
            <div>Reduced Motion: {preferences.reducedMotion ? 'Enabled' : 'Disabled'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;