import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../constants/theme';
import { CONFIG } from '../config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

let Video = null;
let isVideoAvailable = false;

try {
  const videoModule = require('react-native-video');
  Video = videoModule.default || videoModule;
  if (Video && (typeof Video === 'function' || typeof Video === 'object')) {
    isVideoAvailable = true;
    console.log('react-native-video module loaded successfully');
  } else {
    console.warn('react-native-video module loaded', typeof Video);
  }
} catch (e) {
  console.warn('react-native-video not available:', e.message);
  isVideoAvailable = false;
  Video = null;
}

const VideoPlayerModal = ({ visible, videoUri, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [nativeModuleError, setNativeModuleError] = useState(false);
  const [isPaused, setIsPaused] = useState(true); // Start paused, will be set to false when modal opens
  const videoRef = useRef(null);
  const fullVideoUri = videoUri && videoUri.startsWith('http') 
    ? videoUri 
    : videoUri ? `${CONFIG.API_BASE_URL}${videoUri}` : '';

  const canUseVideo = isVideoAvailable && Video && (typeof Video === 'function' || typeof Video === 'object');

  useEffect(() => {
    console.log(' VideoPlayerModal useEffect:', { visible, videoUri: videoUri?.substring(0, 50), fullVideoUri: fullVideoUri?.substring(0, 50) });
    if (visible && videoUri) {
      console.log(' VideoPlayerModal opened:', {
        isVideoAvailable,
        hasVideo: !!Video,
        videoType: typeof Video,
        canUseVideo,
        nativeModuleError,
        videoUri: fullVideoUri.substring(0, 80) + '...',
        fullVideoUri: fullVideoUri
      });
     
      setIsLoading(true);
      setHasError(false);
      setIsPaused(false);
    } else if (!visible) {
    
      setIsPaused(true);
    }
  }, [visible, videoUri, isVideoAvailable, Video, canUseVideo, nativeModuleError, fullVideoUri]);

  if (!visible || !videoUri) return null;

  if (!canUseVideo || nativeModuleError) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={false}
        onRequestClose={onClose}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="times" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.fallbackContainer}>
            <Icon name="exclamation-triangle" size={48} color={colors.textLight} />
            <Text style={styles.fallbackText}>
              Video player not available
            </Text>
            {/* <Text style={styles.fallbackSubtext}>
              {nativeModuleError 
                ? 'Native module not linked. Please rebuild the app:\n\nFor Android: npm run android\nFor iOS: cd ios && pod install && cd .. && npm run ios'
                : 'Please install react-native-video to play videos'}
            </Text> */}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="times" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.videoContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          
          {hasError ? (
            <View style={styles.errorContainer}>
              <Icon name="exclamation-circle" size={48} color="#fff" />
              <Text style={styles.errorText}>Failed to load video</Text>
              <TouchableOpacity onPress={onClose} style={styles.errorButton}>
                <Text style={styles.errorButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: fullVideoUri }}
              style={styles.video}
              controls={true}
              resizeMode="contain"
              volume={1.0}
              muted={false}
              onLoad={() => {
                console.log('✅ Video loaded successfully:', fullVideoUri.substring(0, 80));
                setIsLoading(false);
                setHasError(false);
                setNativeModuleError(false);
                setIsPaused(false);
              }}
              onLoadStart={() => {
                console.log('🔄 Video load started:', fullVideoUri.substring(0, 80));
                setIsLoading(true);
                setIsPaused(false);
              }}
              onReadyForDisplay={() => {
                console.log('▶️ Video ready for display - starting playback');
                setIsPaused(false);
                setIsLoading(false);
              }}
              onBuffer={(data) => {
                console.log('uffer:', data.isBuffering ? 'Buffering...' : 'Buffered');
                if (data.isBuffering) {
                  setIsLoading(true);
                } else {
                  setIsLoading(false);
                }
              }}
              onProgress={(data) => {
                // Video is playing if we're receiving progress updates
                if (data.currentTime > 0 && isLoading) {
                  console.log('▶️ Video is playing, currentTime:', data.currentTime.toFixed(2));
                  setIsLoading(false);
                }
              }}
              onError={(error) => {
                console.error('Video playback error:', error);
                const errorMessage = error?.nativeEvent?.error || error?.message || '';
              
                if (errorMessage.includes('RCTVideo') || 
                    errorMessage.includes('View config not found') ||
                    errorMessage.includes('undefined is not an object')) {
                  console.error('Native module error detected');
                  setNativeModuleError(true);
                } else {
                  setHasError(true);
                }
                setIsLoading(false);
              }}
              paused={isPaused}
              repeat={false}
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="ignore"
              key={fullVideoUri} 
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: screenWidth,
    height: screenHeight,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  fallbackSubtext: {
    color: colors.textLight,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default VideoPlayerModal;
