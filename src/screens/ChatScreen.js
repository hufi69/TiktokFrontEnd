import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import BackButton from '../components/common/BackButton';
import { colors, spacing } from '../constants/theme';
import { CONFIG } from '../config';
import socketService from '../services/socket/socketService';
import { useAppSelector } from '../hooks/hooks';
import { createChat, getUserChats, getChatById } from '../services/api/chatApi';
import { createMessage, getChatMessages, deleteMessage } from '../services/api/messageApi';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';

const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  if (/^https?:\/\//.test(profilePicture)) return profilePicture;
  return `${CONFIG.API_BASE_URL}/public/img/users/${profilePicture}`;
};

const ChatScreen = ({ onBack, user, initialMessages = [], chatId: initialChatId = null }) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [messages, setMessages] = useState(initialMessages.length > 0 ? initialMessages : []);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [chatId, setChatId] = useState(initialChatId);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Generate room ID from user IDs (sorted to ensure consistency)
  const getRoomId = () => {
    if (!currentUser?._id || !user?._id) return null;
    const userIds = [currentUser._id, user._id].sort();
    return `chat_${userIds[0]}_${userIds[1]}`;
  };

  const roomId = getRoomId();

  // Create or fetch chat when component mounts
  useEffect(() => {
    const initializeChat = async () => {
      if (!currentUser?._id || !user?._id) return;
      if (chatId) return; // Chat already exists

      setIsLoadingChat(true);
      try {
       
        const participants = [currentUser._id, user._id]
          .map(String)
          .sort();

        try {
          const chatsResponse = await getUserChats();
          const existingChat = chatsResponse?.data?.chats?.find((chat) => {
            if (!chat.participants || chat.participants.length !== 2) return false;
            const chatParticipants = chat.participants
              .map((p) => (typeof p === 'object' ? p._id : p))
              .map(String)
              .sort();
            return (
              chatParticipants.length === participants.length &&
              chatParticipants.every((id, index) => id === participants[index])
            );
          });

          if (existingChat) {
            setChatId(existingChat._id);
            setIsLoadingChat(false);
            return;
          }
        } catch (error) {
          console.warn('Error fetching user chats, will create new chat:', error);
        }

        // Create new chat if not found
        const chatResponse = await createChat(participants);
        // Backend returns: { success: true, chat }
        if (chatResponse?.chat?._id) {
          setChatId(chatResponse.chat._id);
        } else if (chatResponse?.data?.chat?._id) {
          setChatId(chatResponse.data.chat._id);
        } else {
          console.warn('Chat created but no chat ID found in response:', chatResponse);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to initialize chat. Please try again.'
        );
      } finally {
        setIsLoadingChat(false);
      }
    };

    initializeChat();
  }, [currentUser?._id, user?._id, chatId]);

  // Fetch messages when chatId is available
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId || isLoadingChat) return;

      setIsLoadingMessages(true);
      try {
        const response = await getChatMessages(chatId);
        const messagesData = response?.messages || response?.data?.messages || [];

        // Transform API messages to UI format
        const transformedMessages = messagesData.map((msg) => {
          // Handle sender data (could be populated object or just ID)
          const senderData = typeof msg.sender === 'object' && msg.sender !== null
            ? msg.sender
            : { _id: msg.sender };
          
          const isFromCurrentUser = senderData._id === currentUser?._id;
          
          // Get attachment image if available
          const attachment = msg.attachments && msg.attachments.length > 0 
            ? `${CONFIG.API_BASE_URL}/public/uploads/${msg.attachments[0].filename}`
            : null;

          const messageDate = new Date(msg.createdAt || msg.timestamp);
          const now = new Date();
          const diffTime = Math.abs(now - messageDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let dateLabel = 'Today';
          if (diffDays === 2) {
            dateLabel = 'Yesterday';
          } else if (diffDays > 2) {
            dateLabel = messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }

          // Determine sender info - backend populates sender with "userName email profilePicture"
          // So we use userName from populated data, not name or fullName
          const sender = isFromCurrentUser 
            ? {
                ...currentUser,
                userName: currentUser?.userName || currentUser?.name,
                fullName: currentUser?.fullName || currentUser?.name || currentUser?.userName,
                profilePicture: currentUser?.profilePicture,
              }
            : {
                _id: senderData._id,
                userName: senderData.userName || user?.userName,
                fullName: senderData.fullName || senderData.userName || user?.fullName || user?.userName,
                profilePicture: senderData.profilePicture || user?.profilePicture,
                email: senderData.email,
              };

          return {
            id: msg._id,
            type: isFromCurrentUser ? 'sent' : 'received',
            text: msg.text || '',
            image: attachment,
            sender: sender,
            timestamp: messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: dateLabel,
            isRead: msg.hasRead || false,
          };
        });

        setMessages(transformedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        // Don't show alert, just log error - messages will be empty
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [chatId, isLoadingChat, currentUser, user]);

  // Join room and setup socket listeners
  useEffect(() => {
    if (!roomId || !currentUser || !user) return;
    if (isLoadingChat) return; // Wait for chat to be initialized

    // Join the chat room (use chatId if available, otherwise use roomId)
    const roomToJoin = chatId || roomId;
    socketService.joinRoom(roomToJoin);

    // Listen for new messages from socket (real-time updates)
    const handleNewMessage = (data) => {
      console.log('Received message via socket:', data);
      
      // Check if message already exists (to avoid duplicates from API + socket)
      setMessages((prev) => {
        const messageId = data._id || data.id;
        if (prev.some(msg => msg.id === messageId)) {
          return prev; // Message already exists
        }

        const isFromCurrentUser = data.sender === currentUser._id || 
                                   data.senderId === currentUser._id ||
                                   (typeof data.sender === 'object' && data.sender._id === currentUser._id);
        
        // Get attachment image if available
        // Backend sends attachments array with { filename, originalname, mimeType }
        const attachment = data.attachment && data.attachment.length > 0
          ? `${CONFIG.API_BASE_URL}/public/uploads/${data.attachment[0].filename}`
          : (data.attachments && data.attachments.length > 0
            ? `${CONFIG.API_BASE_URL}/public/uploads/${data.attachments[0].filename}`
            : null);

        const messageDate = data.timestamp ? new Date(data.timestamp) : new Date();
        const now = new Date();
        const diffTime = Math.abs(now - messageDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dateLabel = 'Today';
        if (diffDays === 2) {
          dateLabel = 'Yesterday';
        } else if (diffDays > 2) {
          dateLabel = messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        // Determine sender info - backend populates sender with "userName email profilePicture"
        const sender = isFromCurrentUser 
          ? {
              ...currentUser,
              userName: currentUser?.userName || currentUser?.name,
              fullName: currentUser?.fullName || currentUser?.name || currentUser?.userName,
              profilePicture: currentUser?.profilePicture,
            }
          : {
              ...user,
              userName: user?.userName || (typeof data.sender === 'object' ? data.sender?.userName : null),
              fullName: user?.fullName || user?.userName || (typeof data.sender === 'object' ? data.sender?.userName : null),
              profilePicture: user?.profilePicture || (typeof data.sender === 'object' ? data.sender?.profilePicture : null),
              email: user?.email || (typeof data.sender === 'object' ? data.sender?.email : null),
            };

        const newMessage = {
          id: messageId || Date.now().toString(),
          type: isFromCurrentUser ? 'sent' : 'received',
          text: data.text || data.message || '',
          image: attachment,
          sender: sender,
          timestamp: messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: dateLabel,
          isRead: data.hasRead !== undefined ? data.hasRead : false, // Use hasRead from socket if provided
        };

        return [...prev, newMessage];
      });
    };

    // Listen for typing indicators
    const handleTyping = (data) => {
      if (data.userId !== currentUser._id) {
        setOtherUserTyping(data.isTyping);
        if (data.isTyping) {
          // Clear typing indicator after 3 seconds
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    };

    // Listen for message read receipts
    const handleMessageRead = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, isRead: true } : msg
        )
      );
    };

    // Register socket listeners
    socketService.on('new_message', handleNewMessage);
    socketService.on('typing', handleTyping);
    socketService.on('message_read', handleMessageRead);

    // Cleanup on unmount
    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('typing', handleTyping);
      socketService.off('message_read', handleMessageRead);
      const roomToLeave = chatId || roomId;
      if (roomToLeave) {
        socketService.leaveRoom(roomToLeave);
      }
    };
  }, [roomId, chatId, currentUser, user, isLoadingChat]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleImagePicker = () => {
    Alert.alert('Select Image', 'Choose how you want to add an image', [
      { text: 'Take Photo', onPress: openCamera },
      { text: 'Choose from Gallery', onPress: openImageLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = () => {
    launchCamera({ mediaType: 'photo' }, (res) => {
      if (!res.didCancel && res.assets) setSelectedImage(res.assets[0]);
    });
  };

  const openImageLibrary = () => {
    launchImageLibrary({ mediaType: 'photo' }, (res) => {
      if (!res.didCancel && res.assets) setSelectedImage(res.assets[0]);
    });
  };

  // Handle typing indicator
  const handleTextChange = (text) => {
    setInputText(text);
    
    if (!isTyping && text.trim().length > 0) {
      setIsTyping(true);
      const roomToSend = chatId || roomId;
      if (roomToSend) {
        socketService.sendTyping(roomToSend, true);
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const roomToSend = chatId || roomId;
      if (roomToSend) {
        socketService.sendTyping(roomToSend, false);
      }
    }, 1000);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      await deleteMessage(selectedMessage.id);
      // Remove message from local state
      setMessages((prev) => prev.filter((msg) => msg.id !== selectedMessage.id));
      setShowDeleteModal(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', error.message || 'Failed to delete message. Please try again.');
      setShowDeleteModal(false);
      setSelectedMessage(null);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;
    if (!chatId) {
      Alert.alert('Error', 'Unable to send message. Chat not initialized.');
      return;
    }
    if (isLoadingChat) {
      Alert.alert('Please wait', 'Chat is being initialized. Please try again in a moment.');
      return;
    }

    const messageText = inputText.trim();
    const messageImage = selectedImage;

    // Optimistically add message to UI
    const tempId = Date.now().toString();
    const now = new Date();
    const optimisticMessage = {
      id: tempId,
      type: 'sent',
      text: messageText,
      image: messageImage?.uri || null,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today',
      isSending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const previousInputText = inputText;
    const previousImage = selectedImage;
    setInputText('');
    setSelectedImage(null);
    setIsTyping(false);
    const roomToSend = chatId || roomId;
    if (roomToSend) {
      socketService.sendTyping(roomToSend, false);
    }

    try {
      // Prepare attachments if image is selected
      const attachments = messageImage ? [{
        uri: messageImage.uri,
        type: messageImage.type || 'image/jpeg',
        name: messageImage.fileName || `image_${Date.now()}.jpg`,
      }] : [];

      // Send message via API
      const response = await createMessage(chatId, messageText, attachments);
      
      // Remove optimistic message and add the real one from API
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== tempId);
        const newMessage = response?.newMessage || response?.data?.newMessage;
        
        if (newMessage) {
          const messageDate = new Date(newMessage.createdAt || new Date());
          const attachment = newMessage.attachments && newMessage.attachments.length > 0
            ? `${CONFIG.API_BASE_URL}/public/uploads/${newMessage.attachments[0].filename}`
            : null;

          const transformedMessage = {
            id: newMessage._id,
            type: 'sent',
            text: newMessage.text || '',
            image: attachment,
            sender: currentUser,
            timestamp: messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: 'Today',
            isRead: newMessage.hasRead || false,
          };
          
          return [...filtered, transformedMessage];
        }
        
        return filtered;
      });

      // Socket will also emit the message, but we've already added it from API response
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      // Restore input
      setInputText(previousInputText);
      setSelectedImage(previousImage);
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    }
  };

  const renderMessage = ({ item, index }) => {
    const showDate = index === 0 || (messages[index - 1]?.date !== item.date);
    const isReceived = item.type === 'received';

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          </View>
        )}

        {isReceived ? (
          <View style={styles.receivedMessageContainer}>
            <Image
              source={{ uri: getAvatarUrl(item.sender?.profilePicture) }}
              style={styles.avatar}
            />
            <View style={styles.receivedMessageContent}>
              <Text style={styles.senderName}>
                {item.sender?.userName || item.sender?.fullName}
              </Text>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.messageImage} />
              )}
              {item.text && (
                <View style={styles.receivedBubble}>
                  <Text style={styles.receivedText}>{item.text}</Text>
                </View>
              )}
              <Text style={styles.receivedTimestamp}>{item.timestamp}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.sentMessageContainer}
            onLongPress={() => {
              setSelectedMessage(item);
              setShowDeleteModal(true);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.sentMessageContent}>
              <Text style={styles.sentSenderName}>
                {item.sender?.userName || item.sender?.fullName || 'You'}
              </Text>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.messageImage} />
              )}
              {item.text && (
                <View style={styles.sentBubble}>
                  <Text style={styles.sentText}>{item.text}</Text>
                </View>
              )}
              <View style={styles.timestampContainer}>
                <Text style={styles.sentTimestamp}>{item.timestamp}</Text>
                {item.isRead && (
                  <Text style={styles.readIndicator}>Read</Text>
                )}
              </View>
            </View>
            <Image
              source={{ uri: getAvatarUrl(item.sender?.profilePicture) }}
              style={styles.sentAvatar}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /** CONTENT STRUCTURE (we reuse this inside Android/iOS containers) */
  const renderContent = () => (
    <>
      {/* HEADER */}
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={styles.headerTitle}>{user?.fullName || user?.userName}</Text>

        <View style={styles.headerActions}>
          <Icon name="phone" size={20} color={colors.text} />
          <Icon name="ellipsis-v" size={20} color={colors.text} />
        </View>
      </View>

      {/* MESSAGES */}
      {isLoadingMessages ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.m, paddingBottom: 20 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          )}
        />
      )}

      {/* SELECTED IMAGE PREVIEW */}
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Icon name="times" size={18} color={'#fff'} />
          </TouchableOpacity>
        </View>
      )}

      {/* TYPING INDICATOR */}
      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{user?.userName || user?.fullName} is typing...</Text>
        </View>
      )}

      {/* DELETE MESSAGE MODAL */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setSelectedMessage(null);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowDeleteModal(false);
            setSelectedMessage(null);
          }}
        >
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Message</Text>
            <Text style={styles.deleteModalText}>
              Unsend this message?
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setSelectedMessage(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteButton]}
                onPress={handleDeleteMessage}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* INPUT BAR */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type message..."
          placeholderTextColor={colors.muted}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />

        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={handleImagePicker}
        >
          <Icon name="camera" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() && !selectedImage) && styles.sendButtonDisabled,
          ]}
          disabled={!inputText.trim() && !selectedImage}
          onPress={handleSend}
        >
          <Icon name="paper-plane" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );

  const isIOS = Platform.OS === 'ios';

  return (
    <SafeAreaView style={styles.container}>
      {isIOS ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={80}
        >
          {renderContent()}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          {renderContent()}
        </View>
      )}
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 15 },

  dateContainer: { alignItems: 'center', marginVertical: spacing.m },
  datePill: {
    backgroundColor: '#eee',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 20,
  },
  dateText: { fontSize: 12, color: colors.muted },

  receivedMessageContainer: { 
    flexDirection: 'row', 
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 10,
  },
  sentAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginLeft: 10,
  },

  receivedMessageContent: { 
    maxWidth: '75%',
    flexShrink: 1,
  },
  senderName: { 
    fontWeight: '600', 
    fontSize: 13,
    marginBottom: 4,
    color: colors.text,
  },
  sentSenderName: {
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 4,
    color: colors.text,
    textAlign: 'right',
  },

  receivedBubble: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 14,
    marginTop: 2,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  receivedText: { 
    fontSize: 14,
    color: colors.text,
  },

  sentMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  sentMessageContent: {
    maxWidth: '75%',
    alignItems: 'flex-end',
    marginRight: 10,
  },
  sentBubble: {
    backgroundColor: colors.pink,
    padding: 10,
    borderRadius: 14,
    marginTop: 2,
  },
  sentText: { 
    color: '#fff', 
    fontSize: 14,
  },

  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
    justifyContent: 'flex-end',
  },
  receivedTimestamp: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  sentTimestamp: {
    fontSize: 11,
    color: colors.muted,
  },
  readIndicator: {
    fontSize: 11,
    color: colors.pink,
    fontWeight: '600',
  },

  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#ddd',
    marginBottom: 6,
  },

  imagePreviewContainer: {
    paddingHorizontal: spacing.m,
    marginBottom: 5,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 14,
    backgroundColor: '#0008',
    borderRadius: 14,
    padding: 6,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },

  input: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },

  cameraButton: {
    padding: 8,
    marginLeft: 5,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.pink,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  sendButtonDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.5,
  },
  typingIndicator: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: colors.bg,
  },
  typingText: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
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
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.l,
    width: '80%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.s,
  },
  deleteModalText: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.l,
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.m,
  },
  deleteModalButton: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    backgroundColor: '#FF3040',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
