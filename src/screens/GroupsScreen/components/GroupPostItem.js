import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../../constants/theme';
import ImageCarousel from '../../HomeScreen/components/ImageCarousel';
import { CONFIG } from '../../../config';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { pinGroupPost, approveGroupPost, rejectGroupPost, deleteGroupPost } from '../../../store/slices/groupsSlice';
import { likeGroupPost, unlikeGroupPost } from '../../../store/slices/groupsSlice';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';

const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  if (/^https?:\/\//.test(profilePicture)) return profilePicture;
  const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
  return `${baseUrl}/public/img/users/${profilePicture}`;
};

const GroupPostItem = ({ post, groupId, onPress, onComment, userRole, currentUserId, onPostUpdated }) => {
  const dispatch = useAppDispatch();
  const postId = post?._id || post?.id;
  const [liked, setLiked] = useState(post?.likedByMe || false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [liking, setLiking] = useState(false);
  
  const isAuthor = post?.author?._id === currentUserId || post?.author?.id === currentUserId;
  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator';
  const canModerate = isAdmin || isModerator;
  const postStatus = post?.status || 'published';
  const isPending = postStatus === 'pending';
  const isPinned = post?.isPinned;

  // Initialize like state from post
  useEffect(() => {
    if (post) {
      setLiked(post.likedByMe || false);
      setLikeCount(post.likes || 0);
    }
  }, [post]);

  const handleLike = useCallback(async () => {
    if (!groupId || !postId || liking || postStatus !== 'published') return;
    
    setLiking(true);
    const wasLiked = liked;
    
    // Optimistic update
    setLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
    
    try {
      if (wasLiked) {
        await dispatch(unlikeGroupPost({ groupId, postId })).unwrap();
      } else {
        await dispatch(likeGroupPost({ groupId, postId })).unwrap();
      }
      // Refresh post to get updated like count
      if (onPostUpdated) {
        onPostUpdated();
      }
    } catch (error) {
      // Revert optimistic update on error
      setLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      console.error('Like error:', error);
    } finally {
      setLiking(false);
    }
  }, [groupId, postId, liked, liking, postStatus, dispatch, onPostUpdated]);

  const handlePin = useCallback(async () => {
    if (!groupId) return;
    try {
      await dispatch(pinGroupPost({ groupId, postId: post._id || post.id, isPinned: !isPinned })).unwrap();
      onPostUpdated?.();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to pin post');
    }
  }, [groupId, post, isPinned, dispatch, onPostUpdated]);

  const handleApprove = useCallback(async () => {
    if (!groupId) return;
    Alert.alert(
      'Approve Post',
      'Are you sure you want to approve this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await dispatch(approveGroupPost({ groupId, postId: post._id || post.id })).unwrap();
              onPostUpdated?.();
            } catch (error) {
              Alert.alert('Error', error || 'Failed to approve post');
            }
          },
        },
      ]
    );
  }, [groupId, post, dispatch, onPostUpdated]);

  const handleReject = useCallback(async () => {
    if (!groupId) return;
    Alert.alert(
      'Reject Post',
      'Are you sure you want to reject this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(rejectGroupPost({ groupId, postId: post._id || post.id })).unwrap();
              onPostUpdated?.();
            } catch (error) {
              Alert.alert('Error', error || 'Failed to reject post');
            }
          },
        },
      ]
    );
  }, [groupId, post, dispatch, onPostUpdated]);

  const handleDelete = useCallback(async () => {
    if (!groupId) return;
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteGroupPost({ groupId, postId: post._id || post.id })).unwrap();
              onPostUpdated?.();
            } catch (error) {
              Alert.alert('Error', error || 'Failed to delete post');
            }
          },
        },
      ]
    );
  }, [groupId, post, dispatch, onPostUpdated]);

  const handleOptions = useCallback(() => {
    const options = [];
    
    if (canModerate && isPending) {
      options.push({ text: 'Approve', onPress: handleApprove });
      options.push({ text: 'Reject', style: 'destructive', onPress: handleReject });
    }
    
    if (canModerate) {
      options.push({ text: isPinned ? 'Unpin' : 'Pin', onPress: handlePin });
    }
    
    if (isAuthor || canModerate) {
      options.push({ text: 'Delete', style: 'destructive', onPress: handleDelete });
    }
    
    if (options.length > 0) {
      Alert.alert('Post Options', '', options.concat([{ text: 'Cancel', style: 'cancel' }]));
    }
  }, [canModerate, isPending, isPinned, isAuthor, handleApprove, handleReject, handlePin, handleDelete]);

  const images = post?.media?.filter(m => m.type === 'image').map(m => {
    const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
    return m.url.startsWith('http') ? m.url : `${baseUrl}${m.url}`;
  }) || [];

  return (
    <View style={[styles.container, isPending && styles.pendingContainer]}>
      {/* Status Badge */}
      {isPending && canModerate && (
        <View style={styles.statusBadge}>
          <Icon name="clock-o" size={12} color={colors.textLight} />
          <Text style={styles.statusText}>Pending Approval</Text>
        </View>
      )}
      
      {/* Pinned Badge */}
      {isPinned && (
        <View style={styles.pinnedBadge}>
          <Icon name="thumb-tack" size={12} color={colors.pink} />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}

      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo}>
          <Image
            source={{ uri: getAvatarUrl(post?.author?.profilePicture) }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>
              {post?.author?.userName || post?.author?.fullName || 'Unknown'}
            </Text>
            <Text style={styles.time}>
              {post?.timeAgo || 'Just now'}
            </Text>
          </View>
        </TouchableOpacity>
        {(canModerate || isAuthor) && (
          <TouchableOpacity onPress={handleOptions}>
            <Icon name="ellipsis-h" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Post Content */}
      {post?.content && (
        <Text style={styles.content}>{post.content}</Text>
      )}

      {/* Post Media */}
      {images.length > 0 && (
        <View style={styles.mediaContainer}>
          <ImageCarousel images={images} />
        </View>
      )}

      {/* Post Actions */}
      {postStatus === 'published' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Icon 
              name={liked ? "heart" : "heart-o"} 
              size={20} 
              color={liked ? "#FF3040" : colors.textLight} 
            />
            <Text style={[styles.actionText, liked && styles.likedText]}>
              {likeCount > 0 ? likeCount : 'Like'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Icon name="comment-o" size={20} color={colors.textLight} />
            <Text style={styles.actionText}>
              {post?.commentsCount || post?.comments || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="share" size={20} color={colors.textLight} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Moderation Actions for Pending Posts */}
      {isPending && canModerate && (
        <View style={styles.moderationActions}>
          <TouchableOpacity style={[styles.modButton, styles.approveButton]} onPress={handleApprove}>
            <Icon name="check" size={16} color="#fff" />
            <Text style={styles.modButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modButton, styles.rejectButton]} onPress={handleReject}>
            <Icon name="times" size={16} color="#fff" />
            <Text style={styles.modButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    padding: spacing.m,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.s,
    backgroundColor: colors.surface,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  time: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.s,
  },
  mediaContainer: {
    marginBottom: spacing.s,
  },
  actions: {
    flexDirection: 'row',
    paddingTop: spacing.s,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    gap: spacing.m,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: 14,
    color: colors.textLight,
  },
  likedText: {
    color: "#FF3040",
    fontWeight: '600',
  },
  pendingContainer: {
    opacity: 0.8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
    alignSelf: 'flex-start',
    marginBottom: spacing.s,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
    alignSelf: 'flex-start',
    marginBottom: spacing.s,
    gap: spacing.xs,
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.pink,
  },
  moderationActions: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
    paddingTop: spacing.s,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  modButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s,
    borderRadius: radius.m,
    gap: spacing.xs,
  },
  approveButton: {
    backgroundColor: colors.pink,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  modButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GroupPostItem;
