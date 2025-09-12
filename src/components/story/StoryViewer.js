import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  Modal,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const StoryViewer = ({ 
  visible, 
  stories, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrevious 
}) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(currentIndex);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showSendTo, setShowSendTo] = useState(false);
  const [progressAnimations] = useState(() => 
    stories.map(() => new Animated.Value(0))
  );

  const currentStory = stories[currentStoryIndex];
  const progressRef = useRef(new Animated.Value(0));

  useEffect(() => {
    if (visible && currentStory) {
      startProgressAnimation();
    }
  }, [visible, currentStoryIndex]);

  const startProgressAnimation = () => {
    progressRef.current.setValue(0);
    Animated.timing(progressRef.current, {
      toValue: 1,
      duration: 5000, // 5 seconds per story
      useNativeDriver: false,
    }).start(() => {
      handleNext();
    });
  };

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      onClose();
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // TODO: Implement send message functionality
      console.log('Sending message:', messageText);
      setMessageText('');
      setShowMessageInput(false);
    }
  };

  const handleMoreOptions = () => {
    setShowMoreOptions(true);
  };

  const handleSendTo = () => {
    setShowSendTo(true);
    setShowMoreOptions(false);
  };

  const handleReport = () => {
    // TODO: Implement report functionality
    console.log('Reporting story');
    setShowMoreOptions(false);
  };

  const handleCopyLink = () => {
    // TODO: Implement copy link functionality
    console.log('Copying link');
    setShowMoreOptions(false);
  };

  const handleMute = () => {
    // TODO: Implement mute functionality
    console.log('Muting user');
    setShowMoreOptions(false);
  };

  if (!visible || !currentStory) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        {/* Story Image */}
        <Image source={{ uri: currentStory.avatar }} style={styles.storyImage} />
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {stories.map((_, index) => (
            <View key={index} style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: index === currentStoryIndex 
                      ? progressRef.current.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        })
                      : index < currentStoryIndex ? '100%' : '0%'
                  }
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={{ uri: currentStory.avatar }} style={styles.profileImage} />
            <View style={styles.userDetails}>
              <Text style={styles.username}>{currentStory.username}</Text>
              <Text style={styles.timeAgo}>1 hour ago</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleMoreOptions} style={styles.moreButton}>
            <Icon name="ellipsis-h" size={20} color={colors.bg} />
          </TouchableOpacity>
        </View>

        {/* Navigation Areas */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity style={styles.leftArea} onPress={handlePrevious} />
          <TouchableOpacity style={styles.rightArea} onPress={handleNext} />
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <View style={styles.messageContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Send Message"
              placeholderTextColor={colors.textLight}
              value={messageText}
              onChangeText={setMessageText}
              onFocus={() => setShowMessageInput(true)}
            />
            <TouchableOpacity style={styles.heartButton}>
              <Icon name="heart-o" size={24} color={colors.bg} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <Icon name="send" size={20} color={colors.bg} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="times" size={24} color={colors.bg} />
        </TouchableOpacity>

        {/* More Options Modal */}
        <Modal visible={showMoreOptions} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.moreOptionsModal}>
              <TouchableOpacity style={styles.optionItem} onPress={handleReport}>
                <Icon name="exclamation-triangle" size={20} color={colors.error} />
                <Text style={styles.optionText}>Report...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionItem} onPress={handleCopyLink}>
                <Icon name="copy" size={20} color={colors.text} />
                <Text style={styles.optionText}>Copy Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionItem} onPress={handleSendTo}>
                <Icon name="send" size={20} color={colors.text} />
                <Text style={styles.optionText}>Share to...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionItem} onPress={handleMute}>
                <Icon name="volume-off" size={20} color={colors.text} />
                <Text style={styles.optionText}>Mute</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowMoreOptions(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Send To Modal */}
        <Modal visible={showSendTo} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.sendToModal}>
              <View style={styles.sendToHeader}>
                <Image source={{ uri: currentStory.avatar }} style={styles.sendToProfileImage} />
                <TextInput
                  style={styles.sendToInput}
                  placeholder="Write a message..."
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <View style={styles.searchContainer}>
                <Icon name="search" size={16} color={colors.textLight} />
                <Text style={styles.searchText}>Search</Text>
              </View>
              <ScrollView style={styles.userList}>
                {[
                  { name: 'Jane Cooper', role: 'Nursing Assistant', status: 'send' },
                  { name: 'Esther Howard', role: 'Marketing Coordinator', status: 'sent' },
                  { name: 'Brooklyn Simmons', role: 'President of Sales', status: 'send' },
                  { name: 'Guy Hawkins', role: 'Dog Trainer', status: 'sent' },
                  { name: 'Jenny Wilson', role: 'Medical Assistant', status: 'send' },
                ].map((user, index) => (
                  <View key={index} style={styles.userItem}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' }} 
                      style={styles.userAvatar} 
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userRole}>{user.role}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.sendButton,
                        user.status === 'sent' && styles.sentButton
                      ]}
                    >
                      <Text style={[
                        styles.sendButtonText,
                        user.status === 'sent' && styles.sentButtonText
                      ]}>
                        {user.status === 'sent' ? 'Sent' : 'Send'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowSendTo(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text,
  },
  storyImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.m,
    paddingTop: 50,
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.bg,
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingTop: 60,
    paddingBottom: spacing.m,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '600',
  },
  timeAgo: {
    color: colors.bg,
    fontSize: 12,
    opacity: 0.8,
  },
  moreButton: {
    padding: spacing.s,
  },
  navigationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  leftArea: {
    flex: 1,
    height: '100%',
  },
  rightArea: {
    flex: 1,
    height: '100%',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.m,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    gap: spacing.s,
  },
  messageInput: {
    flex: 1,
    color: colors.bg,
    fontSize: 16,
  },
  heartButton: {
    padding: 4,
  },
  sendButton: {
    padding: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: spacing.m,
    padding: spacing.s,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  moreOptionsModal: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
    paddingBottom: spacing.m,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    gap: spacing.m,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
  },
  cancelButton: {
    marginTop: spacing.s,
    paddingVertical: spacing.m,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  cancelText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  sendToModal: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
    maxHeight: height * 0.8,
    paddingBottom: spacing.m,
  },
  sendToHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    gap: spacing.s,
  },
  sendToProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sendToInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    gap: spacing.s,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  searchText: {
    fontSize: 16,
    color: colors.textLight,
  },
  userList: {
    maxHeight: height * 0.4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    gap: spacing.s,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userRole: {
    fontSize: 14,
    color: colors.muted,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.l,
  },
  sentButton: {
    backgroundColor: colors.border,
  },
  sendButtonText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: '600',
  },
  sentButtonText: {
    color: colors.muted,
  },
});

export default StoryViewer;