import { getRequest, postFormDataRequest, postRequest, deleteRequest } from './httpClient';
import { CONFIG } from '../../config';

const MODEL_NAME = '/api/v1/messages';

/**
 * Create a new message in a chat
 * @param {string} chatId - The chat ID
 * @param {string} text - Message text
 * @param {Array<Object>} attachments - Array of attachment files (optional)
 * @returns {Promise<Object>} Created message object
 */
export async function createMessage(chatId, text, attachments = []) {
  try {
    if (attachments && attachments.length > 0) {
      // Use FormData for messages with attachments
      const formData = new FormData();
      formData.append('chatId', chatId);
      if (text) {
        formData.append('text', text);
      }
      
      attachments.forEach((attachment, index) => {
        formData.append('attachments', {
          uri: attachment.uri,
          type: attachment.type || 'image/jpeg',
          name: attachment.name || `image_${index}.jpg`,
        });
      });

      const result = await postFormDataRequest(`${MODEL_NAME}/new-message`, formData);
      return result;
    } else {
      // Use JSON for text-only messages
      const result = await postRequest(`${MODEL_NAME}/new-message`, {
        chatId,
        text,
      });
      return result;
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Get all messages for a chat
 * @param {string} chatId - The chat ID
 * @returns {Promise<Object>} Object containing messages array
 */
export async function getChatMessages(chatId) {
  try {
    const result = await getRequest(`${MODEL_NAME}/${chatId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

/**
 * Get the last message for a chat
 * @param {string} chatId - The chat ID
 * @returns {Promise<Object>} Object containing last message
 */
export async function getLastMessage(chatId) {
  try {
    const result = await getRequest(`${MODEL_NAME}/${chatId}/last-message`);
    return result;
  } catch (err) {
    throw err;
  }
}

/**
 * Delete a message
 * @param {string} messageId - The message ID
 * @returns {Promise<Object>} Success response
 */
export async function deleteMessage(messageId) {
  try {
    const result = await deleteRequest(`${MODEL_NAME}/${messageId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

