/**
 * Post Validation Schemas
 * Validation rules for post creation and editing
 */

/**
 * Validate post content
 */
export const validatePostContent = (content) => {
  if (!content || content.trim().length === 0) {
    return 'Post content cannot be empty';
  }
  if (content.length > 5000) {
    return 'Post content must be less than 5000 characters';
  }
  return null;
};

/**
 * Validate post images
 */
export const validatePostImages = (images) => {
  if (!images || images.length === 0) {
    return null; // Images are optional
  }
  
  if (images.length > 10) {
    return 'You can upload a maximum of 10 images';
  }
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  for (const image of images) {
    if (!image.uri) {
      return 'Invalid image file';
    }
    
    if (image.type && !validTypes.includes(image.type)) {
      return 'Images must be JPEG, PNG, or GIF format';
    }
    
    // Check file size (10MB max per image)
    if (image.fileSize && image.fileSize > 10 * 1024 * 1024) {
      return 'Each image must be less than 10MB';
    }
  }
  
  return null;
};

/**
 * Validate post tags
 */
export const validatePostTags = (tags) => {
  if (!tags || tags.length === 0) {
    return null; // Tags are optional
  }
  
  if (tags.length > 30) {
    return 'You can add a maximum of 30 tags';
  }
  
  for (const tag of tags) {
    if (tag.length > 50) {
      return 'Each tag must be less than 50 characters';
    }
  }
  
  return null;
};

/**
 * Post form validation
 */
export const validatePostForm = (postData) => {
  const errors = {};
  
  const contentError = validatePostContent(postData.content || postData.caption);
  if (contentError) errors.content = contentError;
  
  const imagesError = validatePostImages(postData.images);
  if (imagesError) errors.images = imagesError;
  
  const tagsError = validatePostTags(postData.tags);
  if (tagsError) errors.tags = tagsError;
  
  return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Comment validation
 */
export const validateComment = (content) => {
  if (!content || content.trim().length === 0) {
    return 'Comment cannot be empty';
  }
  if (content.length > 2000) {
    return 'Comment must be less than 2000 characters';
  }
  return null;
};

/**
 * Comment form validation
 */
export const validateCommentForm = (commentData) => {
  const errors = {};
  
  const contentError = validateComment(commentData.content);
  if (contentError) errors.content = contentError;
  
  if (!commentData.postId) {
    errors.postId = 'Post ID is required';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

