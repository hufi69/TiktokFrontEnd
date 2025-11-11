import { getRequest, patchRequest, postFormDataRequest } from './httpClient';
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
    if (userData.dateOfBirth) payload.dateOfBirth = userData.dateOfBirth;
    if (userData.country) payload.country = userData.country;
    
    formData.append('data', JSON.stringify(payload));

    // Handle profile picture upload
    const img = userData.avatar || userData.profileImage;
    if (img?.uri) {
      formData.append('profilePicture', {
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.fileName || 'profile.jpg',
      });
    }

    const result = await postFormDataRequest(`${MODEL_NAME}/updateMe`, formData);
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
