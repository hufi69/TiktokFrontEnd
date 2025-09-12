import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, Alert, KeyboardAvoidingView, Platform, RefreshControl,
  Modal
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { addComment } from '../../store/slices/postsSlice';
import { toggleCommentLike, selectCommentLike, selectLikePending, initializeComments, clearError } from '../../store/slices/likesSlice';
import { colors, spacing, radius } from '../../constants/theme';
import { API_CONFIG, buildUrl } from '../../config/api';
import { useSelector } from 'react-redux';

const AVATAR_FALLBACK = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face';
const getId = (c) => (c?._id || c?.id);

const CommentScreen = ({ onBack, postId, post, onPostUpdated, onCommentCountUpdate }) => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector(state => state.auth);
  
  const [comments, setComments] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const inputRef = useRef(null);
  const [expandedReplyFor, setExpandedReplyFor] = useState({});
  const [repliesById, setRepliesById] = useState({});
  const [repliesLoading, setRepliesLoading] = useState({});
  const [repliesCursorById, setRepliesCursorById] = useState({});
  const [repliesLoadingMore, setRepliesLoadingMore] = useState({});
  const loadingMoreRef = useRef(false);

  // State for Edit Comment Modal
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editedContent, setEditedContent] = useState('');

  const handleDeleteComment = useCallback(async (comment) => {
    const commentId = getId(comment);
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to permanently delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const url = buildUrl(API_CONFIG.ENDPOINTS.COMMENT_DELETE);
              const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId }),
              });

              if (!response.ok) {
                throw new Error('Failed to delete the comment.');
              }

              // Remove from local state
              if (comment.parentComment) {
                setRepliesById(prev => ({
                  ...prev,
                  [comment.parentComment]: prev[comment.parentComment].filter(c => getId(c) !== commentId),
                }));
              } else {
                setComments(prev => prev.filter(c => getId(c) !== commentId));
              }

              // Update total comment count
              if (onCommentCountUpdate) {
                const remainingComments = comment.parentComment 
                  ? comments.length + Object.values(repliesById).flat().length - 1
                  : comments.length - 1 + Object.values(repliesById).flat().length;
                onCommentCountUpdate(postId, remainingComments);
              }

            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }, [token, comments, repliesById, onCommentCountUpdate, postId]);

  const handleUpdateComment = useCallback(async () => {
    if (!editingComment || !editedContent.trim()) return;

    const commentId = getId(editingComment);
    try {
      const url = buildUrl(API_CONFIG.ENDPOINTS.COMMENT_UPDATE);
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: editedContent.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update comment.');
      }

      const updatedComment = data.data.comment;

      // Update local state
      if (updatedComment.parentComment) {
        setRepliesById(prev => ({
          ...prev,
          [updatedComment.parentComment]: prev[updatedComment.parentComment].map(c => 
            getId(c) === commentId ? updatedComment : c
          ),
        }));
      } else {
        setComments(prev => prev.map(c => getId(c) === commentId ? updatedComment : c));
      }

      setEditModalVisible(false);
      setEditingComment(null);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token, editingComment, editedContent]);

  const openEditModal = (comment) => {
    setEditingComment(comment);
    setEditedContent(comment.content);
    setEditModalVisible(true);
  };

  const fetchComments = useCallback(async (_cursorParam = null) => {
    try {
      setLoading(true);
      const url = buildUrl(API_CONFIG.ENDPOINTS.GET_COMMENTS, { postId });
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.status === 'success') {
        const allComments = data.data?.comments || [];
        const topLevelComments = [];
        const replies = {};

        // Separate top-level comments and replies
        allComments.forEach(comment => {
          if (comment.parentComment) {
            if (!replies[comment.parentComment]) {
              replies[comment.parentComment] = [];
            }
            replies[comment.parentComment].push(comment);
          } else {
            topLevelComments.push(comment);
          }
        });

        console.log('Fetched comments:', allComments.length, 'Top-level:', topLevelComments.length, 'Replies:', Object.keys(replies).length);

        // Initialize the likes state for all comments
        dispatch(initializeComments(allComments));

        // Set state for both comments and replies
        setComments(topLevelComments);
        setRepliesById(prev => ({ ...prev, ...replies }));
        setCursor(null);

        if (onCommentCountUpdate) {
          onCommentCountUpdate(postId, allComments.length);
        }
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  }, [postId, token, dispatch]);

  const loadInitial = useCallback(() => { fetchComments(); }, [fetchComments]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try { await fetchComments(cursor); }
    finally { loadingMoreRef.current = false; }
  }, [cursor, fetchComments]);

  const onRefresh = useCallback(async () => { setRefreshing(true); try { await loadInitial(); } finally { setRefreshing(false); } }, [loadInitial]);

  useEffect(() => { if (postId) { loadInitial(); } }, [postId, loadInitial]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    try {
      const parentId = replyTo ? getId(replyTo) : null;
      
      // Use appropriate API endpoint based on whether it's a reply or comment
      let result;
      if (parentId) {
        // Reply to comment
        const url = buildUrl(API_CONFIG.ENDPOINTS.COMMENT_REPLY);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            commentId: parentId,
            content: text
          })
        });
        const data = await response.json();
        result = { payload: data.data?.newComment };
      } else {
        // Regular comment
        result = await dispatch(addComment({ postId, content: text, parentId }));
      }
      
      const newComment = result?.payload?.comment || result?.payload;
      if (newComment) {
        const ensuredId = getId(newComment) || `temp-${Date.now()}`;

        if (parentId) {
          // Adding reply
          console.log('📝 Adding reply to comment:', parentId);
          setRepliesById(prev => {
            const existing = prev[parentId] || [];
            if (existing.some(r => getId(r) === ensuredId)) {
              console.log('⚠️ Reply already exists, skipping');
              return prev;
            }
            const updated = [{ ...newComment, _id: ensuredId }, ...existing];
            console.log('✅ Reply added, new count:', updated.length);
            return { ...prev, [parentId]: updated };
          });
          setExpandedReplyFor(prev => ({ ...prev, [parentId]: true }));
          // Update parent comment's reply count
          setComments(prev => prev.map(c => {
            if (getId(c) === parentId) {
              const newRepliesCount = (c.repliesCount || 0) + 1;
              console.log('📈 Updated parent comment replies count:', newRepliesCount);
              return { ...c, repliesCount: newRepliesCount };
            }
            return c;
          }));
        } else {
          // Adding top-level comment
          console.log('Adding top-level comment');
          setComments(prev => {
            if (prev.some(c => getId(c) === ensuredId)) {
              console.log('Comment already exists, skipping');
              return prev;
            }
            const updated = [{ ...newComment, _id: ensuredId }, ...prev];
            console.log('Comment added, new total:', updated.length);
            return updated;
          });
          
          // Update post comment count
          if (onCommentCountUpdate) {
            const totalComments = comments.length + 1 + Object.values(repliesById).flat().length;
            console.log('Updated post comment count:', totalComments);
            onCommentCountUpdate(postId, totalComments);
          }
        }

        setInput('');
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  }, [input, replyTo, dispatch, postId, comments, onCommentCountUpdate, token]);

  const toggleLike = useCallback(async (comment) => {
    const commentId = getId(comment);
    try {
      await dispatch(toggleCommentLike(commentId)).unwrap();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update comment like status');
      dispatch(clearError());
    }
  }, [dispatch]);

  const formatCount = (n) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : String(n);
  const timeAgo = (iso) => { const t = new Date(iso).getTime(); if (!t) return ''; const diffMs = Date.now() - t; const m = Math.floor(diffMs / 60000); if (m < 1) return 'now'; if (m < 60) return `${m}m`; const h = Math.floor(m / 60); if (h < 24) return `${h}h`; const d = Math.floor(h / 24); if (d < 7) return `${d}d`; const w = Math.floor(d / 7); if (w < 4) return `${w}w`; const mo = Math.floor(d / 30); if (mo < 12) return `${mo}mo`; const y = Math.floor(d / 365); return `${y}y`; };

  const fetchReplies = useCallback(async (commentId) => {
    try {
      const url = buildUrl(API_CONFIG.ENDPOINTS.COMMENT_REPLIES, { commentId });
      console.log('🔍 Fetching replies for comment:', commentId, 'URL:', url);
      
      const res = await fetch(url, { 
        method: 'GET', 
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        } 
      });
      
      const json = await res.json();
      console.log('📥 Replies response:', json);
      
      if (!res.ok) {
        console.error('❌ Failed to fetch replies:', json?.message);
        throw new Error(json?.message || 'Failed to fetch replies');
      }
      
      const list = json?.data?.replies || [];
      console.log('📝 Fetched replies:', list.length);
      
      // Initialize likes state for replies too
      if (list.length > 0) {
        dispatch(initializeComments(list));
      }
      
      const ensured = (list || []).map(r => ({ 
        ...r, 
        _id: getId(r) || `r-${commentId}-${Math.random().toString(36).slice(2)}` 
      }));
      
      return { items: ensured, nextCursor: null };
    } catch (error) {
      console.error('💥 Error fetching replies:', error);
      throw error;
    }
  }, [token, dispatch]);

  const toggleReplies = useCallback(async (comment) => {
    const id = getId(comment);
    if (expandedReplyFor[id]) { setExpandedReplyFor(prev => ({ ...prev, [id]: false })); return; }
    setExpandedReplyFor(prev => ({ ...prev, [id]: true }));
    if (!repliesById[id]) {
      try {
        setRepliesLoading(prev => ({ ...prev, [id]: true }));
        const { items, nextCursor } = await fetchReplies(id, null);
        setRepliesById(prev => ({ ...prev, [id]: items }));
        setRepliesCursorById(prev => ({ ...prev, [id]: nextCursor }));
      } catch (e) {
        Alert.alert('Replies', 'Failed to load replies');
      } finally {
        setRepliesLoading(prev => ({ ...prev, [id]: false }));
      }
    }
  }, [expandedReplyFor, repliesById, fetchReplies]);

  const loadMoreReplies = useCallback(async (commentId) => {
    const id = commentId;
    const next = repliesCursorById[id];
    if (!next || repliesLoadingMore[id]) return;
    setRepliesLoadingMore(prev => ({ ...prev, [id]: true }));
    try {
      const { items, nextCursor } = await fetchReplies(id, next);
      setRepliesById(prev => ({ ...prev, [id]: [...(prev[id] || []), ...items] }));
      setRepliesCursorById(prev => ({ ...prev, [id]: nextCursor }));
    } catch (e) {
      Alert.alert('Replies', 'Failed to load more replies');
    } finally {
      setRepliesLoadingMore(prev => ({ ...prev, [id]: false }));
    }
  }, [repliesCursorById, repliesLoadingMore, fetchReplies]);

  // Separate component to avoid Rules of Hooks violation
  const ReplyItem = React.memo(({ item: rep, comments, toggleLike, setReplyTo, inputRef, formatCount, timeAgo }) => {
    const repId = getId(rep);
    const likeState = useSelector(selectCommentLike(repId));
    const pending = useSelector(selectLikePending(repId));
    const isLiked = likeState.isLiked;
    const likeCount = likeState.count;
    
    return (
      <View style={styles.replyRow}>
        <Image 
          source={{ uri: rep.user?.profilePicture || AVATAR_FALLBACK }} 
          style={styles.avatarXs} 
        />
        <View style={{ flex: 1 }}>
          <View style={styles.replyHeader}>
            <Text style={styles.name}>{rep.user?.fullName || rep.user?.userName}</Text>
            <Text style={[styles.time, { marginLeft: 'auto' }]}>{timeAgo(rep.createdAt)}</Text>
          </View>
          <Text style={styles.replyText}>{rep.content}</Text>
          
          {/* Reply actions */}
          <View style={[styles.actionsRow, { marginTop: spacing.xs }]}>
            <TouchableOpacity 
              onPress={() => toggleLike(rep)} 
              style={styles.actionBtn}
              disabled={pending}
            >
              <Icon 
                name={isLiked ? "heart" : "heart-o"} 
                size={12} 
                color={isLiked ? "#FF3040" : colors.muted} 
              />
              <Text style={styles.actionTxt}>{formatCount(likeCount)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                // Reply to a reply - set original parent comment as reply target
                const parentComment = comments.find(c => getId(c) === rep.parentComment);
                if (parentComment) {
                  setReplyTo(parentComment);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }
              }}
              style={[styles.actionBtn, { marginLeft: spacing.m }]}
            >
              <Text style={styles.replyLink}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  });
  
  const renderReplyItem = ({ item }) => (
    <ReplyItem 
      item={item}
      comments={comments}
      toggleLike={toggleLike}
      setReplyTo={setReplyTo}
      inputRef={inputRef}
      formatCount={formatCount}
      timeAgo={timeAgo}
    />
  );

  // Separate component to avoid Rules of Hooks violation
  const CommentItem = React.memo(({ 
    item, 
    currentUser,
    toggleLike, 
    setReplyTo, 
    inputRef, 
    formatCount, 
    timeAgo, 
    toggleReplies,
    expandedReplyFor,
    repliesById,
    repliesLoading,
    renderReplyItem,
    repliesCursorById,
    loadMoreReplies,
    repliesLoadingMore,
    openEditModal,
    handleDeleteComment
  }) => {
    const cid = getId(item);
    const likeState = useSelector(selectCommentLike(cid));
    const pending = useSelector(selectLikePending(cid));
    const isLiked = likeState.isLiked;
    const likeCount = likeState.count;
    const isAuthor = item.user?._id === currentUser?._id;

    return (
      <View style={styles.commentRow}>
        <Image source={{ uri: item.user?.profilePicture || AVATAR_FALLBACK }} style={styles.avatarSm} />
        <View style={{ flex: 1 }}>
          <View style={styles.commentHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.user?.fullName || item.user?.userName}</Text>
            </View>
            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            {isAuthor && (
              <TouchableOpacity 
                onPress={() => {
                  Alert.alert(
                    'Comment Options',
                    'Choose an action for your comment.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Edit', onPress: () => openEditModal(item) },
                      { text: 'Delete', style: 'destructive', onPress: () => handleDeleteComment(item) },
                    ],
                    { cancelable: true }
                  );
                }}
                style={styles.moreBtn}
              >
                <Icon name="ellipsis-v" size={18} color={colors.textLight} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.commentText}>{item.content}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity 
              onPress={() => toggleLike(item)} 
              style={[styles.actionBtn, pending && styles.disabledButton]}
              disabled={pending}
            >
              <Icon 
                name={isLiked ? "heart" : "heart-o"} 
                size={16} 
                color={isLiked ? "#FF3040" : colors.textLight}
                style={pending && styles.pendingIcon}
              />
              <Text style={[styles.actionText, isLiked && { color: "#FF3040" }, pending && styles.pendingText]}>
                {formatCount(likeCount)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { 
                setReplyTo(item); 
                setTimeout(() => inputRef.current?.focus(), 0); 
              }}
              style={[styles.actionBtn, { marginLeft: spacing.m }]}
            >
              <Text style={styles.replyLink}>Reply</Text>
            </TouchableOpacity>

            {(item.repliesCount > 0 || repliesById[cid]?.length > 0) && (
              <TouchableOpacity
                style={[styles.actionBtn, { marginLeft: spacing.m }]}
                onPress={() => toggleReplies(item)}
              >
                <Text style={styles.replyLink}>
                  {expandedReplyFor[cid] ? 'Hide' : 'View'} {item.repliesCount || repliesById[cid]?.length || 0} {(item.repliesCount || repliesById[cid]?.length || 0) === 1 ? 'reply' : 'replies'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {expandedReplyFor[cid] && (
            <View style={styles.repliesContainer}>
              <View style={styles.replyDivider} />
              {repliesLoading[cid] ? (
                <Text style={styles.repliesLoading}>Loading replies…</Text>
              ) : (
                <>
                  <FlashList
                    data={repliesById[cid] || []}
                    keyExtractor={(r, index) => getId(r) || `rep-${index}`}
                    renderItem={renderReplyItem}
                    scrollEnabled={false}
                    estimatedItemSize={44}
                  />
                  {repliesCursorById[cid] ? (
                    <TouchableOpacity onPress={() => loadMoreReplies(cid)} style={styles.viewMoreBtn} disabled={!!repliesLoadingMore[cid]}>
                      <Text style={styles.viewMoreTxt}>{repliesLoadingMore[cid] ? 'Loading…' : 'View more replies'}</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>
          )}
        </View>
      </View>
    );
  });
  
  const renderItem = ({ item }) => (
    <CommentItem 
      item={item}
      currentUser={user}
      toggleLike={toggleLike}
      setReplyTo={setReplyTo}
      inputRef={inputRef}
      formatCount={formatCount}
      timeAgo={timeAgo}
      toggleReplies={toggleReplies}
      expandedReplyFor={expandedReplyFor}
      repliesById={repliesById}
      repliesLoading={repliesLoading}
      renderReplyItem={renderReplyItem}
      repliesCursorById={repliesCursorById}
      loadMoreReplies={loadMoreReplies}
      repliesLoadingMore={repliesLoadingMore}
      openEditModal={openEditModal}
      handleDeleteComment={handleDeleteComment}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} hitSlop={8}>
            <Icon name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Comments</Text>
          <View style={{ width: 22 }} />
        </View>

        <FlashList
          data={comments}
          keyExtractor={(item, index) => getId(item) || String(index)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 88 }}
          ListFooterComponent={cursor ? <Text style={styles.footerLoading}>Loading…</Text> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReachedThreshold={0.3}
          onEndReached={loadMore}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={72}
        />

        {/* Edit Comment Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isEditModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Comment</Text>
              <TextInput
                value={editedContent}
                onChangeText={setEditedContent}
                style={styles.modalInput}
                multiline
                maxLength={1000}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalButton} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonSave]} onPress={handleUpdateComment}>
                  <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={[styles.composer, replyTo && styles.composerReply]}>
          {replyTo ? (
            <View style={styles.replyPill}>
              <Text numberOfLines={1} style={styles.replyPillText}>Replying to {replyTo.user?.fullName || replyTo.user?.userName}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8}>
                <Icon name="times" size={16} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={[styles.inputRow, replyTo && styles.inputRowReply]}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder={replyTo ? 'Write a reply…' : 'Your comment…'}
              placeholderTextColor={colors.textLight}
              style={styles.input}
              multiline
              maxLength={1000}
              returnKeyType={'send'}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity onPress={handleSend} disabled={!input.trim()} style={[styles.postBtn, !input.trim() && { opacity: 0.5 }]}>
              <Text style={styles.postBtnTxt}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.m, paddingVertical: spacing.s, borderBottomWidth: 0.5, borderBottomColor: colors.border, backgroundColor: colors.bg },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },

  commentRow: { flexDirection: 'row', paddingHorizontal: spacing.m, paddingVertical: spacing.m, borderBottomWidth: 0.5, borderBottomColor: colors.bgAlt },
  avatarSm: { width: 36, height: 36, borderRadius: 18, marginRight: spacing.s },
  commentHeader: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  moreBtn: { padding: 6, marginLeft: spacing.s },
  commentText: { fontSize: 14, color: colors.text, marginTop: 6, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.s },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionTxt: { marginLeft: 6, color: colors.muted, fontSize: 12 },
  replyLink: { color: colors.pink, fontSize: 12, fontWeight: '600' },
  time: { color: colors.textLight, fontSize: 12, marginLeft: spacing.s },

  repliesContainer: { marginLeft: 44, paddingRight: spacing.m, marginTop: spacing.xs },
  replyDivider: { height: 1, backgroundColor: colors.bgAlt, marginBottom: spacing.s },
  repliesLoading: { fontSize: 12, color: colors.muted },
  replyRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.s },
  avatarXs: { width: 28, height: 28, borderRadius: 14, marginRight: spacing.s },
  replyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  replyText: { color: colors.text, fontSize: 14 },
  viewMoreBtn: { paddingVertical: 8 },
  viewMoreTxt: { color: colors.pink, fontSize: 12, fontWeight: '600' },

  footerLoading: { textAlign: 'center', color: colors.muted, padding: 12 },

  composer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopWidth: 0.5, borderTopColor: colors.border, padding: spacing.s },
  composerReply: { paddingBottom: spacing.m },
  replyPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.s, paddingVertical: spacing.s, marginBottom: spacing.s, borderRadius: radius.l, backgroundColor: colors.bgAlt },
  replyPillText: { color: colors.text, fontSize: 12, flex: 1, marginRight: spacing.s },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputRowReply: { marginLeft: 44 },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.l, paddingHorizontal: spacing.s, paddingVertical: spacing.s, fontSize: 14, color: colors.text, maxHeight: 120, backgroundColor: colors.bg },
  postBtn: { marginLeft: spacing.s, backgroundColor: colors.pink, paddingHorizontal: spacing.m, height: 40, borderRadius: radius.m, alignItems: 'center', justifyContent: 'center' },
  postBtnTxt: { color: '#fff', fontWeight: '700' },

  // Loading states
  disabledButton: {
    opacity: 0.6,
  },
  pendingIcon: {
    opacity: 0.7,
  },
  pendingText: {
    opacity: 0.7,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.bg,
    borderRadius: radius.m,
    padding: spacing.m,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.m,
  },
  modalInput: {
    width: '100%',
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.s,
    padding: spacing.s,
    color: colors.text,
    marginBottom: spacing.m,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  modalButton: {
    padding: spacing.s,
    marginLeft: spacing.m,
  },
  modalButtonSave: {
    backgroundColor: colors.pink,
    borderRadius: radius.s,
  },
  modalButtonText: {
    color: colors.text,
    fontSize: 16,
  },
  modalButtonTextSave: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CommentScreen;
