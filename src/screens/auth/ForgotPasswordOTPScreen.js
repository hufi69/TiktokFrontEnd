import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../components/common/BackButton';
import { colors } from '../../constants/theme';
import { useAppDispatch } from '../../hooks/hooks';
import { resendOTP } from '../../store/slices/authSlice';

const ForgotPasswordOTPScreen = ({ onBack, onVerify, email, loading, error }) => {
  const dispatch = useAppDispatch();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Mask email/phone for display
  const maskEmail = (email) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length === 2) {
      const username = parts[0];
      const domain = parts[1];
      const maskedUsername = username.length > 2 
        ? username.substring(0, 2) + '*'.repeat(username.length - 2)
        : username;
      return `${maskedUsername}@${domain}`;
    }
    // If it's a phone number format
    if (email.startsWith('+')) {
      const digits = email.replace(/\D/g, '');
      if (digits.length > 4) {
        return `+${digits.substring(0, 2)}${'*'.repeat(digits.length - 4)}${digits.substring(digits.length - 2)}`;
      }
    }
    return email;
  };

  const handleChange = (text, index) => {
    // Only allow digits
    const digit = text.replace(/\D/g, '').slice(0, 1);
    
    if (digit) {
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Auto-focus next input
      if (index < 5 && inputRefs[index + 1].current) {
        inputRefs[index + 1].current.focus();
      }
    } else {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || !email) {
      return;
    }

    setResendLoading(true);
    try {
      const result = await dispatch(resendOTP(email));
      if (resendOTP.fulfilled.match(result)) {
        Alert.alert('Success', 'OTP resent successfully!');
        setCountdown(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
      } else {
        const errorMessage = result.error || 'Failed to resend OTP';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = () => {
    const otpString = otp.join('');
    if (otpString.length === 6) {
      onVerify?.({ otp: otpString });
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '') && otp.length === 6;
  const maskedEmail = maskEmail(email);

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
            <Text style={styles.title}>Forgot Password</Text>
          </View>

          <Text style={styles.subtitle}>
            Code has been send to {maskedEmail}
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                  error && styles.otpInputError
                ]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
                autoFocus={index === 0}
              />
            ))}
          </View>

          {error && (
            <Text style={styles.errorText}>{String(error)}</Text>
          )}

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Resend code in{' '}
              <Text style={styles.countdownText}>{countdown} s</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              (!isOtpComplete || loading) && styles.verifyButtonDisabled
            ]}
            onPress={handleVerify}
            disabled={!isOtpComplete || loading}
          >
            <Text style={[
              styles.verifyText,
              (!isOtpComplete || loading) && styles.verifyTextDisabled
            ]}>
              {loading ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginLeft: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  otpInput: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.bg,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: colors.pink,
    borderWidth: 2,
  },
  otpInputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: colors.muted,
  },
  countdownText: {
    color: colors.error,
    fontWeight: '600',
  },
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
  verifyButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyTextDisabled: {
    color: '#A0A0A0',
  },
});

export default ForgotPasswordOTPScreen;

