import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
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

// Mock messages data
const generateMockMessages = () => {
  return [
    {
      id: '1',
      user: {
        _id: 'user1',
        userName: 'annetteblack',
        fullName: 'Annette Black',
        profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      },
      lastMessage: 'Message',
      timestamp: '20.00',
      unreadCount: 3,
      isRead: false,
    },
    {
      id: '2',
      user: {
        _id: 'user2',
        userName: 'wadewarren',
        fullName: 'Wade Warren',
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      },
      lastMessage: 'perfect!',
      timestamp: '16.20',
      unreadCount: 3,
      isRead: false,
    },
    {
      id: '3',
      user: {
        _id: 'user3',
        userName: 'jennywilson',
        fullName: 'Jenny Wilson',
        profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      },
      lastMessage: 'How are you?',
      timestamp: 'Yesterday',
      unreadCount: 0,
      isRead: true,
    },
    {
      id: '4',
      user: {
        _id: 'user4',
        userName: 'theresawebb',
        fullName: 'Theresa Webb',
        profilePicture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      },
      lastMessage: 'Haha that\'s terrifying 😂',
      timestamp: 'Yesterday',
      unreadCount: 0,
      isRead: true,
    },
    {
      id: '5',
      user: {
        _id: 'user5',
        userName: 'brooklynsimmons',
        fullName: 'Brooklyn Simmons',
        profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      },
      lastMessage: 'I\'ll be there in 2 mins',
      timestamp: 'Yesterday',
      unreadCount: 0,
      isRead: true,
    },
    {
      id: '6',
      user: {
        _id: 'user6',
        userName: 'robertfox',
        fullName: 'Robert Fox',
        profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      },
      lastMessage: 'aww',
      timestamp: 'Dec 22, 24',
      unreadCount: 0,
      isRead: true,
    },
  ];
};

const InboxScreen = ({ onBack, onUserPress, onMessagePress, onCreateMessage }) => {
  const [messages] = useState(generateMockMessages());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = messages.filter(message => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      message.user.userName?.toLowerCase().includes(query) ||
      message.user.fullName?.toLowerCase().includes(query) ||
      message.lastMessage?.toLowerCase().includes(query)
    );
  });

  const renderMessageItem = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => onMessagePress?.(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: getAvatarUrl(item.user.profilePicture) }}
        style={styles.avatar}
      />
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.username}>{item.user.userName || item.user.fullName}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <View style={styles.messageFooter}>
          <Text 
            style={[
              styles.lastMessage,
              !item.isRead && styles.unreadMessage
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={styles.title}>Inbox</Text>
        {/* <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="ellipsis-v" size={20} color={colors.text} />
          </TouchableOpacity>
        </View> */}
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

      {/* Messages Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <TouchableOpacity>
          <Text style={styles.requestsLink}>Requests</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages found</Text>
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
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  headerButton: {
    padding: spacing.s,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: 12,
    marginHorizontal: spacing.m,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  searchIcon: {
    marginRight: spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  requestsLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.pink,
  },
  listContent: {
    paddingBottom: spacing.l,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    backgroundColor: colors.bg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.m,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.muted,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.muted,
    flex: 1,
    marginRight: spacing.s,
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.text,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3040',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 88, // avatar width + margin
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

export default InboxScreen;

