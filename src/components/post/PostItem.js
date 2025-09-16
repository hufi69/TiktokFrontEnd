
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';
import ImageCarousel from './ImageCarousel';
import LikesModal from '../modals/LikesModal';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectPostLike,
  selectLikePending,
  togglePostLike,
  clearError
} from '../../store/slices/likesSlice';

const PostItem = ({ post, onComment, onShare, onBookmark, onUserPress, onEdit, onDelete, currentUserId, onCommentCountUpdate }) => {
  const dispatch = useDispatch();
  const postId = post?.id || post?._id;
  const likeState = useSelector(selectPostLike(postId));
  const pending = useSelector(selectLikePending(postId));
  const [localCommentsCount, setLocalCommentsCount] = useState(post?.comments || post?.commentsCount || post?.commentCount || 0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const likedByMe = likeState.isLiked;
  const likeCount = likeState.count;

  useEffect(() => {
    const newCount = post?.comments || post?.commentsCount || post?.commentCount || 0;
    setLocalCommentsCount(newCount);
  }, [post?.comments, post?.commentsCount, post?.commentCount]);
  
 
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

  const handleToggleLike = useCallback(async () => {
    console.log(' Like button clicked!', { postId, pending, likeState });

    if (pending) {
      console.log(' Like action already pending...');
      return;
    }

    try {
      console.log(`Toggling like for post ${postId}`);
      dispatch(clearError());
      await dispatch(togglePostLike(postId));
    } catch (error) {
      console.error(' Like error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }, [dispatch, postId, pending, likeState]);

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
          disabled={pending}
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
          <TouchableOpacity onPress={() => setShowOptionsMenu(true)} disabled={pending}>
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
          {/*  LIKE BUTTON */}
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              pending && styles.actionButtonDisabled
            ]}
            onPress={handleToggleLike}
            disabled={pending}
          >
            <Icon 
              name={likedByMe ? "heart" : "heart-o"} 
              size={24} 
              color={likedByMe ? "#FF3040" : colors.text}
              style={pending ? styles.iconDisabled : null}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onComment?.(post)}
            disabled={pending}
          >
            <Icon name="comment-o" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onShare?.(post._id)}
            disabled={pending}
          >
            <Icon name="send-o" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onBookmark?.(post._id)}
          disabled={pending}
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
        <TouchableOpacity onPress={() => setShowLikesModal(true)}>
          <Text style={styles.likeCount}>
            {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
          </Text>
        </TouchableOpacity>
      )}

      {/* comments Preview */}
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

      {/* Loading indicator */}
      {pending && (
        <View style={styles.loadingIndicator}>
          <Text style={styles.loadingText}>
            Updating...
          </Text>
        </View>
      )}

      {/* options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsMenu(false);
                onEdit?.(post);
              }}
            >
              <Icon name="edit" size={18} color={colors.text} />
              <Text style={styles.optionText}>Edit Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, styles.deleteOption]}
              onPress={() => {
                setShowOptionsMenu(false);
                onDelete?.(post._id || post.id);
              }}
            >
              <Icon name="trash" size={18} color="#FF3040" />
              <Text style={[styles.optionText, styles.deleteText]}>Delete Post</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* likes Modal */}
      <LikesModal
        visible={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={postId}
        onUserPress={onUserPress}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    marginBottom: spacing.m,
    position: 'relative',
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
    opacity: 0.6,
  },
  iconDisabled: {
    opacity: 0.7,
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
  loadingIndicator: {
    position: 'absolute',
    top: spacing.s,
    right: spacing.m,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 4,
  }, 
  loadingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: colors.bg,
    borderRadius: radius.m,
    minWidth: 150,
    paddingVertical: spacing.s,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: spacing.s,
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.s,
  },
  deleteText: {
    color: '#FF3040',
  },
});

export default PostItem;