/**
 * ApiStatusIndicator Component
 * 
 * A component that displays the connection status of the video streaming API
 * and provides helpful information when the API is not accessible.
 */

import React, { useState, useEffect } from 'react';
import { videoApiService } from '../services/videoApi';

interface ApiStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({
  className = '',
  showDetails = false,
}) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkApiStatus = async () => {
    setIsChecking(true);
    try {
      const status = await videoApiService.healthCheck();
      setIsOnline(status);
      setLastChecked(new Date());
    } catch (error) {
      setIsOnline(false);
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isChecking) return 'bg-yellow-500';
    if (isOnline === null) return 'bg-gray-500';
    return isOnline ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (isOnline === null) return 'Unknown';
    return isOnline ? 'Connected' : 'Disconnected';
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
      );
    }
    
    if (isOnline) {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  if (!showDetails) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} mr-2`}></div>
        <span className="text-sm text-gray-600">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Video API Status</h3>
        <button
          onClick={checkApiStatus}
          disabled={isChecking}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      
      <div className="flex items-center mb-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2 flex items-center justify-center text-white`}>
          {getStatusIcon()}
        </div>
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      {lastChecked && (
        <div className="text-xs text-gray-500">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
      
      {isOnline === false && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-800">
            <strong>Connection Failed</strong>
            <p className="mt-1">
              Cannot connect to the USDA Vision Camera System. Please ensure:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>The vision system is running</li>
              <li>The API is accessible at the configured URL</li>
              <li>Network connectivity is available</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
