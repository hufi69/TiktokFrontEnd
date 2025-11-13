/**
 * Redux Hooks - UI State Only
 * For server state (API calls), use hooks from @/hooks/api instead
 */

import { useDispatch, useSelector } from 'react-redux';

// Base Redux hooks
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Auth Redux hooks (UI state only - for actual auth, use hooks from @/hooks/api)
export const useReduxAuth = () => useAppSelector((state) => state.auth);
export const useReduxAuthUser = () => useAppSelector((state) => state.auth.user);
export const useReduxAuthToken = () => useAppSelector((state) => state.auth.token);
export const useReduxIsAuthenticated = () => useAppSelector((state) => state.auth.isAuthenticated);
export const useReduxAuthLoading = () => useAppSelector((state) => state.auth.isLoading);
export const useReduxAuthError = () => useAppSelector((state) => state.auth.error);

// Posts Redux hooks (UI state only - for fetching posts, use hooks from @/hooks/api)
export const useReduxPosts = () => useAppSelector((state) => state.posts);
export const useReduxPostsList = () => useAppSelector((state) => state.posts.posts);
export const useReduxPostsLoading = () => useAppSelector((state) => state.posts.isLoading);
export const useReduxPostsError = () => useAppSelector((state) => state.posts.error);

// Stories Redux hooks
export const useReduxStories = () => useAppSelector((state) => state.stories);
export const useReduxStoriesList = () => useAppSelector((state) => state.stories.stories);
export const useReduxMyStories = () => useAppSelector((state) => state.stories.myStories);
export const useReduxStoriesLoading = () => useAppSelector((state) => state.stories.isLoading);
export const useReduxStoriesError = () => useAppSelector((state) => state.stories.error);
export const useReduxCurrentStoryIndex = () => useAppSelector((state) => state.stories.currentStoryIndex);
export const useReduxShowStoryViewer = () => useAppSelector((state) => state.stories.showStoryViewer);

// User Redux hooks (UI state only)
export const useReduxUser = () => useAppSelector((state) => state.user);
export const useReduxCurrentUser = () => useAppSelector((state) => state.user.currentUser);
export const useReduxViewedUser = () => useAppSelector((state) => state.user.viewedUser);
export const useReduxUserFollowers = () => useAppSelector((state) => state.user.followers);
export const useReduxUserFollowing = () => useAppSelector((state) => state.user.following);
export const useReduxUserLoading = () => useAppSelector((state) => state.user.isLoading);
export const useReduxUserError = () => useAppSelector((state) => state.user.error);

// UI Redux hooks (primary use case for Redux)
export const useReduxUI = () => useAppSelector((state) => state.ui);
export const useReduxCurrentScreen = () => useAppSelector((state) => state.ui.currentScreen);
export const useReduxActiveTab = () => useAppSelector((state) => state.ui.activeTab);
export const useReduxUILoading = () => useAppSelector((state) => state.ui.isLoading);
export const useReduxLoadingMessage = () => useAppSelector((state) => state.ui.loadingMessage);
export const useReduxUIError = () => useAppSelector((state) => state.ui.error);
export const useReduxShowError = () => useAppSelector((state) => state.ui.showError);
export const useReduxIsRefreshing = () => useAppSelector((state) => state.ui.isRefreshing);
export const useReduxKeyboardVisible = () => useAppSelector((state) => state.ui.keyboardVisible);
export const useReduxKeyboardHeight = () => useAppSelector((state) => state.ui.keyboardHeight);
export const useReduxTheme = () => useAppSelector((state) => state.ui.theme);
export const useReduxLanguage = () => useAppSelector((state) => state.ui.language);
export const useReduxIsAppReady = () => useAppSelector((state) => state.ui.isAppReady);
export const useReduxIsFirstLaunch = () => useAppSelector((state) => state.ui.isFirstLaunch);

// Modal Redux hooks
export const useReduxShowStoryViewerUI = () => useAppSelector((state) => state.ui.showStoryViewer);
export const useReduxShowActionMenu = () => useAppSelector((state) => state.ui.showActionMenu);
export const useReduxShowReplyModal = () => useAppSelector((state) => state.ui.showReplyModal);
export const useReduxShowShareModal = () => useAppSelector((state) => state.ui.showShareModal);
export const useReduxCurrentStoryIndexUI = () => useAppSelector((state) => state.ui.currentStoryIndex);
export const useReduxCurrentStoryUser = () => useAppSelector((state) => state.ui.currentStoryUser);

// Legacy exports (backward compatibility - will be removed in future)
export const useAuth = useReduxAuth;
export const useAuthUser = useReduxAuthUser;
export const useAuthToken = useReduxAuthToken;
export const useIsAuthenticated = useReduxIsAuthenticated;
export const useAuthLoading = useReduxAuthLoading;
export const useAuthError = useReduxAuthError;
export const usePosts = useReduxPosts;
export const usePostsList = useReduxPostsList;
export const usePostsLoading = useReduxPostsLoading;
export const usePostsError = useReduxPostsError;
export const useStories = useReduxStories;
export const useStoriesList = useReduxStoriesList;
export const useMyStories = useReduxMyStories;
export const useStoriesLoading = useReduxStoriesLoading;
export const useStoriesError = useReduxStoriesError;
export const useCurrentStoryIndex = useReduxCurrentStoryIndex;
export const useShowStoryViewer = useReduxShowStoryViewer;
export const useUser = useReduxUser;
export const useCurrentUser = useReduxCurrentUser;
export const useViewedUser = useReduxViewedUser;
export const useUserFollowers = useReduxUserFollowers;
export const useUserFollowing = useReduxUserFollowing;
export const useUserLoading = useReduxUserLoading;
export const useUserError = useReduxUserError;
export const useUI = useReduxUI;
export const useCurrentScreen = useReduxCurrentScreen;
export const useActiveTab = useReduxActiveTab;
export const useUILoading = useReduxUILoading;
export const useLoadingMessage = useReduxLoadingMessage;
export const useUIError = useReduxUIError;
export const useShowError = useReduxShowError;
export const useIsRefreshing = useReduxIsRefreshing;
export const useKeyboardVisible = useReduxKeyboardVisible;
export const useKeyboardHeight = useReduxKeyboardHeight;
export const useTheme = useReduxTheme;
export const useLanguage = useReduxLanguage;
export const useIsAppReady = useReduxIsAppReady;
export const useIsFirstLaunch = useReduxIsFirstLaunch;
export const useShowStoryViewerUI = useReduxShowStoryViewerUI;
export const useShowActionMenu = useReduxShowActionMenu;
export const useShowReplyModal = useReduxShowReplyModal;
export const useShowShareModal = useReduxShowShareModal;
export const useCurrentStoryIndexUI = useReduxCurrentStoryIndexUI;
export const useCurrentStoryUser = useReduxCurrentStoryUser;

