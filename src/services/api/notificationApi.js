import { getRequest, putRequest } from './httpClient';
import { CONFIG } from '../../config';

const MODEL_NAME = '/api/v1/notifications';

/**
 * Get all notifications for the current user
 * @returns {Promise<Object>} Object containing notifications array
 */
export async function getNotifications() {
  try {
    const result = await getRequest(`${MODEL_NAME}/get-notifications`);
    return result;
  } catch (err) {
    throw err;
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise<Object>} Updated notification object
 */
export async function updateNotification(notificationId) {
  try {
    const result = await putRequest(`${MODEL_NAME}/update-notification/${notificationId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

