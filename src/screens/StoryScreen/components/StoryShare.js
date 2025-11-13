import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { fetchAllUsers } from '../../../store/slices/userSlice';

const StoryShare = ({ visible, onClose, onShare, storyUser }) => {
  const dispatch = useAppDispatch();
  const { allUsers, isLoading } = useAppSelector(state => state.user);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const slideAnim = React.useRef(new Animated.Value(400)).current;

  // Load users when component mounts
  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible]);

  const loadUsers = async () => {
    try {
      const result = await dispatch(fetchAllUsers());
      if (fetchAllUsers.fulfilled.match(result)) {
        const apiUsers = result.payload || [];
        const transformedUsers = apiUsers.map(user => ({
          id: user._id,
          name: user.fullName || user.userName || 'Unknown User',
          occupation: user.occupation || 'No occupation',
          avatar: user.profilePicture || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          isSent: false,
        }));
        setUsers(transformedUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleShareToUser = (userId) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, isSent: true } : user
      )
    );
    
    // Simulate sharing
    setTimeout(() => {
      onShare(userId, message);
      handleClose();
    }, 500);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.occupation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleShareToUser(item.id)}
    >
      <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userOccupation}>{item.occupation}</Text>
      </View>
      <TouchableOpacity
        style={[styles.sendButton, item.isSent && styles.sentButton]}
        disabled={item.isSent}
      >
        <Text style={[styles.sendButtonText, item.isSent && styles.sentButtonText]}>
          {item.isSent ? 'Sent' : 'Send'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' }} style={styles.storyUserAvatar} />
            <TextInput
              style={styles.messageInput}
              placeholder="Write a message..."
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              multiline
            />
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={16} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Users List */}
          <FlatList
            data={filteredUsers}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            style={styles.userList}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  storyUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  userList: {
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userOccupation: {
    fontSize: 14,
    color: colors.muted,
  },
  sendButton: {
    backgroundColor: colors.pink,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sentButton: {
    backgroundColor: '#E0E0E0',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sentButtonText: {
    color: colors.muted,
  },
});

export default StoryShare;
