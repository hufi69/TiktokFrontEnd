import { getRequest, patchRequest } from './httpClient';
import { CONFIG } from '../../config';

const MODEL_NAME = '/api/v1/likes';

export async function likePost(postId) {
  try {
    const result = await patchRequest(`${CONFIG.ENDPOINTS.LIKE_POST_ACTION}`, { postId });
    return result;
  } catch (err) {
    throw err;
  }
}

export async function unlikePost(postId) {
  try {
    const result = await patchRequest(`${CONFIG.ENDPOINTS.UNLIKE_POST_ACTION}`, { postId });
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getPostLikes(postId) {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.GET_POST_LIKES}?postId=${postId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getUserLikes(userId) {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.GET_USER_LIKES}?userId=${userId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function likeComment(commentId) {
  try {
    const result = await patchRequest(`${CONFIG.ENDPOINTS.COMMENT_LIKE}`, { commentId });
    return result;
  } catch (err) {
    throw err;
  }
}

export async function unlikeComment(commentId) {
  try {
    const result = await patchRequest(`${CONFIG.ENDPOINTS.COMMENT_UNLIKE}`, { commentId });
    return result;
  } catch (err) {
    throw err;
  }
}
