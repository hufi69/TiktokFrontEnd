import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../components/common/BackButton';
import { colors } from '../../constants/theme';
import { useAppDispatch } from '../../hooks/hooks';
import { resendOTP } from '../../store/slices/authSlice';

const OtpVerificationScreen = ({ onBack, onVerify, loading, error, email }) => {
  const dispatch = useAppDispatch();
  const [otp, setOtp] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setOtp(cleaned);
  };

  const handleResendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Email is required to resend OTP');
      return;
    }

    setResendLoading(true);
    try {
      const result =  dispatch(resendOTP({ email }));
      if (resendOTP.fulfilled.match(result)) {
        Alert.alert('Success', 'OTP resent successfully!');
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to resend OTP';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setResendLoading(false);
    }
  };

  const disabled = loading || otp.length < 6; // accepts 6

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton onPress={onBack} />
            <Text style={styles.title}>Verify Your Email</Text>
          </View>

          <Text style={styles.subtitle}>Enter the OTP we sent to your email</Text>

          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={handleChange}
            placeholder="Enter OTP"
            placeholderTextColor="#C1C1C1"
            keyboardType="number-pad"
            maxLength={6}
            returnKeyType="done"
          />

          {error ? <Text style={styles.errorText}>{String(error)}</Text> : null}

          <TouchableOpacity
            style={[styles.verifyButton, disabled && styles.verifyButtonDisabled]}
            onPress={() => !disabled && onVerify?.({ otp })}
            disabled={disabled}
          >
            <Text style={[styles.verifyText, disabled && styles.verifyTextDisabled]}>
              {loading ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendButton, resendLoading && styles.resendButtonDisabled]}
            onPress={handleResendOTP}
            disabled={resendLoading}
          >
            <Text style={[styles.resendText, resendLoading && styles.resendTextDisabled]}>
              {resendLoading ? 'Sending...' : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginLeft: 16 },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 16 },
  otpInput: {
    height: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 20,
    letterSpacing: 6,
    color: colors.text,
    backgroundColor: colors.bg,
    marginBottom: 12,
  },
  errorText: { color: colors.error, marginBottom: 12 },
  verifyButton: {
    backgroundColor: colors.pink,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyButtonDisabled: { backgroundColor: '#E0E0E0', shadowOpacity: 0, elevation: 0 },
  verifyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  verifyTextDisabled: { color: '#A0A0A0' },
  resendButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resendButtonDisabled: { 
    borderColor: colors.border,
    opacity: 0.6 
  },
  resendText: { 
    color: colors.primary, 
    fontSize: 14, 
    fontWeight: '500' 
  },
  resendTextDisabled: { 
    color: colors.textLight 
  },
});

export default OtpVerificationScreen;

