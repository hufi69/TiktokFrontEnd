import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAppDispatch } from '../../hooks/hooks';
import { createGroupPost } from '../../store/slices/groupsSlice';
import { colors, spacing, radius } from '../../constants/theme';

const CreateGroupPostScreen = ({ group, onBack, onPostCreated }) => {
  const dispatch = useAppDispatch();
  const groupId = group?._id || group?.id;
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isVideoAsset = (asset) => {
    if (!asset) return false;
    if (asset.type?.startsWith('video/')) return true;
    const uri = asset.uri || '';
    return uri.includes('.mp4') || uri.includes('.mov') || uri.includes('.m4v') || uri.includes('.webm');
  };

  const normalizeAsset = (asset) => {
    const isVideo = isVideoAsset(asset);
    const type = asset.type || (isVideo ? 'video/mp4' : 'image/jpeg');
    const fileName = asset.fileName || (isVideo ? `video_${Date.now()}.mp4` : `image_${Date.now()}.jpg`);

    return {
      uri: asset.uri,
      type,
      fileName,
      name: fileName,
      isVideo,
    };
  };

  const addPickedAssets = (assets) => {
    if (!Array.isArray(assets) || assets.length === 0) return;
    setMedia(prev => {
      const remainingSlots = 5 - prev.length;
      if (remainingSlots <= 0) {
        setTimeout(() => {
          Alert.alert('Limit Reached', 'You can only add up to 5 photos and videos per post.');
        }, 0);
        return prev;
      }

      const mediaToAdd = assets
        .slice(0, remainingSlots)
        .map(normalizeAsset)
        .filter(item => item?.uri);

      if (assets.length > remainingSlots) {
        setTimeout(() => {
          Alert.alert('Limit Reached', `Only ${remainingSlots} item(s) added. Maximum 5 photos and videos per post.`);
        }, 0);
      }

      return [...prev, ...mediaToAdd];
    });
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'TokTok needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const pickFromGallery = async () => {
    try {
      const remainingSlots = 5 - media.length;
      if (remainingSlots <= 0) {
        Alert.alert('Limit Reached', 'You can only add up to 5 photos and videos per post.');
        return;
      }

      const options = {
        mediaType: 'mixed',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        videoQuality: 'high',
        selectionLimit: remainingSlots,
        saveToPhotos: false,
      };

      const result = await launchImageLibrary(options);
      if (result?.didCancel) return;
      if (result?.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick media');
        return;
      }

      addPickedAssets(result.assets);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const captureFromCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    try {
      const remainingSlots = 5 - media.length;
      if (remainingSlots <= 0) {
        Alert.alert('Limit Reached', 'You can only add up to 5 photos and videos per post.');
        return;
      }

      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        saveToPhotos: true,
      };

      const result = await launchCamera(options);
      if (result?.didCancel) return;
      if (result?.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to capture photo');
        return;
      }

      if (result?.assets?.[0]) {
        addPickedAssets([result.assets[0]]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const removeMedia = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) {
      Alert.alert('Error', 'Post must contain either text content or media');
      return;
    }

    if (!groupId) {
      Alert.alert('Error', 'Group not found');
      return;
    }

    setIsLoading(true);
    try {
      const postData = {
        content: content.trim(),
        images: media,
        tags: [],
        mentions: [],
      };

      await dispatch(createGroupPost({ groupId, postData })).unwrap();
      Alert.alert('Success', 'Post created successfully!');
      if (onPostCreated) {
        onPostCreated();
      }
      onBack();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={styles.title}>Create Post</Text>
          <TouchableOpacity
            style={[styles.postButton, (!content.trim() && media.length === 0) && styles.postButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading || (!content.trim() && media.length === 0)}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.postButtonText, (!content.trim() && media.length === 0) && styles.postButtonTextDisabled]}>
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Group Info */}
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group?.name || 'Group'}</Text>
          </View>

          {/* Text Input */}
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textLight}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />

          {/* Media Preview */}
          {media.length > 0 && (
            <View style={styles.mediaContainer}>
              {media.map((item, index) => (
                <View key={index} style={styles.mediaItem}>
                  {item.isVideo ? (
                    <View style={styles.videoPlaceholder}>
                      <Icon name="video-camera" size={40} color={colors.textLight} />
                      <Text style={styles.videoText}>Video</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                  )}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeMedia(index)}
                  >
                    <Icon name="times-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Media Actions */}
          <View style={styles.mediaActions}>
            <TouchableOpacity style={styles.mediaButton} onPress={pickFromGallery}>
              <Icon name="photo" size={20} color={colors.pink} />
              <Text style={styles.mediaButtonText}>Photos/Videos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={captureFromCamera}>
              <Icon name="camera" size={20} color={colors.pink} />
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>
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
  postButton: {
    backgroundColor: colors.pink,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.m,
  },
  postButtonDisabled: {
    backgroundColor: colors.border,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    color: colors.textLight,
  },
  content: {
    flex: 1,
    padding: spacing.m,
  },
  groupInfo: {
    marginBottom: spacing.m,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    fontSize: 16,
    color: colors.text,
    minHeight: 150,
    marginBottom: spacing.m,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  mediaItem: {
    width: '48%',
    aspectRatio: 1,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.m,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textLight,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  mediaActions: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.m,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.m,
    gap: spacing.s,
  },
  mediaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});

export default CreateGroupPostScreen;
