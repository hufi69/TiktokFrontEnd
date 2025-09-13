import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';
import ImageCarousel from './ImageCarousel';
import { useSelector, useDispatch } from 'react-redux';
import { selectPostLike, selectLikePending, togglePostLike, clearError } from '../../store/slices/likesSlice';

const PostItem = ({ post, onComment, onShare, onBookmark, onUserPress, onEdit, onDelete, currentUserId, onCommentCountUpdate }) => {
  const dispatch = useDispatch();
  const postId = post?.id || post?._id;
  const likeState = useSelector(selectPostLike(postId));
  const pending = useSelector(selectLikePending(postId));
  const [localCommentsCount, setLocalCommentsCount] = useState(post?.comments || post?.commentsCount || post?.commentCount || 0);
  
  // Use Redux state for likes, fallback to post data
  const likedByMe = likeState.isLiked;
  const likeCount = likeState.count;

  // Update local comment count when post changes
  useEffect(() => {
    const newCount = post?.comments || post?.commentsCount || post?.commentCount || 0;
    setLocalCommentsCount(newCount);
  }, [post?.comments, post?.commentsCount, post?.commentCount]);
  
  // Handle comment count update from CommentScreen
  useEffect(() => {
    if (onCommentCountUpdate) {
      onCommentCountUpdate(postId, (callback) => {
        if (typeof callback === 'function') {
          callback(localCommentsCount);
        } else if (typeof callback === 'number') {
          setLocalCommentsCount(callback);
        }
      });
    }
  }, [postId, onCommentCountUpdate, localCommentsCount]);

  // FIXED: Complete like handler
  const handleToggleLike = useCallback(async () => {
    if (pending) return;

    try {
      console.log(`🚀 Toggling like for post ${postId}, currently liked: ${likedByMe}`);
      const result = await dispatch(togglePostLike(postId));
      
      if (togglePostLike.fulfilled.match(result)) {
        console.log('✅ Like toggle successful:', result.payload);
      } else if (togglePostLike.rejected.match(result)) {
        console.error('❌ Like toggle failed:', result.payload);
        Alert.alert('Error', result.payload || 'Failed to update like status');
        dispatch(clearError());
      }
    } catch (error) {
      console.error('💥 Like error:', error);
      Alert.alert('Error', 'Failed to update like status');
    }
  }, [dispatch, postId, likedByMe, pending]);

  const formatCount = useCallback((count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count?.toString() || '0';
  }, []);

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => onUserPress?.(post.author)}
        >
          <Image
            source={{ uri: post.author?.profilePicture || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>
              {post.author?.userName || post.author?.fullName || 'Unknown User'}
            </Text>
            <Text style={styles.location}>{post.location || 'Unknown Location'}</Text>
          </View>
        </TouchableOpacity>
        
        {currentUserId === post.author?._id && (
          <TouchableOpacity onPress={() => onEdit?.(post)}>
            <Icon name="ellipsis-h" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Post Content */}
      {post.content && (
        <Text style={styles.caption}>{post.content}</Text>
      )}

      {/* Post Media */}
      {post.media && post.media.length > 0 && (
        <ImageCarousel images={post.media} />
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          {/* Like Button - FIXED */}
          <TouchableOpacity 
            style={[styles.actionButton, pending && styles.actionButtonDisabled]}
            onPress={handleToggleLike}
            disabled={pending}
          >
            <Icon 
              name={likedByMe ? "heart" : "heart-o"} 
              size={24} 
              color={likedByMe ? "#FF3040" : colors.text}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onComment?.(post)}
          >
            <Icon name="comment-o" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onShare?.(post._id)}
          >
            <Icon name="send-o" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onBookmark?.(post._id)}
        >
          <Icon 
            name={post.isBookmarked ? "bookmark" : "bookmark-o"} 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Like Count */}
      {likeCount > 0 && (
        <Text style={styles.likeCount}>
          {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
        </Text>
      )}

      {/* Comments Preview - FIXED */}
      {localCommentsCount > 0 ? (
        <TouchableOpacity onPress={() => onComment?.(post)}>
          <Text style={styles.commentCount}>
            View all {formatCount(localCommentsCount)} {localCommentsCount === 1 ? 'comment' : 'comments'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => onComment?.(post)}>
          <Text style={styles.commentCount}>No comments yet</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.timestamp}>
        {new Date(post.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    marginBottom: spacing.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.s,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  location: {
    fontSize: 12,
    color: colors.textLight,
  },
  caption: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: spacing.m,
    padding: spacing.xs,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  likeCount: {
    paddingHorizontal: spacing.m,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  commentCount: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    fontSize: 14,
    color: colors.textLight,
  },
  timestamp: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
    fontSize: 12,
    color: colors.textLight,
  },
});

export default PostItem;