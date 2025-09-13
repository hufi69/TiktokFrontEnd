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
  async (postId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { token } = state.auth;
      const currentLike = state.likes.posts[postId];
      const currentCount = currentLike?.count || 0;
      const isCurrentlyLiked = currentLike?.isLiked || false;
      const storedLikeId = currentLike?.likeId;
      
      console.log('🔄 Toggling post like:', { postId, isCurrentlyLiked, currentCount, storedLikeId });
      
      if (!isCurrentlyLiked) {
        // LIKE the post - POST /api/v1/likes/like
        console.log('👍 Liking post:', postId);
        
        const likeResponse = await fetch(buildUrl('/api/v1/likes/like'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId }),
        });
        
        const likeData = await likeResponse.json();
        console.log('📥 Like response:', likeData);
        
        if (!likeResponse.ok) {
          throw new Error(likeData.message || 'Failed to like post');
        }

        // Store the likeId for future unlike operations
        const newLikeId = likeData.data?.like?._id;
        console.log('✅ Like successful, stored likeId:', newLikeId);
        
        return { 
          postId, 
          isLiked: true, 
          count: currentCount + 1,
          likeId: newLikeId
        };
        
      } else {
        // UNLIKE the post - DELETE /api/v1/likes/unlike
        console.log('👎 Unliking post:', postId);
        
        let likeIdToUse = storedLikeId;
        
        // If no stored likeId, fetch it from backend
        if (!likeIdToUse) {
          console.log('🔍 No stored likeId, fetching from backend...');
          
          try {
            // FIXED: Use POST as per your backend controller
            const likesResponse = await fetch(buildUrl('/api/v1/likes/get-likes'), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ postId }),
            });
            
            const likesData = await likesResponse.json();
            console.log('📥 Fetched likes:', likesData);
            
            if (!likesResponse.ok) {
              throw new Error(likesData.message || 'Failed to fetch likes');
            }
            
            // Find current user's like
            const currentUserId = state.auth?.user?._id;
            const likes = likesData.data?.likes || [];
            const myLike = likes.find(like => 
              (like.user?._id || like.user?.id || like.user) === currentUserId
            );
            
            if (myLike) {
              likeIdToUse = myLike._id;
              console.log('✅ Found likeId:', likeIdToUse);
            } else {
              throw new Error('Could not find your like for this post');
            }
          } catch (fetchError) {
            console.error('❌ Error fetching likeId:', fetchError);
            throw new Error('Unable to unlike: ' + fetchError.message);
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
        console.log('📥 Unlike response:', unlikeData);
        
        if (!unlikeResponse.ok) {
          throw new Error(unlikeData.message || 'Failed to unlike post');
        }
        
        console.log('✅ Unlike successful');
        
        return { 
          postId, 
          isLiked: false, 
          count: Math.max(0, currentCount - 1),
          likeId: null
        };
      }
      
    } catch (error) {
      console.error('❌ Post like error:', error);
      return rejectWithValue(error.message);
    }
  }
);

//  Comment like api
export const toggleCommentLike = createAsyncThunk(
  'likes/toggleComment',
  async (commentId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { token } = state.auth;
      const currentLike = state.likes.comments[commentId];
      const isCurrentlyLiked = currentLike?.isLiked || false;
      const currentCount = currentLike?.count || 0;
      
      console.log('🔄 Toggling comment like:', { commentId, isCurrentlyLiked, currentCount });
      
      //  backend endpoint - POST /api/v1/likes/like-comment 
      const response = await fetch(buildUrl('/api/v1/likes/like-comment'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId }),
      });

      const data = await response.json();
      console.log('📥 Comment like response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle comment like');
      }

      // Handle response
      let newIsLiked;
      let newCount;
      
      if (data.message && data.message.includes('unliked')) {
        // Comment was unliked
        newIsLiked = false;
        newCount = Math.max(0, currentCount - 1);
      } else if (data.data?.like) {
        // Comment was like
        newIsLiked = true;
        newCount = currentCount + 1;
      } else {
        // Fallback: toggle current state
        newIsLiked = !isCurrentlyLiked;
        newCount = newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
      }

      console.log(' Comment like toggled:', { commentId, newIsLiked, newCount });
      
      return { 
        commentId, 
        isLiked: newIsLiked, 
        count: newCount 
      };
    } catch (error) {
      console.error(' Comment like error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Get post likes - POST /api/v1/likes/get-likes
export const getPostLikes = createAsyncThunk(
  'likes/getPostLikes',
  async (postId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl('/api/v1/likes/get-likes'), {
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
        
        // Your backend returns likedByMe field 
        const isLiked = Boolean(post.likedByMe); 
        const likeCount = Number(post.likes) || 0; 
        
        state.posts[postId] = { 
          isLiked: isLiked, 
          count: likeCount, 
          likeId: null, // We don't get likeId from initial posts, will fetch when needed 
        }; 
        
        console.log(`📋 Initialized post ${postId}:`, { 
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
          isLiked: Boolean(comment.isLiked || comment.likedByMe),
          count: Number(comment.likes || comment.likesCount || 0),
        };
        
        console.log(`📋 Initialized comment ${commentId}:`, state.comments[commentId]);
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
        
        // Optimistic update
        state.posts[postId] = {
          ...current,
          isLiked: !current.isLiked,
          count: current.isLiked ? Math.max(0, current.count - 1) : current.count + 1,
          likeId: current.isLiked ? null : current.likeId,
        };
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
        
        state.comments[commentId] = {
          isLiked,
          count,
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

// Selectors
const defaultPostLikeState = { isLiked: false, count: 0, likeId: null };
const defaultCommentLikeState = { isLiked: false, count: 0 };

export const selectPostLike = (postId) => (state) => state.likes.posts[postId] || defaultPostLikeState;
export const selectCommentLike = (commentId) => (state) => state.likes.comments[commentId] || defaultCommentLikeState;
export const selectLikePending = (id) => (state) => !!state.likes.pending[id];
export const selectLikeError = (state) => state.likes.error;
export const selectPostLikes = (postId) => (state) => 
  state.likes.postLikes[postId] || { users: [], loading: false, error: null };