import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../components/common/BackButton';
import { colors } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { changePassword } from '../../store/slices/authSlice';

const ChangePasswordScreen = ({ onBack, onSuccess }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    try {
      const result = await dispatch(changePassword({
        oldPassword: currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword
      }));

      if (changePassword.fulfilled.match(result)) {
        Alert.alert('Success', 'Password changed successfully!', [
          { text: 'OK', onPress: () => onSuccess?.() }
        ]);
      } else if (changePassword.rejected.match(result)) {
        // Redux Toolkit stores error in payload, not error
        const errorMessage = result.payload || 'Failed to change password';
        
        // Format error message for "Incorrect password"
        let displayMessage = errorMessage;
        if (errorMessage.toLowerCase().includes('incorrect password')) {
          displayMessage = 'ERROR : incorrect password';
        }
        
        Alert.alert('Error', displayMessage);
      }
    } catch (error) {
      let displayMessage = error.message || 'Failed to change password';
      if (displayMessage.toLowerCase().includes('incorrect password')) {
        displayMessage = 'ERROR : incorrect password';
      }
      Alert.alert('Error', displayMessage);
    }
  };

  const disabled = loading || !currentPassword || !newPassword || !confirmPassword;

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
            <Text style={styles.title}>Change Password</Text>
          </View>

          <Text style={styles.subtitle}>Enter your current password and choose a new one</Text>

          {/* Current Password */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current Password"
              placeholderTextColor="#C1C1C1"
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Text style={styles.eyeText}>{showCurrentPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New Password"
              placeholderTextColor="#C1C1C1"
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Text style={styles.eyeText}>{showNewPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm New Password"
              placeholderTextColor="#C1C1C1"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={styles.errorText}>
              {error.toLowerCase().includes('incorrect password') 
                ? 'ERROR : incorrect password' 
                : String(error)}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.changeButton, disabled && styles.changeButtonDisabled]}
            onPress={handleChangePassword}
            disabled={disabled}
          >
            <Text style={[styles.changeText, disabled && styles.changeTextDisabled]}>
              {loading ? 'Changing...' : 'Change Password'}
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
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 24 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bg,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  eyeText: {
    fontSize: 20,
  },
  errorText: { color: colors.error, marginBottom: 16 },
  changeButton: {
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
  changeButtonDisabled: { backgroundColor: '#E0E0E0', shadowOpacity: 0, elevation: 0 },
  changeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  changeTextDisabled: { color: '#A0A0A0' },
});

export default ChangePasswordScreen;
