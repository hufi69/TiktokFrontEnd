import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

const BackButton = ({ onPress, style, accessibilityLabel = 'Go back' }) => (
  <TouchableOpacity 
    style={[styles.back, style]} 
    onPress={onPress} 
    accessibilityLabel={accessibilityLabel}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    activeOpacity={0.7}
  >
    <View style={styles.chevron} />
  </TouchableOpacity>
);
const styles = StyleSheet.create({
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    zIndex: 1,
  },
  chevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.text,
    transform: [{ rotate: '45deg' }],
    marginLeft: 2,
  },
});

export default BackButton;

