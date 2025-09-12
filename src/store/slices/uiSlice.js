import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  
  currentScreen: 'splash',
  activeTab: 'home',
  selectedUserId: null,
  followSomeoneSource: null, // Track where user came from: 'profile' | 'onboarding'
  
  // Loading states
  isLoading: false,
  loadingMessage: '',
  
  // Modal states
  showStoryViewer: false,
  showActionMenu: false,
  showReplyModal: false,
  showShareModal: false,
  
  // Story viewer state
  currentStoryIndex: 0,
  currentStoryUser: null,
  
  // Theme and preferences
  theme: 'light', // 'light' | 'dark'
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
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Navigation actions
    setCurrentScreen: (state, action) => {
      state.currentScreen = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setSelectedUserId: (state, action) => {
      state.selectedUserId = action.payload;
    },
    setFollowSomeoneSource: (state, action) => {
      state.followSomeoneSource = action.payload;
    },
    
    // Loading actions
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
    
    // Story viewer actions
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
    
    // Reset UI state
    resetUI: (state) => {
      state.currentScreen = 'splash';
      state.activeTab = 'home';
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
    },
  },
});

export const {
  setCurrentScreen,
  setActiveTab,
  setSelectedUserId,
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
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
