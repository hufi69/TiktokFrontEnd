import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAppDispatch } from '../../hooks/hooks';
import { createGroup } from '../../store/slices/groupsSlice';

const CreateGroupScreen = ({ onBack, onCreateGroup }) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = useCallback((type) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: type === 'cover' ? 1200 : 500,
      maxHeight: type === 'cover' ? 600 : 500,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets?.[0]) {
        if (type === 'cover') {
          setCoverImage(response.assets[0]);
        } else {
          setProfileImage(response.assets[0]);
        }
      }
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    setLoading(true);
    try {
      // Backend currently doesn't support image uploads in create route
      // Images can be added later via updateGroup when backend supports it
      const result = await dispatch(createGroup({
        name: name.trim(),
        description: description.trim(),
        privacy,
        tags: [], // Can be added later if needed
        settings: {}, // Can be customized later
        // coverImage and profileImage are stored locally but not sent yet
        // TODO: Upload images after group creation when backend supports it
      })).unwrap();
      
      // Show info about images if they were selected
      if (coverImage || profileImage) {
        Alert.alert(
          'Group Created',
          'Group created successfully! Note: Images will be added in a future update when the backend supports image uploads.',
          [{ text: 'OK' }]
        );
      }
      
      if (onCreateGroup) {
        onCreateGroup(result);
      } else {
        onBack();
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  }, [name, description, privacy, coverImage, profileImage, dispatch, onCreateGroup, onBack]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="times" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Group</Text>
          <TouchableOpacity 
            style={[styles.createButton, (!name.trim() || loading) && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={!name.trim() || loading}
          >
            <Text style={[styles.createButtonText, (!name.trim() || loading) && styles.createButtonTextDisabled]}>
              {loading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cover Image */}
          <TouchableOpacity 
            style={styles.coverImageContainer}
            onPress={() => pickImage('cover')}
          >
            {coverImage ? (
              <Image source={{ uri: coverImage.uri }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverImagePlaceholder}>
                <Icon name="camera" size={32} color={colors.textLight} />
                <Text style={styles.placeholderText}>Add Cover Photo</Text>
              </View>
            )}
            <View style={styles.coverImageOverlay}>
              <Icon name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Profile Image */}
          <View style={styles.profileImageSection}>
            <TouchableOpacity onPress={() => pickImage('profile')}>
              {profileImage ? (
                <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Icon name="camera" size={24} color={colors.textLight} />
                </View>
              )}
              <View style={styles.profileImageEdit}>
                <Icon name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
              maxLength={100}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell people what this group is about"
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Privacy</Text>
            <View style={styles.privacyOptions}>
              {[
                { value: 'public', label: 'Public', icon: 'globe', desc: 'Anyone can find and join' },
                { value: 'private', label: 'Private', icon: 'lock', desc: 'Anyone can find, but must request to join' },
                { value: 'secret', label: 'Secret', icon: 'eye-slash', desc: 'Only members can find this group' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.privacyOption, privacy === option.value && styles.privacyOptionActive]}
                  onPress={() => setPrivacy(option.value)}
                >
                  <View style={styles.privacyOptionHeader}>
                    <Icon name={option.icon} size={20} color={privacy === option.value ? colors.pink : colors.textLight} />
                    <Text style={[styles.privacyOptionLabel, privacy === option.value && styles.privacyOptionLabelActive]}>
                      {option.label}
                    </Text>
                  </View>
                  <Text style={styles.privacyOptionDesc}>{option.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginLeft: spacing.s,
  },
  createButton: {
    backgroundColor: colors.pink,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.m,
  },
  createButtonDisabled: {
    backgroundColor: colors.border,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonTextDisabled: {
    color: colors.textLight,
  },
  content: {
    flex: 1,
  },
  coverImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: spacing.s,
    color: colors.textLight,
    fontSize: 14,
  },
  coverImageOverlay: {
    position: 'absolute',
    bottom: spacing.m,
    right: spacing.m,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: spacing.s,
  },
  profileImageSection: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: spacing.m,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.bg,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.pink,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  form: {
    padding: spacing.m,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.m,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: spacing.m,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.m,
  },
  privacyOptions: {
    gap: spacing.s,
    marginTop: spacing.xs,
  },
  privacyOption: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: spacing.m,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  privacyOptionActive: {
    borderColor: colors.pink,
    backgroundColor: colors.bg,
  },
  privacyOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.xs,
  },
  privacyOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  privacyOptionLabelActive: {
    color: colors.pink,
  },
  privacyOptionDesc: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 28,
  },
});

export default CreateGroupScreen;
