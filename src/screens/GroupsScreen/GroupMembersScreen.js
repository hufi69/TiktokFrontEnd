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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';
import { GroupMemberItem } from './components';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { fetchGroupMembers } from '../../store/slices/groupsSlice';

const GroupMembersScreen = ({ 
  group, 
  members: initialMembers, 
  onBack, 
  onMemberPress, 
  onRoleChange,
  userRole 
}) => {
  const dispatch = useAppDispatch();
  const groupId = group?._id || group?.id;
  const { groupMembers, isLoading } = useAppSelector(state => state.groups);
  const members = groupId ? (groupMembers[groupId] || initialMembers || []) : (initialMembers || []);
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'admin' | 'moderator' | 'member'

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
    if (!onRoleChange) return;
    
    const options = [];
    if (userRole === 'admin') {
      if (member.role !== 'admin') {
        options.push({ text: 'Make Admin', onPress: () => onRoleChange(member, 'admin') });
      }
      if (member.role !== 'moderator') {
        options.push({ text: 'Make Moderator', onPress: () => onRoleChange(member, 'moderator') });
      }
      if (member.role !== 'member') {
        options.push({ text: 'Make Member', onPress: () => onRoleChange(member, 'member') });
      }
      options.push({ 
        text: 'Remove from Group', 
        style: 'destructive', 
        onPress: () => {
          Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${member.user?.fullName || member.user?.userName}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Remove', 
                style: 'destructive',
                onPress: () => onRoleChange(member, null, 'banned')
              },
            ]
          );
        }
      });
    }
    
    if (options.length > 0) {
      Alert.alert('Member Options', '', options.concat([{ text: 'Cancel', style: 'cancel' }]));
    }
  }, [userRole, onRoleChange]);

  const filteredMembers = members.filter(member => {
    if (filter === 'all') return true;
    return member.role === filter;
  });

  const renderMember = useCallback(({ item }) => (
    <GroupMemberItem
      member={item}
      onPress={() => onMemberPress?.(item)}
      currentUserRole={userRole}
      onRoleChange={handleRoleChange}
    />
  ), [onMemberPress, userRole, handleRoleChange]);

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
      {userRole === 'admin' && (
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
});

export default GroupMembersScreen;
