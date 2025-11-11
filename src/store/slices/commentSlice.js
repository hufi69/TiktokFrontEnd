import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG, buildUrl } from '../../config/api';
import { 
  getComments, 
  createComment as createCommentApi, 
  deleteComment as deleteCommentApi, 
  updateComment as updateCommentApi, 
  replyComment, 
  getReplies 
} from '../../services/api';

// Get all comments for a post
export const getPostComments = createAsyncThunk(
  'comments/getPostComments',
  async (postId, { getState, rejectWithValue }) => {
    try {
      console.log('Get post comments started for ID:', postId);
      
      const data = await getComments(postId);
      console.log('Get comments response:', data);

      return { postId, comments: data.data?.comments || [] };
    } catch (error) {
      console.error('Get comments error:', error);
      return rejectWithValue(error.message || 'Failed to fetch comments');
    }
  }
);

// Create a new parent comment
export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ postId, content }, { getState, rejectWithValue }) => {
    try {
      console.log('Creating parent comment:', { postId, content });

      const data = await createCommentApi({ postId, content });
      console.log('Create comment response:', data);

      const comment = data.data?.comment;
      if (!comment) {
        throw new Error('No comment data received');
      }

      return { postId, comment, isReply: false };
    } catch (error) {
      console.error('Create comment error:', error);
      return rejectWithValue(error.message || 'Failed to create comment');
    }
  }
);

// Delete a comment
export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async ({ commentId, postId }, { getState, rejectWithValue }) => {
    try {
      console.log('Delete comment started for ID:', commentId);
      
      await deleteCommentApi(commentId);
      console.log('Delete comment successful for ID:', commentId);

      return { commentId, postId };
    } catch (error) {
      console.error('Delete comment error:', error);
      return rejectWithValue(error.message || 'Failed to delete comment');
    }
  }
);

// Update a comment
export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ commentId, content }, { getState, rejectWithValue }) => {
    try {
      console.log('Update comment started for ID:', commentId);
      
      const data = await updateCommentApi({ commentId, content });
      console.log('Update comment response:', data);

      return { comment: data.data?.comment };
    } catch (error) {
      console.error('Update comment error:', error);
      return rejectWithValue(error.message || 'Failed to update comment');
    }
  }
);

// Reply to a comment
export const replyToComment = createAsyncThunk(
  'comments/replyToComment',
  async ({ commentId, content, postId }, { getState, rejectWithValue }) => {
    try {
      console.log('Creating reply:', { commentId, content, postId });

      const data = await replyComment({ commentId, content });
      console.log('Reply response:', data);

      const reply = data.data?.newComment;
      if (!reply) {
        throw new Error('No reply data received');
      }

      return {
        parentCommentId: commentId,
        reply,
        postId,
        isReply: true
      };
    } catch (error) {
      console.error('Reply to comment error:', error);
      return rejectWithValue(error.message || 'Failed to reply to comment');
    }
  }
);

// Get replies for a comment
export const getCommentReplies = createAsyncThunk(
  'comments/getCommentReplies',
  async (commentId, { getState, rejectWithValue }) => {
    try {
      console.log('Get comment replies started for ID:', commentId);
      
      const data = await getReplies(commentId);
      console.log('Get replies response:', data);

      return { commentId, replies: data.data?.replies || [] };
    } catch (error) {
      console.error('Get comment replies error:', error);
      return rejectWithValue(error.message || 'Failed to fetch replies');
    }
  }
);

const initialState = {
  postComments: {}, // { postId: { comments: [], loading: false, error: null } }
  commentReplies: {}, // { commentId: { replies: [], loading: false, error: null } }
  loading: false,
  error: null,
};

const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearCommentsError: (state) => {
      state.error = null;
    },
    clearPostCommentsError: (state, action) => {
      const { postId } = action.payload;
      if (state.postComments[postId]) {
        state.postComments[postId].error = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Get Post Comments
    builder
      .addCase(getPostComments.pending, (state, action) => {
        const postId = action.meta.arg;
        if (!state.postComments[postId]) {
          state.postComments[postId] = { comments: [], loading: true, error: null };
        } else {
          state.postComments[postId].loading = true;
          state.postComments[postId].error = null;
        }
      })
      .addCase(getPostComments.fulfilled, (state, action) => {
        const { postId, comments } = action.payload;
        state.postComments[postId] = { comments, loading: false, error: null };
      })
      .addCase(getPostComments.rejected, (state, action) => {
        const postId = action.meta.arg;
        if (state.postComments[postId]) {
          state.postComments[postId].loading = false;
          state.postComments[postId].error = action.payload;
        }
      });

    // Create Comment (parent comment)
    builder
      .addCase(createComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const { postId, comment, isReply } = action.payload;
        console.log(` Comment created: ${isReply ? 'Reply' : 'Parent'} for post ${postId}`);

        if (state.postComments[postId]) {
          state.postComments[postId].comments.push(comment);
        }
        state.loading = false;
      })
      .addCase(createComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Comment
    builder
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { commentId, postId } = action.payload;
        if (state.postComments[postId]) {
          state.postComments[postId].comments = state.postComments[postId].comments.filter(
            c => c._id !== commentId
          );
        }
      });

    // Update Comment
    builder
      .addCase(updateComment.fulfilled, (state, action) => {
        const { comment } = action.payload;
        // Find and update comment in all post comments
        Object.values(state.postComments).forEach(postComments => {
          const index = postComments.comments.findIndex(c => c._id === comment._id);
          if (index !== -1) {
            postComments.comments[index] = comment;
          }
        });
      });

    // Reply to Comment
    builder
      .addCase(replyToComment.fulfilled, (state, action) => {
        const { parentCommentId, reply, postId } = action.payload;
        console.log(`Reply created: ${reply._id} for comment ${parentCommentId} in post ${postId}`);

        // Add reply to the parent comment's replies
        if (state.commentReplies[parentCommentId]) {
          state.commentReplies[parentCommentId].replies.push(reply);
        } else {
          // Initialize replies array if it doesn't exist
          state.commentReplies[parentCommentId] = {
            replies: [reply],
            loading: false,
            error: null
          };
        }
      });

    // Get Comment Replies
    builder
      .addCase(getCommentReplies.pending, (state, action) => {
        const commentId = action.meta.arg;
        if (!state.commentReplies[commentId]) {
          state.commentReplies[commentId] = { replies: [], loading: true, error: null };
        } else {
          state.commentReplies[commentId].loading = true;
          state.commentReplies[commentId].error = null;
        }
      })
      .addCase(getCommentReplies.fulfilled, (state, action) => {
        const { commentId, replies } = action.payload;
        state.commentReplies[commentId] = { replies, loading: false, error: null };
      })
      .addCase(getCommentReplies.rejected, (state, action) => {
        const commentId = action.meta.arg;
        if (state.commentReplies[commentId]) {
          state.commentReplies[commentId].loading = false;
          state.commentReplies[commentId].error = action.payload;
        }
      });
  },
});

export const { clearCommentsError, clearPostCommentsError } = commentSlice.actions;
export default commentSlice.reducer;

// Selectors
export const selectPostComments = (postId) => (state) => 
  state.comments.postComments[postId] || { comments: [], loading: false, error: null };

export const selectCommentReplies = (commentId) => (state) => 
  state.comments.commentReplies[commentId] || { replies: [], loading: false, error: null };

export const selectCommentsLoading = (state) => state.comments.loading;
export const selectCommentsError = (state) => state.comments.error;
