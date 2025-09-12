import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from '../../hooks/hooks';
import { forgotPassword } from '../../store/slices/authSlice';

const PINK = '#FF6B9D';
const TEXT = '#2C2C2C';

const ForgotPasswordScreen = ({ onBack, onVerify }) => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await dispatch(forgotPassword({ email }));
      console.log('🔧 Forgot password result:', result);
      console.log('📦 Result payload:', result.payload);
      
      if (forgotPassword.fulfilled.match(result)) {
        Alert.alert('Success', 'Password reset email sent!');
        // Fix: Access resetToken from the correct location
        const resetToken = result.payload?.resetToken;
        console.log('🔑 Reset token:', resetToken);
        if (resetToken) {
          onVerify?.(resetToken);
        }
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to send reset email';
        console.log(' Forgot password error:', errorMessage);
        Alert.alert('Error', String(errorMessage));
      }
    } catch (error) {
      console.log(' Forgot password exception:', error);
      Alert.alert('Error', String(error.message));
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

          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.caption}>Enter your email to reset password</Text>

          <TextInput
            style={styles.emailInput}
            placeholder="Enter your email"
            placeholderTextColor="#C1C1C1"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.primaryDisabled]} 
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={[styles.primaryText, isLoading && styles.primaryTextDisabled]}>
              {isLoading ? 'Sending...' : 'Send Reset Email'}
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
  caption: { color: '#666', marginBottom: 16 },
  emailInput: { height: 56, borderWidth: 2, borderColor: '#EFEFEF', borderRadius: 14, backgroundColor: '#FFF', paddingHorizontal: 16, fontSize: 16, color: TEXT, marginBottom: 24 },
  primaryButton: { backgroundColor: PINK, paddingVertical: 16, borderRadius: 24, alignItems: 'center' },
  primaryDisabled: { backgroundColor: '#E0E0E0' },
  primaryText: { color: '#fff', fontWeight: '600' },
  primaryTextDisabled: { color: '#A0A0A0' },
});

export default ForgotPasswordScreen;

