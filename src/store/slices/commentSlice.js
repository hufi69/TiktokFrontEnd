import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG, buildUrl } from '../../config/api';

// Get all comments for a post
export const getPostComments = createAsyncThunk(
  'comments/getPostComments',
  async (postId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl(`/api/v1/comments/get-comments/${postId}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch comments');
      }

      return { postId, comments: data.data?.comments || [] };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create a new parent comment
export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ postId, content }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      console.log(' Creating parent comment:', { postId, content });

      const response = await fetch(buildUrl('/api/v1/comments/create-comment'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, content }),
      });

      const data = await response.json();
      console.log('📥Create comment response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create comment');
      }

      const comment = data.data?.comment;
      if (!comment) {
        throw new Error('No comment data received');
      }

      return { postId, comment, isReply: false };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete a comment
export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async ({ commentId, postId }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl('/api/v1/comments/delete-comment'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete comment');
      }

      return { commentId, postId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update a comment
export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ commentId, content }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl('/api/v1/comments/update-comment'), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId, content }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update comment');
      }

      return { comment: data.data?.comment };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Reply to a comment
export const replyToComment = createAsyncThunk(
  'comments/replyToComment',
  async ({ commentId, content, postId }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      console.log(' Creating reply:', { commentId, content, postId });

      const response = await fetch(buildUrl('/api/v1/comments/reply-comment'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId, content }),
      });

      const data = await response.json();
      console.log(' Reply response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reply to comment');
      }

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
      return rejectWithValue(error.message);
    }
  }
);

// Get replies for a comment
export const getCommentReplies = createAsyncThunk(
  'comments/getCommentReplies',
  async (commentId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl(`/api/v1/comments/get-replies/${commentId}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch replies');
      }

      return { commentId, replies: data.data?.replies || [] };
    } catch (error) {
      return rejectWithValue(error.message);
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
