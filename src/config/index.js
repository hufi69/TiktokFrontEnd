


const CURRENT_ENV = 'PRODUCTION'; 


let ENV_API_BASE_URL = undefined;
try {
  
  ENV_API_BASE_URL = require('@env').API_BASE_URL;
} catch (_e) {
  
}

const pickLocalBaseUrl = () => {
  // Platform detection if using simulator or real device 
  const Platform = require('react-native').Platform;
  
  if (Platform.OS === 'android') {
  
    return 'http://10.0.2.2:8000';
  }
  

  return 'http://localhost:8000';
};

const ENVIRONMENTS = {
  LOCAL: { API_BASE_URL: pickLocalBaseUrl(), DEBUG: true },
 
  USB_DEBUG: { API_BASE_URL: ENV_API_BASE_URL || 'http://192.168.0.192:8000', DEBUG: true },
  NGROK: { API_BASE_URL: 'https://your-ngrok-url.ngrok-free.app', DEBUG: true },
  PRODUCTION: { API_BASE_URL: 'http://51.20.81.225', DEBUG: true },

};

const API_ENDPOINTS = {
  // Auth
  AUTH_SIGNUP: '/api/v1/auth/signup',
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_VERIFY_OTP: '/api/v1/auth/verify-otp',
  AUTH_VERIFY_TOKEN: '/api/v1/users/getAllUsers',
  AUTH_FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/v1/auth/reset-password/:token',
  AUTH_RESEND_OTP: '/api/v1/auth/resend-otp',
  AUTH_CHANGE_PASSWORD: '/api/v1/auth/change-password',
  
  // Users
  USER_UPDATE_ME: '/api/v1/users/updateMe',
  USER_PROFILE: '/api/v1/users/:id',
  USER_ALL: '/api/v1/users/getAllUsers',
  
  // Follows
  FOLLOW_USER: '/api/v1/follows/new-follow',
  UNFOLLOW_USER: '/api/v1/follows/unfollow',
  FOLLOWERS: '/api/v1/follows/followers',
  FOLLOWING: '/api/v1/follows/following',
  MUTUAL_FOLLOWS: '/api/v1/follows/mutual',
  FOLLOWERS_COUNT: '/api/v1/follows/followers-count',
  FOLLOWING_COUNT: '/api/v1/follows/following-count',
  IS_FOLLOWING: '/api/v1/follows/is-following',
  
  // Posts
  POSTS_LIST: '/api/v1/posts/get-posts',
  POST_CREATE: '/api/v1/posts/new-post',
  POST_GET: '/api/v1/posts/get-post/:id',
  POST_UPDATE: '/api/v1/posts/get-post/:id',
  POST_DELETE: '/api/v1/posts/get-post/:id',
  POST_LIKE: '/api/v1/likes/like',
  
  // Likes (separate controller)
  LIKE_POST_ACTION: '/api/v1/likes/like',
  UNLIKE_POST_ACTION: '/api/v1/likes/unlike',
  GET_POST_LIKES: '/api/v1/likes/get-likes',
  GET_USER_LIKES: '/api/v1/likes/get-likes',
  
  // Comments
  COMMENTS_LIST: '/api/v1/comments',
  COMMENTS_GET: '/api/v1/comments/get-comments/:postId',
  COMMENT_GET: '/api/v1/comments/get-comment/:commentId',
  COMMENT_CREATE: '/api/v1/comments/create-comment',
  COMMENT_DELETE: '/api/v1/comments/delete-comment',
  COMMENT_UPDATE: '/api/v1/comments/update-comment',
  COMMENT_REPLY: '/api/v1/comments/reply-comment',
  COMMENT_REPLIES: '/api/v1/comments/get-replies/:commentId',
  COMMENT_LIKE: '/api/v1/likes/like-comment',
  COMMENT_UNLIKE: '/api/v1/likes/unlike-comment',
  
  // Google OAuth
  GOOGLE_LOGIN: '/api/v1/auth/google-login',
  GOOGLE_CALENDAR: '/api/v1/auth/google-calendar',
  
  // Stories
  STORIES_LIST: '/api/v1/stories',
  STORY_CREATE: '/api/v1/stories',
  STORY_LIKE: '/api/v1/stories/:id/like',
  STORY_REPLY: '/api/v1/stories/:id/reply',
  STORY_SHARE: '/api/v1/stories/:id/share'
};

// Get current environment config
const getCurrentConfig = () => {
  const config = ENVIRONMENTS[CURRENT_ENV];
  if (!config) {
    console.warn(`Environment "${CURRENT_ENV}" not found, using LOCAL`);
    return ENVIRONMENTS.LOCAL;
  }
  return config;
};


export const CONFIG = {
  ...getCurrentConfig(),
  ENDPOINTS: {
    ...API_ENDPOINTS,
    
    SIGNUP: API_ENDPOINTS.AUTH_SIGNUP,
    LOGIN: API_ENDPOINTS.AUTH_LOGIN,
    VERIFY_OTP: API_ENDPOINTS.AUTH_VERIFY_OTP,
    VERIFY_TOKEN: API_ENDPOINTS.AUTH_VERIFY_TOKEN,
    FORGOT_PASSWORD: API_ENDPOINTS.AUTH_FORGOT_PASSWORD,
    RESET_PASSWORD: API_ENDPOINTS.AUTH_RESET_PASSWORD,
    RESEND_OTP: API_ENDPOINTS.AUTH_RESEND_OTP,
    CHANGE_PASSWORD: API_ENDPOINTS.AUTH_CHANGE_PASSWORD,

    // Users
    UPDATE_ME: API_ENDPOINTS.USER_UPDATE_ME,
    USER_PROFILE: API_ENDPOINTS.USER_PROFILE,
    ALL_USERS: API_ENDPOINTS.USER_ALL,

    // Follows
    ALL_FOLLOWERS: API_ENDPOINTS.FOLLOWERS,
    ALL_FOLLOWING: API_ENDPOINTS.FOLLOWING,
    MUTUAL_FOLLOWS: API_ENDPOINTS.MUTUAL_FOLLOWS,
    FOLLOWERS_COUNT: API_ENDPOINTS.FOLLOWERS_COUNT,
    FOLLOWING_COUNT: API_ENDPOINTS.FOLLOWING_COUNT,
    IS_FOLLOWING: API_ENDPOINTS.IS_FOLLOWING,

    // Posts
    POSTS: API_ENDPOINTS.POSTS_LIST,
    GET_POST: API_ENDPOINTS.POST_GET,
    UPDATE_POST: API_ENDPOINTS.POST_UPDATE,
    DELETE_POST: API_ENDPOINTS.POST_DELETE,
    LIKE_POST: API_ENDPOINTS.POST_LIKE,
    LIKE_POST_ACTION: API_ENDPOINTS.LIKE_POST_ACTION,
    UNLIKE_POST_ACTION: API_ENDPOINTS.UNLIKE_POST_ACTION,
    GET_POST_LIKES: API_ENDPOINTS.GET_POST_LIKES,

    // Comments
    COMMENTS: API_ENDPOINTS.COMMENTS_LIST,
    GET_COMMENTS: API_ENDPOINTS.COMMENTS_GET,
    CREATE_COMMENT: API_ENDPOINTS.COMMENT_CREATE,
    DELETE_COMMENT: API_ENDPOINTS.COMMENT_DELETE,
    UPDATE_COMMENT: API_ENDPOINTS.COMMENT_UPDATE,
    REPLY_COMMENT: API_ENDPOINTS.COMMENT_REPLY,
    COMMENT_REPLIES: API_ENDPOINTS.COMMENT_REPLIES,
    COMMENT_LIKE: API_ENDPOINTS.COMMENT_LIKE,
    COMMENT_UNLIKE: API_ENDPOINTS.COMMENT_UNLIKE,

    // OAuth
    GOOGLE_LOGIN: API_ENDPOINTS.GOOGLE_LOGIN,
    GOOGLE_CALENDAR: API_ENDPOINTS.GOOGLE_CALENDAR,
  },
  APP_NAME: 'TokTok',
  APP_VERSION: '1.0.0'
};

export const buildUrl = (endpoint, params = {}) => {
  let url = CONFIG.API_BASE_URL + endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
};

export const apiRequest = async (endpoint, options = {}) => {
  const url = typeof endpoint === 'string' ? buildUrl(endpoint) : endpoint;
  
  const config = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }
    
    return { data, response };
  } catch (error) {
    throw new Error(error.message || 'Network request failed');
  }
};

export const API_CONFIG = {
  BASE_URL: CONFIG.API_BASE_URL,
  ENDPOINTS: CONFIG.ENDPOINTS,
  DEBUG: CONFIG.DEBUG
};

export const ENV_CONFIG = CONFIG;
