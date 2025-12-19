import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';
import { GroupItem } from './components';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { fetchUserGroups, fetchGroups, searchGroups, joinGroup } from '../../store/slices/groupsSlice';

const GroupsScreen = ({ onBack, onCreateGroup, onGroupPress }) => {
  const dispatch = useAppDispatch();
  const { userGroups, groups, groupMembers, isLoading } = useAppSelector(state => state.groups);
  const [activeTab, setActiveTab] = useState('myGroups'); // 'myGroups' | 'discover'
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [joinedGroups, setJoinedGroups] = useState(new Set()); 

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setIsSearching(false);
      loadGroups();
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      loadGroups();
    }
  }, [activeTab]);

  const loadGroups = useCallback(async () => {
    if (activeTab === 'myGroups') {
      await dispatch(fetchUserGroups());
    } else {
      await dispatch(fetchGroups());
    }
  }, [activeTab, dispatch]);

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const results = await dispatch(searchGroups({ 
        query, 
        params: { 
          isMyGroups: activeTab === 'myGroups',
          privacy: activeTab === 'myGroups' ? undefined : 'public' 
        } 
      })).unwrap();
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [activeTab, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  }, [loadGroups]);

  const handleJoinGroup = useCallback(async (group) => {
    const groupId = group._id || group.id;
    if (!groupId) return;

    setJoiningGroupId(groupId);
    try {
      await dispatch(joinGroup(groupId)).unwrap();
      // Mark as joined
      setJoinedGroups(prev => new Set([...prev, groupId]));
      // Refresh groups to update member count
      await dispatch(fetchGroups());
      Alert.alert('Success', 'Successfully joined the group!');
    } catch (error) {
      // Handle "Already a member" error
      if (error && error.toLowerCase().includes('already a member')) {
        // Mark as joined even if already a member
        setJoinedGroups(prev => new Set([...prev, groupId]));
        Alert.alert('Info', 'You are already a member of this group');
      } else {
        Alert.alert('Error', error || 'Failed to join group');
      }
    } finally {
      setJoiningGroupId(null);
    }
  }, [dispatch]);

  const renderGroupItem = useCallback(({ item }) => {
    const groupId = item._id || item.id;
    const isJoined = joinedGroups.has(groupId);
    const isJoining = joiningGroupId === groupId;
    const showJoinButton = activeTab === 'discover' && !isJoined;
    const actualMemberCount = groupMembers[groupId]?.length || item.memberCount || 0;

    return (
      <GroupItem
        group={{ ...item, memberCount: actualMemberCount }}
        onPress={() => onGroupPress?.(item)}
        isJoined={isJoined}
        onJoin={showJoinButton ? handleJoinGroup : undefined}
        joining={isJoining}
      />
    );
  }, [onGroupPress, activeTab, joinedGroups, joiningGroupId, handleJoinGroup, groupMembers]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="users" size={64} color={colors.textLight} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'myGroups' ? 'No Groups Yet' : 'No Groups Found'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'myGroups' 
          ? 'Join or create a group to get started'
          : 'Try adjusting your search'}
      </Text>
      {activeTab === 'myGroups' && (
        <TouchableOpacity 
          style={styles.createButton}
          onPress={onCreateGroup}
        >
          <Icon name="plus" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const currentData = searchQuery.trim() ? searchResults : (activeTab === 'myGroups' ? userGroups : groups);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Groups</Text>
        <TouchableOpacity 
          style={styles.createIconButton}
          onPress={onCreateGroup}
        >
          <Icon name="plus" size={24} color={colors.pink} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="times-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      {!searchQuery.trim() && (
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'myGroups' && styles.activeTab]}
            onPress={() => setActiveTab('myGroups')}
          >
            <Text style={[styles.tabText, activeTab === 'myGroups' && styles.activeTabText]}>
              My Groups
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
              Discover
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Groups List */}
      {(isLoading || isSearching) && currentData.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderGroupItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.pink]}
            />
          }
          ListEmptyComponent={renderEmptyState}
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginLeft: spacing.s,
  },
  createIconButton: {
    padding: spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    gap: spacing.s,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.s,
    alignItems: 'center',
    borderRadius: radius.m,
  },
  activeTab: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeTabText: {
    color: colors.pink,
  },
  listContent: {
    padding: spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.l,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    marginHorizontal: spacing.m,
    marginVertical: spacing.s,
    gap: spacing.s,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pink,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: radius.xl,
    gap: spacing.s,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupsScreen;
