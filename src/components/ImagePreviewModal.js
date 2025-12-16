import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  FlatList,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../constants/theme';
import { API_CONFIG } from '../config/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImagePreviewModal = ({ visible, images, currentIndex = 0, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const flatListRef = useRef(null);

  React.useEffect(() => {
    if (visible && currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: currentIndex, animated: false });
      }, 100);
    }
  }, [visible, currentIndex]);

  if (!visible || !images || images.length === 0) return null;

  const getImageUri = (image) => {
    if (typeof image === 'string') {
      return image.startsWith('http') ? image : `${API_CONFIG.BASE_URL}${image}`;
    }
    if (image && typeof image === 'object' && image.url) {
      const url = image.url;
      return url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
    }
    return null;
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setActiveIndex(index);
  };

  const renderImage = ({ item, index }) => {
    const imageUri = getImageUri(item);
    if (!imageUri) return null;

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    );
  };

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
          {images.length > 1 && (
            <Text style={styles.imageCounter}>
              {activeIndex + 1} / {images.length}
            </Text>
          )}
          <View style={styles.headerSpacer} />
        </View>

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
          initialScrollIndex={currentIndex}
        />

        {/* Dot Indicators */}
        {images.length > 1 && (
          <View style={styles.dotContainer}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === activeIndex ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCounter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  imageContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
  dotContainer: {
    position: 'absolute',
    bottom: 30,
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

export default ImagePreviewModal;

