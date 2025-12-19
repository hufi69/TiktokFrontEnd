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
import { CONFIG } from '../../config';
import VideoPlayerModal from '../../components/VideoPlayerModal';

// Try to import react-native-video
let Video = null;
try {
  const videoModule = require('react-native-video');
  Video = videoModule.default || videoModule;
} catch (e) {
  // Video module not available
}

const EditPostScreen = ({ onBack, post, onPostUpdated }) => {
  const dispatch = useAppDispatch();
  const [content, setContent] = useState(post?.caption || '');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
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

        {/* Media Preview - Read Only (Images and Videos) */}
        {(() => {
          // Get media from post - could be in post.media, post.images, or post.videos
          const media = post?.media || [];
          const images = post?.images || [];
          const videos = post?.videos || [];
          
          // Combine all media items
          const allMedia = media.length > 0 
            ? media 
            : [...images.map(img => ({ type: 'image', url: img })), ...videos.map(vid => ({ type: 'video', url: vid }))];
          
          if (allMedia.length === 0) return null;
          
          const isVideo = (item) => {
            if (!item) return false;
            if (item.type === 'video' || item.type?.startsWith('video/')) return true;
            const url = typeof item === 'string' ? item : item.url || '';
            return url.includes('.mp4') || url.includes('.mov') || url.includes('.m4v') || url.includes('.webm');
          };
          
          const getMediaUrl = (item) => {
            if (typeof item === 'string') {
              return item.startsWith('http') ? item : `${CONFIG.API_BASE_URL}${item}`;
            }
            if (item && typeof item === 'object' && item.url) {
              const url = item.url;
              return url.startsWith('http') ? url : `${CONFIG.API_BASE_URL}${url}`;
            }
            return null;
          };
          
          const imageCount = allMedia.filter(m => !isVideo(m)).length;
          const videoCount = allMedia.filter(m => isVideo(m)).length;
          
          return (
            <View style={styles.mediaPreviewContainer}>
              <Text style={styles.mediaPreviewTitle}>
                Media ({allMedia.length}) {imageCount > 0 && `• ${imageCount} image${imageCount > 1 ? 's' : ''}`} {videoCount > 0 && `• ${videoCount} video${videoCount > 1 ? 's' : ''}`}
              </Text>
              <Text style={styles.mediaPreviewNote}>Media cannot be edited</Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreview}>
                {allMedia.map((item, index) => {
                  const itemIsVideo = isVideo(item);
                  const mediaUrl = getMediaUrl(item);
                  
                  if (!mediaUrl) return null;
                  
                  if (itemIsVideo) {
                    const thumbnail = item.thumbnailUrl || item.thumbnail;
                    const thumbnailUri = thumbnail
                      ? (thumbnail.startsWith('http') ? thumbnail : `${CONFIG.API_BASE_URL}${thumbnail}`)
                      : null;
                    const canUseVideoThumbnail = Video && (typeof Video === 'function' || typeof Video === 'object');
                    const fullVideoUrl = mediaUrl.startsWith('http') ? mediaUrl : `${CONFIG.API_BASE_URL}${mediaUrl}`;
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.mediaPreviewItem}
                        onPress={() => setSelectedVideo(fullVideoUrl)}
                        activeOpacity={0.9}
                      >
                        {thumbnailUri ? (
                          <Image
                            source={{ uri: thumbnailUri }}
                            style={styles.mediaPreviewImage}
                            resizeMode="cover"
                          />
                        ) : canUseVideoThumbnail ? (
                          <View style={styles.videoThumbnailContainer}>
                            <Video
                              source={{ uri: fullVideoUrl }}
                              style={styles.mediaPreviewImage}
                              resizeMode="cover"
                              paused={true}
                              controls={false}
                              muted={true}
                              repeat={false}
                            />
                          </View>
                        ) : (
                          <View style={styles.videoPlaceholder}>
                            <Icon name="video-camera" size={24} color={colors.textLight} />
                          </View>
                        )}
                        <View style={styles.videoOverlay}>
                          <Icon name="play-circle" size={20} color="white" />
                        </View>
                      </TouchableOpacity>
                    );
                  } else {
                    return (
                      <View key={index} style={styles.mediaPreviewItem}>
                        <Image source={{ uri: mediaUrl }} style={styles.mediaPreviewImage} />
                      </View>
                    );
                  }
                })}
              </ScrollView>
            </View>
          );
        })()}
        
        {/* Video Player Modal */}
        {selectedVideo && (
          <VideoPlayerModal
            videoUri={selectedVideo}
            visible={!!selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
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
  mediaPreviewContainer: {
    marginBottom: 16,
  },
  mediaPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  mediaPreviewNote: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  mediaPreview: {
    flexDirection: 'row',
  },
  mediaPreviewItem: {
    marginRight: 12,
    position: 'relative',
  },
  mediaPreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  videoThumbnailContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  videoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
