import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAppDispatch } from '../../hooks/hooks';
import { createPost } from '../../store/slices/postsSlice';
import { colors } from '../../constants/theme';

const CreatePostScreen = ({ onBack, onPostCreated }) => {
  const dispatch = useAppDispatch();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleMediaPicker = async (type) => {
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
        multiple: type === 'gallery',
        selectionLimit: type === 'gallery' ? remainingSlots : 1,
        saveToPhotos: false,
      };

      const result = type === 'camera' 
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (result.assets && result.assets.length > 0) {
        const mediaToAdd = result.assets.slice(0, remainingSlots);
        const newMedia = mediaToAdd.map(asset => ({
          uri: asset.uri,
          type: asset.type || (asset.uri?.includes('.mp4') || asset.uri?.includes('.mov') ? 'video/mp4' : 'image/jpeg'),
          name: asset.fileName || (asset.type?.startsWith('video/') ? `video_${Date.now()}.mp4` : `image_${Date.now()}.jpg`),
          isVideo: asset.type?.startsWith('video/') || asset.uri?.includes('.mp4') || asset.uri?.includes('.mov'),
        }));
        setMedia([...media, ...newMedia]);
        if (result.assets.length > remainingSlots) {
          Alert.alert('Limit Reached', `Only ${remainingSlots} item(s) added. Maximum 5 photos and videos per post.`);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const removeMedia = (index) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!content.trim() && media.length === 0) {
      Alert.alert('Error', 'Please add some content or media');
      return;
    }

    setIsLoading(true);
    try {
      console.log(' Creating post with:', { content: content.trim(), media: media.length });
      const result = await dispatch(createPost({
        content: content.trim(),
        images: media // Keep as 'images' for backend compatibility, but it includes videos
      }));
      
      console.log(' Create post result:', result);
      
      if (createPost.fulfilled.match(result)) {
        console.log(' Post created successfully!');
        Alert.alert('Success', 'Post created successfully!');
        onPostCreated?.();
      } else if (createPost.rejected.match(result)) {
        console.log(' Post creation failed:', result.error);
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to create post';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.log(' Post creation error:', error);
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="times" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity 
            style={[styles.postButton, (!content.trim() && media.length === 0) && styles.postButtonDisabled]}
            onPress={handleCreatePost}
            disabled={isLoading || (!content.trim() && media.length === 0)}
          >
            <Text style={[styles.postButtonText, (!content.trim() && media.length === 0) && styles.postButtonTextDisabled]}>
              {isLoading ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textLight}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {media.length > 0 && (
            <View style={styles.mediaGrid}>
              {media.map((item, index) => (
                <View key={index} style={styles.mediaContainer}>
                  {item.isVideo ? (
                    <View style={styles.videoContainer}>
                      <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
                      <View style={styles.videoOverlay}>
                        <Icon name="play-circle" size={32} color="white" />
                      </View>
                    </View>
                  ) : (
                    <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
                  )}
                  <TouchableOpacity 
                    style={styles.removeMediaButton}
                    onPress={() => removeMedia(index)}
                  >
                    <Icon name="times" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleMediaPicker('gallery')}
            >
              <Icon name="image" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Photos & Videos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleMediaPicker('camera')}
            >
              <Icon name="camera" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Camera</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  postButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: colors.border,
  },
  postButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    color: colors.textLight,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    padding: 0,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  mediaContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 8,
  },
  actionButtonText: {
    color: colors.text,
    fontWeight: '500',
  },
});

export default CreatePostScreen;
