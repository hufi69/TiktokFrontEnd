import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  
  currentScreen: 'splash',
  activeTab: 'home',
  selectedUserId: null,
  selectedChatUser: null, // user data for chat screen
  followSomeoneSource: null, // tracking user caming from profile or after edit screen 

  isLoading: false,
  loadingMessage: '',
  
  showStoryViewer: false,
  showActionMenu: false,
  showReplyModal: false,
  showShareModal: false,
  
  
  currentStoryIndex: 0,
  currentStoryUser: null,
  
  // Theme and preferences
  theme: 'light', 
  language: 'en',
  
  // App state
  isAppReady: false,
  isFirstLaunch: true,
  
  // Error handling
  error: null,
  showError: false,
  
  // Refresh states
  isRefreshing: false,
  
  // Keyboard state
  keyboardVisible: false,
  keyboardHeight: 0,
  
  // Notifications
  unreadNotificationCount: 0,
  
  // Inbox
  unreadInboxCount: 0,
  
  // Temporary profile data (for preserving form data when navigating back)
  tempProfileData: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    
    setCurrentScreen: (state, action) => {
      state.currentScreen = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setSelectedUserId: (state, action) => {
      state.selectedUserId = action.payload;
    },
    setSelectedChatUser: (state, action) => {
      state.selectedChatUser = action.payload;
    },
    setFollowSomeoneSource: (state, action) => {
      state.followSomeoneSource = action.payload;
    },
    
    
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setLoadingMessage: (state, action) => {
      state.loadingMessage = action.payload;
    },
    
    // Modal actions
    setShowStoryViewer: (state, action) => {
      state.showStoryViewer = action.payload;
    },
    setShowActionMenu: (state, action) => {
      state.showActionMenu = action.payload;
    },
    setShowReplyModal: (state, action) => {
      state.showReplyModal = action.payload;
    },
    setShowShareModal: (state, action) => {
      state.showShareModal = action.payload;
    },
    
    // Skip this for now 
    setCurrentStoryIndex: (state, action) => {
      state.currentStoryIndex = action.payload;
    },
    setCurrentStoryUser: (state, action) => {
      state.currentStoryUser = action.payload;
    },
    
    // Theme and preferences
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    
    // App state
    setAppReady: (state, action) => {
      state.isAppReady = action.payload;
    },
    setFirstLaunch: (state, action) => {
      state.isFirstLaunch = action.payload;
    },
    
    // Error handling
    setError: (state, action) => {
      state.error = action.payload;
      state.showError = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
      state.showError = false;
    },
    setShowError: (state, action) => {
      state.showError = action.payload;
    },
    
    // Refresh actions
    setRefreshing: (state, action) => {
      state.isRefreshing = action.payload;
    },
    
    // Keyboard actions
    setKeyboardVisible: (state, action) => {
      state.keyboardVisible = action.payload;
    },
    setKeyboardHeight: (state, action) => {
      state.keyboardHeight = action.payload;
    },
    
    // Notification actions
    setUnreadNotificationCount: (state, action) => {
      state.unreadNotificationCount = action.payload;
    },
    incrementNotificationCount: (state) => {
      state.unreadNotificationCount += 1;
    },
    decrementNotificationCount: (state) => {
      state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - 1);
    },
    resetNotificationCount: (state) => {
      state.unreadNotificationCount = 0;
    },
    
    // Inbox actions
    setUnreadInboxCount: (state, action) => {
      state.unreadInboxCount = action.payload;
    },
    incrementInboxCount: (state) => {
      state.unreadInboxCount += 1;
    },
    decrementInboxCount: (state) => {
      state.unreadInboxCount = Math.max(0, state.unreadInboxCount - 1);
    },
    resetInboxCount: (state) => {
      state.unreadInboxCount = 0;
    },
    
    // Temporary profile data actions
    setTempProfileData: (state, action) => {
      state.tempProfileData = action.payload;
    },
    clearTempProfileData: (state) => {
      state.tempProfileData = null;
    },
    
    // Reset UI state
    resetUI: (state) => {
      state.currentScreen = 'splash';
      state.activeTab = 'home';
      state.selectedUserId = null;
      state.selectedChatUser = null;
      state.isLoading = false;
      state.loadingMessage = '';
      state.showStoryViewer = false;
      state.showActionMenu = false;
      state.showReplyModal = false;
      state.showShareModal = false;
      state.currentStoryIndex = 0;
      state.currentStoryUser = null;
      state.error = null;
      state.showError = false;
      state.isRefreshing = false;
      state.keyboardVisible = false;
      state.keyboardHeight = 0;
      state.unreadNotificationCount = 0;
      state.unreadInboxCount = 0;
      state.tempProfileData = null;
    },
  },
});

export const {
  setCurrentScreen,
  setActiveTab,
  setSelectedUserId,
  setSelectedChatUser,
  setFollowSomeoneSource,
  setLoading,
  setLoadingMessage,
  setShowStoryViewer,
  setShowActionMenu,
  setShowReplyModal,
  setShowShareModal,
  setCurrentStoryIndex,
  setCurrentStoryUser,
  setTheme,
  setLanguage,
  setAppReady,
  setFirstLaunch,
  setError,
  clearError,
  setShowError,
  setRefreshing,
  setKeyboardVisible,
  setKeyboardHeight,
  setUnreadNotificationCount,
  incrementNotificationCount,
  decrementNotificationCount,
  resetNotificationCount,
  setUnreadInboxCount,
  incrementInboxCount,
  decrementInboxCount,
  resetInboxCount,
  setTempProfileData,
  clearTempProfileData,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
