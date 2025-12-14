// HTTP Client
export { default as httpClient } from './httpClient';
export * from './httpClient';


export * as authApi from './authApi';
export * as userApi from './userApi';
export * as postsApi from './postsApi';
export * as followApi from './followApi';
export * as commentsApi from './commentsApi';
export * as likesApi from './likesApi';
export * as chatApi from './chatApi';
export * as messageApi from './messageApi';
export * as notificationApi from './notificationApi';


export {
  signUp,
  signIn,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  googleLogin
} from './authApi';

export {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  verifyToken
} from './userApi';

export {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost
} from './postsApi';

export {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing,
  getMutualFollows,
  getFollowersCount,
  getFollowingCount
} from './followApi';

export {
  getComments,
  createComment,
  replyComment,
  updateComment,
  deleteComment,
  getReplies,
  getComment,
  likeComment,
  unlikeComment
} from './commentsApi';

export {
  likePost as likePostAction,
  unlikePost,
  getPostLikes,
  getUserLikes,
  likeComment as likeCommentAction,
  unlikeComment as unlikeCommentAction
} from './likesApi';

export {
  createChat,
  getUserChats,
  getChatById,
  deleteChat
} from './chatApi';

export {
  createMessage,
  getChatMessages,
  getLastMessage,
  deleteMessage
} from './messageApi';

export {
  getNotifications,
  updateNotification
} from './notificationApi';
