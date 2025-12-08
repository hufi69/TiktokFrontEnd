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
    if (userData.dateOfBirth) {
      // Ensure date is in YYYY-MM-DD format for backend
      const dateStr = userData.dateOfBirth;
      // If already in YYYY-MM-DD format, use as is
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        payload.dateOfBirth = dateStr;
      } else if (dateStr.includes('T')) {
        // If full ISO format, extract just YYYY-MM-DD
        payload.dateOfBirth = dateStr.split('T')[0];
      } else if (dateStr.includes('/')) {
        // Convert MM/DD/YYYY to YYYY-MM-DD (backward compatibility)
        const [month, day, year] = dateStr.split('/');
        if (month && day && year && year.length === 4) {
          payload.dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          payload.dateOfBirth = dateStr;
        }
      } else {
        // Try to parse and format
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          payload.dateOfBirth = `${year}-${month}-${day}`;
        } else {
          payload.dateOfBirth = dateStr;
        }
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
