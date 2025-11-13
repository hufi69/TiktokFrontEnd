import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../../constants/theme';

const brandColor = {
  google: '#EA4335',
  facebook: '#1877F2',
  apple: '#000000',
};
const SocialButton = ({ provider, label, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress} accessibilityRole="button">
    <View style={styles.iconWrap}>
      <Icon name={provider} size={18} color={brandColor[provider] || colors.text} />
    </View>
    <Text style={styles.text}>{label}</Text>
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  text: { color: colors.text, fontSize: 15, fontWeight: '600' },
});

export default SocialButton;

