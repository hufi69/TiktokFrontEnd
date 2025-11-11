import axios from 'axios';
import { CONFIG } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultTimeout = 15000;
const uploadTimeout = 60000; // 1 minute for file uploads

const formDataRequestHeaders = {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
};

const jsonRequestHeaders = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create axios instance
const httpClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: defaultTimeout,
});

// Request interceptor to add Bearer token
httpClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Set longer timeout for file uploads
      if (config.headers['Content-Type'] === 'multipart/form-data') {
        config.timeout = uploadTimeout;
      }

      // Add debug logging in development
      if (CONFIG.DEBUG) {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        if (config.data) {
          console.log('Request Data:', config.data);
        }
      }

      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
httpClient.interceptors.response.use(
  (response) => {
    if (CONFIG.DEBUG) {
      console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log('Response Data:', response.data);
    }

    // Return the data directly for successful responses
    return response.data;
  },
  (error) => {
    if (CONFIG.DEBUG) {
      console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.error('Error details:', error.response?.data || error.message);
    }

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Network error
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Other error
      return Promise.reject(new Error(error.message || 'An unexpected error occurred'));
    }
  }
);

// HTTP Methods
export const getRequest = (url, params = {}, config = { ...jsonRequestHeaders }) =>
  httpClient.get(url, { params, ...config });

export const postRequest = (url, data, config = { ...jsonRequestHeaders }) =>
  httpClient.post(url, data, config);

export const putRequest = (url, data, config = { ...jsonRequestHeaders }) =>
  httpClient.put(url, data, config);

export const patchRequest = (url, data, config = { ...jsonRequestHeaders }) =>
  httpClient.patch(url, data, config);

export const deleteRequest = (url, config = { ...jsonRequestHeaders }) =>
  httpClient.delete(url, config);

// Form Data Methods
export const getFormDataRequest = (url, params = {}, config = { ...formDataRequestHeaders }) =>
  httpClient.get(url, { params, ...config });

export const postFormDataRequest = (url, data, config = { ...formDataRequestHeaders, timeout: uploadTimeout }) =>
  httpClient.post(url, data, config);

export const putFormDataRequest = (url, data, config = { ...formDataRequestHeaders }) =>
  httpClient.put(url, data, config);

export const patchFormDataRequest = (url, data, config = { ...formDataRequestHeaders }) =>
  httpClient.patch(url, data, config);

export const deleteFormDataRequest = (url, config = { ...formDataRequestHeaders }) =>
  httpClient.delete(url, config);

export default httpClient;
