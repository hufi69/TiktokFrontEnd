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
  const commentsCount = localCommentsCount;
  
  // Use Redux state if available, otherwise fall back to post data
  const likedByMe = likeState.isLiked || post?.isLiked || false;
  const likeCount = likeState.count || post?.likes || 0;

  // Update local comment count when post changes
  useEffect(() => {
    setLocalCommentsCount(post?.comments || post?.commentsCount || post?.commentCount || 0);
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

  // Display values come from Redux like state (initialized via initializePosts)

  // Single handler for both like and unlike - always dispatches togglePostLike
  const handleToggleLike = useCallback(async () => {
    console.log('PostItem: Calling togglePostLike for postId:', postId, 'currentlyLiked:', likedByMe);
    try {
      await dispatch(togglePostLike(postId)).unwrap();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update like status');
      dispatch(clearError());
    }
  }, [dispatch, postId, likedByMe]);



  return (
  <View style={styles.postContainer}>
    {/* Post Header */}
    <TouchableOpacity style={styles.postHeader} onPress={() => onUserPress(post.user)}>
      <Image source={{ uri: post.user.avatar }} style={styles.postUserAvatar} />
      <View style={styles.postUserInfo}>
        <Text style={styles.postUsername}>{post.user.username}</Text>
        <Text style={styles.postUserOccupation}>{post.user.occupation}</Text>
      </View>
      <TouchableOpacity 
        style={styles.postMoreButton}
        onPress={() => {
          
          if (post.user.id === currentUserId) {
            Alert.alert(
              'Post Options',
              'What would you like to do?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Edit', onPress: () => onEdit(post) },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
              ]
            );
          } else {
            
            Alert.alert(
              'Post Options',
              'What would you like to do?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Report', style: 'destructive', onPress: () => console.log('Report post') },
              ]
            );
          }
        }}
      >
        <Icon name="ellipsis-h" size={16} color={colors.muted} />
      </TouchableOpacity>
    </TouchableOpacity>

    <ImageCarousel images={post.images} style={styles.postImage} />

    
    <View style={styles.postActions}>
      <View style={styles.leftActions}>
        <TouchableOpacity 
          style={[styles.actionButton, pending && styles.disabledButton]}
          disabled={pending}
          onPress={handleToggleLike}
        >
          <Icon 
            name={likedByMe ? "heart" : "heart-o"} 
            size={24} 
            color={likedByMe ? "#FF3040" : colors.text} 
            style={pending && styles.pendingIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onComment(postId)}
        >
          <Icon name="comment-o" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onShare(postId)}
        >
          <Icon name="send-o" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => onBookmark(postId)}>
        <Icon 
          name={post.isBookmarked ? "bookmark" : "bookmark-o"} 
          size={24} 
          color={colors.text} 
        />
      </TouchableOpacity>
    </View>

    <View style={styles.postStats}>
      <Text style={styles.likesText}>
        {Number(likeState.count || likeCount || 0).toLocaleString()} likes
      </Text>
      <View style={styles.captionContainer}>
        <Text style={styles.captionUsername}>{post.user.username}</Text>
        <Text style={styles.captionText}> {post.caption}</Text>
      </View>
      <TouchableOpacity onPress={() => onComment(postId)}>
        <Text style={styles.commentsText}>
          {commentsCount > 0 ? `View all ${commentsCount} comments` : 'Add a comment...'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.timeText}>{post.timeAgo}</Text>
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: colors.bg,
    marginBottom: 0,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  postUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  postUserInfo: {
    flex: 1,
    marginLeft: spacing.s,
  },
  postUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  postUserOccupation: {
    fontSize: 12,
    color: colors.muted,
  },
  postMoreButton: {
    padding: spacing.s,
  },
  postImage: {
    backgroundColor: colors.bgAlt,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  leftActions: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  actionButton: {
    padding: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pendingIcon: {
    opacity: 0.7,
  },
  postStats: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.m,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  captionContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  captionUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  captionText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  commentsText: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.muted,
  },
});

export default PostItem;
  
