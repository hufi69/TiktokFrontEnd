import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  TextInput,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import BackButton from '../../components/common/BackButton';
import { colors } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { fetchAllUsers, followUser, unfollowUser } from '../../store/slices/userSlice';
import { CONFIG } from '../../config';

// Default avatar for users without profile picture
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';

// Helper function to get full profile picture URL
const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  // If it's already a full URL (starts with http), use it directly
  if (/^https?:\/\//.test(profilePicture)) {
    return profilePicture;
  }
  // Otherwise, construct the full URL with base URL
  return `${CONFIG.API_BASE_URL}/public/uploads/users/${profilePicture}`;
};

const UserItem = ({ user, onToggleFollow, loading, onUserPress }) => {
  // Determine if this specific user is being processed
  const isProcessing = Boolean(loading && user._id);
  const isMutual = user.isMutual || (user.isFollowing && user.followsMe);
  
  return (
  <View style={styles.userItem}>
    <TouchableOpacity 
      style={styles.userInfo} 
      onPress={() => onUserPress(user)}
      activeOpacity={0.7}
    >
      <Image 
          source={{ uri: getAvatarUrl(user.profilePicture) }} 
        style={styles.avatar} 
      />
      <View style={styles.userDetails}>
          <View style={styles.userNameRow}>
        <Text style={styles.userName}>{user.fullName || user.userName || 'Unknown User'}</Text>
            {isMutual && (
              <Text style={styles.mutualText}>mutual</Text>
            )}
          </View>
        <Text style={styles.userOccupation}>{user.occupation || 'No occupation'}</Text>
      </View>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[
        styles.followButton,
        user.isFollowing && styles.followingButton,
          isProcessing && styles.disabledButton
      ]}
      onPress={() => onToggleFollow(user._id)}
        disabled={isProcessing}
        activeOpacity={0.7}
    >
      <Text style={[
        styles.followButtonText,
        user.isFollowing && styles.followingButtonText
      ]}>
          {isProcessing ? '...' : (user.isFollowing ? 'Following' : 'Follow')}
      </Text>
    </TouchableOpacity>
  </View>
);
};

const FollowSomeoneScreen = ({ onBack, onContinue, onUserProfilePress }) => {
  const dispatch = useAppDispatch();
  const { allUsers, isLoading } = useAppSelector(state => state.user);
  const { user: currentUser } = useAppSelector(state => state.auth);
  const { followSomeoneSource } = useAppSelector(state => state.ui);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingUserId, setProcessingUserId] = useState(null);
  
  // Hide back button during onboarding flow (when source is 'onboarding' or null)
  const showBackButton = followSomeoneSource === 'profile';

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const handleToggleFollow = async (userId) => {
    try {
      console.log(' Toggle follow started for user:', userId);
      const userIdStr = userId?.toString();
      
      // Set processing state for this specific user
      setProcessingUserId(userIdStr);
      
      // Use string comparison for consistency
      const user = allUsers.find(u => u._id?.toString() === userIdStr);
      console.log(' User to toggle:', { 
        found: !!user, 
        userId: userIdStr, 
        userIsFollowing: user?.isFollowing,
        userData: user ? { id: user._id, name: user.fullName || user.userName } : null
      });
      
      if (!user) {
        Alert.alert('Error', 'User not found');
        setProcessingUserId(null);
        return;
      }
      
      if (user.isFollowing) {
        console.log(' Unfollowing user...');
        await dispatch(unfollowUser(userId)).unwrap();
        console.log(' Unfollow successful');
      } else {
        console.log(' Following user...');
        await dispatch(followUser(userId)).unwrap();
        console.log(' Follow successful');
      }
    } catch (error) {
      console.error(' Follow/Unfollow error:', error);
      const errorMessage = error.message || 'Failed to update follow status';
      
      // Handle duplicate follow error specifically
      if (errorMessage.toLowerCase().includes('duplicate') || 
          errorMessage.toLowerCase().includes('already')) {
        Alert.alert('Already Following', 'You are already following this user.');
        // Refresh the users list to update the button state
        dispatch(fetchAllUsers());
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      // Clear processing state
      setProcessingUserId(null);
    }
  };

  const filteredUsers = allUsers
    .filter(user => {
      // Filter out current user - don't show yourself in follow suggestions
      // Use string comparison for consistency
      const userIdStr = user._id?.toString();
      const currentUserIdStr = currentUser?._id?.toString() || currentUser?.id?.toString();
      if (userIdStr === currentUserIdStr) {
        return false;
      }

      // Apply search filter
      if (searchQuery) {
        return (
          (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.userName && user.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.occupation && user.occupation.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      return true;
    });

  const handleUserPress = (user) => {
    console.log(' Navigate to user profile:', user._id);
    if (onUserProfilePress) {
      onUserProfilePress(user);
    }
  };

  const handleContinue = () => {
    onContinue?.({ followingUsers: allUsers.filter(u => u.isFollowing) });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {showBackButton && <BackButton onPress={onBack} />}
          {!showBackButton && <View style={{ width: 40 }} />}
          <Text style={styles.title}>Follow Someone</Text>
        </View>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={16} color="#C1C1C1" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#C1C1C1"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Follow someone you might know or you can skip them too.
        </Text>

        {/* Users List */}
        {isLoading && allUsers.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <UserItem 
                user={item} 
                onToggleFollow={handleToggleFollow} 
                loading={processingUserId === item._id?.toString()}
                onUserPress={handleUserPress}
              />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            refreshing={isLoading || false}
            onRefresh={() => dispatch(fetchAllUsers())}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            )}
          />
        )}

        
                         <TouchableOpacity
                   style={styles.continueButton}
                   onPress={handleContinue}
                 >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginLeft: 16,
  },
  description: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: 24,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  mutualText: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
  },
  userOccupation: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.muted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.muted,
  },
  continueButton: {
    backgroundColor: colors.pink,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 20,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FollowSomeoneScreen;
