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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAppDispatch } from '../../hooks/hooks';
import { updatePostAsync } from '../../store/slices/postsSlice';
import { colors } from '../../constants/theme';

const EditPostScreen = ({ onBack, post, onPostUpdated }) => {
  const dispatch = useAppDispatch();
  const [content, setContent] = useState(post?.caption || '');
  const [images, setImages] = useState(post?.images || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (post) {
      console.log('Post data for editing:', post);
      setContent(post.caption || post.content || '');
      setImages(post.images || []);
    }
  }, [post]);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const { PermissionsAndroid } = require('react-native');
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos.',
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

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const { PermissionsAndroid } = require('react-native');
      try {
        // Request both READ and WRITE permissions
        const readGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to your storage to select photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        const writeGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to your storage to select photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        return readGranted === PermissionsAndroid.RESULTS.GRANTED && 
               writeGranted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      });

      if (!result.didCancel && result.assets && result.assets.length > 0) {
        const newImage = {
          uri: result.assets[0].uri,
          type: result.assets[0].type || 'image/jpeg',
          name: result.assets[0].fileName || 'photo.jpg',
        };
        setImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSelectImage = async () => {
    try {
      // For Android latest version
      if (Platform.OS === 'android' && Platform.Version < 33) {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required', 
            'Storage permission is required to select images. Please grant permission in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {
                // Open app settings
                if (Platform.OS === 'android') {
                  const { Linking } = require('react-native');
                  Linking.openSettings();
                }
              }}
            ]
          );
          return;
        }
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        selectionLimit: 10 - images.length,
      });

      if (!result.didCancel && result.assets) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'image.jpg',
        }));
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePost = async () => {
    if (!content.trim() && images.length === 0) {
      Alert.alert('Error', 'Please add some content or images to your post.');
      return;
    }

    setIsLoading(true);
    try {
      const postData = {
        content: content.trim(),
        images: images,
      };

      console.log('Updating post:', { postId: post._id || post.id, postData });
      const result = await dispatch(updatePostAsync({ postId: post._id || post.id, postData }));
      console.log(' Update result:', result);
      
      if (updatePostAsync.fulfilled.match(result)) {
        console.log(' Post updated successfully:', result.payload);
        Alert.alert('Success', 'Post updated successfully!');
        if (onPostUpdated) {
          onPostUpdated(result.payload.post);
        }
      } else if (updatePostAsync.rejected.match(result)) {
        console.log(' Update failed:', result.error);
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to update post';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error(' Update post error:', error);
      Alert.alert('Error', 'Failed to update post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Post</Text>
        <TouchableOpacity 
          style={[styles.saveButton, (!content.trim() && images.length === 0) && styles.saveButtonDisabled]}
          onPress={handleUpdatePost}
          disabled={isLoading || (!content.trim() && images.length === 0)}
        >
          <Text style={[styles.saveButtonText, (!content.trim() && images.length === 0) && styles.saveButtonTextDisabled]}>
            {isLoading ? 'Updating...' : 'Save'}
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
          maxLength={1000}
          textAlignVertical="top"
        />

        {/* Image Preview */}
        {images.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.imagePreviewTitle}>Images ({images.length}/10)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreview}>
              {images.map((image, index) => (
                <View key={index} style={styles.imagePreviewItem}>
                  <Image source={{ uri: image.uri }} style={styles.imagePreviewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Icon name="times" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Add Image Buttons */}
        {images.length < 10 && (
          <View style={styles.addImageContainer}>
            <TouchableOpacity style={styles.addImageButton} onPress={handleTakePhoto}>
              <Icon name="camera" size={24} color={colors.primary} />
              <Text style={styles.addImageText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addImageButton} onPress={handleSelectImage}>
              <Icon name="image" size={24} color={colors.primary} />
              <Text style={styles.addImageText}>Select Image</Text>
            </TouchableOpacity>
          </View>
        )}

      
        <View style={styles.bottomSaveContainer}>
          <TouchableOpacity 
            style={[styles.bottomSaveButton, (!content.trim() && images.length === 0) && styles.bottomSaveButtonDisabled]}
            onPress={handleUpdatePost}
            disabled={isLoading || (!content.trim() && images.length === 0)}
          >
            <Text style={[styles.bottomSaveButtonText, (!content.trim() && images.length === 0) && styles.bottomSaveButtonTextDisabled]}>
              {isLoading ? 'Updating...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 36,
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButtonTextDisabled: {
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
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    marginBottom: 16,
  },
  imagePreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  imagePreview: {
    flexDirection: 'row',
  },
  imagePreviewItem: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  addImageButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    minWidth: 120,
  },
  addImageText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  bottomSaveContainer: {
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  bottomSaveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 50,
  },
  bottomSaveButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  bottomSaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomSaveButtonTextDisabled: {
    color: colors.textLight,
  },
});

export default EditPostScreen;
