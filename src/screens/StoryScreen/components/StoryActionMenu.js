import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../../constants/theme';

const StoryActionMenu = ({ visible, onClose, onReport, onCopyLink, onShare, onMute }) => {
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const actionItems = [
    {
      id: 'report',
      title: 'Report...',
      icon: 'exclamation-triangle',
      color: '#FF4757',
      onPress: onReport,
    },
    {
      id: 'copyLink',
      title: 'Copy Link',
      icon: 'link',
      color: colors.text,
      onPress: onCopyLink,
    },
    {
      id: 'share',
      title: 'Share to...',
      icon: 'send',
      color: colors.text,
      onPress: onShare,
    },
    {
      id: 'mute',
      title: 'Mute',
      icon: 'volume-off',
      color: colors.text,
      onPress: onMute,
    },
  ];

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
            styles.menuContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />
          
          {/* Action Items */}
          {actionItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.actionItem}
              onPress={() => {
                item.onPress();
                handleClose();
              }}
            >
              <Icon name={item.icon} size={20} color={item.color} style={styles.actionIcon} />
              <Text style={[styles.actionText, { color: item.color }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
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
  menuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  actionIcon: {
    marginRight: 16,
    width: 20,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default StoryActionMenu;
