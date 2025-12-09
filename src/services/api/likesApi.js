import { getRequest, postRequest, deleteRequest } from './httpClient';
import { CONFIG } from '../../config';

const MODEL_NAME = '/api/v1/likes';

export async function likePost(postId) {
  try {
    // Backend: POST /api/v1/likes/like with { postId }
    const result = await postRequest(`${MODEL_NAME}/like`, { postId });
    return result;
  } catch (err) {
    throw err;
  }
}

export async function unlikePost(likeId) {
  try {
    // Backend: DELETE /api/v1/likes/unlike with { likeId }
    const payload = { likeId };
    const result = await deleteRequest(`${MODEL_NAME}/unlike`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getPostLikes(postId) {
  try {
    // Backend: GET /api/v1/likes/get-likes/:postId
    const result = await getRequest(`${MODEL_NAME}/get-likes/${postId}`);
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
    // Backend: POST /api/v1/likes/like-comment (commentId in request body)
    const result = await postRequest(`${MODEL_NAME}/like-comment`, { commentId });
    return result;
  } catch (err) {
    throw err;
  }
}

export async function unlikeComment(commentId) {
  try {
    // Backend: Same endpoint toggles like/unlike (commentId in request body)
    const result = await postRequest(`${MODEL_NAME}/like-comment`, { commentId });
    return result;
  } catch (err) {
    throw err;
  }
}
