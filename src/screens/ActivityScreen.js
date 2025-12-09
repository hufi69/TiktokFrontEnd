import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import BackButton from '../components/common/BackButton';
import { colors, spacing } from '../constants/theme';
import { CONFIG } from '../config';

// Default avatar
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';

// Helper function to get full profile picture URL
const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  if (/^https?:\/\//.test(profilePicture)) {
    return profilePicture;
  }
  return `${CONFIG.API_BASE_URL}/public/img/users/${profilePicture}`;
};

// Mock activity data
const generateMockActivities = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const formatDate = (date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return [
    {
      id: '1',
      type: 'follow',
      user: {
        _id: 'user1',
        userName: 'huffffffi',
        fullName: 'Huzaifa Umer',
        profilePicture: null,
      },
      timestamp: '4h',
      dateGroup: 'Today',
      isFollowing: false,
    },
    {
      id: '2',
      type: 'mention',
      user: {
        _id: 'user2',
        userName: 'annaclaramm',
        fullName: 'Anna Clara',
        profilePicture: null,
      },
      timestamp: '6h',
      dateGroup: 'Today',
      postImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '3',
      type: 'follow',
      user: {
        _id: 'user3',
        userName: 'amandadasilva',
        fullName: 'Amanda Silva',
        profilePicture: null,
      },
      timestamp: '8h',
      dateGroup: 'Today',
      isFollowing: true,
    },
    {
      id: '4',
      type: 'mention',
      user: {
        _id: 'user4',
        userName: 'marciacristina',
        fullName: 'Marcia Cristina',
        profilePicture: null,
      },
      timestamp: '1d',
      dateGroup: 'Yesterday',
      postImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '5',
      type: 'follow',
      user: {
        _id: 'user5',
        userName: 'alessandroveronezi',
        fullName: 'Alessandro Veronezi',
        profilePicture: null,
      },
      timestamp: '1d',
      dateGroup: 'Yesterday',
      isFollowing: false,
    },
    {
      id: '6',
      type: 'mention',
      user: {
        _id: 'user6',
        userName: 'gabrielcantarin',
        fullName: 'Gabriel Cantarin',
        profilePicture: null,
      },
      timestamp: '1d',
      dateGroup: 'Yesterday',
      postImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '7',
      type: 'follow',
      user: {
        _id: 'user7',
        userName: 'carolinedias',
        fullName: 'Caroline Dias',
        profilePicture: null,
      },
      timestamp: '2d',
      dateGroup: formatDate(twoDaysAgo),
      isFollowing: false,
    },
  ];
};

const ActivityScreen = ({ onBack, onUserPress, onFollowPress }) => {
  const [activities] = useState(generateMockActivities());
  const [followingUsers, setFollowingUsers] = useState(
    activities.filter(a => a.isFollowing).map(a => a.user._id)
  );

  const handleFollowToggle = (activity) => {
    if (activity.type !== 'follow') return;
    
    const userId = activity.user._id;
    const isCurrentlyFollowing = followingUsers.includes(userId);
    
    if (isCurrentlyFollowing) {
      setFollowingUsers(followingUsers.filter(id => id !== userId));
      activity.isFollowing = false;
    } else {
      setFollowingUsers([...followingUsers, userId]);
      activity.isFollowing = true;
    }
    
    if (onFollowPress) {
      onFollowPress(userId, !isCurrentlyFollowing);
    }
  };

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'follow':
        return 'Started following you.';
      case 'mention':
        return 'Mentioned you in a comment.';
      case 'like':
        return 'Liked your post.';
      case 'comment':
        return 'Commented on your post.';
      default:
        return 'Interacted with you.';
    }
  };

  const groupedActivities = activities.reduce((acc, activity) => {
    const group = activity.dateGroup;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(activity);
    return acc;
  }, {});


  const renderSection = ({ item: section }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.activities.map((activity) => (
        <View key={activity.id} style={styles.activityItem}>
          <TouchableOpacity
            style={styles.userInfoRow}
            onPress={() => onUserPress?.(activity.user)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: getAvatarUrl(activity.user.profilePicture) }}
              style={styles.avatar}
            />
            
            <View style={styles.activityContent}>
              <View style={styles.activityTextRow}>
                <Text style={styles.username}>{activity.user.userName || activity.user.fullName}</Text>
                <Text style={styles.activityText}> {getActivityText(activity)}</Text>
              </View>
              <Text style={styles.timestamp}>{activity.timestamp}</Text>
            </View>
          </TouchableOpacity>

          {activity.type === 'follow' && (
            <TouchableOpacity
              style={[
                styles.followButton,
                activity.isFollowing && styles.followingButton
              ]}
              onPress={() => handleFollowToggle(activity)}
            >
              <Text style={[
                styles.followButtonText,
                activity.isFollowing && styles.followingButtonText
              ]}>
                {activity.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}

          {activity.type === 'mention' && activity.postImage && (
            <Image
              source={{ uri: activity.postImage }}
              style={styles.postThumbnail}
            />
          )}
        </View>
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
      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        renderItem={renderSection}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activity yet</Text>
          </View>
        )}
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
});

export default ActivityScreen;

