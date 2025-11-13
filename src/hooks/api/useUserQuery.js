

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserService, FollowService } from '../../services';


export const useUserProfile = (userId) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => UserService.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 1000 * 60, 
  });
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ['allUsers'],
    queryFn: () => UserService.getAllUsers(),
    staleTime: 1000 * 60 * 5, 
  });
};


export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData) => UserService.updateUserProfile(userData),
    onSuccess: (updatedUser) => {
      console.log('Profile updated:', updatedUser);
      
     
      queryClient.setQueryData(['user'], updatedUser);
      
      
      if (updatedUser._id || updatedUser.id) {
        queryClient.setQueryData(
          ['userProfile', updatedUser._id || updatedUser.id],
          updatedUser
        );
      }
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error) => {
      console.error(' Update profile error:', error);
    },
  });
};


 
export const useFollowUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId) => FollowService.followUser(userId),
    onMutate: async (userId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['userProfile', userId] });
      
      const previousProfile = queryClient.getQueryData(['userProfile', userId]);
      
      queryClient.setQueryData(['userProfile', userId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isFollowing: true,
          followersCount: (oldData.followersCount || 0) + 1,
        };
      });
      
      return { previousProfile };
    },
    onError: (err, userId, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['userProfile', userId], context.previousProfile);
      }
      console.error(' Follow user error:', err);
    },
    onSettled: (data, error, userId) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
};

/**
 * Unfollow user mutation
 */
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId) => FollowService.unfollowUser(userId),
    onMutate: async (userId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['userProfile', userId] });
      
      const previousProfile = queryClient.getQueryData(['userProfile', userId]);
      
      queryClient.setQueryData(['userProfile', userId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isFollowing: false,
          followersCount: Math.max((oldData.followersCount || 0) - 1, 0),
        };
      });
      
      return { previousProfile };
    },
    onError: (err, userId, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['userProfile', userId], context.previousProfile);
      }
      console.error(' Unfollow user error:', err);
    },
    onSettled: (data, error, userId) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
};

/**
 * Get followers query
 */
export const useFollowers = () => {
  return useQuery({
    queryKey: ['followers'],
    queryFn: () => FollowService.getFollowers(),
  });
};

/**
 * Get following query
 */
export const useFollowing = () => {
  return useQuery({
    queryKey: ['following'],
    queryFn: () => FollowService.getFollowing(),
  });
};

