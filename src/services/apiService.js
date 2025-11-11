//api service
import { CONFIG, buildUrl, apiRequest } from '../config';
import * as authApi from './api/authApi';
import * as userApi from './api/userApi';
import * as postsApi from './api/postsApi';
import * as followApi from './api/followApi';
import * as commentsApi from './api/commentsApi';
import * as likesApi from './api/likesApi';

class ApiService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.debug = CONFIG.DEBUG;
  }

  // request method
  async request(endpoint, options = {}) {
    try {
      const { data, response } = await apiRequest(endpoint, options);
      
      if (this.debug) {
        console.log(` API Request: ${options.method || 'GET'} ${endpoint}`);
        console.log(` Response:`, data);
      }
      
      return { data, response };
    } catch (error) {
      if (this.debug) {
        console.error(` API Error: ${endpoint}`, error.message);
      }
      throw error;
    }
  }

  // Auth Services
  auth = {
    login: (credentials) => authApi.signIn(credentials),
    signup: (userData) => authApi.signUp(userData),
    verifyOTP: (otpData) => authApi.verifyOTP(otpData),
    forgotPassword: (email) => authApi.forgotPassword(email),
    resetPassword: (token, passwordData) => authApi.resetPassword(token, passwordData),
    changePassword: (passwordData) => authApi.changePassword(passwordData)
  };

  // User Services
  user = {
    getProfile: (userId) => userApi.getUserProfile(userId),
    updateProfile: (userData) => userApi.updateUserProfile(userData),
    getAllUsers: () => userApi.getAllUsers()
  };

  // Follow Services
  follow = {
    followUser: (targetUserId) => followApi.followUser(targetUserId),
    unfollowUser: (targetUserId) => followApi.unfollowUser(targetUserId),
    getFollowers: () => followApi.getFollowers(),
    getFollowing: () => followApi.getFollowing(),
    isFollowing: (targetUserId) => followApi.isFollowing(targetUserId)
  };

  // Post Services
  post = {
    getPosts: (limit = 50) => postsApi.getPosts(limit),
    getPost: (postId) => postsApi.getPost(postId),
    createPost: (postData) => postsApi.createPost(postData),
    updatePost: (postId, postData) => postsApi.updatePost(postId, postData),
    deletePost: (postId) => postsApi.deletePost(postId),
    likePost: (postId) => postsApi.likePost(postId)
  };

  // Comment Services
  comment = {
    getComments: (postId) => commentsApi.getComments(postId),
    createComment: (commentData) => commentsApi.createComment(commentData),
    replyComment: (commentData) => commentsApi.replyComment(commentData),
    updateComment: (commentData) => commentsApi.updateComment(commentData),
    deleteComment: (commentId) => commentsApi.deleteComment(commentId),
    getReplies: (commentId) => commentsApi.getReplies(commentId),
    getComment: (commentId) => commentsApi.getComment(commentId)
  };
}

export const apiService = new ApiService();
export default apiService;
