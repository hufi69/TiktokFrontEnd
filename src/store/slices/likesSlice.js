import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { API_CONFIG, buildUrl } from '../../config/api';
import * as likesApi from '../../services/api/likesApi';

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
      const postId = typeof payload === 'string' ? payload : payload.postId;

      const currentLike = state.likes.posts[postId];
      const currentCount = currentLike?.count || 0;
      const isCurrentlyLiked = currentLike?.isLiked || false;
      const storedLikeId = currentLike?.likeId;

      let effectiveLikeId = storedLikeId;
      
      if (isCurrentlyLiked && !effectiveLikeId) {
        // Need to fetch likeId from backend
        const currentUserId = state.auth?.user?._id || state.auth?.user?.id;
        const likesData = await likesApi.getPostLikes(postId);
        const likes = likesData.data?.likes || [];
        const userLike = likes.find(like => {
          const likeUserId = like.user?._id || like.user?.id;
          return likeUserId && likeUserId.toString() === currentUserId?.toString();
        });
        effectiveLikeId = userLike?._id || userLike?.id;
        
        if (!effectiveLikeId) {
          // If likeId not found but state says liked, sync state from backend
          console.log('LikeId not found for unlike - syncing state...');
          if (likes.length === 0) {
            // No likes found, post is not actually liked
            return {
              postId,
              isLiked: false,
              count: 0,
              likeId: null,
            };
          }
      
          return {
            postId,
            isLiked: false,
            count: likes.length,
            likeId: null,
          };
        }
      }
      if (!isCurrentlyLiked) {
    
        try {
          const data = await likesApi.likePost(postId);
          return {
            postId,
            isLiked: true,
            count: currentCount + 1,
            likeId: data.data?.like?._id,
          };
        } catch (likeError) {
          // Handle duplicate/already liked error - state is out of sync
          const errorMessage = likeError.message || '';
          const isDuplicateError = errorMessage.toLowerCase().includes('duplicate') || 
                                  errorMessage.toLowerCase().includes('already liked') ||
                                  errorMessage.toLowerCase().includes('post already liked');
          
          if (isDuplicateError) {
         
            console.log('Duplicate like detected - syncing state from backend...');
            const currentUserId = state.auth?.user?._id || state.auth?.user?.id;
            const likesData = await likesApi.getPostLikes(postId);
            const likes = likesData.data?.likes || [];
            const userLike = likes.find(like => {
              const likeUserId = like.user?._id || like.user?.id;
              return likeUserId && likeUserId.toString() === currentUserId?.toString();
            });
            
            if (userLike) {
    
              return {
                postId,
                isLiked: true,
                count: likes.length,
                likeId: userLike._id || userLike.id,
              };
            } else {
          
              return {
                postId,
                isLiked: true,
                count: likes.length || currentCount,
                likeId: null,
              };
            }
          }
       
          throw likeError;
        }
      } else {
     
        if (!effectiveLikeId) {
        
          const currentUserId = state.auth?.user?._id || state.auth?.user?.id;
          const likesData = await likesApi.getPostLikes(postId);
          const likes = likesData.data?.likes || [];
          const userLike = likes.find(like => {
            const likeUserId = like.user?._id || like.user?.id;
            return likeUserId && likeUserId.toString() === currentUserId?.toString();
          });
          effectiveLikeId = userLike?._id || userLike?.id;
        }
        
        if (effectiveLikeId) {
          try {
            await likesApi.unlikePost(effectiveLikeId);
            return {
              postId,
              isLiked: false,
              count: Math.max(0, currentCount - 1),
              likeId: null,
            };
          } catch (unlikeError) {
            // If unlike fails, sync state from backend
            console.log('Unlike failed - syncing state from backend...', unlikeError.message);
            const currentUserId = state.auth?.user?._id || state.auth?.user?.id;
            const likesData = await likesApi.getPostLikes(postId);
            const likes = likesData.data?.likes || [];
            const userLike = likes.find(like => {
              const likeUserId = like.user?._id || like.user?.id;
              return likeUserId && likeUserId.toString() === currentUserId?.toString();
            });
            
            if (!userLike) {
              return {
                postId,
                isLiked: false,
                count: likes.length,
                likeId: null,
              };
            } else {
              // Still liked, sync with correct likeId
              return {
                postId,
                isLiked: true,
                count: likes.length,
                likeId: userLike._id || userLike.id,
              };
            }
          }
        } else {
      
          console.log('LikeId not found - syncing state from backend...');
          const currentUserId = state.auth?.user?._id || state.auth?.user?.id;
          const likesData = await likesApi.getPostLikes(postId);
          const likes = likesData.data?.likes || [];
          const userLike = likes.find(like => {
            const likeUserId = like.user?._id || like.user?.id;
            return likeUserId && likeUserId.toString() === currentUserId?.toString();
          });
          
          if (!userLike) {
            // Not actually liked, update state
            return {
              postId,
              isLiked: false,
              count: likes.length,
              likeId: null,
            };
          } else {
            // Still liked, update with correct likeId
            return {
              postId,
              isLiked: true,
              count: likes.length,
              likeId: userLike._id || userLike.id,
            };
          }
        }
      }

    } catch (error) {
      console.error('Post like error:', error);
      return rejectWithValue(error.message);
    }
  }
);


export const toggleCommentLike = createAsyncThunk(
  'likes/toggleComment',
  async (commentId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const currentLike = state.likes.comments[commentId];
      const currentCount = currentLike?.count || 0;
      const isCurrentlyLiked = currentLike?.isLiked || false;

      // Call API directly - backend toggles automatically
      const data = await likesApi.likeComment(commentId);
      
      // Determine if it was liked or unliked based on response
      const wasLiked = !data.message?.includes('unliked');
      
      return {
        commentId,
        isLiked: wasLiked,
        count: wasLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
        likeId: wasLiked ? data.data?.like?._id : null,
      };

    } catch (error) {
      console.error('Comment like error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Get post likes - GET /api/v1/likes/get-likes/:postId
export const getPostLikes = createAsyncThunk(
  'likes/getPostLikes',
  async (postId, { getState, rejectWithValue }) => {
    try {
      const data = await likesApi.getPostLikes(postId);
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
        const errorMessage = action.payload || '';
        const isDuplicateError = errorMessage.toLowerCase().includes('duplicate') || 
                                errorMessage.toLowerCase().includes('already liked') ||
                                errorMessage.toLowerCase().includes('post already liked') ||
                                errorMessage.toLowerCase().includes('could not find likeid');
        
        if (current && !isDuplicateError) {
   
          current.isLiked = !current.isLiked;
          current.count = current.isLiked ? current.count + 1 : Math.max(0, current.count - 1);
        }
        delete state.pending[postId];

        if (!isDuplicateError) {
          state.error = action.payload;
        }
      })
      
      
      .addCase(toggleCommentLike.pending, (state, action) => {
        const commentId = action.meta.arg;

        
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
const defaultPostLikesState = { users: [], loading: false, error: null };


export const selectPostLike = (postId) => (state) => state.likes.posts[postId] || defaultPostLikeState;
export const selectCommentLike = (commentId) => (state) => state.likes.comments[commentId] || defaultCommentLikeState;
export const selectLikePending = (id) => (state) => !!state.likes.pending[id];
export const selectLikeError = (state) => state.likes.error;


export const selectPostLikes = (postId) => createSelector(
  [(state) => state.likes.postLikes[postId]],
  (postLikes) => postLikes || defaultPostLikesState
);