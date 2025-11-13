/**
 * useAuthQuery - React Query hooks for authentication
 * Replaces Redux-based useAuth hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '../../services';
import { storeAuthToken, storeUserData, removeAuthToken, removeUserData, getAuthToken } from '../../utils/helpers/storage';

/**
 * Login mutation
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, password }) => AuthService.signIn({ email, password }),
    onSuccess: async (data) => {
      console.log(' Login successful:', data);
      
      // Store in AsyncStorage
      if (data.token) {
        await storeAuthToken(data.token);
        queryClient.setQueryData(['authToken'], data.token);
      }
      if (data.user) {
        await storeUserData(data.user);
        queryClient.setQueryData(['user'], data.user);
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error) => {
      console.error(' Login error:', error);
    },
  });
};

/**
 * Signup mutation
 */
export const useSignup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData) => AuthService.signUp(userData),
    onSuccess: async (data) => {
      console.log('Signup successful:', data);
      
      // Store user data (but don't auto-login until OTP verified)
      if (data.user) {
        queryClient.setQueryData(['pendingUser'], data.user);
      }
    },
    onError: (error) => {
      console.error(' Signup error:', error);
    },
  });
};

/**
 * OTP verification mutation
 */
export const useVerifyOTP = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (otpData) => AuthService.verifyOTP(otpData),
    onSuccess: async (data) => {
      console.log(' OTP verified:', data);
      
      // Store auth data after OTP verification
      if (data.token) {
        await storeAuthToken(data.token);
        queryClient.setQueryData(['authToken'], data.token);
      }
      if (data.user) {
        await storeUserData(data.user);
        queryClient.setQueryData(['user'], data.user);
      }
      
      // Clear pending user
      queryClient.removeQueries({ queryKey: ['pendingUser'] });
    },
    onError: (error) => {
      console.error(' OTP verification error:', error);
    },
  });
};

/**
 * Resend OTP mutation
 */
export const useResendOTP = () => {
  return useMutation({
    mutationFn: (email) => AuthService.resendOTP(email),
    onSuccess: () => {
      console.log('OTP resent successfully');
    },
    onError: (error) => {
      console.error(' Resend OTP error:', error);
    },
  });
};

/**
 * Forgot password mutation
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email) => AuthService.forgotPassword(email),
    onSuccess: (data) => {
      console.log(' Password reset email sent:', data);
    },
    onError: (error) => {
      console.error(' Forgot password error:', error);
    },
  });
};

/**
 * Reset password mutation
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, passwordData }) => AuthService.resetPassword(token, passwordData),
    onSuccess: () => {
      console.log(' Password reset successful');
    },
    onError: (error) => {
      console.error(' Reset password error:', error);
    },
  });
};

/**
 * Change password mutation
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (passwordData) => AuthService.changePassword(passwordData),
    onSuccess: () => {
      console.log(' Password changed successfully');
    },
    onError: (error) => {
      console.error(' Change password error:', error);
    },
  });
};

/**
 * Logout mutation
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Clear storage
      await removeAuthToken();
      await removeUserData();
    },
    onSuccess: () => {
      console.log(' Logout successful');
      
      // Clear all queries
      queryClient.clear();
    },
    onError: (error) => {
      console.error(' Logout error:', error);
    },
  });
};

/**
 * Get current user query
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => null,
    initialData: null,
    staleTime: Infinity,
  });
};

/**
 * Get auth token query
 */
export const useAuthToken = () => {
  return useQuery({
    queryKey: ['authToken'],
    queryFn: async () => {
      const token = await getAuthToken();
      return token;
    },
    staleTime: Infinity,
  });
};

/**
 * Check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const { data: token } = useAuthToken();
  return !!token;
};

