// Professional API Service Layer
import { CONFIG, buildUrl, apiRequest } from '../config';

class ApiService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.debug = CONFIG.DEBUG;
  }

  // Generic request method
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
    login: (credentials) => this.request(CONFIG.ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

    signup: (userData) => this.request(CONFIG.ENDPOINTS.AUTH_SIGNUP, {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

    verifyOTP: (otpData) => this.request(CONFIG.ENDPOINTS.AUTH_VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify(otpData)
    }),

    forgotPassword: (email) => this.request(CONFIG.ENDPOINTS.AUTH_FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

    resetPassword: (token, passwordData) => this.request(
      buildUrl(CONFIG.ENDPOINTS.AUTH_RESET_PASSWORD, { token }), {
      method: 'POST',
      body: JSON.stringify(passwordData)
    }),

    changePassword: (passwordData, token) => this.request(CONFIG.ENDPOINTS.AUTH_CHANGE_PASSWORD, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(passwordData)
    })
  };

  // User Services
  user = {
    getProfile: (userId, token) => this.request(
      buildUrl(CONFIG.ENDPOINTS.USER_PROFILE, { id: userId }), {
      headers: { Authorization: `Bearer ${token}` }
    }),

    updateProfile: (userData, token) => {
      const formData = new FormData();

      // Build payload under `data` key as JSON string per backend
      const payload = {};
      if (userData.fullName) payload.fullName = userData.fullName;
      if (userData.username) payload.userName = userData.username;
      if (userData.occupation) payload.occupation = userData.occupation;
      if (userData.email) payload.email = userData.email;
      if (userData.dateOfBirth) payload.dateOfBirth = userData.dateOfBirth;
      if (userData.country) payload.country = userData.country;
      formData.append('data', JSON.stringify(payload));

      // Optional file field
      const img = userData.avatar || userData.profileImage;
      if (img?.uri) {
        formData.append('profilePicture', {
          uri: img.uri,
          type: img.type || 'image/jpeg',
          name: img.fileName || 'profile.jpg',
        });
      }

      return this.request(CONFIG.ENDPOINTS.USER_UPDATE_ME, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    },

    getAllUsers: (token) => this.request(CONFIG.ENDPOINTS.USER_ALL, {
      headers: { Authorization: `Bearer ${token}` }
    })
  };

  // Follow Services
  follow = {
    followUser: (targetUserId, token) => this.request(
      CONFIG.ENDPOINTS.FOLLOW_USER, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: targetUserId })
    }),

    unfollowUser: (targetUserId, token) => this.request(
      CONFIG.ENDPOINTS.UNFOLLOW_USER, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: targetUserId })
    }),

    getFollowers: (token) => this.request(CONFIG.ENDPOINTS.FOLLOWERS, {
      headers: { Authorization: `Bearer ${token}` }
    }),

    getFollowing: (token) => this.request(CONFIG.ENDPOINTS.FOLLOWING, {
      headers: { Authorization: `Bearer ${token}` }
    }),

    isFollowing: (targetUserId, token) => this.request(
      CONFIG.ENDPOINTS.IS_FOLLOWING, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
  };

  // Post Services
  post = {
    getPosts: (token, limit = 50) => this.request(`${CONFIG.ENDPOINTS.POSTS_LIST}?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

    getPost: (postId, token) => this.request(
      buildUrl(CONFIG.ENDPOINTS.POST_GET, { id: postId }), {
      headers: { Authorization: `Bearer ${token}` }
    }),

    createPost: (postData, token) => {
      const form = new FormData();
      const payload = {
        content: postData.caption || postData.content || '',
        isPublic: postData.isPublic ?? true,
        tags: postData.tags || [],
      };
      form.append('data', JSON.stringify(payload));

      if (Array.isArray(postData.images)) {
        postData.images.forEach((image, idx) => {
          if (image?.uri) {
            form.append('images', {
              uri: image.uri,
              type: image.type || 'image/jpeg',
              name: image.fileName || `image_${idx}.jpg`,
            });
          }
        });
      }

      return this.request(CONFIG.ENDPOINTS.POST_CREATE, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
    },

    updatePost: (postId, postData, token) => this.request(
      buildUrl(CONFIG.ENDPOINTS.POST_UPDATE, { id: postId }), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(postData)
    }),

    deletePost: (postId, token) => this.request(
      buildUrl(CONFIG.ENDPOINTS.POST_DELETE, { id: postId }), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }),

    likePost: (postId, token) => this.request(
      buildUrl(CONFIG.ENDPOINTS.POST_LIKE, { id: postId }), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
  };

  // Comment Services
  comment = {
    getComments: (postId, token) => this.request(
      buildUrl(CONFIG.ENDPOINTS.COMMENTS_GET, { postId }), {
      headers: { Authorization: `Bearer ${token}` }
    }),

    createComment: (commentData, token) => this.request(CONFIG.ENDPOINTS.COMMENT_CREATE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(commentData)
    }),

    replyComment: (commentData, token) => this.request(CONFIG.ENDPOINTS.COMMENT_REPLY, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(commentData)
    }),

    updateComment: (commentData, token) => this.request(CONFIG.ENDPOINTS.COMMENT_UPDATE, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(commentData)
    }),

    deleteComment: (commentId, token) => this.request(CONFIG.ENDPOINTS.COMMENT_DELETE, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ commentId })
    }),

    getReplies: (commentId, token) => this.request(
      buildUrl(CONFIG.ENDPOINTS.COMMENT_REPLIES, { commentId }), {
        headers: { Authorization: `Bearer ${token}` }
      }
    ),

    getComment: (commentId, token) => this.request(
      buildUrl(CONFIG.ENDPOINTS.COMMENT_GET, { commentId }), {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
  };
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
