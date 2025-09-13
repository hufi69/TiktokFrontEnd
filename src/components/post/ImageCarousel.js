import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { colors } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

const ImageCarousel = ({ images, style }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  // FIXED: Function to handle both string URLs and media objects
  const getImageUri = (media) => {
    // If it's already a string URL
    if (typeof media === 'string') {
      return media.startsWith('http') ? media : `http://10.0.2.2:8000${media}`;
    }
    
    // If it's a media object from backend
    if (media && typeof media === 'object' && media.url) {
      const url = media.url;
      return url.startsWith('http') ? url : `http://10.0.2.2:8000${url}`;
    }
    
    // Fallback placeholder
    return 'https://via.placeholder.com/300x300/f0f0f0/ccc?text=No+Image';
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentIndex(index);
  };

  // FIXED: Updated renderImage to handle media objects
  const renderImage = ({ item, index }) => {
    const imageUri = getImageUri(item);
    
    console.log(`📸 Rendering image ${index}:`, {
      original: item,
      processedUri: imageUri
    });

    return (
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="cover"
        onError={(error) => {
          console.error(`📸 Image ${index} failed to load:`, error.nativeEvent.error);
        }}
        onLoad={() => {
          console.log(`📸 Image ${index} loaded successfully`);
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

  // FIXED: Added safety check for images array
  if (!images || images.length === 0) {
    console.log('📸 ImageCarousel: No images provided');
    return null;
  }

  console.log('📸 ImageCarousel received images:', images.length, 'items');

  return (
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: colors.bgAlt,
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