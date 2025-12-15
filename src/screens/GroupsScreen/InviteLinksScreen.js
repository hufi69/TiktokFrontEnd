import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { fetchInviteLinks, createInviteLink, deactivateInviteLink } from '../../store/slices/groupsSlice';
import { CONFIG } from '../../config';

const InviteLinksScreen = ({ group, onBack }) => {
  const dispatch = useAppDispatch();
  const { inviteLinks, isLoading } = useAppSelector(state => state.groups);
  const groupId = group?._id || group?.id;
  const links = groupId ? (inviteLinks[groupId] || []) : [];
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchInviteLinks(groupId));
    }
  }, [groupId, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (groupId) {
      await dispatch(fetchInviteLinks(groupId));
    }
    setRefreshing(false);
  }, [groupId, dispatch]);

  const handleCreateLink = useCallback(async () => {
    Alert.prompt(
      'Create Invite Link',
      'Set expiration date (optional) and max uses (optional)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (expiresAt, maxUses) => {
            setCreating(true);
            try {
              const linkData = {};
              if (expiresAt) {
                linkData.expiresAt = new Date(expiresAt).toISOString();
              }
              if (maxUses) {
                linkData.maxUses = parseInt(maxUses, 10);
              }
              await dispatch(createInviteLink({ groupId, linkData })).unwrap();
              Alert.alert('Success', 'Invite link created');
            } catch (error) {
              Alert.alert('Error', error || 'Failed to create invite link');
            } finally {
              setCreating(false);
            }
          },
        },
      ],
      'plain-text'
    );
  }, [groupId, dispatch]);

  const handleShare = useCallback(async (link) => {
    const inviteUrl = `${CONFIG.API_BASE_URL}/groups/invite/${link.token}`;
    try {
      await Share.share({
        message: `Join ${group?.name} on TokTok! ${inviteUrl}`,
        url: inviteUrl,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [group]);

  const handleCopy = useCallback((link) => {
    const inviteUrl = `${CONFIG.API_BASE_URL}/groups/invite/${link.token}`;
    // TODO: Use Clipboard API
    Alert.alert('Copied', 'Invite link copied to clipboard');
  }, []);

  const handleDeactivate = useCallback((link) => {
    Alert.alert(
      'Deactivate Link',
      'Are you sure you want to deactivate this invite link?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deactivateInviteLink(link._id || link.id)).unwrap();
              Alert.alert('Success', 'Invite link deactivated');
            } catch (error) {
              Alert.alert('Error', error || 'Failed to deactivate link');
            }
          },
        },
      ]
    );
  }, [dispatch]);

  const renderLink = useCallback(({ item }) => {
    const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
    const isMaxUsesReached = item.maxUses && item.uses >= item.maxUses;
    const isActive = item.isActive && !isExpired && !isMaxUsesReached;

    return (
      <View style={[styles.linkItem, !isActive && styles.linkItemInactive]}>
        <View style={styles.linkHeader}>
          <View style={styles.linkInfo}>
            <Text style={styles.linkToken} numberOfLines={1}>
              {item.token.substring(0, 20)}...
            </Text>
            <View style={styles.linkMeta}>
              <Text style={styles.linkMetaText}>
                Uses: {item.uses || 0}{item.maxUses ? ` / ${item.maxUses}` : ''}
              </Text>
              {item.expiresAt && (
                <Text style={styles.linkMetaText}>
                  Expires: {new Date(item.expiresAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.linkStatus}>
            {!isActive && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {isExpired ? 'Expired' : isMaxUsesReached ? 'Max Uses' : 'Inactive'}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.linkActions}>
          {isActive && (
            <>
              <TouchableOpacity
                style={styles.linkActionButton}
                onPress={() => handleShare(item)}
              >
                <Icon name="share" size={16} color={colors.pink} />
                <Text style={styles.linkActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.linkActionButton}
                onPress={() => handleCopy(item)}
              >
                <Icon name="copy" size={16} color={colors.text} />
                <Text style={styles.linkActionText}>Copy</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={[styles.linkActionButton, styles.deactivateButton]}
            onPress={() => handleDeactivate(item)}
          >
            <Icon name="times" size={16} color={colors.error} />
            <Text style={[styles.linkActionText, styles.deactivateText]}>Deactivate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleShare, handleCopy, handleDeactivate]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Invite Links</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateLink}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color={colors.pink} />
          ) : (
            <Icon name="plus" size={20} color={colors.pink} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group?.name || 'Group'}</Text>
        <Text style={styles.count}>{links.length} invite link{links.length !== 1 ? 's' : ''}</Text>
      </View>

      {isLoading && links.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <FlatList
          data={links}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderLink}
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
              <Icon name="link" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No invite links</Text>
              <Text style={styles.emptySubtext}>Create an invite link to share with others</Text>
              <TouchableOpacity
                style={styles.createLinkButton}
                onPress={handleCreateLink}
                disabled={creating}
              >
                <Icon name="plus" size={18} color="#fff" />
                <Text style={styles.createLinkButtonText}>Create Invite Link</Text>
              </TouchableOpacity>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  createButton: {
    padding: spacing.xs,
  },
  groupInfo: {
    padding: spacing.m,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: 14,
    color: colors.textLight,
  },
  listContent: {
    padding: spacing.m,
  },
  linkItem: {
    backgroundColor: colors.bg,
    borderRadius: radius.m,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  linkItemInactive: {
    opacity: 0.6,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  linkInfo: {
    flex: 1,
  },
  linkToken: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
  linkMeta: {
    gap: spacing.xs,
  },
  linkMetaText: {
    fontSize: 12,
    color: colors.textLight,
  },
  linkStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  linkActions: {
    flexDirection: 'row',
    gap: spacing.s,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: spacing.m,
  },
  linkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  deactivateButton: {
    backgroundColor: 'transparent',
  },
  linkActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  deactivateText: {
    color: colors.error,
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
    marginBottom: spacing.l,
    textAlign: 'center',
  },
  createLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pink,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: radius.m,
    gap: spacing.s,
  },
  createLinkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InviteLinksScreen;
