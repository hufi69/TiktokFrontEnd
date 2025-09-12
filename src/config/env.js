

import { CONFIG } from './index';

// Legacy configuration - redirects to new system
export const ENV_CONFIG = {
  API_BASE_URL: CONFIG.API_BASE_URL,
  APP_NAME: CONFIG.APP_NAME,
  APP_VERSION: CONFIG.APP_VERSION,
  NODE_ENV: 'development',
  DEBUG: CONFIG.DEBUG,
  ...CONFIG.ENDPOINTS,
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${ENV_CONFIG.API_BASE_URL}${endpoint}`;
};

// Helper function to check if in development
export const isDevelopment = () => {
  return ENV_CONFIG.NODE_ENV === 'development';
};

// Helper function to log debug messages
export const debugLog = (message, data = null) => {
  if (ENV_CONFIG.DEBUG) {
    console.log(`[DEBUG] ${message}`, data);
  }
};
