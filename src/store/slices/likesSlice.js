import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG, buildUrl } from '../../config/api';

const initialState = {
  posts: {},          // { postId: { isLiked, count, likeId } }
  comments: {},       // { commentId: { isLiked, count } }
  postLikes: {},      // { postId: { users: [], loading: false, error: null } }
  pending: {},
  error: null,
};

// Toggle post like/unlike with backend-aligned logic
export const togglePostLike = createAsyncThunk(
  'likes/togglePost',
  async (postId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { token } = state.auth;
      const currentUser = state.auth?.user;
      const currentLike = state.likes.posts[postId];
      const isCurrentlyLiked = currentLike?.isLiked || false;
      
      const likeId = currentLike?.likeId;
      
      console.log('togglePostLike DEBUG:', {
        postId,
        currentLike,
        isCurrentlyLiked,
        likeId,
        willCallLikeAPI: !isCurrentlyLiked,
        willCallUnlikeAPI: isCurrentlyLiked
      });

      // If not liked, call like API
      if (!isCurrentlyLiked) {
        console.log('Calling LIKE API:', API_CONFIG.ENDPOINTS.LIKE_POST_ACTION, postId);
        const likeRes = await fetch(buildUrl(API_CONFIG.ENDPOINTS.LIKE_POST_ACTION), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId }),
        });
        const likeData = await likeRes.json();
        if (!likeRes.ok) {
          throw new Error(likeData.message || 'Failed to like post');
        }
        const newLikeId = likeData.data?.like?._id;
        return { postId, isLiked: true, count: (currentLike?.count || 0) + 1, likeId: newLikeId };
      }
      // If already liked, call unlike API
      else {
        // If we don't have a likeId, we need to fetch it first
        if (!likeId) {
          try {
            // First try to get the likes for this post to find our like ID
            const likesRes = await fetch(buildUrl(API_CONFIG.ENDPOINTS.GET_POST_LIKES), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ postId }),
            });
            const likesData = await likesRes.json();
            
            if (likesRes.ok) {
              const likesArr = likesData?.data?.likes || [];
              const myId = currentUser?._id || currentUser?.id;
              const myLike = likesArr.find(like => {
                const likeUserId = like?.user?._id || like?.user?.id;
                return likeUserId === myId;
              });
              
              if (myLike) {
                // Found our like, now we can unlike it
                const myLikeId = myLike._id;
                const unlikeRes = await fetch(buildUrl(API_CONFIG.ENDPOINTS.UNLIKE_POST_ACTION), {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ likeId: myLikeId }),
                });
                
                const unlikeData = await unlikeRes.json();
                if (!unlikeRes.ok) {
                  throw new Error(unlikeData.message || 'Failed to unlike post');
                }
                
                return { postId, isLiked: false, count: Math.max(0, (currentLike?.count || 0) - 1), likeId: null };
              } else {
                // We couldn't find our like, so we can't unlike it
                throw new Error('Could not find your like for this post');
              }
            } else {
              throw new Error(likesData.message || 'Failed to fetch likes');
            }
          } catch (error) {
            console.error('Error finding like ID:', error);
            return rejectWithValue(error.message);
          }
        } else {
          // We already have the likeId, so we can unlike directly
          try {
            const unlikeRes = await fetch(buildUrl(API_CONFIG.ENDPOINTS.UNLIKE_POST_ACTION), {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ likeId }),
            });
            
            const unlikeData = await unlikeRes.json();
            if (!unlikeRes.ok) {
              throw new Error(unlikeData.message || 'Failed to unlike post');
            }
            
            return { postId, isLiked: false, count: Math.max(0, (currentLike?.count || 0) - 1), likeId: null };
          } catch (error) {
            console.error('Error unliking post:', error);
            return rejectWithValue(error.message);
          }
        }
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      return rejectWithValue(error.message);
    }
  }
);


export const unlikePost = createAsyncThunk(
  'likes/unlikePost',
  async ({ postId, likeId }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { token } = state.auth;
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.UNLIKE_POST_ACTION), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ likeId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to unlike post');
      }

      return { postId, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Get all users who liked a post (Instagram-like functionality)
export const getPostLikes = createAsyncThunk(
  'likes/getPostLikes',
  async (postId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      // The backend expects postId in the request body, not as a query parameter
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.GET_POST_LIKES), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch post likes');
      }

      // Returns array of users who liked the post
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

// Toggle comment like/unlike - uses single endpoint that auto-toggles
export const toggleCommentLike = createAsyncThunk(
  'likes/toggleComment',
  async (commentId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { token } = state.auth;
      
      const response = await fetch(buildUrl('/api/v1/likes/like-comment'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle comment like');
      }

      // Determine if this was a like or unlike based on response
      // If data.data.like exists, it means we just liked the comment
      // If it doesn't exist, it means we just unliked the comment
      const isLiked = !!data.data?.like;
      const likeCountChange = isLiked ? 1 : -1;

      return { commentId, isLiked, count: likeCountChange };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    // Initialize posts with like data - includes likeId for posts
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
        
        state.posts[postId] = {
          isLiked: typeof post.likedByMe === 'boolean' 
            ? post.likedByMe 
            : (typeof post.isLiked === 'boolean' ? post.isLiked : false),
          count: Number(post.likes) || 0,
          likeId: post.likeId || null, // Store likeId for unlike operations
        };
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
          isLiked: Boolean(comment.isLiked),
          count: Number(comment.likes) || 0,
        };
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
        const postId = action.meta.arg;
        const current = state.posts[postId] || { isLiked: false, count: 0, likeId: null };
        
        // Simple optimistic update
        state.posts[postId] = {
          ...current,
          isLiked: !current.isLiked,
          count: current.isLiked ? Math.max(0, current.count - 1) : current.count + 1,
          likeId: current.isLiked ? null : current.likeId, // Keep existing likeId for potential revert
        };
        state.pending[postId] = true;
      })
      .addCase(togglePostLike.fulfilled, (state, action) => {
        const { postId, isLiked, count, likeId } = action.payload;
        
        // Complete state update with server response
        state.posts[postId] = {
          isLiked,
          count,
          likeId, // Will be null for unlike, actual ID for like
        };
        delete state.pending[postId];
        state.error = null;
      })
      .addCase(togglePostLike.rejected, (state, action) => {
        const postId = action.meta.arg;
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
        const current = state.comments[commentId] || { isLiked: false, count: 0 };
        
        // Optimistic update
        state.comments[commentId] = {
          ...current,
          isLiked: !current.isLiked,
          count: current.isLiked ? Math.max(0, current.count - 1) : current.count + 1,
        };
        state.pending[commentId] = true;
      })
      .addCase(toggleCommentLike.fulfilled, (state, action) => {
        const { commentId, isLiked, count } = action.payload;
        const current = state.comments[commentId] || { isLiked: false, count: 0 };
        
        // Complete state update with server response
        state.comments[commentId] = {
          isLiked,
          count: current.count + count, // Add the change to current count
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
          current.count = current.isLiked ? Math.max(0, current.count - 1) : current.count + 1;
        }

        delete state.pending[commentId];
        state.error = action.payload;
      });
    
    // Get Post Likes (list of users who liked)
    builder
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

// Selectors
const defaultPostLikeState = { isLiked: false, count: 0, likeId: null };
const defaultCommentLikeState = { isLiked: false, count: 0 };

export const selectPostLike = (postId) => (state) => state.likes.posts[postId] || defaultPostLikeState;
export const selectCommentLike = (commentId) => (state) => state.likes.comments[commentId] || defaultCommentLikeState;
export const selectLikePending = (id) => (state) => !!state.likes.pending[id];
export const selectLikeError = (state) => state.likes.error;
export const selectPostLikes = (postId) => (state) => 
  state.likes.postLikes[postId] || { users: [], loading: false, error: null };
