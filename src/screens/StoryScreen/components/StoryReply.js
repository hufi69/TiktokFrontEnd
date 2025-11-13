import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../../constants/theme';

const StoryReply = ({ visible, onClose, onSend, storyUser }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Reply to ${storyUser}...`}
          placeholderTextColor="rgba(255, 255, 255, 0.7)"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={200}
          autoFocus
        />
        <TouchableOpacity
          style={[styles.sendButton, message.trim() ? styles.sendButtonActive : styles.sendButtonInactive]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Icon name="send" size={16} color={message.trim() ? colors.pink : 'rgba(255, 255, 255, 0.5)'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: colors.pink,
  },
  sendButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default StoryReply;
