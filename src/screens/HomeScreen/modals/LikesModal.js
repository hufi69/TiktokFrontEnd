import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { getPostLikes, selectPostLikes } from '../../../store/slices/likesSlice';
import { colors, spacing, radius } from '../../../constants/theme';
import { CONFIG } from '../../../config';

const AVATAR_FALLBACK = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face';

const LikesModal = ({ visible, onClose, postId, onUserPress }) => {
  const dispatch = useAppDispatch();
  
  // Memoize the selector to prevent unnecessary rerenders
  const selectLikes = useMemo(() => (state) => {
    return selectPostLikes(postId)(state);
  }, [postId]);
  
  const likesData = useAppSelector(selectLikes);
  const { users: likes = [], loading = false, error = null } = likesData;

  useEffect(() => {
    if (visible && postId) {
      console.log('🔍 Fetching likes for post:', postId);
      dispatch(getPostLikes(postId));
    }
  }, [visible, postId, dispatch]);

  const renderLikeItem = ({ item }) => {
    const user = item.user;
    const avatarUri = user?.profilePicture
      ? /^https?:\/\//.test(user.profilePicture)
        ? user.profilePicture
        : (() => {
            const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
            return `${baseUrl}/public/img/users/${user.profilePicture}`;
          })()
      : AVATAR_FALLBACK;

    return (
      <TouchableOpacity
        style={styles.likeItem}
        onPress={() => {
          if (onUserPress) {
            onUserPress(user);
          }
        }}
      >
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatar}
          defaultSource={{ uri: AVATAR_FALLBACK }}
        />

        <View style={styles.userInfo}>
          <Text style={styles.fullName}>{user?.fullName || 'Unknown User'}</Text>
          <Text style={styles.userName}>@{user?.userName || 'unknown'}</Text>
        </View>

        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Icon name="times" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Likes</Text>

      <View style={styles.headerSpacer} />
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading likes...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={48} color={colors.error} />
          <Text style={styles.errorText}>Failed to load likes</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => dispatch(getPostLikes(postId))}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!likes || likes.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="heart-o" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>No likes yet</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={likes}
        keyExtractor={(item) => item._id}
        renderItem={renderLikeItem}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderContent()}
      </SafeAreaView>
    </Modal>
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
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSpacer: {
    width: 32, // Same as close button to center title
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.s,
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.s,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userName: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: spacing.s,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginTop: spacing.s,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
    marginTop: spacing.m,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: spacing.s,
  },
});

export default LikesModal;