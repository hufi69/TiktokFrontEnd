import { getRequest, postRequest, deleteRequest } from './httpClient';
import { CONFIG } from '../../config';

const MODEL_NAME = '/api/v1/chats';

/**
 * Create a new chat 
 * @param {Array<string>} participants 
 * @returns {Promise<Object>} 
 */
export async function createChat(participants) {
  try {
    const result = await postRequest(`${MODEL_NAME}/create-chat`, {
      participants,
    });
    return result;
  } catch (err) {
    throw err;
  }
}

/**
 * Get all chats for the current user
 * @returns {Promise<Object>} 
 */
export async function getUserChats() {
  try {
    const result = await getRequest(`${MODEL_NAME}/user-chats`);
    return result;
  } catch (err) {
    throw err;
  }
}

/**
 * Get a specific chat by ID
 * @param {string} chatId - The chat ID
 * @returns {Promise<Object>} 
 */
export async function getChatById(chatId) {
  try {
    const result = await getRequest(`${MODEL_NAME}/chat/${chatId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

/**
 * Delete a chat
 * @param {string} chatId - The chat ID
 * @returns {Promise<Object>} 
 */
export async function deleteChat(chatId) {
  try {
    // Try different endpoint patterns based on backend structure
    // Pattern 1: /api/v1/chats/chat/:chatId (matches GET pattern)
    // Pattern 2: /api/v1/chats/:chatId (simpler pattern)
    // Pattern 3: /api/v1/chats/delete-chat/:chatId (explicit delete)
    let result;
    try {
      result = await deleteRequest(`${MODEL_NAME}/chat/${chatId}`);
    } catch (err) {
      // Try alternative endpoint
      try {
        result = await deleteRequest(`${MODEL_NAME}/${chatId}`);
      } catch (err2) {
        // Try explicit delete endpoint
        result = await deleteRequest(`${MODEL_NAME}/delete-chat/${chatId}`);
      }
    }
    return result;
  } catch (err) {
    throw err;
  }
}

