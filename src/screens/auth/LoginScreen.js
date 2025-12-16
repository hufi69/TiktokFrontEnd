import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../components/common/BackButton';
import AuthInput from '../AuthScreen/components/AuthInput';
import SocialButton from '../AuthScreen/components/SocialButton';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../constants/theme';

const LoginScreen = ({ onBack, onSocial, onSubmit, onGoToSignup, onForgetPassword, isLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [secure, setSecure] = useState(true);
  const [focusedField, setFocusedField] = useState(null);
  const passwordRef = useRef(null);
  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 8;
  const isFormValid = email.trim().length > 0 && password.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        extraScrollHeight={24}
        keyboardOpeningTime={0}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
          <BackButton style={styles.back} onPress={onBack} />

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Login to your{'\n'}Account</Text>
          </View>

          <View style={styles.form}>
            <AuthInput
              icon="envelope"
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current && passwordRef.current.focus()}
              focused={focusedField === 'email'}
              error={email.length > 0 && !isEmailValid}
            />

            <AuthInput
              ref={passwordRef}
              icon="lock"
              placeholder="Password"
              secureTextEntry={secure}
              textContentType="password"
              returnKeyType="done"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              rightIcon={secure ? 'eye-slash' : 'eye'}
              onRightPress={() => setSecure(!secure)}
              focused={focusedField === 'password'}
              error={password.length > 0 && !isPasswordValid}
            />

            <TouchableOpacity style={styles.remember} onPress={() => setRemember(!remember)}>
              <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                {remember && <Icon name="check" size={12} color={colors.bg} />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, (!isFormValid || isLoading) && styles.primaryButtonDisabled]} 
              onPress={() => onSubmit && onSubmit({ email: email.trim(), password, remember })} 
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.bg} />
              ) : (
                <Text style={[styles.primaryText, !isFormValid && styles.primaryTextDisabled]}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgetPassword} onPress={onForgetPassword}>
              <Text style={styles.forgetPasswordText}>Forget the password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerLabel}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <SocialButton provider="facebook" label="" onPress={() => onSocial?.('facebook')} />
            <SocialButton provider="google" label="" onPress={() => onSocial?.('google')} />
            <SocialButton provider="apple" label="" onPress={() => onSocial?.('apple')} />
          </View>

          <TouchableOpacity style={styles.bottomLink} onPress={onGoToSignup}>
            <Text style={styles.bottomText}>Don't have an account? <Text style={styles.bottomLinkText}>Sign up</Text></Text>
          </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  back: { position: 'absolute', top: 20, left: 24 },
  titleContainer: { alignItems: 'center', marginTop: 80, marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center', lineHeight: 34 },
  form: { width: '100%', gap: 16, marginBottom: 32 },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 16 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.pink, borderColor: colors.pink },
  rememberText: { color: colors.muted, fontSize: 14 },
  primaryButton: { marginTop: 8, backgroundColor: colors.pink, paddingVertical: 16, borderRadius: 25, alignItems: 'center' },
  primaryText: { color: colors.bg, fontSize: 16, fontWeight: '600' },
  primaryButtonDisabled: { backgroundColor: '#E0E0E0' },
  primaryTextDisabled: { color: '#A0A0A0' },
  forgetPassword: { alignItems: 'center', marginTop: 16 },
  forgetPasswordText: { color: '#FF4757', fontSize: 14, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 14 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: { color: colors.muted, fontSize: 12 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 24 },
  bottomLink: { marginTop: 20, alignItems: 'center' },
  bottomText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  bottomLinkText: { color: colors.pink, fontWeight: '700' },
});

export default LoginScreen;
