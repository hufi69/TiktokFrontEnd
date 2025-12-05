import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import BackButton from '../../components/common/BackButton';
import AuthInput from '../AuthScreen/components/AuthInput';
import SocialButton from '../AuthScreen/components/SocialButton';
import { colors } from '../../constants/theme';

const SignupScreen = ({ onBack, onSubmit, onSocial, onGoToSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [secure, setSecure] = useState(true);
  const [focusedField, setFocusedField] = useState(null);
  const passwordRef = useRef(null);
  // Form validation
  const isFormValid = email.trim().length > 0 && password.length > 0;
  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 8;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        extraScrollHeight={24}
        keyboardOpeningTime={0}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          
          <BackButton style={styles.back} onPress={onBack} />

          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Create your{'\n'}Account</Text>
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

            {/* Password */}
            <AuthInput
              ref={passwordRef}
              icon="lock"
              placeholder="Password"
              secureTextEntry={secure}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password-new"
              textContentType="password"
              returnKeyType="done"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              rightIcon={secure ? 'eye-slash' : 'eye'}
              onRightPress={() => setSecure(s => !s)}
              focused={focusedField === 'password'}
              error={password.length >= 8 && !isPasswordValid}
            />

            <TouchableOpacity style={styles.remember} onPress={() => setRemember(r => !r)}>
              <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                {remember ? <Icon name="check" size={12} color="#fff" /> : null}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                !isFormValid && styles.primaryButtonDisabled
              ]} 
              onPress={() => isFormValid && onSubmit && onSubmit({ email: email.trim(), password, remember })}
              disabled={!isFormValid}
            >
              <Text style={[
                styles.primaryText,
                !isFormValid && styles.primaryTextDisabled
              ]}>
                Sign up
              </Text>
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

          <TouchableOpacity style={styles.bottomLink} onPress={onGoToSignIn}>
            <Text style={styles.bottomText}>Already have an account? <Text style={styles.bottomLinkText}>Sign in</Text></Text>
          </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { 
    flexGrow: 1, 
    padding: 24,
    paddingBottom: 40,
  },
  back: { position: 'absolute', top: 20, left: 24 },
  titleContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: colors.text,
    textAlign: 'center',
    lineHeight: 34,
  },
  form: { 
    width: '100%',
    gap: 16, 
    marginBottom: 32,
  },
  /* Input visuals provided by AuthInput */
  remember: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 16 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.pink, borderColor: colors.pink },
  rememberText: { color: colors.muted, fontSize: 14 },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.pink,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryText: { color: colors.bg, fontSize: 16, fontWeight: '600' },
  primaryTextDisabled: {
    color: '#999999',
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 14 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: { color: colors.muted, fontSize: 12 },
  socialRow: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  socialCircle: { width: 0, height: 0 },
  bottomLink: { 
    marginTop: 20,
    alignItems: 'center',
  },
  bottomText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  bottomLinkText: { color: colors.pink, fontWeight: '700' },
});

export default SignupScreen;
