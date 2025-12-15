import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';
import { GroupMemberItem } from './components';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { fetchGroupMembers, updateMemberRole, removeMember } from '../../store/slices/groupsSlice';

const GroupMembersScreen = ({ 
  group, 
  members: initialMembers, 
  onBack, 
  onMemberPress, 
  onRoleChange,
  userRole 
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const groupId = group?._id || group?.id;
  const { groupMembers, isLoading } = useAppSelector(state => state.groups);
  const members = groupId ? (groupMembers[groupId] || initialMembers || []) : (initialMembers || []);
  //members details
  const currentUserMember = members.find(m => {
    const memberUserId = m.user?._id || m.user?.id || m.user;
    const currentUserId = user?._id || user?.id;
    return memberUserId && currentUserId && memberUserId.toString() === currentUserId.toString();
  });
  const effectiveUserRole = currentUserMember?.role || userRole || 'member';
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'admin' | 'moderator' | 'member'
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberMenu, setShowMemberMenu] = useState(false);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupMembers({ groupId }));
    }
  }, [groupId, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (groupId) {
      await dispatch(fetchGroupMembers({ groupId }));
    }
    setRefreshing(false);
  }, [groupId, dispatch]);

  const handleRoleChange = useCallback((member) => {
    if (effectiveUserRole !== 'admin') return;
    setSelectedMember(member);
    setShowMemberMenu(true);
  }, [effectiveUserRole]);

  const handleUpdateMember = useCallback(async (role, status) => {
    if (!selectedMember || !groupId) return;
    
    const userId = selectedMember.user?._id || selectedMember.user?.id || selectedMember.user;
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setShowMemberMenu(false);
    
    try {
      const updates = {};
      if (role !== undefined && role !== null) {
        updates.role = role;
      }
      if (status !== undefined && status !== null) {
        updates.status = status;
      }

      await dispatch(updateMemberRole({ groupId, userId, updates })).unwrap();
      Alert.alert('Success', 'Member updated successfully');
      
      // Refresh members list
      await dispatch(fetchGroupMembers({ groupId }));
      
      if (onRoleChange) {
        onRoleChange(selectedMember, role, status);
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update member');
    } finally {
      setSelectedMember(null);
    }
  }, [selectedMember, groupId, dispatch, onRoleChange]);

  const handleRemoveMember = useCallback(async () => {
    if (!selectedMember || !groupId) return;
    
    const userId = selectedMember.user?._id || selectedMember.user?.id || selectedMember.user;
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setShowMemberMenu(false);
    try {
      await dispatch(removeMember({ groupId, userId })).unwrap();
      Alert.alert('Success', 'Member removed successfully');
      await dispatch(fetchGroupMembers({ groupId }));
      
      if (onRoleChange) {
        onRoleChange(selectedMember, null, 'banned');
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to remove member');
    } finally {
      setSelectedMember(null);
    }
  }, [selectedMember, groupId, dispatch, onRoleChange]);

  const filteredMembers = members.filter(member => {
    if (filter === 'all') return true;
    return member.role === filter;
  });

  const renderMember = useCallback(({ item }) => (
    <GroupMemberItem
      member={item}
      onPress={() => onMemberPress?.(item)}
      currentUserRole={effectiveUserRole}
      onRoleChange={handleRoleChange}
    />
  ), [onMemberPress, effectiveUserRole, handleRoleChange]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Members</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Group Info */}
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group?.name || 'Group'}</Text>
        <Text style={styles.memberCount}>{members.length} members</Text>
      </View>

      {/* Filters */}
      {effectiveUserRole === 'admin' && (
        <View style={styles.filters}>
          {['all', 'admin', 'moderator', 'member'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.filter, filter === role && styles.activeFilter]}
              onPress={() => setFilter(role)}
            >
              <Text style={[styles.filterText, filter === role && styles.activeFilterText]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Members List */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item._id || item.user?._id || item.id}
        renderItem={renderMember}
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
            <Icon name="users" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Member Menu Modal */}
      <Modal
        visible={showMemberMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowMemberMenu(false);
          setSelectedMember(null);
        }}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowMemberMenu(false);
            setSelectedMember(null);
          }}
        >
          <View style={styles.menuContainer} onStartShouldSetResponder={() => true}>
            <Text style={styles.menuTitle}>
              {selectedMember?.user?.fullName || selectedMember?.user?.userName || 'Member'}
            </Text>
            
            {/* Role Options */}
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Change Role</Text>
              {[
                { value: 'admin', label: 'Admin', emoji: '👑' },
                { value: 'moderator', label: 'Moderator', emoji: '🛡️' },
                { value: 'member', label: 'Member', emoji: '👤' }
              ].map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.menuItem,
                    selectedMember?.role === role.value && styles.menuItemActive
                  ]}
                  onPress={() => handleUpdateMember(role.value, selectedMember?.status)}
                >
                  <Text style={[
                    styles.menuItemText,
                    selectedMember?.role === role.value && styles.menuItemTextActive
                  ]}>
                    {role.emoji} {role.label}
                    {selectedMember?.role === role.value && ' (Current)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Options */}
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Change Status</Text>
              {[
                { value: 'active', label: 'Active', emoji: '✅' },
                { value: 'pending', label: 'Pending', emoji: '⏳' },
                { value: 'banned', label: 'Banned', emoji: '🚫' }
              ].map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.menuItem,
                    selectedMember?.status === status.value && styles.menuItemActive
                  ]}
                  onPress={() => handleUpdateMember(selectedMember?.role, status.value)}
                >
                  <Text style={[
                    styles.menuItemText,
                    selectedMember?.status === status.value && styles.menuItemTextActive
                  ]}>
                    {status.emoji} {status.label}
                    {selectedMember?.status === status.value && ' (Current)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Remove Member */}
            <TouchableOpacity
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={() => {
                setShowMemberMenu(false);
                Alert.alert(
                  'Remove Member',
                  `Are you sure you want to remove ${selectedMember?.user?.fullName || selectedMember?.user?.userName} from this group?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Remove', 
                      style: 'destructive',
                      onPress: () => handleRemoveMember()
                    },
                  ]
                );
              }}
            >
              <Text style={styles.deleteMenuItemText}>Remove from Group</Text>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginLeft: spacing.s,
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
  memberCount: {
    fontSize: 14,
    color: colors.textLight,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    gap: spacing.s,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  filter: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
  },
  activeFilter: {
    backgroundColor: colors.pink,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: spacing.l,
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: spacing.m,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: colors.bg,
    borderRadius: radius.m,
    width: '80%',
    maxWidth: 400,
    padding: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: spacing.m,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.s,
  },
  menuItem: {
    padding: spacing.m,
    borderRadius: radius.s,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  menuItemActive: {
    backgroundColor: colors.pink + '20',
    borderWidth: 1,
    borderColor: colors.pink,
  },
  menuItemText: {
    fontSize: 14,
    color: colors.text,
  },
  menuItemTextActive: {
    color: colors.pink,
    fontWeight: '600',
  },
  deleteMenuItem: {
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: spacing.m,
  },
  deleteMenuItemText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
});

export default GroupMembersScreen;
