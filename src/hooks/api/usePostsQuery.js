

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { PostService } from '../../services';

/**
 * Get all posts query
 */
export const usePosts = (limit = 50) => {
  return useQuery({
    queryKey: ['posts', limit],
    queryFn: () => PostService.getPosts(limit),
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Get single post query
 */
export const usePost = (postId) => {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => PostService.getPost(postId),
    enabled: !!postId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Create post mutation
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postData) => PostService.createPost(postData),
    onSuccess: (newPost) => {
      console.log('✅ Post created:', newPost);
      
      // Add new post to the list
      queryClient.setQueryData(['posts'], (oldData) => {
        if (!oldData) return { data: { posts: [newPost] } };
        return {
          ...oldData,
          data: {
            ...oldData.data,
            posts: [newPost, ...(oldData.data?.posts || [])],
          },
        };
      });
      
      // Invalidate posts list
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error('❌ Create post error:', error);
    },
  });
};

/**
 * Update post mutation
 */
export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, postData }) => PostService.updatePost(postId, postData),
    onSuccess: (updatedPost, variables) => {
      console.log('✅ Post updated:', updatedPost);
      
      // Update post in cache
      queryClient.setQueryData(['post', variables.postId], updatedPost);
      
      // Update post in list
      queryClient.setQueryData(['posts'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            posts: oldData.data?.posts?.map((post) =>
              post.id === variables.postId || post._id === variables.postId
                ? updatedPost
                : post
            ),
          },
        };
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
    onError: (error) => {
      console.error('❌ Update post error:', error);
    },
  });
};

/**
 * Delete post mutation
 */
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postId) => PostService.deletePost(postId),
    onSuccess: (_, postId) => {
      console.log('✅ Post deleted:', postId);
      
      // Remove post from list
      queryClient.setQueryData(['posts'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            posts: oldData.data?.posts?.filter(
              (post) => post.id !== postId && post._id !== postId
            ),
          },
        };
      });
      
      // Remove post from cache
      queryClient.removeQueries({ queryKey: ['post', postId] });
      
      // Invalidate posts list
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error('❌ Delete post error:', error);
    },
  });
};

/**
 * Bookmark post mutation (optimistic update)
 */
export const useBookmarkPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, isBookmarked }) => {
      // This would be a real API call
      // For now, we'll just simulate it
      return { postId, isBookmarked: !isBookmarked };
    },
    onMutate: async ({ postId, isBookmarked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      
      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(['posts']);
      
      // Optimistically update
      queryClient.setQueryData(['posts'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            posts: oldData.data?.posts?.map((post) =>
              post.id === postId || post._id === postId
                ? { ...post, isBookmarked: !isBookmarked }
                : post
            ),
          },
        };
      });
      
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

