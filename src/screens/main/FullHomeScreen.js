import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
  PermissionsAndroid,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { fetchPosts, bookmarkPost, deletePost } from '../../store/slices/postsSlice';
import { initializePosts } from '../../store/slices/likesSlice';
import { colors, spacing, radius } from '../../constants/theme';
import { StoryItem, PostItem, BottomNavigation } from '../../components';
import StoryViewer from '../../components/story/StoryViewer';
import { API_CONFIG } from '../../config/api';
import { buildStories, insertNewStory } from '../../utils/api/postUtils';

const FullHomeScreen = ({ onLogout, onProfilePress, onCreatePost, onViewComments, onEditPost, onPostUpdated }) => {
  const dispatch = useAppDispatch();
  const { posts: reduxPosts, isLoading } = useAppSelector(state => state.posts);
  const { user } = useAppSelector(state => state.auth);
  const insets = useSafeAreaInsets();
  console.log('FullHomeScreen - User:', user);
  console.log('FullHomeScreen - Is loading:', isLoading);
  console.log('FullHomeScreen - Redux posts count:', reduxPosts?.length || 0);
  
  
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [refreshing, setRefreshing] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [stories, setStories] = useState([]);
  useEffect(() => {
    if (Array.isArray(reduxPosts)) {
      console.log('Syncing local posts with Redux posts, count:', reduxPosts.length);
    
      setPosts([...reduxPosts]);
    }
  }, [reduxPosts]);

  // Fetch posts on component mount
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  
  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const loadPosts = useCallback(async () => {
    try {
      console.log('Starting to load posts...');
      const result = await dispatch(fetchPosts());
      console.log('Fetch posts result:', result);
      
      if (fetchPosts.fulfilled.match(result)) {
        const list = result.payload || [];
        console.log(' Posts loaded:', list);
        
        
        if (list.length > 0) {
          console.log('Initializing post like states for', list.length, 'posts');
          dispatch(initializePosts(list));
        }
        
        setPosts(list.map(post => ({ ...post, likedByMe: post.likedByMe || false })));
      } else {
        console.error(' Failed to fetch posts:', result.error);
      }
    } catch (error) {
      console.error(' Error loading posts:', error);
    }
  }, [dispatch]);

  const loadStories = useCallback(() => {
    try {
      const newStories = buildStories(posts, user);
      setStories(newStories);
    } catch (error) {
      console.error('Failed to load stories:', error);
    }
  }, [posts, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPosts(), loadStories()]);
    setRefreshing(false);
  };

  // Camera/Gallery permissions
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
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
    if (Platform.OS !== 'android') return true;
    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Media Permission',
            message: 'This app needs access to your media to select photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'This app needs access to your storage to select photos.',
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
  };

  const handleStoryUpload = () => {
    Alert.alert(
      'Add Story',
      'Choose how you want to add your story',
      [
        { text: 'Take Photo', onPress: openCameraForStory },
        { text: 'Choose from Gallery', onPress: openGalleryForStory },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCameraForStory = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1080,
      maxHeight: 1920,
      includeBase64: false,
    };

    launchCamera(options, (response) => {
      if (response.didCancel || response.errorMessage) return;
      if (response.assets && response.assets[0]) {
        // Add new story to the beginning of stories array
        const newStory = {
          id: Date.now().toString(),
          username: 'You',
          avatar: response.assets[0].uri,
          isYourStory: false,
          hasStory: true,
        };
        setStories(prev => insertNewStory(prev, response.assets[0].uri));
        Alert.alert('Success', 'Story added successfully!');
      }
    });
  };
//IGNORE THE STORIES CODE FOR NOW AS RIGHT NOW NOT USING IT
  const openGalleryForStory = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Storage permission is required to select photos.');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1080,
      maxHeight: 1920,
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) return;
      if (response.assets && response.assets[0]) {
        const newStory = {
          id: Date.now().toString(),
          username: 'You',
          avatar: response.assets[0].uri,
          isYourStory: false,
          hasStory: true,
        };
        setStories(prev => insertNewStory(prev, response.assets[0].uri));
        Alert.alert('Success', 'Story added successfully!');
      }
    });
  };

  const handleStoryPress = useCallback((story) => {
    if (story.isYourStory) {
      handleStoryUpload();
    } else {
      // Check if the story has actual story content
      if (story.stories && story.stories.length > 0) {
        const viewableStories = stories.filter(s => !s.isYourStory && s.stories && s.stories.length > 0);
        const storyIndex = viewableStories.findIndex(s => s.id === story.id);
        if (storyIndex >= 0) {
          setCurrentStoryIndex(storyIndex);
          setShowStoryViewer(true);
        }
      } else {
        Alert.alert('No Stories', 'This user has no stories to view.');
      }
    }
  }, [stories]);

  const handleLike = useCallback(async (postId) => {
    try {
      console.log('FullHomeScreen - handleLike called for post:', postId);
      console.log('FullHomeScreen - About to dispatch togglePostLike...');
      const result = await dispatch(togglePostLike(postId));
      console.log(' FullHomeScreen - togglePostLike result:', result);
      
      if (result.type.endsWith('/fulfilled')) {
        console.log(' Post like action completed successfully');
      } else if (result.type.endsWith('/rejected')) {
        console.error(' Post like action failed:', result.payload);
      }
    } catch (error) {
      console.error(' FullHomeScreen - Like error:', error);
    }
  }, [dispatch]);

  // Story navigation handlers
  const handleStoryNext = useCallback(() => {
    const viewableStories = stories.filter(s => !s.isYourStory && s.stories && s.stories.length > 0);
    if (currentStoryIndex < viewableStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      setShowStoryViewer(false);
    }
  }, [currentStoryIndex, stories]);

  const handleStoryPrevious = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else {
      setShowStoryViewer(false);
    }
  }, [currentStoryIndex]);

  const handleStoryClose = useCallback(() => {
    setShowStoryViewer(false);
  }, []);

  const handleComment = useCallback((post) => {
    if (onViewComments) {
      onViewComments(post);
    }
  }, [onViewComments]);
  

  const handleShare = useCallback(async (postId) => {
    try {
      const result = await Share.share({
        message: 'Check out this amazing post on TicToe! 📸✨',
        url: 'https://tictoe.app/post/' + postId, // Your app's deep link
      });
      
      if (result.action === Share.sharedAction) {
        console.log('Post shared successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to share at the moment');
      console.log('Share error:', error);
    }
  }, []);

  const handleEditPost = useCallback((post) => {
    if (onEditPost) {
      onEditPost(post);
    }
  }, [onEditPost]);

  const handlePostUpdated = useCallback((updatedPost) => {
    console.log(' Refreshing posts after update:', updatedPost);
    console.log(' Updated post ID:', updatedPost._id || updatedPost.id);
    console.log('Updated post content:', updatedPost.content);
    console.log('Updated post caption:', updatedPost.caption);
    
    // Update the specific post in local state
    setPosts(prevPosts => {
      console.log(' Current posts count:', prevPosts.length);
      const updatedPosts = prevPosts.map(post => {
        const postId = post._id || post.id;
        const updatedPostId = updatedPost._id || updatedPost.id;
        
        console.log('Comparing post ID:', postId, 'with updated ID:', updatedPostId);
        
        if (postId === updatedPostId) {
          console.log('Found matching post, updating:', postId);
          const updatedPostData = {
            ...post,
            caption: updatedPost.content || updatedPost.caption || post.caption,
            content: updatedPost.content || post.content,
            images: updatedPost.images || updatedPost.media || post.images,
          };
          console.log(' Updated post data:', updatedPostData);
          return updatedPostData;
        }
        return post;
      });
      
      console.log('Final posts count:', updatedPosts.length);
      return updatedPosts;
    });
  }, []);

  const handleDeletePost = useCallback(async (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting post:', postId);
              const result = await dispatch(deletePost(postId));
              console.log('Delete result:', result);
              
              if (deletePost.fulfilled.match(result)) {
                // Remove post from local state
                setPosts(prevPosts => prevPosts.filter(p => p._id !== postId && p.id !== postId));
                Alert.alert('Success', 'Post deleted successfully!');
              } else if (deletePost.rejected.match(result)) {
                console.error('Delete failed:', result.error);
                const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to delete post';
                Alert.alert('Error', errorMessage);
              } else {
                // If both nit then delete 
                console.log('Delete result type:', typeof result, result);
                setPosts(prevPosts => prevPosts.filter(p => p._id !== postId && p.id !== postId));
                Alert.alert('Success', 'Post deleted successfully!');
              }
            } catch (error) {
              console.error('Delete post error:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  }, [dispatch]);

  const handleBookmark = useCallback(async (postId) => {
    try {
      const result = await dispatch(bookmarkPost(postId));
      if (bookmarkPost.fulfilled.match(result)) {
        // Update local posts state
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, isBookmarked: !post.isBookmarked }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Failed to bookmark post:', error);
    }
  }, [dispatch]);

  const handleUserPress = useCallback((user) => {
    console.log('User pressed:', user.username);
   
  }, []);

    const handleTabPress = useCallback((tabId) => {
    setActiveTab(tabId);
    console.log('Tab pressed:', tabId);
    if (tabId === 'profile' && onProfilePress) { 
      onProfilePress();
    } else if (tabId === 'create' && onCreatePost) {
      onCreatePost();
    }
  }, [onProfilePress, onCreatePost]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, []);

  const renderHeader = useCallback(() => (
    <View>
      {/* App Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>TokTok</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="heart-o" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="send-o" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Logout', 
                    style: 'destructive',
                    onPress: () => {
                      if (onLogout) {
                        onLogout();
                      }
                    }
                  },
                ]
              );
            }}
          >
            <Icon name="ellipsis-v" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories Section */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.storiesContainer}
        contentContainerStyle={styles.storiesContent}
      >
        {stories.map((story) => (
          <StoryItem
            key={story.id}
            story={story}
            onPress={handleStoryPress}
          />
        ))}
      </ScrollView>
    </View>
  ), [stories, handleStoryPress, onLogout]);

  const handleCommentCountUpdate = useCallback((postId, callbackOrCount) => {
    if (typeof callbackOrCount === 'function') {
      // Get the current count for the post
      const post = posts.find(p => p._id === postId || p.id === postId);
      const currentCount = post?.comments || post?.commentsCount || post?.commentCount || 0;
      callbackOrCount(currentCount);
    } else if (typeof callbackOrCount === 'number') {
      // Update the count with the new value
      setPosts(prevPosts => 
        prevPosts.map(post => 
          (post._id === postId || post.id === postId) 
            ? { ...post, comments: callbackOrCount, commentsCount: callbackOrCount, commentCount: callbackOrCount }
            : post
        )
      );
    }
  }, [posts]);

  const renderPost = useCallback(({ item }) => (
    <PostItem
      post={item}
      onComment={() => handleComment(item)}
      onShare={handleShare}
      onBookmark={handleBookmark}
      onUserPress={handleUserPress}
      onEdit={handleEditPost}
      onDelete={handleDeletePost}
      currentUserId={user?._id}
      onCommentCountUpdate={handleCommentCountUpdate}
    />
  ), [handleComment, handleShare, handleBookmark, handleUserPress, handleEditPost, handleDeletePost, user?._id, handleCommentCountUpdate]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={6}
        removeClippedSubviews
        contentContainerStyle={{
         
          paddingBottom: (insets.bottom || 0) + 80,
        }}
      />

      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />

      {/* Story Viewer Modal */}
      <StoryViewer
        visible={showStoryViewer}
        stories={stories.filter(s => !s.isYourStory && s.stories && s.stories.length > 0)}
        currentIndex={currentStoryIndex}
        onClose={handleStoryClose}
        onNext={handleStoryNext}
        onPrevious={handleStoryPrevious}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    backgroundColor: colors.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.l,
  },
  headerButton: {
    padding: spacing.s,
    borderRadius: radius.l,
  },

  storiesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  storiesContent: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    gap: spacing.m,
  },
});

export default FullHomeScreen;
