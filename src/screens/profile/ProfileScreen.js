import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../constants/theme';
import { API_CONFIG } from '../../config/api';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import {
  fetchUserProfile,
  fetchUserFollowers,
  fetchUserFollowing,
  fetchUserPosts,
  getFollowersCount,
  getFollowingCount,
  followUser,
  unfollowUser
} from '../../store/slices/userSlice';
import BackButton from '../../components/common/BackButton';

// Default avatar
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';


const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  return /^https?:\/\//.test(profilePicture)
    ? profilePicture
    : `${API_CONFIG.BASE_URL}/public/img/users/${profilePicture}`;
};

const ProfileHeader = ({ user, onEditProfile, onSettings, isOwnProfile, onFollowToggle, onFollowSomeone }) => {
  const dispatch = useAppDispatch();
  const { followersCount, followingCount, postsCount, isLoading } = useAppSelector(state => state.user);

  useEffect(() => {
    if (user?._id) {
      dispatch(getFollowersCount(user._id));
      dispatch(getFollowingCount(user._id));
      dispatch(fetchUserPosts(user._id));
    }
  }, [user?._id, dispatch]);

  return (
    <View style={styles.header}>
      <View style={styles.profileInfo}>
        <Image
          source={{ uri: getAvatarUrl(user?.profilePicture) }}
          style={styles.profileImage}
        />
        <View style={styles.profileDetails}>
          <Text style={styles.username}>{user?.userName || user?.fullName || 'Unknown User'}</Text>
          <Text style={styles.fullName}>{user?.fullName}</Text>
          <Text style={styles.occupation}>{user?.occupation || 'No occupation'}</Text>
          <Text style={styles.location}>{user?.country || 'No location'}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{postsCount || 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{followersCount || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{followingCount || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {isOwnProfile ? (
          <>
            <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={onSettings}>
              <Icon name="cog" size={20} color={colors.text} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.followButton} onPress={onFollowToggle}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Follow Someone Button  */}
      {isOwnProfile && (
        <View style={styles.followSomeoneContainer}>
          <TouchableOpacity style={styles.followSomeoneButton} onPress={onFollowSomeone}>
            <Icon name="user-plus" size={16} color={'#fff'} />
            <Text style={styles.followSomeoneText}>Follow Someone</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const FollowButton = ({ userId, isFollowing, onToggleFollow, loading }) => {
  const dispatch = useAppDispatch();

  const handleToggleFollow = async () => {
    try {
      if (isFollowing) {
        await dispatch(unfollowUser(userId)).unwrap();
      } else {
        await dispatch(followUser(userId)).unwrap();
      }
      onToggleFollow && onToggleFollow();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update follow status');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.followButton,
        isFollowing && styles.followingButton,
        loading && styles.disabledButton
      ]}
      onPress={handleToggleFollow}
      disabled={loading}
    >
      <Text style={[
        styles.followButtonText,
        isFollowing && styles.followingButtonText
      ]}>
        {loading ? '...' : (isFollowing ? 'Following' : 'Follow')}
      </Text>
    </TouchableOpacity>
  );
};

const UserListItem = ({ user, onPress, showFollowButton = false }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    //implement later 
  }, [user]);

  return (
    <TouchableOpacity style={styles.userListItem} onPress={() => onPress(user)}>
      <Image
        source={{ uri: getAvatarUrl(user?.profilePicture) }}
        style={styles.userListItemImage}
      />
      <View style={styles.userListItemInfo}>
        <Text style={styles.userListItemName}>{user?.fullName || user?.userName}</Text>
        <Text style={styles.userListItemOccupation}>{user?.occupation || 'No occupation'}</Text>
      </View>
      {showFollowButton && (
        <FollowButton
          userId={user._id}
          isFollowing={isFollowing}
          onToggleFollow={() => setIsFollowing(!isFollowing)}
          loading={loading}
        />
      )}
    </TouchableOpacity>
  );
};

const PostGrid = ({ posts, onPostPress, refreshing, onRefresh, onCreatePost, isOwnProfile }) => {
  const renderPostItem = ({ item }) => {
    const images = (item.media || [])
      .filter(m => m.type === 'image' && m.url)
      .map(m => `${API_CONFIG.BASE_URL}${m.url}`);

    return (
      <TouchableOpacity 
        style={styles.postGridItem} 
        onPress={() => onPostPress(item)}
      >
        <Image
          source={{ 
            uri: images.length > 0 
              ? images[0] 
              : 'https://via.placeholder.com/120x120?text=No+Image'
          }}
          style={styles.postGridImage}
        />
        {images.length > 1 && (
          <View style={styles.multipleImagesIndicator}>
            <Icon name="clone" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      renderItem={renderPostItem}
      numColumns={3}
      columnWrapperStyle={styles.postGridRow}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={() => (
        <View style={styles.emptyPostsContainer}>
          <Icon name="camera" size={48} color={colors.muted} />
          <Text style={styles.emptyPostsTitle}>
            {isOwnProfile ? 'Create your first post' : 'No posts yet'}
          </Text>
          <Text style={styles.emptyPostsSubtitle}>
            {isOwnProfile ? 'Give this space some love.' : 'This user hasn\'t posted anything yet.'}
          </Text>
          {isOwnProfile && onCreatePost && (
            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={onCreatePost}
            >
              <Text style={styles.createPostButtonText}>Create</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
};

const ProfileScreen = ({ navigation, route, onBack, onEditProfile, onSettings, onFollowSomeone, onCreatePost, refreshTrigger }) => {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector(state => state.auth);
  const { 
    viewedUser, 
    followers, 
    following, 
    userPosts,
    isLoading, 
    error 
  } = useAppSelector(state => state.user);
  
  const [activeTab, setActiveTab] = useState('posts'); // posts, followers, following
  const [refreshing, setRefreshing] = useState(false);

  const userId = route?.params?.userId || currentUser?._id;
  const isOwnProfile = !route?.params?.userId || (userId === currentUser?._id);

  
  useEffect(() => {
    console.log(' Profile:', {
      routeUserId: route?.params?.userId,
      currentUserId: currentUser?._id,
      finalUserId: userId,
      isOwnProfile,
      currentUserEmail: currentUser?.email,
      viewedUserEmail: viewedUser?.email
    });
  }, [route?.params?.userId, currentUser?._id, userId, isOwnProfile, currentUser?.email, viewedUser?.email]);

  useEffect(() => {
    if (userId) {
      console.log(' Fetching user profile for:', userId);
      dispatch(fetchUserProfile(userId));
    }
  }, [userId, dispatch]);

  useEffect(() => {
    const refreshProfile = () => {
      if (userId) {
        console.log(' Refreshing profile data');
        dispatch(fetchUserProfile(userId));
      }
    };

   
    refreshProfile();
  }, [userId, dispatch]);

  useEffect(() => {
    if (userId) {
      console.log(' Profile screen mounted/focused, refreshing data');
      dispatch(fetchUserProfile(userId));
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (userId && refreshTrigger > 0) {
      console.log(' Profile refresh triggered, refreshing data');
      dispatch(fetchUserProfile(userId));
    }
  }, [refreshTrigger, userId, dispatch]);

  // Debug logging
  useEffect(() => {
    console.log(' ProfileScreen Debug:', {
      userId,
      currentUser: currentUser?._id,
      viewedUser: viewedUser?._id,
      isLoading,
      error,
      isOwnProfile,
      hasNavigation: !!navigation,
      hasOnBack: !!onBack,
      hasOnFollowSomeone: !!onFollowSomeone
    });
  }, [userId, currentUser?._id, viewedUser?._id, isLoading, error, isOwnProfile, navigation, onBack, onFollowSomeone]);

  // If no userId is available, show loading
  if (!userId) {
    console.log(' No userId available');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading only if we're actually loading and don't have user data yet
  if (isLoading && !viewedUser && !currentUser) {
    console.log(' Showing loading screen');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    if (userId) {
      console.log(' Fetching user profile for:', userId);
      dispatch(fetchUserProfile(userId));
    }
  }, [userId, dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (userId) {
        await dispatch(fetchUserProfile(userId)).unwrap();
        if (activeTab === 'posts') {
          await dispatch(fetchUserPosts(userId)).unwrap();
        } else if (activeTab === 'followers') {
          await dispatch(fetchUserFollowers(userId)).unwrap();
        } else if (activeTab === 'following') {
          await dispatch(fetchUserFollowing(userId)).unwrap();
        }
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabPress = async (tab) => {
    setActiveTab(tab);
    if (userId) {
      if (tab === 'posts') {
        await dispatch(fetchUserPosts(userId));
      } else if (tab === 'followers') {
        await dispatch(fetchUserFollowers(userId));
      } else if (tab === 'following') {
        await dispatch(fetchUserFollowing(userId));
      }
    }
  };

  const handleBack = () => {
    console.log(' Back button pressed');
    if (onBack) {
      onBack();
    } else {
      console.log('No onBack handler available');
    }
  };

  const handleEditProfile = () => {
    console.log(' Edit profile pressed');
    if (onEditProfile) {
      onEditProfile();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('EditProfile', { user: viewedUser });
    } else {
      console.log('No edit profile handler available');
    }
  };

  const handleSettings = () => {
    console.log(' Settings pressed');
    if (onSettings) {
      onSettings();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Settings');
    } else {
      console.log(' No settings handler available');
    }
  };

  const handleUserPress = (user) => {
    console.log(' User pressed:', user._id);
    if (navigation && navigation.push) {
      navigation.push('Profile', { userId: user._id });
    } else {
      console.log(' No navigation available for user press');
    }
  };

  const handlePostPress = (post) => {
    // Navigate to post detail or open post modal
    console.log('Post pressed:', post);
  };

  const handleFollowToggle = async () => {
    if (!userId || isOwnProfile) return;
    
    try {
      const isFollowing = viewedUser?.isFollowing || false;
      if (isFollowing) {
        await dispatch(unfollowUser(userId)).unwrap();
      } else {
        await dispatch(followUser(userId)).unwrap();
      }
      
      await dispatch(fetchUserProfile(userId));
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update follow status');
    }
  };

  const handleFollowSomeone = () => {
    console.log('Follow someone pressed');
    if (onFollowSomeone) {
      onFollowSomeone();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('FollowSomeone');
    } else {
      console.log(' No follow someone handler available');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <PostGrid 
            posts={userPosts} 
            onPostPress={handlePostPress}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onCreatePost={onCreatePost}
            isOwnProfile={isOwnProfile}
          />
        );
      case 'followers':
        return (
          <FlatList
            data={followers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <UserListItem
                user={item}
                onPress={handleUserPress}
                showFollowButton={!isOwnProfile}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No followers yet</Text>
              </View>
            )}
          />
        );
      case 'following':
        return (
          <FlatList
            data={following}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <UserListItem
                user={item}
                onPress={handleUserPress}
                showFollowButton={!isOwnProfile}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Not following anyone yet</Text>
              </View>
            )}
          />
        );
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If no user data is available at all, show a fallback
  if (!viewedUser && !currentUser) {
    console.log(' No user data available');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user data available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerContainer}>
        <BackButton onPress={handleBack} />
        <Text style={styles.headerTitle}>
          {isOwnProfile ? 'My Profile' : 'Profile'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ProfileHeader
        user={viewedUser || currentUser}
        onEditProfile={handleEditProfile}
        onSettings={handleSettings}
        isOwnProfile={isOwnProfile}
        onFollowToggle={handleFollowToggle}
        onFollowSomeone={handleFollowSomeone}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => handleTabPress('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => handleTabPress('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => handleTabPress('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  header: {
    padding: 20,
    backgroundColor: colors.bg,
  },
  profileInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  profileDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  fullName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  occupation: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: colors.muted,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.pink,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.pink,
  },
  tabText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.text,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    minHeight: 400,
  },
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userListItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userListItemInfo: {
    flex: 1,
  },
  userListItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userListItemOccupation: {
    fontSize: 14,
    color: colors.muted,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.pink,
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.pink,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  followingButtonText: {
    color: colors.pink,
  },
  disabledButton: {
    opacity: 0.6,
  },
  postsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoonText: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.muted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.pink,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Post Grid Styles
  postGridRow: {
    justifyContent: 'space-between',
  },
  postGridItem: {
    width: '32%',
    aspectRatio: 1,
    marginBottom: 2,
    position: 'relative',
  },
  postGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyPostsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPostsSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  createPostButton: {
    backgroundColor: colors.pink,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followSomeoneContainer: {
    marginTop: 15,
  },
  followSomeoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink,
    borderWidth: 0,
    borderColor: colors.pink,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  followSomeoneText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen;
