import { getRequest, patchRequest, postFormDataRequest, patchFormDataRequest } from './httpClient';
import { CONFIG } from '../../config';

const MODEL_NAME = '/api/v1/users';

export async function getUserProfile(userId) {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.USER_PROFILE.replace(':id', userId)}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function updateUserProfile(userData) {
  try {
    const formData = new FormData();
    const payload = {};
    
    if (userData.fullName) payload.fullName = userData.fullName;
    if (userData.username) payload.userName = userData.username;
    if (userData.occupation) payload.occupation = userData.occupation;
    if (userData.email) payload.email = userData.email;
    if (userData.phone) payload.phone = userData.phone;
    if (userData.dateOfBirth) {
      // Ensure date is in YYYY-MM-DD format for backend
      const dateStr = userData.dateOfBirth;
      let formattedDate = null;
      
      // If already in YYYY-MM-DD format, validate it
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        // Validate month (1-12) and day (1-31)
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          // Create a date object to validate the actual date
          const date = new Date(year, month - 1, day);
          if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            formattedDate = dateStr;
          }
        }
      } else if (dateStr.includes('T')) {
        // If full ISO format, extract just YYYY-MM-DD
        formattedDate = dateStr.split('T')[0];
      } else if (dateStr.includes('/')) {
        // Convert MM/DD/YYYY to YYYY-MM-DD (backward compatibility)
        const [month, day, year] = dateStr.split('/').map(Number);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
          const date = new Date(year, month - 1, day);
          if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        }
      } else {
        // Try to parse and format
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }
      }
      
      if (formattedDate) {
        payload.dateOfBirth = formattedDate;
      } else {
        throw new Error('Invalid date format. Please use YYYY-MM-DD format (e.g., 2000-12-23)');
      }
    }
    if (userData.country) payload.country = userData.country;
    
    formData.append('data', JSON.stringify(payload));

    
    const img = userData.avatar || userData.profileImage;
    if (img?.uri) {
      formData.append('profilePicture', {
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.fileName || 'profile.jpg',
      });
    }

    const result = await patchFormDataRequest(`${MODEL_NAME}/updateMe`, formData);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getAllUsers() {
  try {
    const result = await getRequest(`${MODEL_NAME}/getAllUsers`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function verifyToken() {
  try {
    const result = await getRequest(`${MODEL_NAME}/getAllUsers`);
    return result;
  } catch (err) {
    throw err;
  }
}
