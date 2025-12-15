import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';
import { GroupPostItem } from './components';
import { CONFIG } from '../../config';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { fetchGroup, fetchGroupPosts, joinGroup, fetchGroupMembers, deleteGroup } from '../../store/slices/groupsSlice';

const DEFAULT_GROUP_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop';

const getGroupImageUrl = (image) => {
  if (!image) return DEFAULT_GROUP_IMAGE;
  if (/^https?:\/\//.test(image)) return image;
  const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
  return `${baseUrl}/public/img/groups/${image}`;
};

const GroupDetailScreen = ({ 
  group: initialGroup, 
  onBack, 
  onCreatePost, 
  onPostPress, 
  onMembersPress,
  onSettingsPress,
  onJoinRequestsPress,
  onInviteLinksPress,
  onCommentPress,
  onGroupDeleted,
  userRole,
  currentUserId 
}) => {
  const dispatch = useAppDispatch();
  const { currentGroup, groupPosts, groupMembers, isLoading } = useAppSelector(state => state.groups);
  const { user } = useAppSelector(state => state.auth);
  const group = currentGroup || initialGroup;
  const groupId = group?._id || group?.id;
  const posts = groupId ? (groupPosts[groupId] || []) : [];
  const members = groupId ? (groupMembers[groupId] || []) : [];
  const actualMemberCount = members.length > 0 ? members.length : (group?.memberCount || 0);
  const [refreshing, setRefreshing] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const currentUserMember = members.find(m => {
    const memberUserId = m.user?._id || m.user?.id || m.user;
    const currentUserId = user?._id || user?.id;
    return memberUserId && currentUserId && memberUserId.toString() === currentUserId.toString();
  });
  const effectiveUserRole = currentUserMember?.role || userRole || 'member';
  const effectiveIsMember = isMember || (currentUserMember?.status === 'active');
  const isAdmin = effectiveUserRole === 'admin';

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
      dispatch(fetchGroupMembers({ groupId }));
      if (effectiveIsMember) {
        dispatch(fetchGroupPosts({ groupId }));
      }
    }
  }, [groupId, dispatch, effectiveIsMember]);
// for the debug 
  useEffect(() => {
    if (groupId) {
      console.log('Group Detail - User Role Detection:', {
        userRole,
        currentUserMember: currentUserMember,
        currentUserMemberRole: currentUserMember?.role,
        effectiveUserRole,
        isAdmin,
        membersCount: members.length,
        currentUserId: user?._id || user?.id,
        members: members.map(m => ({
          userId: m.user?._id || m.user?.id || m.user,
          role: m.role,
        })),
      });
    }
  }, [groupId, userRole, currentUserMember, effectiveUserRole, isAdmin, members.length, user, members]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (groupId) {
      await dispatch(fetchGroup(groupId));
      await dispatch(fetchGroupMembers({ groupId }));
      if (effectiveIsMember) {
        await dispatch(fetchGroupPosts({ groupId }));
      }
    }
    setRefreshing(false);
  }, [groupId, effectiveIsMember, dispatch]);

  const handleJoin = useCallback(async () => {
    if (!groupId) return;
    setJoining(true);
    try {
      await dispatch(joinGroup(groupId)).unwrap();
      setIsMember(true);
      await dispatch(fetchGroupPosts({ groupId }));
    } catch (error) {
      console.error('Join group error:', error);
    } finally {
      setJoining(false);
    }
  }, [groupId, dispatch]);

  const handleDeleteGroup = useCallback(() => {
    if (!groupId) return;
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await dispatch(deleteGroup(groupId)).unwrap();
              Alert.alert('Success', 'Group deleted successfully');
              onGroupDeleted?.();
              onBack();
            } catch (error) {
              Alert.alert('Error', error || 'Failed to delete group');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [groupId, dispatch, onGroupDeleted, onBack]);

  const handlePostUpdated = useCallback(() => {
    if (groupId) {
      // Refresh posts to get updated like counts and status
      dispatch(fetchGroupPosts({ groupId }));
    }
  }, [groupId, dispatch]);

  const renderPost = useCallback(({ item }) => (
    <GroupPostItem
      post={item}
      groupId={groupId}
      onPress={() => onPostPress?.(item)}
      onComment={() => onCommentPress?.({ groupId, postId: item._id || item.id, post: item })}
      userRole={effectiveUserRole}
      currentUserId={currentUserId}
      onPostUpdated={handlePostUpdated}
    />
  ), [groupId, onPostPress, onCommentPress, effectiveUserRole, currentUserId, handlePostUpdated]);

  const renderHeader = () => (
    <View>
      {/* Cover Image */}
      <Image 
        source={{ uri: getGroupImageUrl(group?.coverImage) }}
        style={styles.coverImage}
        resizeMode="cover"
      />
      
      {/* Group Info */}
      <View style={styles.infoContainer}>
        <View style={styles.profileSection}>
          {group?.profileImage && (
            <Image 
              source={{ uri: getGroupImageUrl(group.profileImage) }}
              style={styles.profileImage}
            />
          )}
          <View style={styles.groupInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.groupName}>{group?.name || 'Group'}</Text>
              <Icon 
                name={group?.privacy === 'public' ? 'globe' : group?.privacy === 'private' ? 'lock' : 'eye-slash'} 
                size={16} 
                color={colors.textLight} 
              />
            </View>
            {group?.description && (
              <Text style={styles.description}>{group.description}</Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Icon name="users" size={18} color={colors.pink} />
            <Text style={styles.statValue}>{actualMemberCount}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="file-text" size={18} color={colors.pink} />
            <Text style={styles.statValue}>{group?.postCount || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {!effectiveIsMember ? (
          <TouchableOpacity 
            style={[styles.joinButton, joining && styles.joinButtonDisabled]}
            onPress={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="user-plus" size={18} color="#fff" />
                <Text style={styles.joinButtonText}>Join Group</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onCreatePost}
            >
              <Icon name="plus" size={18} color={colors.pink} />
              <Text style={styles.actionButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  if (!effectiveIsMember) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group</Text>
          <View style={{ width: 30 }} />
        </View>
        {renderHeader()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group?.name || 'Group'}
        </Text>
        {effectiveIsMember && (
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
          >
            <Icon name="cog" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading && posts.length === 0 && effectiveIsMember ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderPost}
          ListHeaderComponent={renderHeader}
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
              <Icon name="file-text-o" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to post in this group</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            {isAdmin && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onSettingsPress?.();
                  }}
                >
                  <Icon name="cog" size={18} color={colors.text} />
                  <Text style={styles.menuItemText}>Group Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, styles.deleteMenuItem]}
                  onPress={() => {
                    setShowMenu(false);
                    handleDeleteGroup();
                  }}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <>
                      <Icon name="trash" size={18} color={colors.error} />
                      <Text style={[styles.menuItemText, styles.deleteMenuItemText]}>Delete Group</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
            {(effectiveUserRole === 'admin' || effectiveUserRole === 'moderator') && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onJoinRequestsPress?.();
                  }}
                >
                  <Icon name="user-plus" size={18} color={colors.text} />
                  <Text style={styles.menuItemText}>Join Requests</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onInviteLinksPress?.();
                  }}
                >
                  <Icon name="link" size={18} color={colors.text} />
                  <Text style={styles.menuItemText}>Invite Links</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onMembersPress?.();
              }}
            >
              <Icon name="users" size={18} color={colors.text} />
              <Text style={styles.menuItemText}>View Members</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginLeft: spacing.s,
  },
  menuButton: {
    padding: spacing.xs,
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface,
  },
  infoContainer: {
    padding: spacing.m,
    backgroundColor: colors.bg,
  },
  profileSection: {
    flexDirection: 'row',
    marginBottom: spacing.m,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: radius.m,
    marginRight: spacing.m,
    backgroundColor: colors.surface,
  },
  groupInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.m,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
    marginBottom: spacing.m,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink,
    paddingVertical: spacing.m,
    borderRadius: radius.m,
    gap: spacing.s,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.m,
    borderRadius: radius.m,
    gap: spacing.xs,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.l,
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
  menuButton: {
    padding: spacing.xs,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: spacing.m,
  },
  menuContainer: {
    backgroundColor: colors.bg,
    borderRadius: radius.m,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    gap: spacing.s,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  deleteMenuItem: {
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.m,
  },
  deleteMenuItemText: {
    color: colors.error,
  },
});

export default GroupDetailScreen;
