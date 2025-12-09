import { getRequest, postRequest, patchRequest, deleteRequest } from './httpClient';
import { CONFIG } from '../../config';

const MODEL_NAME = '/api/v1/comments';

export async function getComments(postId) {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.COMMENTS_GET.replace(':postId', postId)}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function createComment(commentData) {
  try {
    const result = await postRequest(`${CONFIG.ENDPOINTS.COMMENT_CREATE}`, commentData);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function replyComment(commentData) {
  try {
    const result = await postRequest(`${CONFIG.ENDPOINTS.COMMENT_REPLY}`, commentData);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function updateComment(commentData) {
  try {
    const result = await patchRequest(`${CONFIG.ENDPOINTS.COMMENT_UPDATE}`, commentData);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function deleteComment(commentId) {
  try {
    const payload = { commentId };
    const result = await deleteRequest(`${CONFIG.ENDPOINTS.COMMENT_DELETE}`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getReplies(commentId) {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.COMMENT_REPLIES.replace(':commentId', commentId)}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getComment(commentId) {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.COMMENT_GET.replace(':commentId', commentId)}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function likeComment(commentId) {
  try {
    // Backend: POST /api/v1/likes/like-comment (commentId in request body, toggles)
    const result = await postRequest(`/api/v1/likes/like-comment`, { commentId });
    return result;
  } catch (err) {
    throw err;
  }
}

export async function unlikeComment(commentId) {
  try {
    // Backend: POST /api/v1/likes/like-comment (commentId in request body, toggles)
    const result = await postRequest(`/api/v1/likes/like-comment`, { commentId });
    return result;
  } catch (err) {
    throw err;
  }
}
