import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../constants/theme';

const AuthInput = React.forwardRef(({ icon, rightIcon, onRightPress, style, inputStyle, focused, error, secureTextEntry, ...props }, ref) => {
  return (
    <View style={[styles.row, focused && styles.rowFocused, error && styles.rowError, style]}>
      {icon ? (
        <View style={styles.leftIcon} pointerEvents="none">
          <Icon name={icon} size={16} color={focused ? colors.pink : '#C1C1C1'} />
        </View>
      ) : null}
      <TextInput ref={ref} style={[styles.input, inputStyle]} placeholderTextColor="#C1C1C1" secureTextEntry={secureTextEntry} {...props} />
      {rightIcon ? (
        <TouchableOpacity style={styles.rightIcon} onPress={onRightPress}>
          <Icon name={rightIcon} size={18} color="#9A9A9A" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bg,
  },
  rowFocused: {
    borderColor: colors.pink,
    ...Platform.select({ android: { elevation: 0 } }),
  },
  rowError: { borderColor: colors.error },
  leftIcon: { width: 48, alignItems: 'center', justifyContent: 'center' },
  rightIcon: { width: 48, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, paddingHorizontal: 12, fontSize: 16, color: colors.text },
});

export default AuthInput;

