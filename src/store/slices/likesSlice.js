import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG, buildUrl } from '../../config/api';

const initialState = {
  posts: {},          
  comments: {},       
  postLikes: {},     
  pending: {},
  error: null,
};

export const togglePostLike = createAsyncThunk(
  'likes/togglePost',
  async (payload, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { token } = state.auth;

      
      const postId = typeof payload === 'string' ? payload : payload.postId;

      const currentLike = state.likes.posts[postId];
      const currentCount = currentLike?.count || 0;
      const isCurrentlyLiked = currentLike?.isLiked || false;
      const storedLikeId = currentLike?.likeId;

      console.log(' Toggling post like:', { postId, isCurrentlyLiked, currentCount });
      console.log(' Decision logic: isCurrentlyLiked =', isCurrentlyLiked, ', so will', isCurrentlyLiked ? 'UNLIKE' : 'LIKE');

      if (!isCurrentlyLiked) {
        // LIKE the post - POST /api/v1/likes/like
        console.log(' Liking post:', postId);

        const likeResponse = await fetch(buildUrl('/api/v1/likes/like'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId }),
        });

        const likeData = await likeResponse.json();
        console.log(' Like response:', likeData);

        if (!likeResponse.ok) {
          throw new Error(likeData.message || 'Failed to like post');
        }

        // Store the likeId 
        const newLikeId = likeData.data?.like?._id;
        console.log(' Like successful, stored likeId:', newLikeId);

        return {
          postId,
          isLiked: true,
          count: currentCount + 1,
          likeId: newLikeId
        };

      } else {
        // UNLIKE the post - DELETE /api/v1/likes/unlike
        console.log('Unliking post:', postId);

        let likeIdToUse = storedLikeId;

        // If no likeId stored but post is liked, fetch it from backend
        if (!likeIdToUse) {
          console.log(' No likeId stored, fetching from backend...');

          const likesResponse = await fetch(buildUrl(`/api/v1/likes/get-likes/${postId}`), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const likesData = await likesResponse.json();
          console.log('Fetched likes for unlike:', likesData);

          if (!likesResponse.ok) {
            throw new Error(likesData.message || 'Failed to fetch likes');
          }

          // Find current user's like
          const currentUserId = state.auth?.user?._id || state.auth?.user?.id;
          const likes = likesData.data?.likes || [];

          const myLike = likes.find(like => {
            const likeUserId = like.user?._id || like.user?.id;
            return String(likeUserId) === String(currentUserId);
          });

          if (myLike) {
            likeIdToUse = myLike._id;
            console.log(' Found likeId for unlike:', likeIdToUse);
          } else {
            throw new Error('Could not find your like for this post');
          }
        }

        // Now unlike with the likeId
        const unlikeResponse = await fetch(buildUrl('/api/v1/likes/unlike'), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ likeId: likeIdToUse }),
        });

        const unlikeData = await unlikeResponse.json();
        console.log('Unlike response:', unlikeData);

        if (!unlikeResponse.ok) {
          throw new Error(unlikeData.message || 'Failed to unlike post');
        }

        console.log(' Unlike successful');

        return {
          postId,
          isLiked: false,
          count: Math.max(0, currentCount - 1),
          likeId: null
        };
      }

    } catch (error) {
      console.error(' Post like error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Comment like API - simple like toggleCommentLike
export const toggleCommentLike = createAsyncThunk(
  'likes/toggleComment',
  async (commentId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { token } = state.auth;
      const currentLike = state.likes.comments[commentId];
      const currentCount = currentLike?.count || 0;
      const isCurrentlyLiked = currentLike?.isLiked || false;

      console.log(' Toggling comment like:', { commentId, isCurrentlyLiked, currentCount });
      console.log(' API URL:', buildUrl(`/api/v1/likes/like-comment/${commentId}`));

      // Backend endpoint: POST /api/v1/likes/like-comment/:commentId
      const response = await fetch(buildUrl(`/api/v1/likes/like-comment/${commentId}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📥 Comment like response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle comment like');
      }

      // Check response to determine if liked or unliked
      if (data.message && data.message.includes('unliked')) {
        // Comment was unliked
        console.log(' Comment unliked');
        return {
          commentId,
          isLiked: false,
          count: Math.max(0, currentCount - 1),
          likeId: null
        };
      } else if (data.data?.like) {
        // Comment was liked
        console.log(' Comment liked, likeId:', data.data.like._id);
        return {
          commentId,
          isLiked: true,
          count: currentCount + 1,
          likeId: data.data.like._id
        };
      } else {
        throw new Error('Unexpected response format');
      }

    } catch (error) {
      console.error(' Comment like error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Get post likes - GET /api/v1/likes/get-likes/:postId
export const getPostLikes = createAsyncThunk(
  'likes/getPostLikes',
  async (postId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      const response = await fetch(buildUrl(`/api/v1/likes/get-likes/${postId}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch post likes');
      }

      const likes = data.data?.likes || [];
      const myUserId = getState().auth?.user?._id || getState().auth?.user?.id;
      const mine = likes.find(l => (l?.user?._id || l?.user?.id) === myUserId);
      const myLikeId = mine?._id || mine?.id || null;
      
      return { postId, likes, myLikeId };
    } catch (error) {
      console.error('Error fetching post likes:', error);
      return rejectWithValue(error.message);
    }
  }
);


const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    // Initialize posts with like data
    initializePosts(state, action) { 
      if (!action.payload || !Array.isArray(action.payload)) { 
        console.warn('initializePosts: Invalid payload', action.payload); 
        return; 
      } 
      
      action.payload.forEach(post => { 
        if (!post) return; 
        
        const postId = post._id || post.id; 
        if (!postId) { 
          console.warn('initializePosts: Post missing ID', post); 
          return; 
        } 
        const isLiked = Boolean(post.likedByMe); 
        const likeCount = Number(post.likes) || 0; 
        
        state.posts[postId] = { 
          isLiked: isLiked, 
          count: likeCount, 
          likeId: null, 
        }; 
        
        console.log(` Initialized post ${postId}:`, { 
          isLiked, 
          count: likeCount, 
          likedByMe: post.likedByMe 
        }); 
      });
    },
    
    // Initialize comments with like data
    initializeComments(state, action) {
      if (!action.payload || !Array.isArray(action.payload)) {
        console.warn('initializeComments: Invalid payload', action.payload);
        return;
      }

      action.payload.forEach(comment => {
        if (!comment) return;

        const commentId = comment._id || comment.id;
        if (!commentId) {
          console.warn('initializeComments: Comment missing ID', comment);
          return;
        }

        state.comments[commentId] = {
          isLiked: Boolean(comment.likedByMe),
          count: Number(comment.likes || comment.likesCount || 0),
          likeId: null,
        };

        console.log(` Initialized comment ${commentId}:`, {
          likedByMe: comment.likedByMe,
          isLiked: Boolean(comment.likedByMe),
          count: Number(comment.likes || comment.likesCount || 0)
        });
      });
    },
    
    // Clear error state
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Toggle post like
      .addCase(togglePostLike.pending, (state, action) => {
        const payload = action.meta.arg;
        const postId = typeof payload === 'string' ? payload : payload.postId;

        
        state.pending[postId] = true;
      })
      .addCase(togglePostLike.fulfilled, (state, action) => {
        const { postId, isLiked, count, likeId } = action.payload;
        
        state.posts[postId] = {
          isLiked,
          count,
          likeId,
        };
        delete state.pending[postId];
        state.error = null;
      })
      .addCase(togglePostLike.rejected, (state, action) => {
        const payload = action.meta.arg;
        const postId = typeof payload === 'string' ? payload : payload.postId;
        const current = state.posts[postId];

        // Revert optimistic update on failure
        if (current) {
          current.isLiked = !current.isLiked;
          current.count = current.isLiked ? current.count + 1 : Math.max(0, current.count - 1);
        }

        delete state.pending[postId];
        state.error = action.payload;
      })
      
      // Toggle comment like
      .addCase(toggleCommentLike.pending, (state, action) => {
        const commentId = action.meta.arg;

        // Only set pending state, no optimistic update
        state.pending[commentId] = true;
      })
      .addCase(toggleCommentLike.fulfilled, (state, action) => {
        const { commentId, isLiked, count, likeId } = action.payload;

        state.comments[commentId] = {
          isLiked,
          count,
          likeId: likeId || null,
        };
        delete state.pending[commentId];
        state.error = null;
      })
      .addCase(toggleCommentLike.rejected, (state, action) => {
        const commentId = action.meta.arg;
        const current = state.comments[commentId];

        // Revert optimistic update on failure
        if (current) {
          current.isLiked = !current.isLiked;
          current.count = current.isLiked ? current.count + 1 : Math.max(0, current.count - 1);
        }

        delete state.pending[commentId];
        state.error = action.payload;
      })
    
      // Get Post Likes
      .addCase(getPostLikes.pending, (state, action) => {
        const postId = action.meta.arg;
        if (!state.postLikes[postId]) {
          state.postLikes[postId] = { users: [], loading: true, error: null };
        } else {
          state.postLikes[postId].loading = true;
          state.postLikes[postId].error = null;
        }
      })
      .addCase(getPostLikes.fulfilled, (state, action) => {
        const { postId, likes, myLikeId } = action.payload;
        state.postLikes[postId] = { users: likes, loading: false, error: null };
        
        if (!state.posts[postId]) {
          state.posts[postId] = { isLiked: false, count: 0, likeId: null };
        }
        if (myLikeId) {
          state.posts[postId].likeId = myLikeId;
          state.posts[postId].isLiked = true;
        }
      })
      .addCase(getPostLikes.rejected, (state, action) => {
        const postId = action.meta.arg;
        if (state.postLikes[postId]) {
          state.postLikes[postId].loading = false;
          state.postLikes[postId].error = action.payload;
        }
      });
  }
});

export const { initializePosts, initializeComments, clearError } = likesSlice.actions;
export default likesSlice.reducer;
const defaultPostLikeState = { isLiked: false, count: 0, likeId: null };
const defaultCommentLikeState = { isLiked: false, count: 0, likeId: null };

export const selectPostLike = (postId) => (state) => state.likes.posts[postId] || defaultPostLikeState;
export const selectCommentLike = (commentId) => (state) => state.likes.comments[commentId] || defaultCommentLikeState;
export const selectLikePending = (id) => (state) => !!state.likes.pending[id];
export const selectLikeError = (state) => state.likes.error;
export const selectPostLikes = (postId) => (state) => 
  state.likes.postLikes[postId] || { users: [], loading: false, error: null };