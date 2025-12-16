import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../../constants/theme';
import { CONFIG } from '../../../config';
import VideoPlayerModal from '../../../components/VideoPlayerModal';

// Try to import native-video 
let Video = null;
try {
  const videoModule = require('react-native-video');
  Video = videoModule.default || videoModule;
} catch (e) {
  
}

const { width: screenWidth } = Dimensions.get('window');

const ImageCarousel = ({ images, style }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const flatListRef = useRef(null);

  const isVideo = (media) => {
    if (!media) return false;
    if (media.type === 'video' || media.type?.startsWith('video/')) return true;
    const url = typeof media === 'string' ? media : media.url || '';
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.m4v') || url.includes('.webm');
  };

  const getMediaUri = (media) => {
    if (typeof media === 'string') {
      return media.startsWith('http') ? media : `${CONFIG.API_BASE_URL}${media}`;
    }
    if (media && typeof media === 'object' && media.url) {
      const url = media.url;
      return url.startsWith('http') ? url : `${CONFIG.API_BASE_URL}${url}`;
    }
    return 'https://via.placeholder.com/300x300/f0f0f0/ccc?text=No+Image';
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentIndex(index);
  };


  const renderImage = ({ item, index }) => {
    const mediaUri = getMediaUri(item);
    const itemIsVideo = isVideo(item);

  
    if (itemIsVideo) {
      const videoUrl = typeof item === 'string' 
        ? item 
        : (item.url || mediaUri);
      
     
      const fullVideoUrl = videoUrl.startsWith('http') 
        ? videoUrl 
        : `${CONFIG.API_BASE_URL}${videoUrl}`;
      
      const thumbnail = item.thumbnailUrl || item.thumbnail;
      const thumbnailUri = thumbnail
        ? (thumbnail.startsWith('http') 
            ? thumbnail 
            : `${CONFIG.API_BASE_URL}${thumbnail}`)
        : null;
      const canUseVideoThumbnail = Video && (typeof Video === 'function' || typeof Video === 'object');

      return (
        <TouchableOpacity
          style={styles.mediaContainer}
          activeOpacity={0.9}
          onPress={() => setSelectedVideo(videoUrl)}
        >
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.image}
              resizeMode="cover"
              onError={(error) => {
                console.error(`Video thumbnail ${index} failed to load:`, error.nativeEvent.error);
              }}
            />
          ) : canUseVideoThumbnail ? (
            <View style={styles.videoThumbnailContainer}>
              <Video
                source={{ uri: fullVideoUrl }}
                style={styles.image}
                resizeMode="cover"
                paused={true}
                controls={false}
                muted={true}
                repeat={false}
                poster={null}
                posterResizeMode="cover"
              />
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Icon name="video-camera" size={64} color={colors.textLight} />
              <Text style={styles.videoPlaceholderText}>Video</Text>
            </View>
          )}
          <View style={styles.videoOverlay} pointerEvents="none">
            <View style={styles.playButton}>
              <Icon name="play-circle" size={64} color="white" />
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // For images, render normally
    return (
      <Image
        source={{ uri: mediaUri }}
        style={styles.image}
        resizeMode="cover"
        onError={(error) => {
          console.error(`Image ${index} failed to load:`, error.nativeEvent.error);
        }}
      />
    );
  };

  const renderDotIndicator = (index) => (
    <View
      key={index}
      style={[
        styles.dot,
        index === currentIndex ? styles.activeDot : styles.inactiveDot
      ]}
    />
  );

  // for the handling of the images array
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <View style={[styles.container, style]}>
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImage}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          initialNumToRender={1}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={true}
        />
        
        {/* Dot Indicators */}
        {images.length > 1 && (
          <View style={styles.dotContainer}>
            {images.map((_, index) => renderDotIndicator(index))}
          </View>
        )}
      </View>

      {/* Video Player Modal */}
      <VideoPlayerModal
        visible={!!selectedVideo}
        videoUri={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  mediaContainer: {
    width: screenWidth,
    height: screenWidth,
    position: 'relative',
  },
  image: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: colors.bgAlt,
  },
  videoThumbnailContainer: {
    width: screenWidth,
    height: screenWidth,
    overflow: 'hidden',
    backgroundColor: colors.bgAlt,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: colors.bgAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    color: colors.textLight,
    fontWeight: '500',
  },
  dotContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

export default ImageCarousel;