import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Image,
  Alert,
  PermissionsAndroid,
  TextInput
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import BackButton from '../../components/common/BackButton';
import AuthInput from '../../components/auth/AuthInput';
import { colors } from '../../constants/theme';

const FillProfileScreen = ({ onBack, onContinue, userData, isEditMode = false, onEditCountry }) => {
  const [profileImage, setProfileImage] = useState(userData?.profilePicture ? { uri: userData.profilePicture } : null);
  const [fullName, setFullName] = useState(userData?.fullName || '');
  const [username, setUsername] = useState(userData?.userName || '');
  const [dateOfBirth, setDateOfBirth] = useState(userData?.dateOfBirth || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || '');
  const [countryCode, setCountryCode] = useState('+1');
  const [occupation, setOccupation] = useState(userData?.occupation || '');
  const [focusedField, setFocusedField] = useState(null);

  // Refs for input navigation
  const usernameRef = useRef(null);
  const dobRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const occupationRef = useRef(null);

  // Form validation
  const isFormValid = fullName.trim().length > 0 && 
                     username.trim().length > 0 && 
                     email.trim().length > 0;

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to your storage to select photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Profile Photo',
      'Choose how you want to add your photo',
      [
        { text: 'Take Photo', onPress: openCamera },
        { text: 'Choose from Gallery', onPress: openImageLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: false,
      saveToPhotos: false,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorMessage) {
        console.log('Camera Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to open camera. Please try again.');
      } else if (response.assets && response.assets[0]) {
        setProfileImage(response.assets[0]);
      }
    });
  };

  const openImageLibrary = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Storage permission is required to select photos.');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to open gallery. Please try again.');
      } else if (response.assets && response.assets[0]) {
        setProfileImage(response.assets[0]);
      }
    });
  };

  const formatPhoneNumber = (text) => {
    // Format phone number as (XXX) XXX-XXXX
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Limit to 10 digits
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
    }
  };

  const countryCodes = [
    { code: '+1', flag: '🇺🇸', country: 'US' },
    { code: '+44', flag: '🇬🇧', country: 'UK' },
    { code: '+92', flag: '🇵🇰', country: 'PK' },
    { code: '+61', flag: '🇦🇺', country: 'AU'}, 
    { code: '+91', flag: '🇮🇳', country: 'IN'},
   
   
  ];

  const handleCountryCodePress = () => {
    Alert.alert(
      'Select Country Code',
      'Choose your country code',
      countryCodes.map(item => ({
        text: `${item.flag} ${item.code} ${item.country}`,
        onPress: () => setCountryCode(item.code)
      })).concat([{ text: 'Cancel', style: 'cancel' }])
    );
  };

  const handleDateChange = (text) => {
    // Simple date formatting MM/DD/YYYY
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      cleaned = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    if (cleaned.length >= 5) {
      cleaned = cleaned.substring(0, 5) + '/' + cleaned.substring(5, 9);
    }
    setDateOfBirth(cleaned);
  };

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
          {/* Header */}
          <View style={styles.header}>
            <BackButton onPress={onBack} />
            <Text style={styles.title}>Fill Your Profile</Text>
          </View>

          {/* Profile Image */}
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imageContainer} onPress={handleImagePicker}>
              {profileImage ? (
                <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Icon name="user" size={40} color="#C1C1C1" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Icon name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <AuthInput
              icon="user"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === 'fullName'}
              returnKeyType="next"
              onSubmitEditing={() => usernameRef.current?.focus()}
              blurOnSubmit={false}
            />

            <AuthInput
              ref={usernameRef}
              icon="at"
              placeholder="Choose a unique username"
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === 'username'}
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => dobRef.current?.focus()}
              blurOnSubmit={false}
            />

            <AuthInput
              ref={dobRef}
              icon="calendar"
              placeholder="MM/DD/YYYY"
              value={dateOfBirth}
              onChangeText={handleDateChange}
              onFocus={() => setFocusedField('dob')}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === 'dob'}
              keyboardType="numeric"
              maxLength={10}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />

            <AuthInput
              ref={emailRef}
              icon="envelope"
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === 'email'}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              blurOnSubmit={false}
            />

            <View style={styles.phoneContainer}>
              <TouchableOpacity style={styles.countryCode} onPress={handleCountryCodePress}>
                <Text style={styles.countryCodeText}>
                  {countryCodes.find(c => c.code === countryCode)?.flag || '🇺🇸'} {countryCode}
                </Text>
                <Icon name="chevron-down" size={12} color="#C1C1C1" />
              </TouchableOpacity>
              
              <View style={[styles.phoneInputContainer, focusedField === 'phone' && styles.phoneInputFocused]}>
                <TextInput
                  ref={phoneRef}
                  style={styles.phoneInput}
                  placeholder="(123) 456-7890"
                  placeholderTextColor="#C1C1C1"
                  value={formatPhoneNumber(phoneNumber)}
                  onChangeText={handlePhoneChange}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => occupationRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            <AuthInput
              ref={occupationRef}
              icon="briefcase"
              placeholder="Occupation"
              value={occupation}
              onChangeText={setOccupation}
              onFocus={() => setFocusedField('occupation')}
              onBlur={() => setFocusedField(null)}
              focused={focusedField === 'occupation'}
              returnKeyType="done"
            />

            {/* Country Field - Only show in edit mode, read-only */}
            {isEditMode && (
              <View style={styles.countryField}>
                <View style={styles.countryFieldContent}>
                  <Icon name="globe" size={20} color={colors.pink} />
                  <View style={styles.countryFieldText}>
                    <Text style={styles.countryFieldLabel}>Country</Text>
                    <Text style={styles.countryFieldValue}>
                      {userData?.country || 'No country selected'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={[styles.continueButton, !isFormValid && styles.continueButtonDisabled]} 
            onPress={() => isFormValid && onContinue?.({
              profileImage,
              fullName,
              username,
              dateOfBirth,
              email,
              phoneNumber: `${countryCode} ${formatPhoneNumber(phoneNumber)}`,
              occupation
            })}
            disabled={!isFormValid}
          >
            <Text style={[styles.continueText, !isFormValid && styles.continueTextDisabled]}>
              Continue
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginLeft: 16,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  form: {
    gap: 16,
    marginBottom: 32,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bg,
    gap: 8,
    minWidth: 80,
  },
  countryCodeText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
  },
  phoneInputFocused: {
    borderColor: colors.pink,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  continueButton: {
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
  continueButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueTextDisabled: {
    color: '#A0A0A0',
  },
  countryField: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bg,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  countryFieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryFieldText: {
    flex: 1,
  },
  countryFieldLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 2,
  },
  countryFieldValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
});

export default FillProfileScreen;
