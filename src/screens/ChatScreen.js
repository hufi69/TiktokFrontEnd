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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import BackButton from '../components/common/BackButton';
import { colors, spacing } from '../constants/theme';
import { CONFIG } from '../config';
import socketService from '../services/socket/socketService';
import { useAppSelector } from '../hooks/hooks';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';

const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  if (/^https?:\/\//.test(profilePicture)) return profilePicture;
  return `${CONFIG.API_BASE_URL}/public/img/users/${profilePicture}`;
};

const generateMockChatMessages = (user) => {
  if (!user) return [];
  return [
    {
      id: '1',
      type: 'received',
      sender: user,
      occupation: user.occupation || 'Marketing Coordinator',
      image:
        'https://images.unsplash.com/photo-1529626465-07711f2317e8?w=400&h=400&fit=crop',
      text: "She is adorable! Don't you want to meet her?? 😉",
      timestamp: '10:00',
      date: 'Today',
    },
  ];
};

const ChatScreen = ({ onBack, user, initialMessages = [] }) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [messages, setMessages] = useState(
    initialMessages.length > 0 ? initialMessages : generateMockChatMessages(user)
  );
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Generate room ID from user IDs (sorted to ensure consistency)
  const getRoomId = () => {
    if (!currentUser?._id || !user?._id) return null;
    const userIds = [currentUser._id, user._id].sort();
    return `chat_${userIds[0]}_${userIds[1]}`;
  };

  const roomId = getRoomId();

  // Join room and setup socket listeners
  useEffect(() => {
    if (!roomId || !currentUser || !user) return;

    // Join the chat room
    socketService.joinRoom(roomId);

    // Listen for new messages
    const handleNewMessage = (data) => {
      console.log('Received message:', data);
      const isFromCurrentUser = data.senderId === currentUser._id;
      
      const newMessage = {
        id: data.id || Date.now().toString(),
        type: isFromCurrentUser ? 'sent' : 'received',
        text: data.message || data.text || '',
        image: data.image || null,
        sender: isFromCurrentUser ? currentUser : user,
        timestamp: data.timestamp 
          ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: data.date || 'Today',
      };

      setMessages((prev) => [...prev, newMessage]);
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
      if (roomId) {
        socketService.leaveRoom(roomId);
      }
    };
  }, [roomId, currentUser, user]);

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
      socketService.sendTyping(roomId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.sendTyping(roomId, false);
    }, 1000);
  };

  const handleSend = () => {
    if (!inputText.trim() && !selectedImage) return;
    if (!roomId) {
      Alert.alert('Error', 'Unable to send message. Please try again.');
      return;
    }

    const messageText = inputText.trim();
    const messageImage = selectedImage?.uri || null;

    // Optimistically add message to UI
    const tempId = Date.now().toString();
    const now = new Date();
    const optimisticMessage = {
      id: tempId,
      type: 'sent',
      text: messageText,
      image: messageImage,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today',
      isSending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');
    setSelectedImage(null);
    setIsTyping(false);
    socketService.sendTyping(roomId, false);

    // Send message via socket
    const success = socketService.sendMessage(roomId, messageText, messageImage);
    
    if (!success) {
      // If socket send failed, show error and remove optimistic message
      Alert.alert('Error', 'Failed to send message. Please check your connection.');
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } else {
      // Update message to remove sending indicator when confirmed
      // The server will send back the message with proper ID
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, isSending: false } : msg
          )
        );
      }, 500);
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
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.sentMessageContainer}>
            <View style={styles.sentMessageContent}>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.messageImage} />
              )}
              {item.text && (
                <View style={styles.sentBubble}>
                  <Text style={styles.sentText}>{item.text}</Text>
                </View>
              )}
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
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
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.m, paddingBottom: 20 }}
      />

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

        <TouchableOpacity onPress={handleImagePicker}>
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

  receivedMessageContainer: { flexDirection: 'row', marginBottom: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },

  receivedMessageContent: { flex: 1 },
  senderName: { fontWeight: '600', marginBottom: 4 },

  receivedBubble: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 14,
    marginTop: 4,
  },
  receivedText: { fontSize: 14 },

  sentMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  sentMessageContent: {
    maxWidth: '80%',
    alignItems: 'flex-end',
  },
  sentBubble: {
    backgroundColor: colors.pink,
    padding: 10,
    borderRadius: 14,
  },
  sentText: { color: '#fff', fontSize: 14 },

  timestamp: { marginTop: 4, fontSize: 11, color: colors.muted },

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
  },

  input: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 10,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.pink,
    justifyContent: 'center',
    alignItems: 'center',
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
});
