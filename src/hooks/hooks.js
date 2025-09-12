import { useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Auth hooks
export const useAuth = () => useAppSelector((state) => state.auth);
export const useAuthUser = () => useAppSelector((state) => state.auth.user);
export const useAuthToken = () => useAppSelector((state) => state.auth.token);
export const useIsAuthenticated = () => useAppSelector((state) => state.auth.isAuthenticated);
export const useAuthLoading = () => useAppSelector((state) => state.auth.isLoading);
export const useAuthError = () => useAppSelector((state) => state.auth.error);




// Posts hooks
export const usePosts = () => useAppSelector((state) => state.posts);
export const usePostsList = () => useAppSelector((state) => state.posts.posts);
export const usePostsLoading = () => useAppSelector((state) => state.posts.isLoading);
export const usePostsError = () => useAppSelector((state) => state.posts.error);

// Stories hooks
export const useStories = () => useAppSelector((state) => state.stories);
export const useStoriesList = () => useAppSelector((state) => state.stories.stories);
export const useMyStories = () => useAppSelector((state) => state.stories.myStories);
export const useStoriesLoading = () => useAppSelector((state) => state.stories.isLoading);
export const useStoriesError = () => useAppSelector((state) => state.stories.error);
export const useCurrentStoryIndex = () => useAppSelector((state) => state.stories.currentStoryIndex);
export const useShowStoryViewer = () => useAppSelector((state) => state.stories.showStoryViewer);

// User hooks
export const useUser = () => useAppSelector((state) => state.user);
export const useCurrentUser = () => useAppSelector((state) => state.user.currentUser);
export const useViewedUser = () => useAppSelector((state) => state.user.viewedUser);
export const useUserFollowers = () => useAppSelector((state) => state.user.followers);
export const useUserFollowing = () => useAppSelector((state) => state.user.following);
export const useUserLoading = () => useAppSelector((state) => state.user.isLoading);
export const useUserError = () => useAppSelector((state) => state.user.error);

// UI hooks
export const useUI = () => useAppSelector((state) => state.ui);
export const useCurrentScreen = () => useAppSelector((state) => state.ui.currentScreen);
export const useActiveTab = () => useAppSelector((state) => state.ui.activeTab);
export const useUILoading = () => useAppSelector((state) => state.ui.isLoading);
export const useLoadingMessage = () => useAppSelector((state) => state.ui.loadingMessage);
export const useUIError = () => useAppSelector((state) => state.ui.error);
export const useShowError = () => useAppSelector((state) => state.ui.showError);
export const useIsRefreshing = () => useAppSelector((state) => state.ui.isRefreshing);
export const useKeyboardVisible = () => useAppSelector((state) => state.ui.keyboardVisible);
export const useKeyboardHeight = () => useAppSelector((state) => state.ui.keyboardHeight);
export const useTheme = () => useAppSelector((state) => state.ui.theme);
export const useLanguage = () => useAppSelector((state) => state.ui.language);
export const useIsAppReady = () => useAppSelector((state) => state.ui.isAppReady);
export const useIsFirstLaunch = () => useAppSelector((state) => state.ui.isFirstLaunch);

// Modal hooks
export const useShowStoryViewerUI = () => useAppSelector((state) => state.ui.showStoryViewer);
export const useShowActionMenu = () => useAppSelector((state) => state.ui.showActionMenu);
export const useShowReplyModal = () => useAppSelector((state) => state.ui.showReplyModal);
export const useShowShareModal = () => useAppSelector((state) => state.ui.showShareModal);
export const useCurrentStoryIndexUI = () => useAppSelector((state) => state.ui.currentStoryIndex);
export const useCurrentStoryUser = () => useAppSelector((state) => state.ui.currentStoryUser);
