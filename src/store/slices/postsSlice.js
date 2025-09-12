import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG, buildUrl } from '../../config/api';
import { transformPost } from '../../utils/api/postUtils';
import { initializePosts, getPostLikes } from './likesSlice';

// Async thunks for API calls

const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const { token } = getState().auth;
      console.log('🔧 Fetch posts - Token exists:', !!token);
      
      const url = buildUrl(API_CONFIG.ENDPOINTS.POSTS) + '?limit=50';
      console.log('🔧 Fetch posts - API URL:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Fetch posts response status:', response.status);
      const data = await response.json();
      console.log('📥 Fetch posts response data:', data);

      if (!response.ok) {
        console.error('❌ Fetch posts API error:', data);
        return rejectWithValue(data.message || 'Failed to fetch posts');
      }

      const rawPosts = data.data?.posts || data.posts || [];
      const { user } = getState().auth;
      
      // Debug: Log a sample raw post to see its structure
      if (rawPosts.length > 0) {
        console.log('📊 Sample raw post from backend:', {
          id: rawPosts[0]._id,
          commentsCount: rawPosts[0].commentsCount,
          commentCount: rawPosts[0].commentCount,
          comments: Array.isArray(rawPosts[0].comments) ? `Array[${rawPosts[0].comments.length}]` : rawPosts[0].comments,
          totalComments: rawPosts[0].totalComments,
          hasComments: !!(rawPosts[0].comments || rawPosts[0].commentsCount || rawPosts[0].commentCount)
        });
      }
      
      // Transform posts
      const transformedPosts = rawPosts.map(post => transformPost(post, user?._id));
      console.log('✅ Fetch posts successful, count:', transformedPosts.length);
      
      return transformedPosts;
    } catch (error) {
      console.error('💥 Fetch posts network error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Removed duplicate likePost - using togglePostLike from likesSlice instead

const bookmarkPost = createAsyncThunk(
  'posts/bookmarkPost',
  async (postId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      // For now, just return success since bookmark API might not be implemented
      // TODO: Replace with your actual API endpoint when available
      console.log('Bookmark post:', postId);
      return { postId, isBookmarked: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const formData = new FormData();
      // Backend expects JSON under `data` key and files under `images`/`videos`
      const payload = {
        content: postData.caption || postData.content || '',
        isPublic: postData.isPublic ?? true,
        tags: postData.tags || [],
      };
      formData.append('data', JSON.stringify(payload));
      
      // Add images to form data
      if (postData.images && postData.images.length > 0) {
        postData.images.forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: `image_${index}.jpg`,
          });
        });
      }

      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.POST_CREATE), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let the browser set it
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to create post');
      }

      const rawPost = data.data?.post || data.post;
      console.log(' Raw created post:', rawPost);
      
      const { user } = getState().auth;
      const transformedPost = transformPost(rawPost, user?._id);
      
      console.log(' Transformed created post:', transformedPost);
      return transformedPost;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, content, parentId }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      // Validate inputs
      if (!postId || !content) {
        return rejectWithValue('Post ID and content are required');
      }
      
      console.log('🔧 Sending comment request:', { postId, content, parentId });
      
      // If replying, use reply endpoint; else, create comment
      const isReply = !!parentId;
      const url = isReply 
        ? buildUrl(API_CONFIG.ENDPOINTS.REPLY_COMMENT)
        : buildUrl(API_CONFIG.ENDPOINTS.CREATE_COMMENT);

      const body = isReply
        ? { commentId: parentId, content: content?.toString() || '' }
        : { postId, content: content?.toString() || '' };

      const response = await fetch(url, {
        method: isReply ? 'POST' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log('📥 Comment response:', { status: response.status, data });

      if (!response.ok) {
        console.error('❌ Comment API error:', data);
        return rejectWithValue(data.message || 'Failed to add comment');
      }

      console.log('✅ Comment successful:', data);
      const comment = data.data?.comment || data.data?.newComment || data.comment || data.newComment;
      return { postId, comment };
    } catch (error) {
      console.error('💥 Comment network error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const getPost = createAsyncThunk(
  'posts/getPost',
  async (postId, { getState, rejectWithValue, dispatch }) => {
    try {
      const { token } = getState().auth;
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.GET_POST, { id: postId }), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch post');
      }

      // Normalize to transformed post and initialize likes state
      const rawPost = data.data?.post || data.post || data.data;
      const likedByMe = data.data?.likedByMe;
      const { user } = getState().auth;
      const transformed = transformPost(rawPost, user?._id);
      // Use likedByMe from API if present
      if (typeof likedByMe === 'boolean') {
        transformed.isLiked = likedByMe;
      }

      // Initialize likes slice for this post
      try {
        dispatch(initializePosts([transformed]));
        if (transformed.isLiked && !transformed.likeId) {
          dispatch(getPostLikes(postId));
        }
      } catch (_e) {}

      return transformed;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const updatePostAsync = createAsyncThunk(
  'posts/updatePostAsync',
  async ({ postId, postData }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const url = buildUrl(API_CONFIG.ENDPOINTS.UPDATE_POST, { id: postId });
      console.log('🔧 Update post URL:', url);
      console.log('🔧 Update post token:', token ? 'Token exists' : 'No token');
      console.log('🔧 Update post data:', postData);

      // For now, let's try a simple JSON request without FormData
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: postData.content || '',
          // Skip images for now to test basic functionality
        }),
      });

      console.log('📥 Update post response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Update post API error - Status:', response.status);
        let errorMessage = 'Failed to update post';
        try {
          const errorData = await response.json();
          console.error('❌ Update post API error data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          errorMessage = `Server error: ${response.status}`;
        }
        return rejectWithValue(errorMessage);
      }

      const data = await response.json();
      console.log('📥 Update post response data:', data);

      console.log('✅ Update post API response:', data);
      const rawPost = data.data?.post || data.data || data;
      console.log('📦 Raw updated post:', rawPost);
      
      const { user } = getState().auth;
      const transformedPost = transformPost(rawPost, user?._id);
      
      console.log('✅ Transformed updated post:', transformedPost);
      return { postId, post: transformedPost };
    } catch (error) {
      console.error('💥 Update post network error:', error);
      console.error('💥 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      return rejectWithValue(error.message || 'Failed to update post');
    }
  }
);

const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.DELETE_POST, { id: postId }), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🗑️ Delete response status:', response.status);
      
      // Check if response has content
      const responseText = await response.text();
      console.log('🗑️ Delete response text:', responseText);
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        // If response is empty or not JSON, but status is 200/204, consider it success
        if (response.ok) {
          return postId;
        }
        return rejectWithValue('Invalid response from server');
      }

      if (!response.ok) {
        console.error('❌ Delete post API error:', data);
        const errorMessage = data.message || data.error || 'Failed to delete post';
        return rejectWithValue(errorMessage);
      }

      return postId;
    } catch (error) {
      console.error('💥 Delete network error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  posts: [],
  isLoading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearPostsError: (state) => {
      state.error = null;
    },
    setPosts: (state, action) => {
      state.posts = action.payload;
    },
    addPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    updatePost: (state, action) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload };
      }
    },
    removePost: (state, action) => {
      state.posts = state.posts.filter(post => post._id !== action.payload && post.id !== action.payload);
    },
    // Removed toggleLike and setLikeStatus - using likesSlice for all like functionality
    toggleBookmark: (state, action) => {
      const { postId } = action.payload;
      const post = state.posts.find(p => p.id === postId);
      if (post) {
        post.isBookmarked = !post.isBookmarked;
      }
    },
    incrementCommentCount: (state, action) => {
      const { postId } = action.payload;
      const post = state.posts.find(p => p.id === postId || p._id === postId);
      if (post) {
        post.comments = (post.comments || 0) + 1;
        post.commentsCount = (post.commentsCount || 0) + 1;
        console.log('📈 Incremented comment count for post:', postId, 'new count:', post.commentsCount);
      } else {
        console.warn('⚠️ Post not found for comment increment:', postId);
      }
    },
    updateCommentCount: (state, action) => {
      const { postId, count } = action.payload;
      const post = state.posts.find(p => p.id === postId || p._id === postId);
      if (post) {
        post.comments = count;
        post.commentsCount = count;
        console.log('📈 Updated comment count for post:', postId, 'to:', count);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Posts
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload;
        state.error = null;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Removed likePost reducers - using likesSlice for all like functionality

    // Bookmark Post
    builder
      .addCase(bookmarkPost.fulfilled, (state, action) => {
        const { postId, isBookmarked } = action.payload;
        const post = state.posts.find(p => p.id === postId);
        if (post) {
          post.isBookmarked = isBookmarked;
        }
      });

    // Create Post
    builder
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts.unshift(action.payload);
        state.error = null;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Post
    builder
      .addCase(getPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPost.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add or update the post in the posts array
        const index = state.posts.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        } else {
          state.posts.unshift(action.payload);
        }
        state.error = null;
      })
      .addCase(getPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Post
    builder
      .addCase(updatePostAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePostAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { postId, post } = action.payload;
        const index = state.posts.findIndex(p => p._id === postId || p.id === postId);
        if (index !== -1) {
          state.posts[index] = { ...state.posts[index], ...post };
        }
        state.error = null;
      })
      .addCase(updatePostAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete Post
    builder
      .addCase(deletePost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = state.posts.filter(post => post._id !== action.payload && post.id !== action.payload);
        state.error = null;
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Add Comment
    builder
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        const post = state.posts.find(p => p.id === postId || p._id === postId);
        if (post) {
          // Update both comments count fields
          post.comments = (post.comments || 0) + 1;
          post.commentsCount = (post.commentsCount || 0) + 1;
          console.log('📝 Updated post comment count to:', post.commentsCount);
        } else {
          console.warn('⚠️ Post not found for comment update:', postId);
        }
      });
  },
});

export const {
  clearPostsError,
  setPosts,
  addPost,
  updatePost,
  removePost,
  toggleBookmark,
  incrementCommentCount,
  updateCommentCount,
} = postsSlice.actions;

export { 
  fetchPosts, 
  bookmarkPost, 
  createPost, 
  getPost, 
  updatePostAsync, 
  deletePost, 
  addComment 
};

export default postsSlice.reducer;
