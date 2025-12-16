import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import BackButton from '../components/common/BackButton';
import { colors, spacing } from '../constants/theme';
import { CONFIG } from '../config';
import { getNotifications, updateNotification } from '../services/api/notificationApi';
import { useAppSelector, useAppDispatch } from '../hooks/hooks';
import socketService from '../services/socket/socketService';
import { setUnreadNotificationCount, decrementNotificationCount } from '../store/slices/uiSlice';
import { DEFAULT_AVATAR } from '../constants/theme';
const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  if (/^https?:\/\//.test(profilePicture)) {
    return profilePicture;
  }
  return `${CONFIG.API_BASE_URL}/public/uploads/users/${profilePicture}`;
};


const formatTimestamp = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return '1d';
    if (diffDays < 7) return `${diffDays}d`;
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};
const getDateGroup = (dateString) => {
  if (!dateString) return 'Today';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Today';
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch (error) {
    return 'Today';
  }
};

const ActivityScreen = ({ onBack, onUserPress, onFollowPress }) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);

  useEffect(() => {
    fetchNotifications();
    
    // Set up socket listener for real-time notifications
    const handleNewNotification = (notification) => {
      console.log('📬 New notification in ActivityScreen:', notification);
      const sender = notification.sender || {};
      const transformedNotification = {
        id: notification._id || notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read || false,
        timestamp: formatTimestamp(notification.createdAt || new Date().toISOString()),
        dateGroup: getDateGroup(notification.createdAt || new Date().toISOString()),
        createdAt: notification.createdAt || new Date().toISOString(),
        user: {
          _id: sender._id,
          userName: sender.userName,
          fullName: sender.userName,
          profilePicture: sender.profilePicture || null,
        },
      };
      setNotifications(prev => [transformedNotification, ...prev]);
    };
    
    socketService.on('new_notification', handleNewNotification);
    
    return () => {
      socketService.off('new_notification', handleNewNotification);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await getNotifications();
      const notificationsData = response?.notifications || [];
      const transformedNotifications = notificationsData.map((notification) => {
        const sender = notification.sender || {};
        
        return {
          id: notification._id,
          type: notification.type, 
          title: notification.title,
          message: notification.message,
          read: notification.read || false,
          timestamp: formatTimestamp(notification.createdAt),
          dateGroup: getDateGroup(notification.createdAt),
          createdAt: notification.createdAt,
          
          user: {
            _id: sender._id ,
            userName: sender.userName ,
            fullName: sender.userName , 
            profilePicture: sender.profilePicture || null,
          },
        };
      });

      setNotifications(transformedNotifications);
      
      // Update unread count in Redux
      const unreadCount = transformedNotifications.filter(n => !n.read).length;
      dispatch(setUnreadNotificationCount(unreadCount));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      try {
        await updateNotification(notification.id);
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        // Decrement unread count
        dispatch(decrementNotificationCount());
      } catch (error) {
        console.error('Error updating notification:', error);
        Alert.alert('Error', 'Failed to mark notification as read. Please try again.');
      }
    }
    // No navigation - just mark as read
  };

  const handleFollowToggle = (notification) => {
    if (notification.type !== 'follow') return;
    
    const userId = notification.user._id;
    const isCurrentlyFollowing = followingUsers.includes(userId);
    
    if (isCurrentlyFollowing) {
      setFollowingUsers(followingUsers.filter(id => id !== userId));
    } else {
      setFollowingUsers([...followingUsers, userId]);
    }
    
    if (onFollowPress) {
      onFollowPress(userId, !isCurrentlyFollowing);
    }
  };

  const getActivityText = (notification) => {
    // Use the message from backend, or fallback to type-based text
    if (notification.message) {
      return notification.message;
    }
    
    switch (notification.type) {
      case 'follow':
        return 'Started following you.';
      case 'like':
        return 'Liked your post.';
      case 'comment':
        return 'Commented on your post.';
      case 'share':
        return 'Shared your post.';
      default:
        return 'Interacted with you.';
    }
  };

  const groupedActivities = notifications.reduce((acc, notification) => {
    const group = notification.dateGroup;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(notification);
    return acc;
  }, {});


  const renderSection = ({ item: section }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.activities.map((notification) => (
        <TouchableOpacity
          key={notification.id}
          style={[
            styles.activityItem,
            !notification.read && styles.unreadItem
          ]}
          onPress={() => handleNotificationPress(notification)}
          activeOpacity={0.7}
        >
          <View style={styles.userInfoRow}>
            <Image
              source={{ uri: getAvatarUrl(notification.user?.profilePicture) }}
              style={styles.avatar}
              defaultSource={{ uri: DEFAULT_AVATAR }}
            />
            
            <View style={styles.activityContent}>
              <View style={styles.activityTextRow}>
                <Text style={styles.username}>{notification.user?.userName || 'User'}</Text>
                <Text style={styles.activityText}> {getActivityText(notification)}</Text>
              </View>
              <Text style={styles.timestamp}>{notification.timestamp}</Text>
            </View>
          </View>

          {notification.type === 'follow' && (
            <TouchableOpacity
              style={[
                styles.followButton,
                followingUsers.includes(notification.user._id) && styles.followingButton
              ]}
              onPress={() => handleFollowToggle(notification)}
            >
              <Text style={[
                styles.followButtonText,
                followingUsers.includes(notification.user._id) && styles.followingButtonText
              ]}>
                {followingUsers.includes(notification.user._id) ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const sections = Object.keys(groupedActivities).map((dateGroup) => ({
    title: dateGroup,
    activities: groupedActivities[dateGroup],
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={styles.title}>Activity</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="ellipsis-v" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Activity List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          renderItem={renderSection}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.pink]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )}
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
    paddingVertical: spacing.m,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  menuButton: {
    padding: spacing.s,
  },
  listContent: {
    paddingBottom: spacing.l,
  },
  section: {
    marginTop: spacing.l,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: colors.bg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    backgroundColor: colors.bg,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.m,
  },
  activityContent: {
    flex: 1,
  },
  activityTextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  activityText: {
    fontSize: 14,
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.pink,
    minWidth: 80,
    alignItems: 'center',
    marginLeft: spacing.s,
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
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginLeft: spacing.s,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.muted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  unreadItem: {
    backgroundColor: '#F0F8FF',
  },
});

export default ActivityScreen;

