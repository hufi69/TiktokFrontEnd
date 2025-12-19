import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Alert, RefreshControl, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../constants/theme';
import { API_CONFIG } from '../../config/api';
import VideoPlayerModal from '../../components/VideoPlayerModal';
import ImagePreviewModal from '../../components/ImagePreviewModal';
import ImageCarousel from '../../screens/HomeScreen/components/ImageCarousel';
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Try to import react-native-video for thumbnail generation
let Video = null;
try {
  const videoModule = require('react-native-video');
  Video = videoModule.default || videoModule;
} catch (e) {
  // Video not available
}
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import {
  fetchUserProfile,
  fetchUserFollowers,
  fetchUserFollowing,
  fetchUserPosts,
  followUser,
  unfollowUser,
  checkIsFollowing,
  clearUserPosts
} from '../../store/slices/userSlice';
import { setSelectedChatUser, setCurrentScreen } from '../../store/slices/uiSlice';
import BackButton from '../../components/common/BackButton';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';


const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  return /^https?:\/\//.test(profilePicture)
    ? profilePicture
    : `${API_CONFIG.BASE_URL}/public/uploads/users/${profilePicture}`;
};

const ProfileHeader = ({ user, onEditProfile, onSettings, isOwnProfile, onFollowToggle, onFollowSomeone, isFollowing, isLoading, onProfilePicturePress, onMessagePress }) => {
  const dispatch = useAppDispatch();
  const { postsCount, userPosts } = useAppSelector(state => state.user);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserPosts(user._id));
    }
  }, [user?._id, dispatch]);
// followers and following of the user 
  const followersCount = user?.followers ?? 0;
  const followingCount = user?.following ?? 0;
  const displayPostsCount = postsCount || userPosts?.length || 0;

  return (
    <View style={styles.header}>
      <View style={styles.profileInfo}>
        <TouchableOpacity onPress={onProfilePicturePress} activeOpacity={0.8}>
          <Image
            source={{ uri: getAvatarUrl(user?.profilePicture) }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <View style={styles.profileDetails}>
          <Text style={styles.username}>{user?.userName || user?.fullName || 'Unknown User'}</Text>
          <Text style={styles.fullName}>{user?.fullName}</Text>
          <Text style={styles.occupation}>{user?.occupation || 'No occupation'}</Text>
          <Text style={styles.location}>{user?.country || 'No location'}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{displayPostsCount}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{followersCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {isOwnProfile ? (
          <>
            <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={onSettings}>
              <Icon name="cog" size={20} color={colors.text} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
                isLoading && styles.disabledButton
              ]}
              onPress={onFollowToggle}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText
              ]}>
                {isLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={onMessagePress}
              activeOpacity={0.7}
            >
              <Icon name="comment" size={16} color={colors.pink} />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Follow Someone Button  */}
      {isOwnProfile && (
        <View style={styles.followSomeoneContainer}>
          <TouchableOpacity style={styles.followSomeoneButton} onPress={onFollowSomeone}>
            <Icon name="user-plus" size={16} color={'#fff'} />
            <Text style={styles.followSomeoneText}>Follow Someone</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const FollowButton = ({ userId, isFollowing, onToggleFollow, loading }) => {
  const dispatch = useAppDispatch();

  const handleToggleFollow = async () => {
    try {
      if (isFollowing) {
        await dispatch(unfollowUser(userId)).unwrap();
      } else {
        await dispatch(followUser(userId)).unwrap();
      }
      onToggleFollow && onToggleFollow();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update follow status');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.followButton,
        isFollowing && styles.followingButton,
        loading && styles.disabledButton
      ]}
      onPress={handleToggleFollow}
      disabled={loading}
    >
      <Text style={[
        styles.followButtonText,
        isFollowing && styles.followingButtonText
      ]}>
        {loading ? '...' : (isFollowing ? 'Following' : 'Follow')}
      </Text>
    </TouchableOpacity>
  );
};

// Fullscreen Media Carousel Modal Component - Handles both images and videos
const MediaCarouselModal = ({ media, currentIndex = 0, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: currentIndex, animated: false });
      }, 100);
    }
  }, [currentIndex]);

  const isVideo = (item) => {
    if (!item) return false;
    if (item.type === 'video' || item.type?.startsWith('video/')) return true;
    const url = typeof item === 'string' ? item : item.url || '';
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.m4v') || url.includes('.webm');
  };

  const getMediaUri = (item) => {
    if (typeof item === 'string') {
      return item.startsWith('http') ? item : `${API_CONFIG.BASE_URL}${item}`;
    }
    if (item && typeof item === 'object' && item.url) {
      const url = item.url;
      return url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
    }
    return null;
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setActiveIndex(index);
  };

  const renderMedia = ({ item, index }) => {
    const mediaUri = getMediaUri(item);
    const itemIsVideo = isVideo(item);

    if (itemIsVideo) {
      const videoUrl = typeof item === 'string' 
        ? item 
        : (item.url || mediaUri);
      
      const fullVideoUrl = videoUrl.startsWith('http') 
        ? videoUrl 
        : `${API_CONFIG.BASE_URL}${videoUrl}`;
      
      const thumbnail = item.thumbnailUrl || item.thumbnail;
      const thumbnailUri = thumbnail
        ? (thumbnail.startsWith('http') 
            ? thumbnail 
            : `${API_CONFIG.BASE_URL}${thumbnail}`)
        : null;
      const canUseVideoThumbnail = Video && (typeof Video === 'function' || typeof Video === 'object');

      return (
        <TouchableOpacity
          style={mediaCarouselStyles.mediaContainer}
          activeOpacity={0.9}
          onPress={() => {
           
            setSelectedVideo(fullVideoUrl);
          }}
        >
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={mediaCarouselStyles.media}
              resizeMode="contain"
            />
          ) : canUseVideoThumbnail ? (
            <View style={mediaCarouselStyles.videoThumbnailContainer}>
              <Video
                source={{ uri: fullVideoUrl }}
                style={mediaCarouselStyles.media}
                resizeMode="contain"
                paused={true}
                controls={false}
                muted={true}
                repeat={false}
              />
            </View>
          ) : (
            <View style={mediaCarouselStyles.videoPlaceholder}>
              <Icon name="video-camera" size={64} color={colors.textLight} />
              <Text style={mediaCarouselStyles.videoPlaceholderText}>Video</Text>
            </View>
          )}
          <View style={mediaCarouselStyles.videoOverlay} pointerEvents="box-none">
            <TouchableOpacity 
              style={mediaCarouselStyles.playButton}
              onPress={() => {
               
                setSelectedVideo(fullVideoUrl);
              }}
              activeOpacity={0.8}
            >
              <Icon name="play-circle" size={64} color="white" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    // For images, render normally with fullscreen sizing
    return (
      <View style={mediaCarouselStyles.mediaContainer}>
        <Image
          source={{ uri: mediaUri }}
          style={mediaCarouselStyles.media}
          resizeMode="contain"
        />
      </View>
    );
  };

  if (!media || media.length === 0) return null;

  return (
    <>
      <Modal
        visible={!!media}
        animationType="fade"
        transparent={false}
        onRequestClose={onClose}
      >
        <View style={mediaCarouselStyles.container}>
          <View style={mediaCarouselStyles.header}>
            <TouchableOpacity onPress={onClose} style={mediaCarouselStyles.closeButton}>
              <Icon name="times" size={24} color="#fff" />
            </TouchableOpacity>
            {media.length > 1 && (
              <Text style={mediaCarouselStyles.counter}>
                {activeIndex + 1} / {media.length}
              </Text>
            )}
            <View style={mediaCarouselStyles.headerSpacer} />
          </View>

          <FlatList
            ref={flatListRef}
            data={media}
            renderItem={renderMedia}
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
          {media.length > 1 && (
            <View style={mediaCarouselStyles.dotContainer}>
              {media.map((_, index) => (
                <View
                  key={index}
                  style={[
                    mediaCarouselStyles.dot,
                    index === activeIndex ? mediaCarouselStyles.activeDot : mediaCarouselStyles.inactiveDot
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>

      {/* Video Player Modal */}
      <VideoPlayerModal
        visible={!!selectedVideo}
        videoUri={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </>
  );
};

const UserListItem = ({ user, onPress, showFollowButton = false, isMutual = false }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    //implement later 
  }, [user]);

  return (
    <TouchableOpacity style={styles.userListItem} onPress={() => onPress(user)}>
      <Image
        source={{ uri: getAvatarUrl(user?.profilePicture) }}
        style={styles.userListItemImage}
      />
      <View style={styles.userListItemInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userListItemName}>{user?.fullName || user?.userName}</Text>
          {isMutual && (
            <Text style={styles.mutualText}>mutual</Text>
          )}
        </View>
        <Text style={styles.userListItemOccupation}>
          {user?.occupation || user?.user?.occupation }
        </Text>
      </View>
      {showFollowButton && (
        <FollowButton
          userId={user._id}
          isFollowing={isFollowing}
          onToggleFollow={() => setIsFollowing(!isFollowing)}
          loading={loading}
        />
      )}
    </TouchableOpacity>
  );
};

const PostGrid = ({ posts, onPostPress, refreshing, onRefresh, onCreatePost, isOwnProfile }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedImages, setSelectedImages] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const isVideo = (media) => {
    if (!media) return false;
    if (media.type === 'video' || media.type?.startsWith('video/')) return true;
    const url = typeof media === 'string' ? media : media.url || '';
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.m4v') || url.includes('.webm');
  };

  const renderPostItem = ({ item }) => {
    const media = item.media || [];
    const images = media.filter(m => m.type === 'image' && m.url);
    const videos = media.filter(m => isVideo(m) && m.url);
    
    // Get the first media item - prioritize videos if they exist, otherwise use images
    // This ensures videos are visible in the grid
    const firstMedia = videos[0] || images[0];
    const hasMultipleMedia = media.length > 1;
    
    // Determine if first item is a video
    const firstIsVideo = firstMedia && isVideo(firstMedia);
    
    // Get thumbnail or video URL
    let mediaUri = null;
    if (firstMedia) {
      if (firstIsVideo) {
        const thumbnail = firstMedia.thumbnailUrl || firstMedia.thumbnail;
        mediaUri = thumbnail
          ? (thumbnail.startsWith('http') ? thumbnail : `${API_CONFIG.BASE_URL}${thumbnail}`)
          : null;
        // If no thumbnail, we'll use Video component
      } else {
        mediaUri = firstMedia.url.startsWith('http') 
          ? firstMedia.url 
          : `${API_CONFIG.BASE_URL}${firstMedia.url}`;
      }
    }

    const videoUrl = firstIsVideo && firstMedia?.url
      ? (firstMedia.url.startsWith('http') ? firstMedia.url : `${API_CONFIG.BASE_URL}${firstMedia.url}`)
      : null;

    const canUseVideoThumbnail = Video && (typeof Video === 'function' || typeof Video === 'object');

    const handlePress = () => {
      // Show all media (images + videos) in a carousel, similar to home screen
      // This ensures videos are visible when tapping on posts
      if (media.length > 0) {
        setSelectedMedia(media);
        // Find the index of the first media item we're showing
        const firstIndex = media.findIndex(m => 
          firstMedia && m.url === firstMedia.url
        );
        setSelectedMediaIndex(firstIndex >= 0 ? firstIndex : 0);
      } else {
        // Fallback to post press handler
        onPostPress(item);
      }
    };

    return (
      <TouchableOpacity 
        style={styles.postGridItem} 
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {firstIsVideo ? (
          // Video post
          <>
            {mediaUri ? (
              // Backend provided thumbnail
              <Image
                source={{ uri: mediaUri }}
                style={styles.postGridImage}
                resizeMode="cover"
              />
            ) : canUseVideoThumbnail && videoUrl ? (
              // Use Video component to show first frame
              <View style={styles.postGridVideoContainer}>
                <Video
                  source={{ uri: videoUrl }}
                  style={styles.postGridImage}
                  resizeMode="cover"
                  paused={true}
                  controls={false}
                  muted={true}
                  repeat={false}
                />
              </View>
            ) : (
              // Fallback placeholder
              <View style={styles.postGridVideoPlaceholder}>
                <Icon name="video-camera" size={24} color={colors.textLight} />
              </View>
            )}
            <View style={styles.postGridVideoOverlay} pointerEvents="box-none">
              <TouchableOpacity 
                style={{ justifyContent: 'center', alignItems: 'center' }}
                onPress={(e) => {
                  e.stopPropagation();
                  console.log('🎯 Profile grid play button pressed, opening media carousel');
                  handlePress();
                }}
                activeOpacity={0.8}
              >
                <Icon name="play-circle" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Image post
          <Image
            source={{ 
              uri: mediaUri || 'https://via.placeholder.com/120x120?text=No+Image'
            }}
            style={styles.postGridImage}
            resizeMode="cover"
          />
        )}
        {hasMultipleMedia && (
          <View style={styles.multipleImagesIndicator}>
            <Icon name="clone" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPostItem}
        numColumns={3}
        columnWrapperStyle={styles.postGridRow}
        contentContainerStyle={styles.postGridContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyPostsContainer}>
            <Icon name="camera" size={48} color={colors.muted} />
            <Text style={styles.emptyPostsTitle}>
              {isOwnProfile ? 'Create your first post' : 'No posts yet'}
            </Text>
            <Text style={styles.emptyPostsSubtitle}>
              {isOwnProfile ? 'Give this space some love.' : 'This user hasn\'t posted anything yet.'}
            </Text>
            {isOwnProfile && onCreatePost && (
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={onCreatePost}
              >
                <Text style={styles.createPostButtonText}>Create</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      
      {/* Media Carousel Modal - Shows all media (images + videos) in fullscreen */}
      {selectedMedia && selectedMedia.length > 0 && (
        <MediaCarouselModal
          media={selectedMedia}
          currentIndex={selectedMediaIndex}
          onClose={() => {
            setSelectedMedia(null);
            setSelectedMediaIndex(0);
          }}
        />
      )}
      
      {/* Video Player Modal - Fallback for single video */}
      <VideoPlayerModal
        visible={!!selectedVideo && !selectedMedia}
        videoUri={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
      
      {/* Image Preview Modal - Fallback for images only */}
      <ImagePreviewModal
        visible={!!selectedImages && !selectedMedia}
        images={selectedImages || []}
        currentIndex={selectedImageIndex}
        onClose={() => {
          setSelectedImages(null);
          setSelectedImageIndex(0);
        }}
      />
    </>
  );
};

const ProfileScreen = ({ navigation, route, onBack, onEditProfile, onSettings, onFollowSomeone, onCreatePost, refreshTrigger, onUserProfilePress, onMessagePress }) => {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector(state => state.auth);
  const { 
    viewedUser, 
    followers, 
    following, 
    userPosts,
    isLoading, 
    error 
  } = useAppSelector(state => state.user);
  
  const [activeTab, setActiveTab] = useState('posts'); // posts, followers, following
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const userId = route?.params?.userId || currentUser?._id;
  const isOwnProfile = !route?.params?.userId || (userId === currentUser?._id);

  const followingIds = new Set(
    following.map(f => f._id?.toString()).filter(Boolean)
  );
  const followerIds = new Set(
    followers.map(f => f._id?.toString()).filter(Boolean)
  );  
 
  const getIsMutualForFollower = (user) => {
    const userIdStr = user._id?.toString();
    return user.isMutual || (userIdStr && followingIds.has(userIdStr));
  };

 
  const getIsMutualForFollowing = (user) => {
    const userIdStr = user._id?.toString();
    return user.isMutual || (userIdStr && followerIds.has(userIdStr));
  };

  
  useEffect(() => {
    console.log(' Profile:', {
      routeUserId: route?.params?.userId,
      currentUserId: currentUser?._id,
      finalUserId: userId,
      isOwnProfile,
      currentUserEmail: currentUser?.email,
      viewedUserEmail: viewedUser?.email
    });
  }, [route?.params?.userId, currentUser?._id, userId, isOwnProfile, currentUser?.email, viewedUser?.email]);

  useEffect(() => {
    if (userId) {
      console.log(' Fetching user profile for:', userId);
    
      dispatch(clearUserPosts());
      dispatch(fetchUserProfile(userId));
    
      if (!isOwnProfile) {
        dispatch(checkIsFollowing(userId)).then((result) => {
          if (checkIsFollowing.fulfilled.match(result)) {
            setIsFollowingUser(result.payload.isFollowing);
          }
        });
      } else {
        setIsFollowingUser(false);
      }
    }
  }, [userId, dispatch, isOwnProfile]);


  useEffect(() => {
    if (viewedUser?.isFollowing !== undefined && !isOwnProfile) {
      setIsFollowingUser(viewedUser.isFollowing);
    }
  }, [viewedUser?.isFollowing, isOwnProfile]);

  useEffect(() => {
    const refreshProfile = () => {
      if (userId) {
        console.log(' Refreshing profile data');
        dispatch(fetchUserProfile(userId));
      }
    };
    refreshProfile();
  }, [userId, dispatch]);

  useEffect(() => {
    if (userId) {
      console.log(' Profile screen mounted/focused, refreshing data');
      dispatch(fetchUserProfile(userId));
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (userId && refreshTrigger > 0) {
      console.log(' Profile refresh triggered, refreshing data');
      dispatch(fetchUserProfile(userId));
    }
  }, [refreshTrigger, userId, dispatch]);

  useEffect(() => {
    if (!isOwnProfile && (activeTab === 'followers' || activeTab === 'following')) {
      setActiveTab('posts');
    }
  }, [isOwnProfile, activeTab]);

  useEffect(() => {
    console.log(' ProfileScreen Debug:', {
      userId,
      currentUser: currentUser?._id,
      viewedUser: viewedUser?._id,
      isLoading,
      error,
      isOwnProfile,
      hasNavigation: !!navigation,
      hasOnBack: !!onBack,
      hasOnFollowSomeone: !!onFollowSomeone
    });
  }, [userId, currentUser?._id, viewedUser?._id, isLoading, error, isOwnProfile, navigation, onBack, onFollowSomeone]);

  if (!userId) {
    console.log(' No userId available');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading && !viewedUser && !currentUser) {
    console.log(' Showing loading screen');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    if (userId) {
      console.log(' Fetching user profile for:', userId);
      dispatch(fetchUserProfile(userId));
    }
  }, [userId, dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (userId) {
        await dispatch(fetchUserProfile(userId)).unwrap();
        if (activeTab === 'posts') {
          await dispatch(fetchUserPosts(userId)).unwrap();
        } else if (activeTab === 'followers' && isOwnProfile) {
          await dispatch(fetchUserFollowers(userId)).unwrap();
        } else if (activeTab === 'following' && isOwnProfile) {
          await dispatch(fetchUserFollowing(userId)).unwrap();
        }
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabPress = async (tab) => {
    if ((tab === 'followers' || tab === 'following') && !isOwnProfile) {
      return;
    }
    
    setActiveTab(tab);
    if (userId) {
      if (tab === 'posts') {
        await dispatch(fetchUserPosts(userId));
      } else if (tab === 'followers' && isOwnProfile) {
        await dispatch(fetchUserFollowers(userId));
      } else if (tab === 'following' && isOwnProfile) {
        await dispatch(fetchUserFollowing(userId));
      }
    }
  };

  const handleBack = () => {
    console.log(' Back button pressed');
    if (onBack) {
      onBack();
    } else {
      console.log('No onBack handler available');
    }
  };

  const handleEditProfile = () => {
    console.log(' Edit profile pressed');
    if (onEditProfile) {
      onEditProfile();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('EditProfile', { user: viewedUser });
    } else {
      console.log('No edit profile handler available');
    }
  };

  const handleSettings = () => {
    console.log(' Settings pressed');
    if (onSettings) {
      onSettings();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Settings');
    } else {
      console.log(' No settings handler available');
    }
  };

  const handleUserPress = (user) => {
    console.log(' User pressed:', user._id);
    if (onUserProfilePress) {
      onUserProfilePress(user);
    } else if (navigation && navigation.push) {
      navigation.push('Profile', { userId: user._id });
    } else {
      console.log(' No navigation available for user press');
    }
  };

  const handlePostPress = (post) => {
    console.log('Post pressed:', post);
  };

  const handleFollowToggle = async () => {
    if (!userId || isOwnProfile) return;
    
    setIsFollowLoading(true);
    try {
      if (isFollowingUser) {
        await dispatch(unfollowUser(userId)).unwrap();
        setIsFollowingUser(false);
      } else {
        await dispatch(followUser(userId)).unwrap();
        setIsFollowingUser(true);
      }
      
      await dispatch(fetchUserProfile(userId));
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update follow status');
      setIsFollowingUser(!isFollowingUser);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleFollowSomeone = () => {
    console.log('Follow someone pressed');
    if (onFollowSomeone) {
      onFollowSomeone();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('FollowSomeone');
    } else {
      console.log(' No follow someone handler available');
    }
  };

  const handleMessage = () => {
    console.log('Message pressed for user:', userId);
    if (onMessagePress && viewedUser) {
      onMessagePress(viewedUser);
    } else if (viewedUser) {
      // Navigate to chat screen using Redux
      dispatch(setSelectedChatUser(viewedUser));
      dispatch(setCurrentScreen('chat'));
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <PostGrid 
            posts={userPosts} 
            onPostPress={handlePostPress}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onCreatePost={onCreatePost}
            isOwnProfile={isOwnProfile}
          />
        );
      case 'followers':
        return (
          <FlatList
            data={followers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <UserListItem
                user={item}
                onPress={handleUserPress}
                showFollowButton={!isOwnProfile}
                isMutual={getIsMutualForFollower(item)}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No followers yet</Text>
              </View>
            )}
          />
        );
      case 'following':
        return (
          <FlatList
            data={following}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <UserListItem
                user={item}
                onPress={handleUserPress}
                showFollowButton={!isOwnProfile}
                isMutual={getIsMutualForFollowing(item)}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Not following anyone yet</Text>
              </View>
            )}
          />
        );
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!viewedUser && !currentUser) {
    console.log(' No user data available');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user data available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <BackButton onPress={handleBack} />
        <Text style={styles.headerTitle}>
          {isOwnProfile ? 'My Profile' : 'Profile'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ProfileHeader
        user={viewedUser || currentUser}
        onEditProfile={handleEditProfile}
        onSettings={handleSettings}
        isOwnProfile={isOwnProfile}
        onFollowToggle={handleFollowToggle}
        onFollowSomeone={handleFollowSomeone}
        isFollowing={isFollowingUser}
        isLoading={isFollowLoading}
        onProfilePicturePress={() => setShowImagePreview(true)}
        onMessagePress={handleMessage}
      />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => handleTabPress('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Posts
            </Text>
          </TouchableOpacity>
          {isOwnProfile && (
            <>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
                onPress={() => handleTabPress('followers')}
              >
                <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
                  Followers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'following' && styles.activeTab]}
                onPress={() => handleTabPress('following')}
              >
                <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
                  Following
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </ScrollView>

      {/* Profile Picture Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowImagePreview(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowImagePreview(false)}
              >
                <Icon name="times" size={24} color="#fff" />
              </TouchableOpacity>
              <Image
                source={{ uri: getAvatarUrl((viewedUser || currentUser)?.profilePicture) }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Media Carousel Modal Styles
const mediaCarouselStyles = StyleSheet.create({
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
  counter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  mediaContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  media: {
    width: screenWidth,
    height: screenHeight,
  },
  videoThumbnailContainer: {
    width: screenWidth,
    height: screenHeight,
    overflow: 'hidden',
    backgroundColor: '#000',
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
    height: screenHeight,
    backgroundColor: '#000',
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  header: {
    padding: 20,
    backgroundColor: colors.bg,
  },
  profileInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  profileDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  fullName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  occupation: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: colors.muted,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.pink,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.pink,
  },
  tabText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.text,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    minHeight: 400,
  },
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userListItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userListItemInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userListItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  mutualText: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
  },
  userListItemOccupation: {
    fontSize: 14,
    color: colors.muted,
  },
  followButton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: colors.pink,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.pink,
    borderRadius: 25,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  followingButtonText: {
    color: colors.pink,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.pink,
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.pink,
  },
  disabledButton: {
    opacity: 0.6,
  },
  postsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoonText: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.muted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.pink,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Post Grid Styles
  postGridContainer: {
    padding: 0,
  },
  postGridRow: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  postGridItem: {
    width: '33.33%',
    aspectRatio: 1,
    marginBottom: 2,
    position: 'relative',
  },
  postGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  postGridVideoContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: colors.bgAlt,
  },
  postGridVideoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  postGridVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyPostsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPostsSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  createPostButton: {
    backgroundColor: colors.pink,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followButton: {
    flex: 1,
    backgroundColor: colors.pink,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.pink,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: colors.pink,
  },
  disabledButton: {
    opacity: 0.6,
  },
  followSomeoneContainer: {
    marginTop: 15,
  },
  followSomeoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink,
    borderWidth: 0,
    borderColor: colors.pink,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  followSomeoneText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '90%',
    borderRadius: 10,
  },
});

export default ProfileScreen;
