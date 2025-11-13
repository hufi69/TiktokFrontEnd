

import { CONFIG } from './index';


export const ENV_CONFIG = {
  API_BASE_URL: CONFIG.API_BASE_URL,
  APP_NAME: CONFIG.APP_NAME,
  APP_VERSION: CONFIG.APP_VERSION,
  NODE_ENV: 'development',
  DEBUG: CONFIG.DEBUG,
  ...CONFIG.ENDPOINTS,
};


export const getApiUrl = (endpoint) => {
  return `${ENV_CONFIG.API_BASE_URL}${endpoint}`;
};


export const isDevelopment = () => {
  return ENV_CONFIG.NODE_ENV === 'development';
};


export const debugLog = (message, data = null) => {
  if (ENV_CONFIG.DEBUG) {
    console.log(`[DEBUG] ${message}`, data);
  }
};
