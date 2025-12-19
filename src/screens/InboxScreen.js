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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import BackButton from '../components/common/BackButton';
import { colors, spacing } from '../constants/theme';
import { CONFIG } from '../config';
import { getUserChats } from '../services/api/chatApi';
import { useAppSelector, useAppDispatch } from '../hooks/hooks';
import { setUnreadInboxCount } from '../store/slices/uiSlice';
import { followUser } from '../store/slices/userSlice';

// Default avatar
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';

// Helper function to get full profile picture URL
const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  if (/^https?:\/\//.test(profilePicture)) {
    return profilePicture;
  }
  return `${CONFIG.API_BASE_URL}/public/uploads/users/${profilePicture}`;
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
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [activeChats, setActiveChats] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'requests'
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Helper function to transform chat data
  const transformChat = (chat, currentUserId) => {
    // Normalize IDs to strings for comparison
    const currentUserIdStr = currentUserId?.toString();
    
    // Find the other participant (not the current user)
    const otherParticipant = chat.participants?.find((p) => {
      const participantId = typeof p === 'object' ? p._id : p;
      return participantId?.toString() !== currentUserIdStr;
    }) || chat.participants?.[0];

    // Extract participant data
    const participantData = typeof otherParticipant === 'object' 
      ? otherParticipant 
      : { _id: otherParticipant };

    const displayName = participantData.userName || participantData.fullName || 'Unknown User';

    // Handle lastMessage (may not exist for new chats)
    const lastMessageText = chat.lastMessage?.text || '';
    const lastMessageTime = chat.lastMessage?.sentAt || chat.updatedAt || chat.createdAt;
    const lastMessageSenderId = chat.lastMessage?.senderId;
    
    // Check if last message is from the other user (unread)
    const lastMessageSenderIdStr = lastMessageSenderId?.toString();
    const isLastMessageFromOther = lastMessageSenderIdStr && 
      lastMessageSenderIdStr !== currentUserIdStr &&
      lastMessageSenderIdStr !== currentUser?.id?.toString();
    
    // Calculate unread count (backend may provide this, otherwise use 1 if message from other)
    const unreadCount = chat.unreadCount || (isLastMessageFromOther ? 1 : 0);
    const isRead = !isLastMessageFromOther;

    // Check if current user is the requester (sender of the request)
    const requestedById = typeof chat.requestedBy === 'object' 
      ? chat.requestedBy?._id 
      : chat.requestedBy;
    const isCurrentUserRequester = requestedById?.toString() === currentUserIdStr;

    return {
      id: chat._id,
      chatId: chat._id,
      status: chat.status || 'active',
      requestedBy: chat.requestedBy, // Populated user object for requests
      isCurrentUserRequester: isCurrentUserRequester, // True if current user sent the request
      user: {
        _id: participantData._id,
        userName: participantData.userName || displayName,
        fullName: participantData.fullName || displayName,
        name: participantData.name,
        email: participantData.email,
        profilePicture: participantData.profilePicture || null,
      },
      lastMessage: lastMessageText || 'No messages yet',
      timestamp: formatTimestamp(lastMessageTime),
      unreadCount: unreadCount,
      isRead: isRead,
    };
  };

  // Fetch user chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        const response = await getUserChats();
        
        // Backend returns: { status, results: { chats, requests }, data: { chats: [], requests: [] } }
        // Handle both possible response structures
        const activeChatsData = response?.data?.chats || response?.chats || [];
        const requestsData = response?.data?.requests || response?.requests || [];
        
        console.log('📬 Fetched chats:', {
          activeChatsCount: activeChatsData.length,
          requestsCount: requestsData.length,
          currentUserId: currentUser?._id
        });
        
        const transformedActiveChats = activeChatsData.map((chat) => 
          transformChat(chat, currentUser?._id)
        );
        
        const transformedRequests = requestsData.map((chat) => 
          transformChat(chat, currentUser?._id)
        );

        setActiveChats(transformedActiveChats);
        setRequests(transformedRequests);
        
        // Calculate total unread (active chats + requests)
        const totalUnread = [...transformedActiveChats, ...transformedRequests].reduce(
          (sum, chat) => sum + (chat.unreadCount || 0), 
          0
        );
        dispatch(setUnreadInboxCount(totalUnread));
        
        console.log('📊 Updated inbox counts:', {
          activeChats: transformedActiveChats.length,
          requests: transformedRequests.length,
          totalUnread
        });
      } catch (error) {
        console.error('Error fetching chats:', error);
        setActiveChats([]);
        setRequests([]);
        dispatch(setUnreadInboxCount(0));
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?._id) {
      fetchChats();
    }
  }, [currentUser?._id, dispatch]);

  // Handle accepting a chat request (by following the user)
  const handleAcceptRequest = async (request) => {
    try {
      setProcessingRequestId(request.id);
      const otherUserId = request.user._id;
      
      // Follow the user - this will automatically upgrade chat to "active" on backend
      await dispatch(followUser(otherUserId)).unwrap();
      
      // Refresh chats to get updated list
      const response = await getUserChats();
      const activeChatsData = response?.data?.chats || [];
      const requestsData = response?.data?.requests || [];
      
      const transformedActiveChats = activeChatsData.map((chat) => 
        transformChat(chat, currentUser?._id)
      );
      
      const transformedRequests = requestsData.map((chat) => 
        transformChat(chat, currentUser?._id)
      );

      setActiveChats(transformedActiveChats);
      setRequests(transformedRequests);
      
      // Update unread count
      const totalUnread = [...transformedActiveChats, ...transformedRequests].reduce(
        (sum, chat) => sum + (chat.unreadCount || 0), 
        0
      );
      dispatch(setUnreadInboxCount(totalUnread));
      
      Alert.alert('Success', 'Chat request accepted');
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', error?.message || 'Failed to accept request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle declining a chat request (delete the chat)
  const handleDeclineRequest = async (request) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this chat request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingRequestId(request.id);
              // TODO: Add deleteChat API call if backend supports it
              // For now, just remove from local state
              setRequests(prev => prev.filter(r => r.id !== request.id));
              Alert.alert('Success', 'Chat request declined');
            } catch (error) {
              console.error('Error declining request:', error);
              Alert.alert('Error', 'Failed to decline request');
            } finally {
              setProcessingRequestId(null);
            }
          },
        },
      ]
    );
  };

  const currentData = activeTab === 'messages' ? activeChats : requests;
  const filteredData = currentData.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.user.userName?.toLowerCase().includes(query) ||
      item.user.fullName?.toLowerCase().includes(query) ||
      item.lastMessage?.toLowerCase().includes(query)
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
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }) => {
    // Only show Accept/Decline buttons if current user is NOT the requester (i.e., they are the receiver)
    const isReceiver = !item.isCurrentUserRequester;
    
    return (
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
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
          {/* Only show Accept/Decline buttons for the receiver */}
          {isReceiver ? (
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={[styles.acceptButton, processingRequestId === item.id && styles.buttonDisabled]}
                onPress={() => handleAcceptRequest(item)}
                disabled={processingRequestId === item.id}
              >
                {processingRequestId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.acceptButtonText}>Accept</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.declineButton, processingRequestId === item.id && styles.buttonDisabled]}
                onPress={() => handleDeclineRequest(item)}
                disabled={processingRequestId === item.id}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.pendingStatus, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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

      {/* Tab Header */}
      <View style={styles.sectionHeader}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
            Messages
          </Text>
          {activeChats.some(chat => chat.unreadCount > 0) && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {activeChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests
          </Text>
          {requests.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{requests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Messages/Requests List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id || item.chatId}
          renderItem={activeTab === 'messages' ? renderMessageItem : renderRequestItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'messages' ? 'No messages found' : 'No requests found'}
              </Text>
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
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
    gap: spacing.xs,
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
  tabBadge: {
    backgroundColor: colors.pink,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.pink,
    paddingVertical: spacing.s,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.s,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  declineButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pendingStatus: {
    marginTop: spacing.s,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  pendingText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
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

