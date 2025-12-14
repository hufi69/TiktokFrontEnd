import { getRequest, postRequest, patchRequest, deleteRequest, postFormDataRequest } from './httpClient';
import { CONFIG } from '../../config';

const MODEL_NAME = '/api/v1/posts';

export async function getPosts(limit = 50) {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.POSTS_LIST}?limit=${limit}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getPost(postId) {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.POST_GET.replace(':id', postId)}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getUserPosts(userId) {
  try {
    const result = await getRequest(`${CONFIG.ENDPOINTS.POST_GET_BY_USER.replace(':id', userId)}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function createPost(postData) {
  try {
    const formData = new FormData();
    const payload = {
      content: postData.caption || postData.content || '',
      isPublic: postData.isPublic ?? true,
      tags: postData.tags || [],
    };
    
    formData.append('data', JSON.stringify(payload));

    if (Array.isArray(postData.images)) {
      postData.images.forEach((image, idx) => {
        if (image?.uri) {
          const type = image.type || 'image/jpeg';
          const isVideo = typeof type === 'string' && type.startsWith('video/');
          const fallbackName = isVideo ? `video_${idx}.mp4` : `image_${idx}.jpg`;

          formData.append('images', {
            uri: image.uri,
            type,
            name: image.fileName || image.name || image.filename || fallbackName,
          });
        }
      });
    }

    const result = await postFormDataRequest(`${CONFIG.ENDPOINTS.POST_CREATE}`, formData);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function updatePost(postId, postData) {
  try {
    const result = await patchRequest(`${CONFIG.ENDPOINTS.POST_UPDATE.replace(':id', postId)}`, postData);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function deletePost(postId) {
  try {
    const result = await deleteRequest(`${CONFIG.ENDPOINTS.POST_DELETE.replace(':id', postId)}`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function likePost(postId) {
  try {
   
    const result = await postRequest(`/api/v1/likes/like`, { postId });
    return result;
  } catch (err) {
    throw err;
  }
}
