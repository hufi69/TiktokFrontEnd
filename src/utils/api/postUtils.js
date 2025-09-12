import { API_CONFIG } from '../../config/api';

// Single source of truth for post transformation
export const transformPost = (raw, userId) => {
  // Debug: Log the raw post data to see what comment fields are available
  if (raw && (raw.commentsCount > 0 || raw.comments?.length > 0 || raw.commentCount > 0)) {
    console.log('📊 Raw post with comments:', {
      postId: raw._id,
      commentsCount: raw.commentsCount,
      commentCount: raw.commentCount,
      commentsLength: raw.comments?.length,
      totalComments: raw.totalComments
    });
  }
  
  const avatar = (() => {
    const pp = raw?.author?.profilePicture;
    if (!pp) return 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';
    return /^https?:\/\//.test(pp) ? pp : `${API_CONFIG.BASE_URL}/public/img/users/${pp}`;
  })();

  const images = (raw.media || [])
    .filter(m => m.type === 'image' && m.url)
    .map(m => `${API_CONFIG.BASE_URL.replace(/\/$/, '')}/${m.url.replace(/^\//, '')}`);

  const finalCommentsCount = raw?.commentsCount || raw?.commentCount || raw?.comments?.length || raw?.totalComments || 0;
  
  return {
    id: raw._id,                          // ← canonical id
    user: {
      id: raw?.author?._id,
      username: raw?.author?.fullName || raw?.author?.userName || 'Unknown User',
      avatar,
      occupation: raw?.author?.occupation || 'No occupation'
    },
    images,
    likes: typeof raw?.likes === 'number' ? raw.likes : (Array.isArray(raw?.likes) ? raw.likes.length : 0),
    comments: finalCommentsCount,
    commentsCount: finalCommentsCount,
    caption: raw?.content || '',
    timeAgo: raw?.createdAt ?? '',        
    
    // Only trust boolean likedByMe; otherwise default to false to avoid accidental DELETE
    isLiked: typeof raw?.likedByMe === 'boolean' 
      ? raw.likedByMe 
      : (typeof raw?.isLiked === 'boolean' ? raw.isLiked : false),
    likeId: raw?.likeId || null,         
    isBookmarked: !!raw?.bookmarked,      
    _id: raw._id,                        
    content: raw?.content,
    media: raw?.media,
    author: raw?.author,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt
  };
};

// Safe story building function
export const buildStories = (basePosts, user) => {
  const yourAvatar = (() => {
    const pp = user?.profilePicture;
    if (!pp) return 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';
    return /^https?:\/\//.test(pp) ? pp : `${API_CONFIG.BASE_URL}/public/img/users/${pp}`;
  })();

  const yourStory = {
    id: 'your_story',
    username: 'Your Story',
    avatar: yourAvatar,
    isYourStory: true,
    stories: []
  };

  const userStories = (basePosts || []).slice(0, 8).map((p, i) => ({
    id: `story_${p.user?.id || p.user?._id || i}_${i}`,
    username: p.user?.username || 'Unknown',
    avatar: p.user?.avatar || p.user?.profilePicture,
    hasStory: false,
    stories: []
  }));

  return [yourStory, ...userStories];
};

// Safe story insertion for new stories
export const insertNewStory = (prevStories, pickedUri) => {
  const [head, ...rest] = prevStories[0]?.isYourStory ? prevStories : [];
  const newStory = {
    id: Date.now().toString(),
    username: 'You',
    avatar: pickedUri,
    isYourStory: false,
    hasStory: true,
    stories: [{ id: 's1', uri: pickedUri, type: 'image', ts: Date.now() }]
  };
  return head ? [head, newStory, ...rest] : [newStory];
};
