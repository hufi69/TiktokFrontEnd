import { getRequest, postRequest, deleteRequest } from './httpClient';
import { CONFIG } from '../../config';

const MODEL_NAME = '/api/v1/follows';

export async function followUser(targetUserId) {
  try {
    const payload = { userId: targetUserId };
    const result = await postRequest(`${CONFIG.ENDPOINTS.FOLLOW_USER}`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function unfollowUser(targetUserId) {
  try {
    const payload = { userId: targetUserId };
    const result = await deleteRequest(`${CONFIG.ENDPOINTS.UNFOLLOW_USER}`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getFollowers() {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.FOLLOWERS}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getFollowing() {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.FOLLOWING}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function isFollowing(targetUserId) {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.IS_FOLLOWING}?userId=${targetUserId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getMutualFollows() {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.MUTUAL_FOLLOWS}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getFollowersCount() {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.FOLLOWERS_COUNT}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getFollowingCount() {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.FOLLOWING_COUNT}`);
    return result;
  } catch (err) {
    throw err;
  }
}
