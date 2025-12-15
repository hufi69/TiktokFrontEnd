import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as groupsApi from '../../services/api/groupsApi';

// Fetch groups (discover)
export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await groupsApi.getGroups(params);
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch groups');
    }
  }
);

export const fetchUserGroups = createAsyncThunk(
  'groups/fetchUserGroups',
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await groupsApi.getUserGroups();
    
      const allGroups = response.data || [];
      
      const currentUserId = getState().auth.user?._id || getState().auth.user?.id;
      if (!currentUserId) {
        return [];
      }
      return allGroups;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user groups');
    }
  }
);

// Fetch single group
export const fetchGroup = createAsyncThunk(
  'groups/fetchGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupsApi.getGroup(groupId);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch group');
    }
  }
);

// Create group
export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (groupData, { rejectWithValue }) => {
    try {
      const response = await groupsApi.createGroup(groupData);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create group');
    }
  }
);

// Update group
export const updateGroup = createAsyncThunk(
  'groups/updateGroup',
  async ({ groupId, groupData }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.updateGroup(groupId, groupData);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update group');
    }
  }
);

// Join group
export const joinGroup = createAsyncThunk(
  'groups/joinGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupsApi.joinGroup(groupId);
      if (response && response.status === 'success') {
        return groupId;
      }
      if (response && response.status === 'fail' && response.message?.toLowerCase().includes('already a member')) {
        return groupId;
      }
      return groupId;
    } catch (error) {
      const errorMessage = error.message || '';
      if (errorMessage.toLowerCase().includes('already a member')) {
        return groupId;
      }
      return rejectWithValue(error.message || 'Failed to join group');
    }
  }
);

// Delete group
export const deleteGroup = createAsyncThunk(
  'groups/deleteGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      await groupsApi.deleteGroup(groupId);
      return groupId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete group');
    }
  }
);

// Fetch group posts
export const fetchGroupPosts = createAsyncThunk(
  'groups/fetchGroupPosts',
  async ({ groupId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.getGroupPosts(groupId, params);
      return { groupId, posts: response.data || [] };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch group posts');
    }
  }
);

// Create group post
export const createGroupPost = createAsyncThunk(
  'groups/createGroupPost',
  async ({ groupId, postData }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.createGroupPost(groupId, postData);
      return { groupId, post: response.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create post');
    }
  }
);

// Like group post
export const likeGroupPost = createAsyncThunk(
  'groups/likeGroupPost',
  async ({ groupId, postId }, { rejectWithValue }) => {
    try {
      await groupsApi.likeGroupPost(groupId, postId);
      return { groupId, postId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to like post');
    }
  }
);

// Unlike group post
export const unlikeGroupPost = createAsyncThunk(
  'groups/unlikeGroupPost',
  async ({ groupId, postId }, { rejectWithValue }) => {
    try {
      await groupsApi.unlikeGroupPost(groupId, postId);
      return { groupId, postId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to unlike post');
    }
  }
);

// Fetch group members
export const fetchGroupMembers = createAsyncThunk(
  'groups/fetchGroupMembers',
  async ({ groupId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.getGroupMembers(groupId, params);
      return { groupId, members: response.data || [] };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch members');
    }
  }
);

// Leave group
export const leaveGroup = createAsyncThunk(
  'groups/leaveGroup',
  async ({ groupId, userId }, { rejectWithValue, getState }) => {
    try {
      const currentUserId = userId || getState().auth.user?._id || getState().auth.user?.id;
      if (!currentUserId) {
        throw new Error('User ID not found');
      }
      await groupsApi.updateMemberRole(groupId, currentUserId, { status: 'left' });
      return groupId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to leave group');
    }
  }
);

// Update member role
export const updateMemberRole = createAsyncThunk(
  'groups/updateMemberRole',
  async ({ groupId, userId, updates }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.updateMemberRole(groupId, userId, updates);
      return { groupId, userId, member: response.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update member');
    }
  }
);

// Remove member
export const removeMember = createAsyncThunk(
  'groups/removeMember',
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {
      await groupsApi.removeMember(groupId, userId);
      return { groupId, userId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove member');
    }
  }
);

// Update group post
export const updateGroupPost = createAsyncThunk(
  'groups/updateGroupPost',
  async ({ groupId, postId, postData }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.updateGroupPost(groupId, postId, postData);
      return { groupId, post: response.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update post');
    }
  }
);

// Delete group post
export const deleteGroupPost = createAsyncThunk(
  'groups/deleteGroupPost',
  async ({ groupId, postId }, { rejectWithValue }) => {
    try {
      await groupsApi.deleteGroupPost(groupId, postId);
      return { groupId, postId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete post');
    }
  }
);

// Pin/unpin post
export const pinGroupPost = createAsyncThunk(
  'groups/pinGroupPost',
  async ({ groupId, postId, isPinned }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.pinGroupPost(groupId, postId, isPinned);
      return { groupId, post: response.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to pin post');
    }
  }
);

// Approve post
export const approveGroupPost = createAsyncThunk(
  'groups/approveGroupPost',
  async ({ groupId, postId }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.approveGroupPost(groupId, postId);
      return { groupId, post: response.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to approve post');
    }
  }
);

// Reject post
export const rejectGroupPost = createAsyncThunk(
  'groups/rejectGroupPost',
  async ({ groupId, postId }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.rejectGroupPost(groupId, postId);
      return { groupId, post: response.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to reject post');
    }
  }
);

// Fetch join requests
export const fetchJoinRequests = createAsyncThunk(
  'groups/fetchJoinRequests',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupsApi.getJoinRequests(groupId);
      return { groupId, requests: response.data || [] };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch join requests');
    }
  }
);

// Approve join request
export const approveJoinRequest = createAsyncThunk(
  'groups/approveJoinRequest',
  async ({ groupId, requestId }, { rejectWithValue }) => {
    try {
      await groupsApi.approveJoinRequest(groupId, requestId);
      return { groupId, requestId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to approve request');
    }
  }
);

// Reject join request
export const rejectJoinRequest = createAsyncThunk(
  'groups/rejectJoinRequest',
  async ({ groupId, requestId }, { rejectWithValue }) => {
    try {
      await groupsApi.rejectJoinRequest(groupId, requestId);
      return { groupId, requestId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to reject request');
    }
  }
);

// Create group comment
export const createGroupComment = createAsyncThunk(
  'groups/createGroupComment',
  async ({ groupId, postId, commentData }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.createGroupComment(groupId, postId, commentData);
      return { groupId, postId, comment: response.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create comment');
    }
  }
);

// Fetch group comments
export const fetchGroupComments = createAsyncThunk(
  'groups/fetchGroupComments',
  async ({ groupId, postId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.getGroupComments(groupId, postId, params);   
      return { groupId, postId, comments: response.data || [] };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch comments');
    }
  }
);

// Update group comment
export const updateGroupComment = createAsyncThunk(
  'groups/updateGroupComment',
  async ({ groupId, commentId, commentData }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.updateGroupComment(groupId, commentId, commentData);
      return { groupId, comment: response.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update comment');
    }
  }
);

// Delete group comment
export const deleteGroupComment = createAsyncThunk(
  'groups/deleteGroupComment',
  async ({ groupId, commentId }, { rejectWithValue }) => {
    try {
      await groupsApi.deleteGroupComment(groupId, commentId);
      return { groupId, commentId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete comment');
    }
  }
);

// Add group reaction
export const addGroupReaction = createAsyncThunk(
  'groups/addGroupReaction',
  async (reactionData, { rejectWithValue }) => {
    try {
      const response = await groupsApi.addGroupReaction(reactionData);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add reaction');
    }
  }
);

// Remove group reaction
export const removeGroupReaction = createAsyncThunk(
  'groups/removeGroupReaction',
  async (reactionId, { rejectWithValue }) => {
    try {
      await groupsApi.removeGroupReaction(reactionId);
      return reactionId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove reaction');
    }
  }
);

// Fetch invite links
export const fetchInviteLinks = createAsyncThunk(
  'groups/fetchInviteLinks',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupsApi.getInviteLinks(groupId);
      return { groupId, links: response.data || [] };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch invite links');
    }
  }
);

// Create invite link
export const createInviteLink = createAsyncThunk(
  'groups/createInviteLink',
  async ({ groupId, linkData }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.createInviteLink(groupId, linkData);
      return { groupId, link: response.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create invite link');
    }
  }
);

// Join via invite link
export const joinViaInviteLink = createAsyncThunk(
  'groups/joinViaInviteLink',
  async (token, { rejectWithValue }) => {
    try {
      const response = await groupsApi.joinViaInviteLink(token);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to join via invite link');
    }
  }
);

// Deactivate invite link
export const deactivateInviteLink = createAsyncThunk(
  'groups/deactivateInviteLink',
  async (linkId, { rejectWithValue }) => {
    try {
      await groupsApi.deactivateInviteLink(linkId);
      return linkId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to deactivate link');
    }
  }
);

// Search groups
export const searchGroups = createAsyncThunk(
  'groups/searchGroups',
  async ({ query, params = {} }, { rejectWithValue }) => {
    try {
      const response = await groupsApi.searchGroups(query, params);
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to search groups');
    }
  }
);

const initialState = {
  groups: [],
  userGroups: [],
  currentGroup: null,
  groupPosts: {},
  groupComments: {},
  groupMembers: {},
  joinRequests: {},
  inviteLinks: {},
  isLoading: false,
  error: null,
};

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentGroup: (state, action) => {
      state.currentGroup = action.payload;
    },
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Groups
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch User Groups
    builder
      .addCase(fetchUserGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userGroups = action.payload;
      })
      .addCase(fetchUserGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Single Group
    builder
      .addCase(fetchGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentGroup = action.payload;
      })
      .addCase(fetchGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create Group
    builder
      .addCase(createGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userGroups.unshift(action.payload);
        state.currentGroup = action.payload;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Group
    builder
      .addCase(updateGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedGroup = action.payload;
        const userGroupIndex = state.userGroups.findIndex(
          g => (g._id || g.id) === (updatedGroup._id || updatedGroup.id)
        );
        if (userGroupIndex !== -1) {
          state.userGroups[userGroupIndex] = updatedGroup;
        }
        const groupIndex = state.groups.findIndex(
          g => (g._id || g.id) === (updatedGroup._id || updatedGroup.id)
        );
        if (groupIndex !== -1) {
          state.groups[groupIndex] = updatedGroup;
        }
        if (state.currentGroup && (state.currentGroup._id || state.currentGroup.id) === (updatedGroup._id || updatedGroup.id)) {
          state.currentGroup = updatedGroup;
        }
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete Group
    builder
      .addCase(deleteGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        const groupId = action.payload;
        // Remove from userGroups
        state.userGroups = state.userGroups.filter(g => (g._id || g.id) !== groupId);
        // Remove from groups
        state.groups = state.groups.filter(g => (g._id || g.id) !== groupId);
        // Clear currentGroup if it's the deleted one
        if (state.currentGroup && (state.currentGroup._id === groupId || state.currentGroup.id === groupId)) {
          state.currentGroup = null;
        }
        // Clean up related data
        delete state.groupPosts[groupId];
        delete state.groupMembers[groupId];
        delete state.joinRequests[groupId];
        delete state.inviteLinks[groupId];
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Join Group
    builder
      .addCase(joinGroup.fulfilled, (state, action) => {
        const groupId = action.payload;
        const group = state.groups.find(g => (g._id || g.id) === groupId);
        if (group) {
          group.memberCount = (group.memberCount || 0) + 1;
          const existsInUserGroups = state.userGroups.some(g => (g._id || g.id) === groupId);
          if (!existsInUserGroups) {
            state.userGroups.push(group);
          }
        }
      });

    // Fetch Group Posts
    builder
      .addCase(fetchGroupPosts.fulfilled, (state, action) => {
        const { groupId, posts } = action.payload;    
        state.groupPosts[groupId] = posts;
      });

    // Create Group Post
    builder
      .addCase(createGroupPost.fulfilled, (state, action) => {
        const { groupId, post } = action.payload;
        if (!state.groupPosts[groupId]) {
          state.groupPosts[groupId] = [];
        }
        state.groupPosts[groupId].unshift(post);
        if (state.currentGroup && (state.currentGroup._id === groupId || state.currentGroup.id === groupId)) {
          state.currentGroup.postCount = (state.currentGroup.postCount || 0) + 1;
        }
      });

    // Like/Unlike Group Post
    builder
      .addCase(likeGroupPost.fulfilled, (state, action) => {
        const { groupId, postId } = action.payload;
        if (state.groupPosts[groupId]) {
          const post = state.groupPosts[groupId].find(p => (p._id || p.id) === postId);
          if (post) {
            post.likes = (post.likes || 0) + 1;
            post.likedByMe = true;
          }
        }
      })
      .addCase(unlikeGroupPost.fulfilled, (state, action) => {
        const { groupId, postId } = action.payload;
        if (state.groupPosts[groupId]) {
          const post = state.groupPosts[groupId].find(p => (p._id || p.id) === postId);
          if (post) {
            post.likes = Math.max(0, (post.likes || 0) - 1);
            post.likedByMe = false;
          }
        }
      });

    // Fetch Group Members
    builder
      .addCase(fetchGroupMembers.fulfilled, (state, action) => {
        const { groupId, members } = action.payload;
        state.groupMembers[groupId] = members;
      });

    // Leave Group
    builder
      .addCase(leaveGroup.fulfilled, (state, action) => {
        const groupId = action.payload;
        state.userGroups = state.userGroups.filter(g => g._id !== groupId && g.id !== groupId);
        if (state.currentGroup && (state.currentGroup._id === groupId || state.currentGroup.id === groupId)) {
          state.currentGroup = null;
        }
      });

    // Update Member Role
    builder
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        const { groupId, userId, member } = action.payload;
        if (state.groupMembers[groupId]) {
          const index = state.groupMembers[groupId].findIndex(
            m => (m.user?._id || m.user?.id || m.user) === userId
          );
          if (index !== -1) {
            state.groupMembers[groupId][index] = member;
          }
        }
      });

    // Remove Member
    builder
      .addCase(removeMember.fulfilled, (state, action) => {
        const { groupId, userId } = action.payload;
        if (state.groupMembers[groupId]) {
          state.groupMembers[groupId] = state.groupMembers[groupId].filter(
            m => (m.user?._id || m.user?.id || m.user) !== userId
          );
        }
        if (state.currentGroup && (state.currentGroup._id === groupId || state.currentGroup.id === groupId)) {
          state.currentGroup.memberCount = Math.max(0, (state.currentGroup.memberCount || 0) - 1);
        }
      });

    // Update Group Post
    builder
      .addCase(updateGroupPost.fulfilled, (state, action) => {
        const { groupId, post } = action.payload;
        if (state.groupPosts[groupId]) {
          const index = state.groupPosts[groupId].findIndex(
            p => (p._id || p.id) === (post._id || post.id)
          );
          if (index !== -1) {
            state.groupPosts[groupId][index] = post;
          }
        }
      });

    // Delete Group Post
    builder
      .addCase(deleteGroupPost.fulfilled, (state, action) => {
        const { groupId, postId } = action.payload;
        if (state.groupPosts[groupId]) {
          state.groupPosts[groupId] = state.groupPosts[groupId].filter(
            p => (p._id || p.id) !== postId
          );
        }
        if (state.currentGroup && (state.currentGroup._id === groupId || state.currentGroup.id === groupId)) {
          state.currentGroup.postCount = Math.max(0, (state.currentGroup.postCount || 0) - 1);
        }
      });

    // Pin Group Post
    builder
      .addCase(pinGroupPost.fulfilled, (state, action) => {
        const { groupId, post } = action.payload;
        if (state.groupPosts[groupId]) {
          const index = state.groupPosts[groupId].findIndex(
            p => (p._id || p.id) === (post._id || post.id)
          );
          if (index !== -1) {
            state.groupPosts[groupId][index] = post;
            // Re-sort: pinned posts first
            state.groupPosts[groupId].sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return 0;
            });
          }
        }
      });

    // Approve/Reject Post
    builder
      .addCase(approveGroupPost.fulfilled, (state, action) => {
        const { groupId, post } = action.payload;
        if (state.groupPosts[groupId]) {
          const index = state.groupPosts[groupId].findIndex(
            p => (p._id || p.id) === (post._id || post.id)
          );
          if (index !== -1) {
            state.groupPosts[groupId][index] = post;
          }
        }
      })
      .addCase(rejectGroupPost.fulfilled, (state, action) => {
        const { groupId, post } = action.payload;
        if (state.groupPosts[groupId]) {
          state.groupPosts[groupId] = state.groupPosts[groupId].filter(
            p => (p._id || p.id) !== (post._id || post.id)
          );
        }
      });

    // Join Requests
    builder
      .addCase(fetchJoinRequests.fulfilled, (state, action) => {
        const { groupId, requests } = action.payload;
        state.joinRequests[groupId] = requests;
      })
      .addCase(approveJoinRequest.fulfilled, (state, action) => {
        const { groupId, requestId } = action.payload;
        if (state.joinRequests[groupId]) {
          state.joinRequests[groupId] = state.joinRequests[groupId].filter(
            r => (r._id || r.id) !== requestId
          );
        }
        if (state.currentGroup && (state.currentGroup._id === groupId || state.currentGroup.id === groupId)) {
          state.currentGroup.memberCount = (state.currentGroup.memberCount || 0) + 1;
        }
      })
      .addCase(rejectJoinRequest.fulfilled, (state, action) => {
        const { groupId, requestId } = action.payload;
        if (state.joinRequests[groupId]) {
          state.joinRequests[groupId] = state.joinRequests[groupId].filter(
            r => (r._id || r.id) !== requestId
          );
        }
      });

    // Group Comments
    builder
      .addCase(fetchGroupComments.fulfilled, (state, action) => {
        const { groupId, postId, comments } = action.payload;
        const key = `${groupId}_${postId}`;
        state.groupComments[key] = comments;
      })
      .addCase(createGroupComment.fulfilled, (state, action) => {
        const { groupId, postId, comment } = action.payload;
        const key = `${groupId}_${postId}`;
        if (!state.groupComments[key]) {
          state.groupComments[key] = [];
        }
        state.groupComments[key].push(comment);
        // Update post comment count
        if (state.groupPosts[groupId]) {
          const post = state.groupPosts[groupId].find(p => (p._id || p.id) === postId);
          if (post) {
            post.comments = (post.comments || 0) + 1;
          }
        }
      })
      .addCase(updateGroupComment.fulfilled, (state, action) => {
        const { groupId, comment } = action.payload;
        // Find and update comment in all post comment arrays
        Object.keys(state.groupComments).forEach(key => {
          if (key.startsWith(`${groupId}_`)) {
            const index = state.groupComments[key].findIndex(
              c => (c._id || c.id) === (comment._id || comment.id)
            );
            if (index !== -1) {
              state.groupComments[key][index] = comment;
            }
          }
        });
      })
      .addCase(deleteGroupComment.fulfilled, (state, action) => {
        const { groupId, commentId } = action.payload;
        // Find and remove comment from all post comment arrays
        Object.keys(state.groupComments).forEach(key => {
          if (key.startsWith(`${groupId}_`)) {
            state.groupComments[key] = state.groupComments[key].filter(
              c => (c._id || c.id) !== commentId
            );
          }
        });
      });

    // Invite Links
    builder
      .addCase(fetchInviteLinks.fulfilled, (state, action) => {
        const { groupId, links } = action.payload;
        state.inviteLinks[groupId] = links;
      })
      .addCase(createInviteLink.fulfilled, (state, action) => {
        const { groupId, link } = action.payload;
        if (!state.inviteLinks[groupId]) {
          state.inviteLinks[groupId] = [];
        }
        state.inviteLinks[groupId].unshift(link);
      })
      .addCase(deactivateInviteLink.fulfilled, (state, action) => {
        const linkId = action.payload;
        Object.keys(state.inviteLinks).forEach(groupId => {
          state.inviteLinks[groupId] = state.inviteLinks[groupId].filter(
            l => (l._id || l.id) !== linkId
          );
        });
      })
      .addCase(joinViaInviteLink.fulfilled, (state, action) => {
        const group = action.payload;
        state.userGroups.unshift(group);
        state.currentGroup = group;
      });

    // Search Groups
    builder
      .addCase(searchGroups.fulfilled, (state, action) => {
        // Search results can be stored separately or merged with groups
        state.groups = action.payload;
      });
  },
});

export const { clearError, setCurrentGroup, clearCurrentGroup } = groupsSlice.actions;
export default groupsSlice.reducer;
