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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAppDispatch } from '../../hooks/hooks';
import { updatePostAsync } from '../../store/slices/postsSlice';
import { colors } from '../../constants/theme';

const EditPostScreen = ({ onBack, post, onPostUpdated }) => {
  const dispatch = useAppDispatch();
  const [content, setContent] = useState(post?.caption || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (post) {
      console.log('Post data for editing:', post);
      setContent(post.caption || post.content || '');
    }
  }, [post]);

  const handleUpdatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please add some content to your post.');
      return;
    }

    setIsLoading(true);
    try {
      const postData = {
        content: content.trim(),
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
        console.log(' Update failed:', result.payload);
        const errorMessage = typeof result.payload === 'string' ? result.payload : 'Failed to update post';
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
        <View style={{ width: 40 }} />
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

        {/* Image Preview - Read Only */}
        {post?.images && post.images.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.imagePreviewTitle}>Images ({post.images.length})</Text>
         
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreview}>
              {post.images.map((imageUri, index) => {
                // post.images is an array of URL strings
                if (!imageUri || typeof imageUri !== 'string') return null;
                return (
                <View key={index} style={styles.imagePreviewItem}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreviewImage} />
                </View>
                );
              })}
            </ScrollView>
          </View>
        )}

      
        <View style={styles.bottomSaveContainer}>
          <TouchableOpacity 
            style={[styles.bottomSaveButton, !content.trim() && styles.bottomSaveButtonDisabled]}
            onPress={handleUpdatePost}
            disabled={isLoading || !content.trim()}
          >
            <Text style={[styles.bottomSaveButtonText, !content.trim() && styles.bottomSaveButtonTextDisabled]}>
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
    marginBottom: 4,
  },
  imagePreviewNote: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 8,
    fontStyle: 'italic',
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
  bottomSaveContainer: {
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  bottomSaveButton: {
    backgroundColor: colors.pink,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.pink,
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
