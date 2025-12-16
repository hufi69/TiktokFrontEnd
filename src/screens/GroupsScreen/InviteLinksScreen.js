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
  Modal,
  TextInput,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    expiresAt: '',
    maxUses: '',
    autoApprove: false,
    role: 'member',
  });

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
    setCreating(true);
    try {
      const linkData = {};
      
     
      if (formData.expiresAt.trim()) {
        const date = new Date(formData.expiresAt);
        if (!isNaN(date.getTime())) {
          linkData.expiresAt = date.toISOString();
        } else {
          Alert.alert('Error', 'Invalid date format. Please use YYYY-MM-DD ');
          setCreating(false);
          return;
        }
      }
      
     
      if (formData.maxUses.trim()) {
        const maxUses = parseInt(formData.maxUses, 10);
        if (!isNaN(maxUses) && maxUses > 0) {
          linkData.maxUses = maxUses;
        } else {
          Alert.alert('Error', 'Max uses must be a positive number');
          setCreating(false);
          return;
        }
      }
      
    
      linkData.autoApprove = formData.autoApprove;
      linkData.role = formData.role;
      
      await dispatch(createInviteLink({ groupId, linkData })).unwrap();
      Alert.alert('Success', 'Invite link created successfully');
      setShowCreateModal(false);
      // Reset form
      setFormData({
        expiresAt: '',
        maxUses: '',
        autoApprove: false,
        role: '',
      });
    } catch (error) {
      Alert.alert('Error', error || 'Failed to create invite link');
    } finally {
      setCreating(false);
    }
  }, [groupId, dispatch, formData]);

  const handleShare = useCallback(async (link) => {
    const inviteUrl = `${CONFIG.API_BASE_URL.replace(/\/$/, '')}/api/v1/invite/${link.token}`;
    try {
      await Share.share({
        message: `Join ${group?.name} on TokTok! ${inviteUrl}`,
        url: inviteUrl,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [group]);

  const handleCopy = useCallback(async (link) => {
    const inviteUrl = `${CONFIG.API_BASE_URL.replace(/\/$/, '')}/api/v1/invite/${link.token}`;
    try {
     
      await Share.share({
        message: inviteUrl,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  }, []);

  const handleDelete = useCallback((link) => {
    Alert.alert(
      'Delete Invite Link',
      'Are you sure you want to delete this invite link?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deactivateInviteLink(link._id || link.id)).unwrap();
              Alert.alert('Success', 'Invite link deleted');
            } catch (error) {
              Alert.alert('Error', error );
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
    const inviteUrl = `${CONFIG.API_BASE_URL.replace(/\/$/, '')}/api/v1/invite/${item.token}`;
    const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';

    return (
      <View style={[styles.linkItem, !isActive && styles.linkItemInactive]}>
        <View style={styles.linkHeader}>
          <View style={styles.linkInfo}>
            <View style={styles.linkTitleRow}>
              <Icon name="link" size={16} color={colors.pink} />
              <Text style={styles.linkTitle}>Invite Link</Text>
              {createdDate && (
                <Text style={styles.linkDate}>Created on {createdDate}</Text>
              )}
            </View>
            <View style={styles.linkMeta}>
              <Text style={styles.linkMetaText}>
                Uses: {item.uses || 0}{item.maxUses ? ` / ${item.maxUses}` : ' / ∞'}
              </Text>
              {item.expiresAt && (
                <Text style={styles.linkMetaText}>
                  Expires on {new Date(item.expiresAt).toLocaleString()}
                </Text>
              )}
              {item.settings && (
                <>
                  <Text style={styles.linkMetaText}>
                    Auto Approve: {item.settings.autoApprove ? 'Yes' : 'No'}
                  </Text>
                  <Text style={styles.linkMetaText}>
                    Role: {item.settings.role || 'member'}
                  </Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.linkStatus}>
            {isActive ? (
              <View style={[styles.statusBadge, styles.statusBadgeActive]}>
                <Text style={[styles.statusText, styles.statusTextActive]}>Active</Text>
              </View>
            ) : (
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
            style={[styles.linkActionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Icon name="trash" size={16} color={colors.error} />
            <Text style={[styles.linkActionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleShare, handleCopy, handleDelete]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Invite Links</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
          disabled={creating}
        >
          <Icon name="plus" size={20} color={colors.pink} />
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
                onPress={() => setShowCreateModal(true)}
              >
                <Icon name="plus" size={18} color="#fff" />
                <Text style={styles.createLinkButtonText}>Create Invite Link</Text>
              </TouchableOpacity>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Invite Link Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Invite Link</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Expiration Date */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Expiration Date (Optional)</Text>
                <Text style={styles.labelHint}>Format: YYYY-MM-DD </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2024-12-31"
                  value={formData.expiresAt}
                  onChangeText={(text) => setFormData({ ...formData, expiresAt: text })}
                  placeholderTextColor={colors.textLight}
                />
              </View>

              {/* Max Uses */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Max Uses (Optional)</Text>
                <Text style={styles.labelHint}>Leave empty for unlimited uses</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 10"
                  value={formData.maxUses}
                  onChangeText={(text) => setFormData({ ...formData, maxUses: text })}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              {/* Auto Approve */}
              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <View style={styles.switchLabelContainer}>
                    <Text style={styles.label}>Auto Approve</Text>
                    <Text style={styles.labelHint}>Automatically approve join requests</Text>
                  </View>
                  <Switch
                    value={formData.autoApprove}
                    onValueChange={(value) => setFormData({ ...formData, autoApprove: value })}
                    trackColor={{ false: colors.border, true: colors.pink }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              {/* Role */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Default Role</Text>
                <View style={styles.roleOptions}>
                  {['member', 'moderator'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        formData.role === role && styles.roleOptionActive,
                      ]}
                      onPress={() => setFormData({ ...formData, role })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          formData.role === role && styles.roleOptionTextActive,
                        ]}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate, creating && styles.modalButtonDisabled]}
                onPress={handleCreateLink}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonCreateText}>Create Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  linkTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.s,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  linkDate: {
    fontSize: 10,
    flex: 1,
    color: colors.textLight,
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
  statusBadgeActive: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  statusTextActive: {
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
  deleteButton: {
    backgroundColor: 'transparent',
  },
  linkActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  deleteText: {
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.m,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: spacing.l,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  labelHint: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.s,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: spacing.m,
    fontSize: 16,
    color: colors.text,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: spacing.m,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  roleOption: {
    flex: 1,
    padding: spacing.m,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: colors.pink,
    borderColor: colors.pink,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.s,
    padding: spacing.m,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    padding: spacing.m,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.surface,
  },
  modalButtonCreate: {
    backgroundColor: colors.pink,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtonCreateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
