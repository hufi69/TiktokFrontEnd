import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAppDispatch } from '../../hooks/hooks';
import { resetPassword } from '../../store/slices/authSlice';

const PINK = '#FF6B9D';
const TEXT = '#2C2C2C';

const CreateNewPasswordScreen = ({ onBack, onContinue, resetToken }) => {
  const dispatch = useAppDispatch();
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const p2Ref = useRef(null);

  const valid = p1.length >= 6 && p1 === p2;

  const handleResetPassword = async () => {
    if (!valid) return;

    setIsLoading(true);
    try {
      const result = await dispatch(resetPassword({ 
        token: resetToken, 
        password: p1 
      }));
      
      if (resetPassword.fulfilled.match(result)) {
        Alert.alert('Success', 'Password reset successfully!');
        onContinue?.();
      } else if (resetPassword.rejected.match(result)) {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to reset password';
        Alert.alert('Error', errorMessage);
      } else {
        Alert.alert('Error', 'Failed to reset password');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
          <TouchableOpacity style={styles.back} onPress={onBack} accessibilityLabel="Go back">
            <View style={styles.chevron} />
          </TouchableOpacity>

          <Text style={styles.title}>Create New Password</Text>

          <View style={styles.inputRow}>
            <View style={styles.leftIcon}><Icon name="lock" size={18} color="#C1C1C1" /></View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#C1C1C1"
              secureTextEntry={secure1}
              value={p1}
              onChangeText={setP1}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => p2Ref.current?.focus()}
            />
            <TouchableOpacity style={styles.rightIcon} onPress={() => setSecure1(s => !s)}>
              <Icon name={secure1 ? 'eye-slash' : 'eye'} size={18} color="#9A9A9A" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.leftIcon}><Icon name="lock" size={18} color="#C1C1C1" /></View>
            <TextInput
              ref={p2Ref}
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#C1C1C1"
              secureTextEntry={secure2}
              value={p2}
              onChangeText={setP2}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.rightIcon} onPress={() => setSecure2(s => !s)}>
              <Icon name={secure2 ? 'eye-slash' : 'eye'} size={18} color="#9A9A9A" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, (!valid || isLoading) && styles.primaryDisabled]} 
            onPress={handleResetPassword}
            disabled={!valid || isLoading}
          >
            <Text style={[styles.primaryText, (!valid || isLoading) && styles.primaryTextDisabled]}>
              {isLoading ? 'Resetting...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 24 },
  back: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', marginBottom: 16 },
  chevron: { width: 10, height: 10, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: TEXT, transform: [{ rotate: '45deg' }], marginLeft: 2 },
  title: { fontSize: 22, fontWeight: '800', color: TEXT, marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 56, borderWidth: 2, borderColor: '#EFEFEF', borderRadius: 14, backgroundColor: '#FFF', marginBottom: 14 },
  leftIcon: { width: 48, alignItems: 'center', justifyContent: 'center' },
  rightIcon: { width: 48, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, paddingHorizontal: 12, fontSize: 16, color: TEXT },
  primaryButton: { backgroundColor: PINK, paddingVertical: 16, borderRadius: 24, alignItems: 'center', marginTop: 10 },
  primaryDisabled: { backgroundColor: '#E0E0E0' },
  primaryText: { color: '#fff', fontWeight: '600' },
  primaryTextDisabled: { color: '#A0A0A0' },
});

export default CreateNewPasswordScreen;

