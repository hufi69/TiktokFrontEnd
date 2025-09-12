import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  COUNTRY_DATA: 'country_data',
  APP_SETTINGS: 'app_settings',
  FIRST_LAUNCH: 'first_launch',
};

// Generic storage functions for the flags 
export const setItem = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error('Error storing data:', error);
    return false;
  }
};

export const getItem = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
};

export const removeItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing data:', error);
    return false;
  }
};

export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

// Specific storage functions
export const storeAuthToken = async (token) => {
  return await setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getAuthToken = async () => {
  return await getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const removeAuthToken = async () => {
  return await removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const storeUserData = async (userData) => {
  return await setItem(STORAGE_KEYS.USER_DATA, userData);
};

export const getUserData = async () => {
  return await getItem(STORAGE_KEYS.USER_DATA);
};

export const removeUserData = async () => {
  return await removeItem(STORAGE_KEYS.USER_DATA);
};

export const storeCountryData = async (countryData) => {
  return await setItem(STORAGE_KEYS.COUNTRY_DATA, countryData);
};

export const getCountryData = async () => {
  return await getItem(STORAGE_KEYS.COUNTRY_DATA);
};

export const removeCountryData = async () => {
  return await removeItem(STORAGE_KEYS.COUNTRY_DATA);
};

export const storeAppSettings = async (settings) => {
  return await setItem(STORAGE_KEYS.APP_SETTINGS, settings);
};

export const getAppSettings = async () => {
  return await getItem(STORAGE_KEYS.APP_SETTINGS);
};

export const setFirstLaunch = async (isFirstLaunch) => {
  return await setItem(STORAGE_KEYS.FIRST_LAUNCH, isFirstLaunch);
};

export const getFirstLaunch = async () => {
  const result = await getItem(STORAGE_KEYS.FIRST_LAUNCH);
  return result !== null ? result : true; // Default to true if not set
};
