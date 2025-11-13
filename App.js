import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import CreateNewPasswordScreen from './src/screens/auth/CreateNewPasswordScreen';
import ChangePasswordScreen from './src/screens/auth/ChangePasswordScreen';
import ResetSuccessScreen from './src/screens/ResetSuccessScreen';
import FillProfileScreen from './src/screens/profile/FillProfileScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import FollowSomeoneScreen from './src/screens/profile/FollowSomeoneScreen';
import CountrySelectScreen from './src/screens/CountrySelectScreen';
import OtpVerificationScreen from './src/screens/auth/OtpVerificationScreen';
import FullHomeScreen from './src/screens/HomeScreen/FullHomeScreen';


import { useAppDispatch, useCurrentScreen, useAuthLoading, useAuthError, useAppSelector } from './src/hooks/hooks';
import { setCurrentScreen, setSelectedUserId, setFollowSomeoneSource } from './src/store/slices/uiSlice';
import { loginUser, signupUser, updateUserCountry, loadStoredAuth, verifyOTP, verifyToken, logoutUser, googleLogin } from './src/store/slices/authSlice';
import { updateUserProfile } from './src/store/slices/userSlice';
import { updateCommentCount } from './src/store/slices/postsSlice';
import { API_CONFIG } from './src/config/api';
import { getAuthToken } from './src/utils/helpers/storage';
import CreatePostScreen from './src/screens/PostScreen/CreatePostScreen';
import CommentScreen from './src/screens/PostScreen/CommentScreen';
import EditPostScreen from './src/screens/PostScreen/EditPostScreen';

function AppContent() {
  const dispatch = useAppDispatch();
  const currentScreen = useCurrentScreen();
  const { selectedUserId } = useAppSelector(state => state.ui);
  const authLoading = useAuthLoading();
  const authError = useAuthError();
  const user = useAppSelector((state) => state.auth.user);

  // Load stored authentication data and verify token on app start
  useEffect(() => {
    const initializeAuth = async () => {
      console.log(' App initialization started');
      
      // Start with splash screen for better UX
      dispatch(setCurrentScreen('splash'));
      console.log(' Splash screen set');
      
      // Wait a bit for splash screen to show
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(' Splash screen timeout completed');
      
      await dispatch(loadStoredAuth());
      console.log(' Stored auth loaded');
      
      
      // If we have a token, verify it with backend
      const token = await getAuthToken();
      console.log('Token check:', { hasToken: !!token, tokenLength: token?.length });
      if (token) {
        try {
          const result = await dispatch(verifyToken());
          if (verifyToken.fulfilled.match(result)) {
            console.log(' Token verified, user is authenticated');
            // User is authenticated, go to home
            dispatch(setCurrentScreen('home'));
          } else {
            console.log(' Token invalid, redirecting to onboarding');
            // Token is invalid, go to onboarding
            dispatch(setCurrentScreen('onboarding'));
          }
        } catch (error) {
          console.log('💥 Token verification failed:', error);
          dispatch(setCurrentScreen('onboarding'));
        }
      } else {
        // No token, go to onboarding screen
        dispatch(setCurrentScreen('onboarding'));
      }
    };
    
    initializeAuth();
  }, [dispatch]);

  const handleSplashFinish = () => {
    dispatch(setCurrentScreen('onboarding'));
  };

  const handleOnboardingNext = () => {
    dispatch(setCurrentScreen('welcome'));
  };

  const handleOnboardingSkip = () => {
    dispatch(setCurrentScreen('welcome'));
  };

  const handleSignUp = () => {
    dispatch(setCurrentScreen('signup'));
  };

  const handleSignInPassword = () => {
    dispatch(setCurrentScreen('login'));
  };

  const handleSocialLogin = async (provider) => {
    console.log(`Social login with ${provider}`);
    
    if (provider === 'google') {
      try {
        const result = await dispatch(googleLogin());
        if (googleLogin.fulfilled.match(result)) {
          console.log(' Google login initiated'); //just icon not implemented yet 
          
          dispatch(setCurrentScreen('countrySelect'));
        } else {
                  console.log(' Google login failed:', result.error);
        const errorMessage = typeof result.error === 'string' ? result.error : 'Google login failed';
        alert('Google login failed: ' + errorMessage);
        }
      } catch (error) {
        console.error('💥 Google login error:', error);
        alert('Google login error: ' + error.message);
      }
    } else {
      // For other providers, go to country selection
      dispatch(setCurrentScreen('countrySelect'));
    }
  };

  // Login screen handlers
  const handleLoginSubmit = async (data) => {
    try {
      console.log('Login started with:', data.email);
      const result = await dispatch(loginUser(data));
      console.log(' Login result:', result);
      
      if (loginUser.fulfilled.match(result)) {
        console.log('Login successful!');
        
        // Check if user is email verified
        if (result.payload.user && result.payload.user.isEmailVerified) {
          console.log('User is email verified, going to home');
          dispatch(setCurrentScreen('home'));
        } else {
          console.log(' User not email verified, going to OTP verification');
          dispatch(setCurrentScreen('otp'));
        }
      } else if (loginUser.rejected.match(result)) {
        console.log(' Login failed:', result.error);
        const errorMessage = typeof result.error === 'string' ? result.error : 'Login failed';
        alert('Login failed: ' + errorMessage);
      }
    } catch (error) {
      console.error(' Login error:', error);
      alert('Login error: ' + error.message);
    }
  };

  const handleForgetPassword = () => {
    dispatch(setCurrentScreen('forgotPassword'));
  };
  

  // Signup screen handlers
  const handleSignupSubmit = async (data) => {
    console.log(' Signup button clicked with data:', data);
    try {
      console.log('📡 Making API call to:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SIGNUP);
      setSignupEmail(data.email); // Store email for OTP screen
      const result = await dispatch(signupUser(data));
      console.log(' API response:', result);
      
      if (signupUser.fulfilled.match(result)) {
        console.log('Signup successful! Redirecting to OTP verification...');
        dispatch(setCurrentScreen('otp'));
      } else if (signupUser.rejected.match(result)) {
        console.log(' Signup failed:', result.error);
        const errorMessage = typeof result.error === 'string' ? result.error : 'Signup failed. Please try again.';
        alert('Signup failed: ' + errorMessage);
      }
    } catch (error) {
      console.error(' Signup error:', error);
      alert('Signup error: ' + error.message);
    }
  };

  const [resetToken, setResetToken] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [signupEmail, setSignupEmail] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);

  // Forgot password handlers
  const handleForgotPasswordVerify = (token) => {
    setResetToken(token);
    dispatch(setCurrentScreen('createNewPassword'));
  };

  // Create new password handlers
  const handleCreatePasswordContinue = () => {
    dispatch(setCurrentScreen('resetSuccess'));
  };

  // Change password handlers
  const handleBackToProfile = () => {
    dispatch(setCurrentScreen('profile'));
  };

  const handleChangePasswordSuccess = () => {
    dispatch(setCurrentScreen('profile'));
  };

  // Profile handlers
  const handleProfileSettings = () => {
    dispatch(setCurrentScreen('changePassword'));
  };

  const handleEditProfile = () => {
    console.log(' Edit profile pressed');
    dispatch(setCurrentScreen('editProfile'));
  };

  const handleBackFromEditProfile = () => {
    console.log('Back from edit profile');
    dispatch(setCurrentScreen('profile'));
  };

  const handleEditProfileContinue = async (data) => {
    try {
      console.log(' Profile edit update started with:', data);
      const result = await dispatch(updateUserProfile(data));
      console.log('Profile edit update result:', result);
      
      if (updateUserProfile.fulfilled.match(result)) {
        console.log('Profile updated successfully!');
        // Trigger profile refresh and go back to profile screen
        setProfileRefreshTrigger(prev => prev + 1);
        dispatch(setCurrentScreen('profile'));
      } else if (updateUserProfile.rejected.match(result)) {
        console.log(' Profile update failed:', result.error);
        const errorMessage = typeof result.error === 'string' ? result.error : 'Profile update failed';
        alert('Profile update failed: ' + errorMessage);
      }
    } catch (error) {
      console.error(' Profile update error:', error);
      alert('Profile update error: ' + error.message);
    }
  };

  const handleEditCountry = () => {
    console.log(' Edit country pressed');
    dispatch(setFollowSomeoneSource('profile'));
    dispatch(setCurrentScreen('countrySelect'));
  };

  // Post creation handlers
  const handleCreatePost = () => {
    dispatch(setCurrentScreen('createPost'));
  };

  const handlePostCreated = () => {
    dispatch(setCurrentScreen('home'));
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    dispatch(setCurrentScreen('editPost'));
  };

  const handlePostUpdated = (updatedPost) => {
    console.log(' Post updated in App.js:', updatedPost);
    setEditingPost(null);
    dispatch(setCurrentScreen('home'));
  };

  // Centralized handler for updating comment counts from CommentScreen
  const handleCommentCountUpdate = useCallback((postId, newCommentCount) => {
    console.log('📝 App.js: Updating comment count for post:', postId, 'to:', newCommentCount);
    dispatch(updateCommentCount({ postId, count: newCommentCount }));
  }, [dispatch]);

  const handleBackFromEditPost = () => {
    setEditingPost(null);
    dispatch(setCurrentScreen('home'));
  };

  // Comment handlers
  const handleViewComments = (post) => {
    console.log(' View comments for post:', post);
    setSelectedPost(post);
    dispatch(setCurrentScreen('comments'));
  };

  const handleBackFromComments = () => {
    dispatch(setCurrentScreen('home'));
  };

  // Reset success handlers
  const handleResetSuccessDone = () => {
    dispatch(setCurrentScreen('login'));
  };

  // Fill profile handlers
  const handleFillProfileContinue = async (data) => {
    try {
      console.log('🔧 Profile update started with:', data);
      const result = await dispatch(updateUserProfile(data));
      console.log('📦 Profile update result:', result);
      
      if (updateUserProfile.fulfilled.match(result)) {
        console.log('Profile updated successfully!');
        
        // After profile completion, go to follow someone screen
        dispatch(setCurrentScreen('followSomeone'));
      } else if (updateUserProfile.rejected.match(result)) {
        console.log(' Profile update failed:', result.error);
        const errorMessage = typeof result.error === 'string' ? result.error : 'Profile update failed';
        alert('Profile update failed: ' + errorMessage);
      }
    } catch (error) {
      console.error(' Profile update error:', error);
      alert('Profile update error: ' + error.message);
    }
  };

  // Follow someone handlers
  const handleFollowSomeoneContinue = (data) => {
    console.log('Following data:', data);
    
    
    const state = store.getState();
    const followSomeoneSource = state.ui.followSomeoneSource;
    
    console.log(' Continue from follow someone, source:', followSomeoneSource);
    
    if (followSomeoneSource === 'profile') {
      dispatch(setSelectedUserId(null));
      dispatch(setCurrentScreen('profile'));
    } else {
      dispatch(setCurrentScreen('home'));
    }
    dispatch(setFollowSomeoneSource(null));
  };
  // Logout
  const handleLogout = async () => {
    console.log(' Logging out user');
    try {
      await dispatch(logoutUser());
      dispatch(setCurrentScreen('welcome'));
    } catch (error) {
      console.error('Logout error:', error);
      dispatch(setCurrentScreen('welcome'));
    }
  };

  // Profile navigation handler
  const handleProfilePress = () => {
    console.log(' Profile button pressed');
    dispatch(setSelectedUserId(null));
    dispatch(setCurrentScreen('profile'));
  };

  const handleProfileFollowSomeone = () => {
    console.log(' Follow someone from profile pressed');
    dispatch(setFollowSomeoneSource('profile'));
    dispatch(setCurrentScreen('followSomeone'));
  };
  const handleFollowSomeoneFromOnboarding = () => {
    console.log(' Follow someone from onboarding pressed');
    dispatch(setFollowSomeoneSource('onboarding'));
    dispatch(setCurrentScreen('followSomeone'));
  };
  // User profile navigation handler
  const handleUserProfilePress = (user) => {
    console.log('User profile pressed:', user._id);
    
    const state = store.getState();
    const followSomeoneSource = state.ui.followSomeoneSource;
    console.log('Navigating to user profile from:', followSomeoneSource);
  
    dispatch(setSelectedUserId(user._id));
    dispatch(setCurrentScreen('profile'));
  };

  // Country selection handlers
  const handleCountrySelectContinue = async (selectedCountry) => {
    try {
      const result = await dispatch(updateUserCountry(selectedCountry));
      if (updateUserCountry.fulfilled.match(result)) {
        const state = store.getState();
        const followSomeoneSource = state.ui.followSomeoneSource;
        
        if (followSomeoneSource === 'profile') {

          dispatch(setCurrentScreen('editProfile'));
        } else {
         
          dispatch(setCurrentScreen('fillProfile'));
        }
      }
    } catch (error) {
      console.error('Country update failed:', error);
    }
  };

  // Back navigation handlers
  const handleBackToWelcome = () => {
    dispatch(setCurrentScreen('welcome'));
  };

  const handleBackToLogin = () => {
    dispatch(setCurrentScreen('login'));
  };

  const handleBackToSignup = () => {
    dispatch(setCurrentScreen('signup'));
  };

  const handleBackToForgotPassword = () => {
    dispatch(setCurrentScreen('forgotPassword'));
  };

  const handleBackToFillProfile = () => {
    dispatch(setCurrentScreen('fillProfile'));
  };

  const handleBackToCountrySelect = () => {
    // Check if we're coming from profile edit
    const state = store.getState();
    const followSomeoneSource = state.ui.followSomeoneSource;
    
    if (followSomeoneSource === 'profile') {
      // If we came from profile edit, go back to profile
      dispatch(setCurrentScreen('profile'));
    } else {
      // Default: go to country select (onboarding flow)
      dispatch(setCurrentScreen('countrySelect'));
    }
  };

  const handleBackToFollowSomeone = () => {
    // Get the source from UI state using getState instead of useAppSelector
    const state = store.getState();
    const followSomeoneSource = state.ui.followSomeoneSource;
    
    console.log('🔙 Back from follow someone, source:', followSomeoneSource);
    
    if (followSomeoneSource === 'profile') {
      // If we came from profile, go back to profile and clear selected user ID
      dispatch(setSelectedUserId(null));
      dispatch(setCurrentScreen('profile'));
    } else {
      // Default fallback to fillProfile (onboarding flow)
      dispatch(setCurrentScreen('fillProfile'));
    }
    
    // Clear the source
    dispatch(setFollowSomeoneSource(null));
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onFinish={handleSplashFinish} />;
      case 'onboarding':
        return (
          <OnboardingScreen 
            onNext={handleOnboardingNext}
            onSkip={handleOnboardingSkip}
          />
        );
      case 'welcome':
        return (
          <WelcomeScreen 
            onBack={() => dispatch(setCurrentScreen('onboarding'))}
            onSignUp={handleSignUp}
            onSignInPassword={handleSignInPassword}
            onGoogle={() => handleSocialLogin('google')}
            onFacebook={() => handleSocialLogin('facebook')}
            onApple={() => handleSocialLogin('apple')}
          />
        );
      case 'login':
        return (
          <LoginScreen
            onBack={handleBackToWelcome}
            onSubmit={handleLoginSubmit}
            onSocial={handleSocialLogin}
            onGoToSignup={handleSignUp}
            onForgetPassword={handleForgetPassword}
          />
        );
      case 'signup':
        return (
          <SignupScreen
            onBack={handleBackToWelcome}
            onSubmit={handleSignupSubmit}
            onSocial={handleSocialLogin}
            onGoToSignIn={handleSignInPassword}
          />
        );
      case 'forgotPassword':
        return (
          <ForgotPasswordScreen
            onBack={handleBackToLogin}
            onVerify={handleForgotPasswordVerify}
          />
        );
              case 'otp':
          return (
            <OtpVerificationScreen
              onBack={handleOtpBack}
              onVerify={handleOtpVerify}
              loading={authLoading}
              error={authError}
              email={signupEmail}
            />
          );
                  case 'createNewPassword':
              return (
                <CreateNewPasswordScreen
                  onBack={handleBackToForgotPassword}
                  onContinue={handleCreatePasswordContinue}
                  resetToken={resetToken}
                />
              );
              case 'changePassword':
              return (
                <ChangePasswordScreen
                  onBack={handleBackToProfile}
                  onSuccess={handleChangePasswordSuccess}
                />
              );
                  case 'createPost':
              return (
                <CreatePostScreen
                  onBack={() => dispatch(setCurrentScreen('home'))}
                  onPostCreated={handlePostCreated}
                />
              );

            case 'editPost':
              return (
                <EditPostScreen
                  onBack={handleBackFromEditPost}
                  post={editingPost}
                  onPostUpdated={handlePostUpdated}
                />
              );

            case 'comments':
              return (
                <CommentScreen
                  onBack={handleBackFromComments}
                  postId={selectedPost?.id || selectedPost?._id}
                  post={selectedPost}
                  onPostUpdated={handlePostUpdated}
                  onCommentCountUpdate={handleCommentCountUpdate}
                />
              );
              

            case 'resetSuccess':
        return (
          <ResetSuccessScreen
            onDone={handleResetSuccessDone}
          />
        );
      case 'countrySelect':
        return (
          <CountrySelectScreen
            onBack={handleBackToCountrySelect}
            onContinue={handleCountrySelectContinue}
          />
        );
      case 'fillProfile':
        return (
          <FillProfileScreen
            onBack={handleBackToCountrySelect}
            onContinue={handleFillProfileContinue}
          />
        );
      case 'editProfile':
        return (
          <FillProfileScreen
            onBack={handleBackFromEditProfile}
            onContinue={handleEditProfileContinue}
            userData={user}
            isEditMode={true}
            onEditCountry={handleEditCountry}
          />
        );
      case 'followSomeone':
        return (
          <FollowSomeoneScreen
            onBack={handleBackToFollowSomeone}
            onContinue={handleFollowSomeoneContinue}
            onUserProfilePress={handleUserProfilePress}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onBack={() => {
              // Check if we're viewing someone else's profile from Follow Someone
              const state = store.getState();
              const followSomeoneSource = state.ui.followSomeoneSource;
              if (followSomeoneSource === 'profile' && selectedUserId) {
                // Go back to Follow Someone screen
                dispatch(setCurrentScreen('followSomeone'));
              } else {
                // Go back to home and clear selected user ID
                dispatch(setSelectedUserId(null));
                dispatch(setCurrentScreen('home'));
              }
            }}
            onEditProfile={handleEditProfile}
            onSettings={handleProfileSettings}
            onFollowSomeone={handleProfileFollowSomeone}
            route={{ params: { userId: selectedUserId } }}
            refreshTrigger={profileRefreshTrigger}
          />
        );
      case 'home':
                      return <FullHomeScreen onLogout={handleLogout} onProfilePress={handleProfilePress} onCreatePost={handleCreatePost} onViewComments={handleViewComments} onEditPost={handleEditPost} onPostUpdated={handlePostUpdated} />;
      default:
        return <SplashScreen onFinish={handleSplashFinish} />;
    }
  };

  // OTP verification handlers
  const handleOtpBack = () => {
    dispatch(setCurrentScreen('signup'));
  };

  const handleOtpVerify = async ({ otp }) => {
    try {
      console.log('🔧 OTP verification started with:', otp);
      const result = await dispatch(verifyOTP({ otp }));
      console.log('📦 OTP verification result:', result);
      
      if (verifyOTP.fulfilled.match(result)) {
        console.log('✅ OTP verified successfully!');
        
        // Check if user needs profile completion
        if (result.payload.user) {
          const user = result.payload.user;
          console.log('👤 User data:', user);
          
          // Check if user has completed profile (has fullName, country, etc.)
          if (user.fullName && user.country) {
            console.log('✅ User profile complete, going to home');
            dispatch(setCurrentScreen('home'));
          } else {
            console.log('⚠️ User profile incomplete, going to country selection');
            dispatch(setCurrentScreen('countrySelect'));
          }
        } else {
          console.log('⚠️ No user data, going to country selection');
          dispatch(setCurrentScreen('countrySelect'));
        }
      } else if (verifyOTP.rejected.match(result)) {
        console.log('❌ OTP verification failed:', result.error);
        const errorMessage = typeof result.error === 'string' ? result.error : 'OTP verification failed';
        alert('OTP verification failed: ' + errorMessage);
      }
    } catch (e) {
      console.error('💥 OTP verification error:', e);
      alert('OTP verification error: ' + e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {renderCurrentScreen()}
    </SafeAreaView>
  );
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      cacheTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
export default App;
