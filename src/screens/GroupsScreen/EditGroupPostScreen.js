import React, { useState, useEffect } from 'react';
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
import { updateGroupPost } from '../../store/slices/groupsSlice';
import { colors, spacing, radius } from '../../constants/theme';
import { CONFIG } from '../../config';

const getMediaUrl = (mediaItem) => {
  if (!mediaItem) return null;
  if (typeof mediaItem === 'string') {
    // If it's already a URL string
    if (mediaItem.startsWith('http')) return mediaItem;
    const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
    return `${baseUrl}${mediaItem}`;
  }
  // If it's an object with url property
  if (mediaItem.url) {
    if (mediaItem.url.startsWith('http')) return mediaItem.url;
    const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
    return `${baseUrl}${mediaItem.url}`;
  }
  return null;
};

const EditGroupPostScreen = ({ group, post, onBack, onPostUpdated, userRole }) => {
  const dispatch = useAppDispatch();
  const groupId = group?._id || group?.id;
  const postId = post?._id || post?.id;
  const isAdmin = userRole === 'admin';
  
  const [content, setContent] = useState(post?.content || '');
  const [media, setMedia] = useState([]);
  const [tags, setTags] = useState(post?.tags?.join(', ') || '');
  const [status, setStatus] = useState(post?.status || 'published');
  const [isPinned, setIsPinned] = useState(post?.isPinned || false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (post?.media && Array.isArray(post.media)) {
      const existingMedia = post.media.map((item) => {
        let originalUrl = null;
        if (typeof item === 'string') {
          originalUrl = item;
        } else if (item.url) {
          originalUrl = item.url; 
        }
        const displayUrl = getMediaUrl(item); 
        
        return {
          uri: displayUrl,
          type: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
          fileName: item.filename || (item.type === 'video' ? 'video.mp4' : 'image.jpg'),
          name: item.filename || (item.type === 'video' ? 'video.mp4' : 'image.jpg'),
          isVideo: item.type === 'video',
          isExisting: true, 
          existingUrl: originalUrl, 
        };
      });
      setMedia(existingMedia);
    }
    if (post?.content) {
      setContent(post.content);
    }
    if (post?.tags) {
      setTags(post.tags.join(', '));
    }
    if (post?.status) {
      setStatus(post.status);
    }
    if (post?.isPinned !== undefined) {
      setIsPinned(post.isPinned);
    }
  }, [post]);
  console.log('media', media);
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
      isExisting: false,
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
    if (!content.trim()) {
      Alert.alert('Error', 'Post content is required');
      return;
    }

    if (!groupId || !postId) {
      Alert.alert('Error', 'Group or post not found');
      return;
    }

    setIsLoading(true);
    try {
      // Parse tags
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
      const existingMediaUrls = media
        .filter(m => m.isExisting && m.existingUrl)
        .map(m => {
          const url = m.existingUrl;
          if (url.startsWith('http')) return url;
          const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
          return `${baseUrl}${url}`;
        });

      const postData = {
        content: content.trim(),
        tags: tagsArray,
      };

      // Include existing media URLs 
      if (existingMediaUrls.length > 0) {
        postData.media = existingMediaUrls;
      } else if (post?.media && post.media.length > 0) {
        postData.media = post.media.map(m => {
          let url = null;
          if (typeof m === 'string') {
            url = m;
          } else if (m.url) {
            url = m.url;
          }
          if (url) {
            if (url.startsWith('http')) return url;
            const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
            return `${baseUrl}${url}`;
          }
          return null;
        }).filter(Boolean);
      } else {
        postData.media = [];
      }

      if (isAdmin) {
        postData.status = status;
        postData.isPinned = isPinned;
      }

      await dispatch(updateGroupPost({ groupId, postId, postData })).unwrap();
      Alert.alert('Success', 'Post updated successfully!');
      if (onPostUpdated) {
        onPostUpdated();
      }
      onBack();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update post');
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
          <Text style={styles.title}>Edit Post</Text>
          <TouchableOpacity
            style={[styles.postButton, (!content.trim() && media.length === 0) && styles.postButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading || (!content.trim() && media.length === 0)}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.postButtonText, (!content.trim() && media.length === 0) && styles.postButtonTextDisabled]}>
                Save
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

          {/* Tags Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags (comma-separated)</Text>
            <TextInput
              style={styles.tagsInput}
              placeholder="e.g., announcement, update"
              placeholderTextColor={colors.textLight}
              value={tags}
              onChangeText={setTags}
            />
          </View>

          {/* Admin-only fields */}
          {isAdmin && (
            <>
              {/* Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={styles.statusOptions}>
                  {['published', 'pending', 'deleted'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusOption, status === s && styles.statusOptionActive]}
                      onPress={() => setStatus(s)}
                    >
                      <Text style={[styles.statusOptionText, status === s && styles.statusOptionTextActive]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Pin Post */}
              <View style={styles.section}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Pin Post</Text>
                  <TouchableOpacity
                    style={[styles.switch, isPinned && styles.switchActive]}
                    onPress={() => setIsPinned(!isPinned)}
                  >
                    <View style={[styles.switchThumb, isPinned && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Media Preview - Read Only */}
          {media.length > 0 && (
            <View style={styles.mediaContainer}>
              <Text style={styles.mediaSectionTitle}>Media (Cannot be edited)</Text>
              {media.map((item, index) => (
                <View key={index} style={styles.mediaItem}>
                  {item.isVideo ? (
                    <View style={styles.videoPlaceholder}>
                      <Icon name="video-camera" size={40} color={colors.textLight} />
                      <Text style={styles.videoText}>Video</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: item.uri || item.existingUrl }} style={styles.mediaImage} />
                  )}
                </View>
              ))}
            </View>
          )}
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
  section: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.s,
  },
  tagsInput: {
    fontSize: 16,
    color: colors.text,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  statusOption: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOptionActive: {
    backgroundColor: colors.pink,
    borderColor: colors.pink,
  },
  statusOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  statusOptionTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: colors.pink,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  mediaContainer: {
    marginBottom: spacing.m,
  },
  mediaSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.s,
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
  existingBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.s,
  },
  existingBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
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

export default EditGroupPostScreen;
