/**
 * useLikesQuery - React Query hooks for likes
 * Replaces Redux-based useLikes hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LikeService } from '../../services';

/**
 * Get post likes query
 */
export const usePostLikes = (postId) => {
  return useQuery({
    queryKey: ['postLikes', postId],
    queryFn: () => LikeService.getPostLikes(postId),
    enabled: !!postId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Get user likes query
 */
export const useUserLikes = (userId) => {
  return useQuery({
    queryKey: ['userLikes', userId],
    queryFn: () => LikeService.getUserLikes(userId),
    enabled: !!userId,
  });
};

/**
 * Like post mutation (optimistic update)
 */
export const useLikePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postId) => LikeService.likePost(postId),
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      
      // Snapshot previous values
      const previousPosts = queryClient.getQueryData(['posts']);
      const previousPost = queryClient.getQueryData(['post', postId]);
      
      // Optimistically update posts list
      queryClient.setQueryData(['posts'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            posts: oldData.data?.posts?.map((post) =>
              post.id === postId || post._id === postId
                ? {
                    ...post,
                    isLiked: true,
                    likesCount: (post.likesCount || 0) + 1,
                  }
                : post
            ),
          },
        };
      });
      
      // Optimistically update single post
      queryClient.setQueryData(['post', postId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isLiked: true,
          likesCount: (oldData.likesCount || 0) + 1,
        };
      });
      
      return { previousPosts, previousPost };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
      console.error('❌ Like post error:', err);
    },
    onSettled: (data, error, postId) => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['postLikes', postId] });
    },
  });
};

/**
 * Unlike post mutation (optimistic update)
 */
export const useUnlikePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postId) => LikeService.unlikePost(postId),
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      
      // Snapshot previous values
      const previousPosts = queryClient.getQueryData(['posts']);
      const previousPost = queryClient.getQueryData(['post', postId]);
      
      // Optimistically update posts list
      queryClient.setQueryData(['posts'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            posts: oldData.data?.posts?.map((post) =>
              post.id === postId || post._id === postId
                ? {
                    ...post,
                    isLiked: false,
                    likesCount: Math.max((post.likesCount || 0) - 1, 0),
                  }
                : post
            ),
          },
        };
      });
      
      // Optimistically update single post
      queryClient.setQueryData(['post', postId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isLiked: false,
          likesCount: Math.max((oldData.likesCount || 0) - 1, 0),
        };
      });
      
      return { previousPosts, previousPost };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
      console.error('❌ Unlike post error:', err);
    },
    onSettled: (data, error, postId) => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['postLikes', postId] });
    },
  });
};

/**
 * Toggle like mutation (convenience hook)
 */
export const useToggleLike = () => {
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  
  return {
    toggleLike: ({ postId, isLiked }) => {
      if (isLiked) {
        return unlikePost.mutate(postId);
      } else {
        return likePost.mutate(postId);
      }
    },
    isPending: likePost.isPending || unlikePost.isPending,
  };
};

