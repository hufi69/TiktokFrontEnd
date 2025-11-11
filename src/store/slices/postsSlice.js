import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG, buildUrl } from '../../config/api';
import { transformPost } from '../../utils/api/postUtils';
import { initializePosts, getPostLikes } from './likesSlice';
import { getPosts, createPost as createPostApi, getPost as getPostApi, updatePost as updatePostApi, deletePost as deletePostApi, createComment } from '../../services/api';
//api calls asycn thunks
const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      console.log('Fetch posts started');
      
      const data = await getPosts(50);
      console.log('Fetch posts response data:', data);

      const rawPosts = data.data?.posts || data.posts || [];
      const { user } = getState().auth;
      
      
      if (rawPosts.length > 0) {
        console.log('Sample raw post from backend:', {
          id: rawPosts[0]._id,
          commentsCount: rawPosts[0].commentsCount,
          commentCount: rawPosts[0].commentCount,
          comments: Array.isArray(rawPosts[0].comments) ? `Array[${rawPosts[0].comments.length}]` : rawPosts[0].comments,
          totalComments: rawPosts[0].totalComments,
          hasComments: !!(rawPosts[0].comments || rawPosts[0].commentsCount || rawPosts[0].commentCount)
        });
      }
      
      const processedPosts = rawPosts.map(post => {
        const commentCount = Number(post.comments) || 0;
        const postId = post._id || post.id;

        // Preserve existing like state if backend doesn't provide accurate likedByMe
        const currentLikeState = getState().likes?.posts?.[postId];
        const shouldPreserveLikeState = currentLikeState && typeof post.likedByMe !== 'boolean';

        const processedPost = {
          ...post,
          id: postId,
          _id: postId,
          commentsCount: commentCount,
          commentCount: commentCount,
          comments: commentCount,
          // Handle likes
          likes: Number(post.likes) || 0,
          likedByMe: shouldPreserveLikeState ? currentLikeState.isLiked : Boolean(post.likedByMe),
          isLiked: shouldPreserveLikeState ? currentLikeState.isLiked : Boolean(post.likedByMe),
          // Ensure author structure
          author: {
            _id: post.author?._id || post.author?.id,
            userName: post.author?.userName || post.author?.username,
            fullName: post.author?.fullName || post.author?.name,
            profilePicture: post.author?.profilePicture || null,
            ...post.author
          }
        };

        console.log(`Processed post ${processedPost.id}:`, {
          commentCount: processedPost.commentsCount,
          backendComments: post.comments,
          likes: processedPost.likes,
          likedByMe: processedPost.likedByMe,
          preservedLikeState: shouldPreserveLikeState,
          backendLikedByMe: post.likedByMe
        });

        return processedPost;
      });
      
      const transformedPosts = processedPosts.map(post => transformPost(post, user?._id));
      console.log(' Fetch posts successful, count:', transformedPosts.length);
      
      return transformedPosts;
    } catch (error) {
      console.error(' Fetch posts network error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const bookmarkPost = createAsyncThunk(
  'posts/bookmarkPost',
  async (postId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      // For now, just return success no bookmark api
      
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
      console.log('Create post started');
      
      const data = await createPostApi(postData);
      console.log('Create post response data:', data);

      const rawPost = data.data?.post || data.post;
      console.log('Raw created post:', rawPost);
      
      const { user } = getState().auth;
      const transformedPost = transformPost(rawPost, user?._id);
      
      console.log('Transformed created post:', transformedPost);
      return transformedPost;
    } catch (error) {
      console.log('Create post error:', error);
      return rejectWithValue(error.message || 'Failed to create post');
    }
  }
);

const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, content, parentId }, { getState, rejectWithValue }) => {
    try {
      console.log('Adding comment:', { postId, content, parentId, isReply: !!parentId });

      const isReply = !!parentId;

      if (isReply) {
        if (!parentId || !content) {
          return rejectWithValue('Parent comment ID and content are required for replies');
        }
      } else {
        if (!postId || !content) {
          return rejectWithValue('Post ID and content are required for comments');
        }
      }

      const commentData = isReply
        ? { commentId: parentId, content: content?.toString() || '' }
        : { postId, content: content?.toString() || '' };

      console.log('API Request:', { commentData, isReply });

      const data = await createComment(commentData);
      console.log('Comment API response:', data);

      // Extract comment from response based on API structure
      const comment = data.data?.comment || data.data?.newComment || data.comment || data.newComment;

      if (!comment) {
        console.error('No comment data in response:', data);
        return rejectWithValue('No comment data received from server');
      }

      console.log('Comment created successfully:', comment);

      return {
        postId,
        comment,
        parentId,
        isReply
      };
    } catch (error) {
      console.error('Comment network error:', error);
      return rejectWithValue(error.message || 'Failed to add comment');
    }
  }
);

const getPost = createAsyncThunk(
  'posts/getPost',
  async (postId, { getState, rejectWithValue, dispatch }) => {
    try {
      console.log('Get post started for ID:', postId);
      
      const data = await getPostApi(postId);
      console.log('Get post response data:', data);

      const rawPost = data.data?.post || data.post || data.data;
      const likedByMe = data.data?.likedByMe;
      const { user } = getState().auth;
      const transformed = transformPost(rawPost, user?._id);
      
      // Use likedByMe from API 
      if (typeof likedByMe === 'boolean') {
        transformed.isLiked = likedByMe;
      }

      try {
        dispatch(initializePosts([transformed]));
        if (transformed.isLiked && !transformed.likeId) {
          dispatch(getPostLikes(postId));
        }
      } catch (_e) {}

      return transformed;
    } catch (error) {
      console.log('Get post error:', error);
      return rejectWithValue(error.message || 'Failed to fetch post');
    }
  }
);

const updatePostAsync = createAsyncThunk(
  'posts/updatePostAsync',
  async ({ postId, postData }, { getState, rejectWithValue }) => {
    try {
      console.log('Update post started for ID:', postId);
      console.log('Update post data:', postData);
      
      const data = await updatePostApi(postId, {
        content: postData.content || '',
        // Skip images for now
      });
      console.log('Update post response data:', data);

      const rawPost = data.data?.post || data.data || data;
      console.log('Raw updated post:', rawPost);
      
      const { user } = getState().auth;
      const transformedPost = transformPost(rawPost, user?._id);
      
      console.log('Transformed updated post:', transformedPost);
      return { postId, post: transformedPost };
    } catch (error) {
      console.error('Update post network error:', error);
      return rejectWithValue(error.message || 'Failed to update post');
    }
  }
);

const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { getState, rejectWithValue }) => {
    try {
      console.log('Delete post started for ID:', postId);
      
      await deletePostApi(postId);
      console.log('Delete post successful for ID:', postId);

      return postId;
    } catch (error) {
      console.error('Delete post error:', error);
      return rejectWithValue(error.message || 'Failed to delete post');
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
        console.log(' Incremented comment count for post:', postId, 'new count:', post.commentsCount);
      } else {
        console.warn(' Post not found for comment increment:', postId);
      }
    },
    updateCommentCount: (state, action) => {
      const { postId, count } = action.payload;
      const post = state.posts.find(p => p.id === postId || p._id === postId);
      if (post) {
        post.comments = count;
        post.commentsCount = count;
        console.log(' Updated comment count for post:', postId, 'to:', count);
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
        const { postId, comment, parentId, isReply } = action.payload;

        if (isReply) {
          console.log(' Reply added successfully:', { parentId, comment: comment._id });
         
        } else {
          console.log(' Parent comment added successfully:', { postId, comment: comment._id });
        }

        
        const post = state.posts.find(p => p.id === postId || p._id === postId);
        if (post) {
          post.comments = (post.comments || 0) + 1;
          post.commentsCount = (post.commentsCount || 0) + 1;
          console.log(` Updated post ${postId} comment count to:`, post.commentsCount);
        } else {
          console.warn(' Post not found for comment update:', postId);
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
