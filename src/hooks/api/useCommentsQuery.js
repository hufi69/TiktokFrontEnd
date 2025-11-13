/**
 * useCommentsQuery - React Query hooks for comments
 * Replaces Redux-based useComments hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CommentService } from '../../services';

/**
 * Get comments for a post query
 */
export const useComments = (postId) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => CommentService.getComments(postId),
    enabled: !!postId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Get single comment query
 */
export const useComment = (commentId) => {
  return useQuery({
    queryKey: ['comment', commentId],
    queryFn: () => CommentService.getComment(commentId),
    enabled: !!commentId,
  });
};

/**
 * Get replies for a comment query
 */
export const useReplies = (commentId) => {
  return useQuery({
    queryKey: ['replies', commentId],
    queryFn: () => CommentService.getReplies(commentId),
    enabled: !!commentId,
  });
};

/**
 * Create comment mutation
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentData) => CommentService.createComment(commentData),
    onSuccess: (newComment, variables) => {
      console.log('✅ Comment created:', newComment);
      
      // Add comment to cache
      queryClient.setQueryData(['comments', variables.postId], (oldData) => {
        if (!oldData) return { data: { comments: [newComment] } };
        return {
          ...oldData,
          data: {
            ...oldData.data,
            comments: [...(oldData.data?.comments || []), newComment],
          },
        };
      });
      
      // Update post comment count
      queryClient.setQueryData(['post', variables.postId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          commentsCount: (oldData.commentsCount || 0) + 1,
        };
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
    onError: (error) => {
      console.error('❌ Create comment error:', error);
    },
  });
};

/**
 * Reply to comment mutation
 */
export const useReplyComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentData) => CommentService.replyComment(commentData),
    onSuccess: (newReply, variables) => {
      console.log('✅ Reply created:', newReply);
      
      // Add reply to cache
      queryClient.setQueryData(['replies', variables.parentId], (oldData) => {
        if (!oldData) return { data: { replies: [newReply] } };
        return {
          ...oldData,
          data: {
            ...oldData.data,
            replies: [...(oldData.data?.replies || []), newReply],
          },
        };
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['replies', variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
    },
    onError: (error) => {
      console.error('❌ Reply comment error:', error);
    },
  });
};

/**
 * Update comment mutation
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentData) => CommentService.updateComment(commentData),
    onSuccess: (updatedComment, variables) => {
      console.log('✅ Comment updated:', updatedComment);
      
      // Update comment in cache
      queryClient.setQueryData(['comment', variables.commentId], updatedComment);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (error) => {
      console.error('❌ Update comment error:', error);
    },
  });
};

/**
 * Delete comment mutation
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentId) => CommentService.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      console.log('✅ Comment deleted:', commentId);
      
      // Remove comment from cache
      queryClient.removeQueries({ queryKey: ['comment', commentId] });
      
      // Invalidate comments list
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (error) => {
      console.error('❌ Delete comment error:', error);
    },
  });
};

/**
 * Like comment mutation
 */
export const useLikeComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentId) => CommentService.likeComment(commentId),
    onSuccess: (_, commentId) => {
      console.log('✅ Comment liked:', commentId);
      
      // Invalidate comment queries
      queryClient.invalidateQueries({ queryKey: ['comment', commentId] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (error) => {
      console.error('❌ Like comment error:', error);
    },
  });
};

/**
 * Unlike comment mutation
 */
export const useUnlikeComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentId) => CommentService.unlikeComment(commentId),
    onSuccess: (_, commentId) => {
      console.log('✅ Comment unliked:', commentId);
      
      // Invalidate comment queries
      queryClient.invalidateQueries({ queryKey: ['comment', commentId] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (error) => {
      console.error('❌ Unlike comment error:', error);
    },
  });
};

