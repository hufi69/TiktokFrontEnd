import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { fetchGroupComments, createGroupComment, updateGroupComment, deleteGroupComment } from '../../store/slices/groupsSlice';
import { CONFIG } from '../../config';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';

const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  if (/^https?:\/\//.test(profilePicture)) return profilePicture;
  const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
  return `${baseUrl}/public/img/users/${profilePicture}`;
};

const GroupCommentScreen = ({ 
  groupId, 
  postId, 
  post, 
  onBack, 
  onUserPress,
  userRole,
  currentUserId 
}) => {
  const dispatch = useAppDispatch();
  const { groupComments, isLoading } = useAppSelector(state => state.groups);
  const key = `${groupId}_${postId}`;
  const comments = groupComments[key] || [];
  const [refreshing, setRefreshing] = useState(false);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (groupId && postId) {
      dispatch(fetchGroupComments({ groupId, postId }));
    }
  }, [groupId, postId, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (groupId && postId) {
      await dispatch(fetchGroupComments({ groupId, postId }));
    }
    setRefreshing(false);
  }, [groupId, postId, dispatch]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (editingComment) {
        // Update comment
        await dispatch(updateGroupComment({
          groupId,
          commentId: editingComment._id || editingComment.id,
          commentData: { content: input.trim() }
        })).unwrap();
        setEditingComment(null);
      } else {
        // Create comment
        await dispatch(createGroupComment({
          groupId,
          postId,
          commentData: {
            content: input.trim(),
            parentComment: replyingTo?._id || replyingTo?.id || null,
          }
        })).unwrap();
        setReplyingTo(null);
      }
      setInput('');
      inputRef.current?.blur();
    } catch (error) {
      console.error('Comment error:', error);
    } finally {
      setSubmitting(false);
    }
  }, [input, editingComment, replyingTo, groupId, postId, dispatch]);

  const handleDelete = useCallback((comment) => {
    const isAuthor = (comment.author?._id || comment.author?.id) === currentUserId;
    const canModerate = userRole === 'admin' || userRole === 'moderator';
    
    if (!isAuthor && !canModerate) return;

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteGroupComment({
                groupId,
                commentId: comment._id || comment.id
              })).unwrap();
            } catch (error) {
              Alert.alert('Error', error || 'Failed to delete comment');
            }
          },
        },
      ]
    );
  }, [groupId, currentUserId, userRole, dispatch]);

  const handleEdit = useCallback((comment) => {
    setEditingComment(comment);
    setInput(comment.content || '');
    setReplyingTo(null);
    inputRef.current?.focus();
  }, []);

  const handleReply = useCallback((comment) => {
    setReplyingTo(comment);
    setEditingComment(null);
    setInput('');
    inputRef.current?.focus();
  }, []);

  const renderComment = useCallback(({ item }) => {
    const isAuthor = (item.author?._id || item.author?.id) === currentUserId;
    const canModerate = userRole === 'admin' || userRole === 'moderator';
    const isReply = !!item.parentComment;

    return (
      <View style={[styles.commentItem, isReply && styles.replyItem]}>
        <TouchableOpacity
          onPress={() => onUserPress?.(item.author)}
          style={styles.commentHeader}
        >
          <Image
            source={{ uri: getAvatarUrl(item.author?.profilePicture) }}
            style={styles.commentAvatar}
          />
          <View style={styles.commentContent}>
            <View style={styles.commentHeaderRow}>
              <Text style={styles.commentAuthor}>
                {item.author?.userName || item.author?.fullName || 'Unknown'}
              </Text>
              <Text style={styles.commentTime}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.commentText}>{item.content}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.commentAction}
                onPress={() => handleReply(item)}
              >
                <Icon name="reply" size={14} color={colors.textLight} />
                <Text style={styles.commentActionText}>Reply</Text>
              </TouchableOpacity>
              {isAuthor && (
                <TouchableOpacity
                  style={styles.commentAction}
                  onPress={() => handleEdit(item)}
                >
                  <Icon name="edit" size={14} color={colors.textLight} />
                  <Text style={styles.commentActionText}>Edit</Text>
                </TouchableOpacity>
              )}
              {(isAuthor || canModerate) && (
                <TouchableOpacity
                  style={styles.commentAction}
                  onPress={() => handleDelete(item)}
                >
                  <Icon name="trash" size={14} color={colors.error} />
                  <Text style={[styles.commentActionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [currentUserId, userRole, handleReply, handleEdit, handleDelete, onUserPress]);

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['top', 'bottom'] : ['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Comments</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Post Preview */}
      {post && (
        <View style={styles.postPreview}>
          <Text style={styles.postPreviewText} numberOfLines={2}>
            {post.content || 'Group post'}
          </Text>
        </View>
      )}

      {/* Comments List */}
      {isLoading && comments.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <FlashList
          data={comments}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderComment}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.pink]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="comment-o" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to comment</Text>
            </View>
          )}
        />
      )}

      {/* Reply/Edit Indicator */}
      {(replyingTo || editingComment) && (
        <View style={styles.indicator}>
          <Text style={styles.indicatorText}>
            {editingComment ? 'Editing comment' : `Replying to ${replyingTo?.author?.userName || 'user'}`}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setReplyingTo(null);
              setEditingComment(null);
              setInput('');
            }}
          >
            <Icon name="times" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={editingComment ? "Edit comment..." : replyingTo ? "Write a reply..." : "Write a comment..."}
            placeholderTextColor={colors.textLight}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || submitting) && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={!input.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="paper-plane" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginLeft: spacing.s,
  },
  postPreview: {
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  postPreviewText: {
    fontSize: 14,
    color: colors.text,
  },
  listContent: {
    padding: spacing.m,
    paddingBottom: 100,
  },
  commentItem: {
    marginBottom: spacing.m,
  },
  replyItem: {
    marginLeft: spacing.l,
    paddingLeft: spacing.m,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.s,
    backgroundColor: colors.surface,
  },
  commentContent: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.s,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.xs,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  commentActionText: {
    fontSize: 12,
    color: colors.textLight,
  },
  deleteText: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.m,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    gap: spacing.s,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: spacing.m,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.pink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.s,
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  indicatorText: {
    fontSize: 12,
    color: colors.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.m,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
});

export default GroupCommentScreen;
