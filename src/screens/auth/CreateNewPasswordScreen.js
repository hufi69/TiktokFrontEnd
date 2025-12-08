import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAppDispatch } from '../../hooks/hooks';
import { resetPassword } from '../../store/slices/authSlice';
import BackButton from '../../components/common/BackButton';
import { colors } from '../../constants/theme';
const illustrationImage = require('../../assets/toktok(1).png');
const CreateNewPasswordScreen = ({ onBack, onContinue, resetOTP }) => {
  const dispatch = useAppDispatch();
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const p2Ref = useRef(null);

  const valid = useMemo(() => {
    const isValid = p1.length >= 8 && p1 === p2 && p1.length > 0;
    return isValid;
  }, [p1, p2]);

  
  const buttonStyle = useMemo(() => {
    if (valid && !isLoading) {
      return styles.primaryButton;
    }
    return styles.primaryButtonDisabled;
  }, [valid, isLoading]);

  const buttonTextStyle = useMemo(() => {
    if (valid && !isLoading) {
      return styles.primaryText;
    }
    return styles.primaryTextDisabled;
  }, [valid, isLoading]);

  const handleResetPassword = async () => {
    if (!valid || !resetOTP) return;

    setIsLoading(true);
    try {
      const result = await dispatch(resetPassword({ 
        otp: resetOTP,
        newPassword: p1,
        confirmNewPassword: p2
      }));
      
      if (resetPassword.fulfilled.match(result)) {
        Alert.alert('Success', 'Password reset successfully!');
        onContinue?.();
      } else if (resetPassword.rejected.match(result)) {
        const errorMessage = typeof result.payload === 'string' ? result.payload : 'Failed to reset password';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.content} 
          keyboardShouldPersistTaps="always" 
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
        >
          <View style={styles.header}>
            <BackButton onPress={onBack} />
            <Text style={styles.title}>Create New Password</Text>
          </View>

          {/* Illustration from assets */}
          <View style={styles.illustrationContainer}>
            <Image 
              source={illustrationImage} 
              style={styles.illustrationImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.sectionTitle}>Create Your New Password</Text>

          <View style={styles.inputRow}>
            <View style={styles.leftIcon}>
              <Icon name="lock" size={18} color="#C1C1C1" />
            </View>
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
            <View style={styles.leftIcon}>
              <Icon name="lock" size={18} color="#C1C1C1" />
            </View>
            <TextInput
              ref={p2Ref}
              style={styles.input}
              placeholder="Password"
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
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Icon name="check" size={12} color="#fff" />}
            </View>
            <Text style={styles.rememberMeText}>Remember me</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              buttonStyle,
              isLoading && styles.primaryButtonLoading
            ]} 
            onPress={handleResetPassword}
            disabled={!valid || isLoading}
            activeOpacity={0.8}
          >
            <Text style={buttonTextStyle}>
              {isLoading ? 'Resetting...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { 
    flexGrow: 1, 
    padding: 24,
    paddingTop: 16,
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
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    marginTop: 20,
    width: '100%',
  },
  illustrationImage: {
    width: '100%',
    height: 200,
    maxWidth: 300,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 56, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 14, 
    backgroundColor: colors.bg, 
    marginBottom: 16,
  },
  leftIcon: { 
    width: 48, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingLeft: 16,
  },
  rightIcon: { 
    width: 48, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingRight: 16,
  },
  input: { 
    flex: 1, 
    paddingHorizontal: 12, 
    fontSize: 16, 
    color: colors.text,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.pink,
    borderColor: colors.pink,
  },
  rememberMeText: {
    fontSize: 14,
    color: colors.muted,
  },
  primaryButton: { 
    backgroundColor: colors.pink, 
    paddingVertical: 16, 
    borderRadius: 25, 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 56,
    width: '100%',
  },
  primaryButtonDisabled: { 
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
    minHeight: 56,
    width: '100%',
  },
  primaryButtonLoading: {
    opacity: 0.7,
  },
  primaryText: { 
    color: '#fff', 
    fontSize: 16,
    fontWeight: '600',
  },
  primaryTextDisabled: { 
    color: '#A0A0A0',
  },
});

export default CreateNewPasswordScreen;

