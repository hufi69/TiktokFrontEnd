import { getRequest, postRequest, patchRequest, deleteRequest, postFormDataRequest } from './httpClient';
import { CONFIG } from '../../config';

const MODEL_NAME = '/api/v1/groups';

// Get all groups (discover)
export async function getGroups(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.privacy) queryParams.append('privacy', params.privacy);
    if (params.tags) queryParams.append('tags', params.tags);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = queryString ? `${MODEL_NAME}?${queryString}` : MODEL_NAME;
    const result = await getRequest(url);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getUserGroups() {
  try {
    const result = await getRequest(`${MODEL_NAME}`);
    return result;
  } catch (err) {
    throw err;
  }
}


// Get single group
export async function getGroup(groupId) {
  try {
    const result = await getRequest(`${MODEL_NAME}/${groupId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

// Create group
export async function createGroup(groupData) {
  try {

    // TODO: Add image upload support when backend is updated with multer middleware
    const payload = {
      name: groupData.name,
      description: groupData.description || '',
      privacy: groupData.privacy || 'public',
      tags: groupData.tags || [],
      settings: groupData.settings || {},
    };

    // Note: coverImage and profileImage are not sent yet
    // Backend route needs multer middleware to handle file uploads
    // For now, images can be uploaded separately via updateGroup endpoint
    
    const result = await postRequest(`${MODEL_NAME}`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

// Update group
export async function updateGroup(groupId, groupData) {
  try {
    const result = await patchRequest(`${MODEL_NAME}/${groupId}`, groupData);
    return result;
  } catch (err) {
    throw err;
  }
}

// Delete group
export async function deleteGroup(groupId) {
  try {
    const result = await deleteRequest(`${MODEL_NAME}/${groupId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

// Join group
export async function joinGroup(groupId) {
  try {
    const result = await postRequest(`${MODEL_NAME}/${groupId}/join`, {});
    return result;
  } catch (err) {
    throw err;
  }
}

// Get group members
export async function getGroupMembers(groupId, params = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = queryString 
      ? `${MODEL_NAME}/${groupId}/members?${queryString}`
      : `${MODEL_NAME}/${groupId}/members`;
    const result = await getRequest(url);
    return result;
  } catch (err) {
    throw err;
  }
}

// Get group posts
// Note: Backend only returns published posts by default
// For moderators to see pending posts, backend would need to add a status query param
export async function getGroupPosts(groupId, params = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    // TODO: Add status filter when backend supports it (e.g., ?status=pending for moderators)

    const queryString = queryParams.toString();
    const url = queryString 
      ? `${MODEL_NAME}/${groupId}/posts?${queryString}`
      : `${MODEL_NAME}/${groupId}/posts`;
    const result = await getRequest(url);
    return result;
  } catch (err) {
    throw err;
  }
}

// Get pending posts (for moderators/admins)
// Note: Backend doesn't have this endpoint yet - would need to be added
// For now, this is a placeholder
export async function getPendingGroupPosts(groupId, params = {}) {
  try {
    // TODO: Backend needs to add endpoint or query param to fetch pending posts
   
    return { status: 'success', data: [] };
  } catch (err) {
    throw err;
  }
}
export async function createGroupPost(groupId, postData) {
  try {
    if (postData.media && Array.isArray(postData.media) && postData.media.length > 0 && postData.media[0]?.uri) {
      const formData = new FormData();
      const payload = {
        content: postData.content || '',
        tags: postData.tags || [],
        mentions: postData.mentions || [],
      };
      formData.append('data', JSON.stringify(payload));
      postData.media.forEach((mediaItem, idx) => {
        if (mediaItem?.uri) {
          const type = mediaItem.type || 'image/jpeg';
          const isVideo = typeof type === 'string' && type.startsWith('video/');
          const fallbackName = isVideo ? `video_${idx}.mp4` : `image_${idx}.jpg`;
          formData.append('images', {
            uri: mediaItem.uri,
            type,
            name: mediaItem.fileName || mediaItem.name || mediaItem.filename || fallbackName,
          });
        }
      });

      const result = await postFormDataRequest(`${MODEL_NAME}/${groupId}/posts`, formData);
      return result;
    } else {
      const payload = {
        content: postData.content || '',
        media: postData.media || [], 
        tags: postData.tags || [],
        mentions: postData.mentions || [],
      };
      const result = await postRequest(`${MODEL_NAME}/${groupId}/posts`, payload);
      return result;
    }
  } catch (err) {
    throw err;
  }
}

// Like group post
export async function likeGroupPost(groupId, postId) {
  try {
    const result = await postRequest(`${MODEL_NAME}/${groupId}/posts/${postId}/like`, {});
    return result;
  } catch (err) {
    throw err;
  }
}

// Unlike group post
export async function unlikeGroupPost(groupId, postId) {
  try {
    const result = await deleteRequest(`${MODEL_NAME}/${groupId}/posts/${postId}/like`);
    return result;
  } catch (err) {
    throw err;
  }
}

// Get join requests (admin only)
export async function getJoinRequests(groupId) {
  try {
    const result = await getRequest(`${MODEL_NAME}/${groupId}/join-requests`);
    return result;
  } catch (err) {
    throw err;
  }
}

// Approve join request
export async function approveJoinRequest(groupId, requestId) {
  try {
    const result = await postRequest(`${MODEL_NAME}/${groupId}/join-requests/${requestId}/approve`, {});
    return result;
  } catch (err) {
    throw err;
  }
}

// Reject join request
export async function rejectJoinRequest(groupId, requestId) {
  try {
    const result = await postRequest(`${MODEL_NAME}/${groupId}/join-requests/${requestId}/reject`, {});
    return result;
  } catch (err) {
    throw err;
  }
}

// Leave group
// Note: Backend doesn't have this endpoint yet - need to use PATCH to update member status
export async function leaveGroup(groupId) {
  try {
    // TODO: Backend should add DELETE /:groupId/members/leave
    // For now, we'll need to get current user ID and use PATCH /:groupId/members/:userId with status: 'left'
    // This requires currentUserId to be passed - will handle in Redux thunk
    throw new Error('Leave group endpoint not implemented - need currentUserId');
  } catch (err) {
    throw err;
  }
}

// Update member role/status
export async function updateMemberRole(groupId, userId, updates) {
  try {
    const result = await patchRequest(`${MODEL_NAME}/${groupId}/members/${userId}`, updates);
    return result;
  } catch (err) {
    throw err;
  }
}

// Remove/ban member
export async function removeMember(groupId, userId) {
  try {
    const result = await deleteRequest(`${MODEL_NAME}/${groupId}/members/${userId}`);
    return result;
  } catch (err) {
    throw err;
  }
}


export async function updateGroupPost(groupId, postId, postData) {
  try {
    const payload = {
      content: postData.content || '',
      tags: postData.tags || [],
      mentions: postData.mentions || [],
    };
    if (postData.media && Array.isArray(postData.media)) {
      payload.media = postData.media;
    }
    if (postData.status !== undefined) {
      payload.status = postData.status;
    }
    if (postData.isPinned !== undefined) {
      payload.isPinned = postData.isPinned;
    }

    const result = await patchRequest(`${MODEL_NAME}/${groupId}/posts/${postId}`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

// Delete group post
export async function deleteGroupPost(groupId, postId) {
  try {
    const result = await deleteRequest(`${MODEL_NAME}/${groupId}/posts/${postId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

// Pin/unpin post
export async function pinGroupPost(groupId, postId, isPinned = true) {
  try {
    const result = await patchRequest(`${MODEL_NAME}/${groupId}/posts/${postId}`, { isPinned });
    return result;
  } catch (err) {
    throw err;
  }
}

// Approve post (uses PATCH to update status)
export async function approveGroupPost(groupId, postId) {
  try {
    const result = await patchRequest(`${MODEL_NAME}/${groupId}/posts/${postId}`, { status: 'published' });
    return result;
  } catch (err) {
    throw err;
  }
}

// Reject post (uses PATCH to update status)
export async function rejectGroupPost(groupId, postId) {
  try {
    const result = await patchRequest(`${MODEL_NAME}/${groupId}/posts/${postId}`, { status: 'rejected' });
    return result;
  } catch (err) {
    throw err;
  }
}

// Search posts in group
export async function searchGroupPosts(groupId, query, params = {}) {
  try {
    const queryParams = new URLSearchParams({ q: query });
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    const url = `${MODEL_NAME}/${groupId}/posts/search?${queryString}`;
    const result = await getRequest(url);
    return result;
  } catch (err) {
    throw err;
  }
}

// Get single group post
export async function getGroupPost(groupId, postId) {
  try {
    const result = await getRequest(`${MODEL_NAME}/${groupId}/posts/${postId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

// Create comment on group post
export async function createGroupComment(groupId, postId, commentData) {
  try {
    const result = await postRequest(
      `${MODEL_NAME}/${groupId}/posts/${postId}/comments`,
      commentData
    );
    return result;
  } catch (err) {
    throw err;
  }
}

// Get comments on group post
export async function getGroupComments(groupId, postId, params = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = queryString
      ? `${MODEL_NAME}/${groupId}/posts/${postId}/comments?${queryString}`
      : `${MODEL_NAME}/${groupId}/posts/${postId}/comments`;
    const result = await getRequest(url);
    return result;
  } catch (err) {
    throw err;
  }
}

// Update group comment
// Note: Backend doesn't have this endpoint yet - placeholder for future implementation
export async function updateGroupComment(groupId, commentId, commentData) {
  try {
    // TODO: Backend needs to add PATCH /:groupId/comments/:commentId
    // For now, this will fail - handle gracefully in UI
    const result = await patchRequest(`${MODEL_NAME}/${groupId}/comments/${commentId}`, commentData);
    return result;
  } catch (err) {
    throw err;
  }
}

// Delete group comment
// Note: Backend doesn't have this endpoint yet - placeholder for future implementation
export async function deleteGroupComment(groupId, commentId) {
  try {
    // TODO: Backend needs to add DELETE /:groupId/comments/:commentId
    // For now, this will fail - handle gracefully in UI
    const result = await deleteRequest(`${MODEL_NAME}/${groupId}/comments/${commentId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

// Add reaction to group post/comment
// Note: Backend uses Like model, not separate reactions
// For posts, use likeGroupPost/unlikeGroupPost
// For comments, backend doesn't have comment likes yet
export async function addGroupReaction(reactionData) {
  try {
    // TODO: Backend needs to implement reactions endpoint
    // For now, this is a placeholder
    throw new Error('Reactions endpoint not implemented yet');
  } catch (err) {
    throw err;
  }
}

// Remove reaction
export async function removeGroupReaction(reactionId) {
  try {
    // TODO: Backend needs to implement reactions endpoint
    throw new Error('Reactions endpoint not implemented yet');
  } catch (err) {
    throw err;
  }
}

// Get reactions for group post
// Note: Backend doesn't have this endpoint - would need to query Like model
export async function getGroupPostReactions(groupId, postId) {
  try {
    // TODO: Backend needs to add GET /:groupId/posts/:postId/reactions
    // For now, return empty array
    return { status: 'success', data: [] };
  } catch (err) {
    throw err;
  }
}

// Create invite link
export async function createInviteLink(groupId, linkData) {
  try {
    const result = await postRequest(`${MODEL_NAME}/${groupId}/invite-links`, linkData);
    return result;
  } catch (err) {
    throw err;
  }
}

// Get invite links
export async function getInviteLinks(groupId) {
  try {
    const result = await getRequest(`${MODEL_NAME}/${groupId}/invite-links`);
    return result;
  } catch (err) {
    throw err;
  }
}

// Join via invite link
export async function joinViaInviteLink(token) {
  try {
    const result = await postRequest(`${MODEL_NAME}/invite/${token}`, {});
    return result;
  } catch (err) {
    throw err;
  }
}

// Deactivate invite link
export async function deactivateInviteLink(linkId) {
  try {
    const result = await deleteRequest(`${MODEL_NAME}/invite-links/${linkId}`);
    return result;
  } catch (err) {
    throw err;
  }
}

// Search groups
export async function searchGroups(query, params = {}) {
  try {
    const queryParams = new URLSearchParams({ q: query });
    if (params.privacy) queryParams.append('privacy', params.privacy);
    if (params.tags) queryParams.append('tags', params.tags);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = `${MODEL_NAME}/search?${queryString}`;
    const result = await getRequest(url);
    return result;
  } catch (err) {
    throw err;
  }
}
