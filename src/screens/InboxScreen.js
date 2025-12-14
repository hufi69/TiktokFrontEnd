import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import BackButton from '../components/common/BackButton';
import { colors, spacing } from '../constants/theme';
import { CONFIG } from '../config';
import { getUserChats } from '../services/api/chatApi';
import { useAppSelector } from '../hooks/hooks';

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

// Helper function to format timestamp
const formatTimestamp = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Same day - show time
    if (diffDays === 1) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } 
    // Yesterday
    else if (diffDays === 2) {
      return 'Yesterday';
    } 
    // Within a week
    else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } 
    // Older
    else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};

const InboxScreen = ({ onBack, onUserPress, onMessagePress, onCreateMessage }) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        const response = await getUserChats();
        const chatsData = response?.data?.chats || [];
        
      
        const transformedChats = chatsData.map((chat) => {
         
          const otherParticipant = chat.participants?.find(
            (p) => (typeof p === 'object' ? p._id : p) !== currentUser?._id
          ) || chat.participants?.[0];

          
          const participantData = typeof otherParticipant === 'object' 
            ? otherParticipant 
            : { _id: otherParticipant };

    
          const displayName =participantData.userName || participantData.fullName;

      
          const lastMessageText = chat.lastMessage?.text || '';
          const lastMessageTime = chat.lastMessage?.sentAt || chat.updatedAt || chat.createdAt;

          return {
            id: chat._id,
            chatId: chat._id,
            user: {
              _id: participantData._id,
              userName: displayName,
              fullName: displayName,
              name: participantData.name,
              email: participantData.email,
              profilePicture: participantData.profilePicture || null,
            },
            lastMessage: lastMessageText || 'No messages yet',
            timestamp: formatTimestamp(lastMessageTime),
            unreadCount: 0, // TODO: Implement unread count from backend
            isRead: true, // TODO: Implement read status from backend
          };
        });

        setChats(transformedChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?._id) {
      fetchChats();
    }
  }, [currentUser?._id]);

  const filteredMessages = chats.filter(message => {
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
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          keyExtractor={(item) => item.id || item.chatId}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
});

export default InboxScreen;

