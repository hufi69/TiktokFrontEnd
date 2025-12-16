import React, { useRef, useState, useEffect } from 'react';
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
import AuthInput from '../AuthScreen/components/AuthInput';
import { colors } from '../../constants/theme';
import { API_CONFIG } from '../../config/api';

const FillProfileScreen = ({ onBack, onContinue, userData, isEditMode = false, isSignupFlow = false, onEditCountry }) => {
  // Helper function to format date for display (extract YYYY-MM-DD from ISO or keep YYYY-MM-DD)
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    // If it's already in YYYY-MM-DD format, return as is
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    // If it's in full ISO format (YYYY-MM-DDTHH:mm:ss.sssZ), extract just YYYY-MM-DD
    if (dateStr.includes('-') && dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    // If it's in ISO format without time, return as is
    if (dateStr.includes('-')) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    // If it's in MM/DD/YYYY format, convert to YYYY-MM-DD
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/');
      if (month && day && year && year.length === 4) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    return dateStr;
  };

  // Helper to get profile image URI
  const getProfileImageUri = (profilePicture) => {
    if (!profilePicture) return null;
    // If it's already a URI (starts with http or file://), use it directly
    if (typeof profilePicture === 'string' && (profilePicture.startsWith('http') || profilePicture.startsWith('file://'))) {
      return { uri: profilePicture };
    }
    // If it's an object with uri, use it
    if (typeof profilePicture === 'object' && profilePicture.uri) {
      return profilePicture;
    }
    // If it's just a filename, construct the full URL
    if (typeof profilePicture === 'string') {
      return { uri: `${API_CONFIG.BASE_URL}/public/uploads/users/${profilePicture}` };
    }
    return null;
  };

  // Helper to parse phone number
  const parsePhoneNumber = (phoneStr) => {
    if (!phoneStr) return { countryCode: '+1', number: '' };
    // Format: "+1 (123) 456-7890" or "+1 1234567890"
    const match = phoneStr.match(/^(\+\d+)\s*(.+)$/);
    if (match) {
      const code = match[1];
      const number = match[2].replace(/\D/g, ''); // Remove all non-digits
      return { countryCode: code, number };
    }
    // If no country code, assume +1
    return { countryCode: '+1', number: phoneStr.replace(/\D/g, '') };
  };

  const [profileImage, setProfileImage] = useState(() => {
    if (isEditMode && userData?.profilePicture) {
      return getProfileImageUri(userData.profilePicture);
    }
    return null;
  });
  const [fullName, setFullName] = useState(userData?.fullName || '');
  const [username, setUsername] = useState(userData?.userName || '');
  const [dateOfBirth, setDateOfBirth] = useState(formatDateForDisplay(userData?.dateOfBirth));
  // Email should be auto-filled from signup and read-only during signup flow only
  const [email, setEmail] = useState(userData?.email || '');
  
  // Auto-fill email if it's signup flow and email is provided
  useEffect(() => {
    if (isSignupFlow && userData?.email) {
      setEmail(userData.email);
    } else if (isEditMode && userData?.email) {
      setEmail(userData.email);
    }
  }, [isSignupFlow, isEditMode, userData?.email]);

  // Parse phone number when loading in edit mode
  const parsedPhone = parsePhoneNumber(userData?.phone || userData?.phoneNumber);
  const [phoneNumber, setPhoneNumber] = useState(parsedPhone.number);
  const [countryCode, setCountryCode] = useState(parsedPhone.countryCode);
  const [occupation, setOccupation] = useState(userData?.occupation || '');
  const [focusedField, setFocusedField] = useState(null);

  // Update profile image when userData changes (for edit mode)
  useEffect(() => {
    if (isEditMode && userData?.profilePicture) {
      const imageUri = getProfileImageUri(userData.profilePicture);
      setProfileImage(imageUri);
    }
  }, [isEditMode, userData?.profilePicture]);

  // Update phone number when userData changes
  useEffect(() => {
    const phone = userData?.phone || userData?.phoneNumber;
    if (phone) {
      const parsed = parsePhoneNumber(phone);
      setPhoneNumber(parsed.number);
      setCountryCode(parsed.countryCode);
    }
  }, [userData?.phone, userData?.phoneNumber]);

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
    //  phone number as (XXX) XXX-XXXX
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
    // Date formatting YYYY-MM-DD
    let cleaned = text.replace(/\D/g, '');
    
    // Limit year to 4 digits
    if (cleaned.length > 4) {
      const year = cleaned.substring(0, 4);
      const month = cleaned.substring(4, 6);
      const day = cleaned.substring(6, 8);
      
      // Validate month (01-12)
      let validMonth = month;
      if (month.length === 2) {
        const monthNum = parseInt(month, 10);
        if (monthNum > 12) {
          validMonth = '12';
        } else if (monthNum < 1) {
          validMonth = '01';
        }
      }
      
      // Validate day (01-31)
      let validDay = day;
      if (day.length === 2) {
        const dayNum = parseInt(day, 10);
        if (dayNum > 31) {
          validDay = '31';
        } else if (dayNum < 1) {
          validDay = '01';
        }
      }
      
      cleaned = year + validMonth + validDay;
    }
    
    if (cleaned.length >= 4) {
      cleaned = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
    }
    if (cleaned.length >= 7) {
      cleaned = cleaned.substring(0, 7) + '-' + cleaned.substring(7, 9);
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
              placeholder="YYYY-MM-DD"
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
              onChangeText={undefined}
              editable={false}
              onFocus={() => setFocusedField(null)}
              onBlur={() => setFocusedField(null)}
              focused={false}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              blurOnSubmit={false}
              style={styles.emailReadOnly}
              inputStyle={styles.emailReadOnlyInput}
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

            {/* Country Field - CANt change in edit mode */}
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
              phone: `${countryCode} ${formatPhoneNumber(phoneNumber)}`,
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
  emailReadOnly: {
    opacity: 0.7,
    backgroundColor: '#F5F5F5',
  },
  emailReadOnlyInput: {
    color: colors.muted,
  },
});

export default FillProfileScreen;
