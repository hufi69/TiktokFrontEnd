import { addComment } from '../../store/slices/postsSlice';
import { createComment, replyToComment } from '../../store/slices/commentSlice';

/**
 
 * @param {Object} params
 * @param {string} params.postId 
 * @param {string} params.content 
 * @param {string} [params.parentId] 
 * @param {Function} params.dispatch 
 * @param {'posts'|'comments'} [params.sliceType='posts'] 
 */
export const addCommentOrReply = async ({
  postId,
  content,
  parentId = null,
  dispatch,
  sliceType = 'posts'
}) => {
  try {
    console.log(' addCommentOrReply called:', {
      postId,
      content: content?.substring(0, 50) + '...',
      parentId,
      isReply: !!parentId,
      sliceType
    });

   
    if (!postId || !content || !dispatch) {
      throw new Error('postId, content, and dispatch are required');
    }

    const isReply = !!parentId;

    if (sliceType === 'comments') {
     
      if (isReply) {
        console.log(' Creating reply via commentSlice...');
        return await dispatch(replyToComment({
          commentId: parentId,
          content,
          postId
        })).unwrap();
      } else {
        console.log(' Creating parent comment via commentSlice...');
        return await dispatch(createComment({
          postId,
          content
        })).unwrap();
      }
    } else {
      // Use posts slice (default)
      console.log(` Creating ${isReply ? 'reply' : 'parent comment'} via postsSlice...`);
      return await dispatch(addComment({
        postId,
        content,
        parentId
      })).unwrap();
    }

  } catch (error) {
    console.error(' Failed to add comment/reply:', error);
    throw error;
  }
};

/**
 * Helper function to validate comment data before sending
 * @param {Object} params
 * @param {string} params.postId
 * @param {string} params.content
 * @param {string} [params.parentId]
 * @returns {Object} 
 */
export const validateCommentData = ({ postId, content, parentId }) => {
  const errors = [];
  const isReply = !!parentId;

  if (!content || content.trim().length === 0) {
    errors.push('Comment content is required');
  }

  if (content && content.trim().length > 2000) {
    errors.push('Comment content must be less than 2000 characters');
  }

  if (!postId) {
    errors.push('Post ID is required');
  }

  if (isReply && !parentId) {
    errors.push('Parent comment ID is required for replies');
  }

  return {
    isValid: errors.length === 0,
    errors,
    isReply,
    data: {
      postId,
      content: content?.trim(),
      parentId
    }
  };
};

/**
 * Helper function to format comment for display
 * @param {Object} comment - Comment object from API
 * @returns {Object} formatted comment
 */
export const formatComment = (comment) => {
  if (!comment) return null;

  return {
    id: comment._id || comment.id,
    _id: comment._id || comment.id,
    content: comment.content || '',
    user: {
      id: comment.user?._id || comment.user?.id,
      _id: comment.user?._id || comment.user?.id,
      fullName: comment.user?.fullName || comment.user?.name || 'Unknown User',
      userName: comment.user?.userName || comment.user?.username || 'unknown',
      profilePicture: comment.user?.profilePicture || null,
    },
    post: comment.post,
    parentComment: comment.parentComment || null,
    likes: comment.likes || 0,
    isLiked: comment.isLiked || false,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    isReply: !!comment.parentComment
  };
};

/**
 * Helper function to organize comments into parent-child structure
 * @param {Array} comments - Flat array of comments
 * @returns {Object} organized comments
 */
export const organizeComments = (comments = []) => {
  const parentComments = [];
  const replies = {};

  comments.forEach(comment => {
    const formatted = formatComment(comment);

    if (formatted.parentComment) {
      // This is a reply
      if (!replies[formatted.parentComment]) {
        replies[formatted.parentComment] = [];
      }
      replies[formatted.parentComment].push(formatted);
    } else {
      // This is a parent comment
      parentComments.push(formatted);
    }
  });

  return {
    parentComments,
    replies,
    totalCount: comments.length
  };
};