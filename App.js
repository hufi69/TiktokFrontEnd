import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, StyleSheet, Animated, Dimensions, Easing, Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import OnboardingScreen2 from './src/screens/OnboardingScreen2';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import ForgotPasswordOTPScreen from './src/screens/auth/ForgotPasswordOTPScreen';
import CreateNewPasswordScreen from './src/screens/auth/CreateNewPasswordScreen';
import ChangePasswordScreen from './src/screens/auth/ChangePasswordScreen';
import ResetSuccessScreen from './src/screens/ResetSuccessScreen';
import FillProfileScreen from './src/screens/profile/FillProfileScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import FollowSomeoneScreen from './src/screens/profile/FollowSomeoneScreen';
import CountrySelectScreen from './src/screens/CountrySelectScreen';
import OtpVerificationScreen from './src/screens/auth/OtpVerificationScreen';
import FullHomeScreen from './src/screens/HomeScreen/FullHomeScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import InboxScreen from './src/screens/InboxScreen';
import ChatScreen from './src/screens/ChatScreen';


import { useAppDispatch, useCurrentScreen, useAuthLoading, useAuthError, useAppSelector } from './src/hooks/hooks';
import { setCurrentScreen, setSelectedUserId, setSelectedChatUser, setFollowSomeoneSource } from './src/store/slices/uiSlice';
import { loginUser, signupUser, updateUserCountry, loadStoredAuth, verifyOTP, verifyResetPasswordOTP, verifyToken, logoutUser, googleLogin } from './src/store/slices/authSlice';
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
  const { selectedUserId, selectedChatUser } = useAppSelector(state => state.ui);
  const authLoading = useAuthLoading();
  const authError = useAuthError();
  const user = useAppSelector((state) => state.auth.user);
  const isTokenVerified = useAppSelector((state) => state.auth.isTokenVerified);
  
  // Track if auth initialization is complete
  const [isInitializing, setIsInitializing] = useState(true);

  // Load stored authentication 
  useEffect(() => {
    const initializeAuth = async () => {
      // Always start with splash screen
      dispatch(setCurrentScreen('splash'));
      setIsInitializing(true);
      
      // Show splash screen for 3-4 seconds
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      // Load stored auth (this will check token expiration)
      const loadResult = await dispatch(loadStoredAuth());
      
      const token = await getAuthToken();
      console.log('Token check:', { hasToken: !!token, tokenLength: token?.length });
      
      if (token && loadStoredAuth.fulfilled.match(loadResult) && loadResult.payload) {
        // We have a valid token (not expired) and user data
        // Navigate to home immediately - backend verification can happen in background
        console.log('✅ Valid token and user found, navigating to home');
        dispatch(setCurrentScreen('home'));
        
        // Verify token with backend in background (non-blocking)
        // If verification fails, we'll handle it gracefully without redirecting
        dispatch(verifyToken()).then((result) => {
          if (verifyToken.rejected.match(result)) {
            console.log('⚠️ Backend token verification failed, but keeping user logged in (token not expired locally)');
            // Don't redirect - token is still valid locally, just backend check failed
            // This could be due to network issues or backend being down
          } else {
            console.log('✅ Backend token verification successful');
          }
        }).catch((error) => {
          console.log('⚠️ Token verification error (non-critical):', error);
          // Don't redirect on error - token is still valid locally
        });
      } else {
        console.log('❌ No valid token found, redirecting to onboarding');
        dispatch(setCurrentScreen('onboarding'));
      }
      
      // Mark initialization as complete
      setIsInitializing(false);
    };
    
    initializeAuth();
  }, [dispatch]);

  // Track previous screen to detect transition from onboarding
  const [prevScreen, setPrevScreen] = useState(null);
  
  useEffect(() => {
    // Track screen changes for animation coordination
    if (currentScreen !== 'welcome') {
      // Reset animation when leaving welcome screen
      welcomeSlideAnim.setValue(0);
    }
    setPrevScreen(currentScreen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen]); // Only depend on currentScreen to avoid infinite loops

  const handleSplashFinish = () => {
    dispatch(setCurrentScreen('onboarding'));
  };

  const handleOnboardingNext = () => {
    if (onboardingStep === 1) {
     
      Animated.timing(onboardingSlideAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease), // Smooth easing
        useNativeDriver: true,
      }).start(() => {
        setOnboardingStep(2);
        onboardingSlideAnim.setValue(0);
      });
    } else {
      // Smooth slide animation from screen 2 to welcome
      startWelcomeTransition(2, 400);
    }
  };

  const handleOnboardingSkip = () => {
    if (onboardingStep === 2) {
      startWelcomeTransition(2, 300);
      return;
    }

    startWelcomeTransition(1, 300);
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
          console.log(' Google login initiated'); 
        } else {
          console.log(' Google login failed:', result.error);
          const errorMessage = typeof result.error === 'string' ? result.error : 'Google login failed';
          alert('Google login failed: ' + errorMessage);
        }
      } catch (error) {
        console.error(' Google login error:', error);
        alert('Google login error: ' + error.message);
      }
    } else {
      console.log(`${provider} login clicked - no navigation`);
    }
  };

  const handleLoginSubmit = async (data) => {
    try {
      console.log('Login started with:', data.email);
      const result = await dispatch(loginUser(data));
      console.log(' Login result:', result);
      
      if (loginUser.fulfilled.match(result)) {
        console.log('Login successful!');
        
     
        if (result.payload.user && result.payload.user.isEmailVerified) {
          console.log('User is email verified, going to home');
          dispatch(setCurrentScreen('home'));
        } else {
          console.log(' User not email verified, going to OTP verification');
          dispatch(setCurrentScreen('otp'));
        }
      } else if (loginUser.rejected.match(result)) {
        console.log(' Login failed:', result.payload);
        const errorMessage = typeof result.payload === 'string' ? result.payload : 'Login failed. Please try again.';
        
        // Use setTimeout to ensure Alert is shown after current execution completes
        setTimeout(() => {
          Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
        }, 100);
      }
    } catch (error) {
      console.error(' Login error:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      setTimeout(() => {
        Alert.alert('Error', 'Login error: ' + errorMessage, [{ text: 'OK' }]);
      }, 100);
    }
  };

  const handleForgetPassword = () => {
    dispatch(setCurrentScreen('forgotPassword'));
  };
  

  // Signup screen handlers
  const handleSignupSubmit = async (data) => {
    console.log(' Signup button clicked with data:', data);
    try {
      console.log(' Making API call to:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SIGNUP);
      setSignupEmail(data.email); 
      const result = await dispatch(signupUser(data));
      console.log(' API response:', result);
      
      if (signupUser.fulfilled.match(result)) {
        console.log('Signup successful! Redirecting to OTP verification...');
        dispatch(setCurrentScreen('otp'));
      } else if (signupUser.rejected.match(result)) {
        console.log(' Signup failed:', result.payload);
        const errorMessage = typeof result.payload === 'string' ? result.payload : 'Signup failed. Please try again.';
        const errorLower = errorMessage.toLowerCase();
        const isUserExistsError = 
          errorLower.includes('already exist') ||
          errorLower.includes('user already exists') ||
          errorLower.includes('email already') ||
          errorLower.includes('already registered');
        
        // Use setTimeout to ensure Alert is shown after current execution completes
        setTimeout(() => {
          if (isUserExistsError) {
            Alert.alert('Error', 'User already exist', [{ text: 'OK' }]);
          } else {
            Alert.alert('Error', 'Signup failed: ' + errorMessage, [{ text: 'OK' }]);
          }
        }, 100);
      }
    } catch (error) {
      console.error(' Signup error:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      const errorLower = errorMessage.toLowerCase();
      const isUserExistsError = 
        errorLower.includes('already exist') ||
        errorLower.includes('user already exists') ||
        errorLower.includes('email already') ||
        errorLower.includes('already registered');
      
      // Use setTimeout to ensure Alert is shown after current execution completes
      setTimeout(() => {
        if (isUserExistsError) {
          Alert.alert('Error', 'User already exist', [{ text: 'OK' }]);
        } else {
          Alert.alert('Error', 'Signup error: ' + errorMessage, [{ text: 'OK' }]);
        }
      }, 100);
    }
  };

  const [resetOTP, setResetOTP] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [signupEmail, setSignupEmail] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingSlideAnim] = useState(new Animated.Value(0));
  const [onboarding2SlideAnim] = useState(new Animated.Value(0));
  const [welcomeSlideAnim] = useState(new Animated.Value(0));
  const [isTransitioningToWelcome, setIsTransitioningToWelcome] = useState(false);
  const [transitioningFromStep, setTransitioningFromStep] = useState(null);

  const navigateToWelcomeImmediate = useCallback(() => {
    setIsTransitioningToWelcome(false);
    setTransitioningFromStep(null);
    welcomeSlideAnim.stopAnimation();
    welcomeSlideAnim.setValue(1);
    dispatch(setCurrentScreen('welcome'));
  }, [dispatch, welcomeSlideAnim]);

  const startWelcomeTransition = useCallback((fromStep, duration = 400) => {
    const outgoingAnim = fromStep === 1 ? onboardingSlideAnim : onboarding2SlideAnim;
    outgoingAnim.setValue(0);
    welcomeSlideAnim.setValue(0);
    setIsTransitioningToWelcome(true);
    setTransitioningFromStep(fromStep);

    Animated.parallel([
      Animated.timing(outgoingAnim, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(welcomeSlideAnim, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOnboardingStep(1);
      outgoingAnim.setValue(0);
      setIsTransitioningToWelcome(false);
      setTransitioningFromStep(null);
      dispatch(setCurrentScreen('welcome'));
    });
  }, [dispatch, onboarding2SlideAnim, onboardingSlideAnim, welcomeSlideAnim]);

  const handleForgotPasswordVerify = (email) => {
    setForgotPasswordEmail(email);
    dispatch(setCurrentScreen('forgotPasswordOTP'));
  };
  const handleForgotPasswordOTPBack = () => {
    dispatch(setCurrentScreen('forgotPassword'));
  };

  const handleForgotPasswordOTPVerify = async ({ otp }) => {
    try {
      console.log('🔧 Forgot password OTP verification started with:', otp);
     
      const result = await dispatch(verifyResetPasswordOTP({ otp }));
      console.log('📦 Forgot password OTP verification result:', result);
      
      if (verifyResetPasswordOTP.fulfilled.match(result)) {
        console.log('✅ Forgot password OTP verified successfully!');
        // Store the OTP to use in reset password API
        setResetOTP(otp);
        dispatch(setCurrentScreen('createNewPassword'));
      } else if (verifyResetPasswordOTP.rejected.match(result)) {
        console.log('❌ Forgot password OTP verification failed:', result.payload);
        const errorMessage = typeof result.payload === 'string' 
          ? result.payload 
          : 'OTP verification failed';
        Alert.alert('Error', errorMessage);
      }
    } catch (e) {
      console.error(' Forgot password OTP verification error:', e);
      Alert.alert('Error', e.message || 'OTP verification error');
    }
  };

  // Create new password handlers
  const handleCreatePasswordContinue = () => {
    setResetOTP(null); // Clear OTP after successful reset
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
        Alert.alert('Success', 'Profile updated successfully!');
        setProfileRefreshTrigger(prev => prev + 1);
        dispatch(setCurrentScreen('profile'));
      } else if (updateUserProfile.rejected.match(result)) {
        console.log(' Profile update failed:', result.payload);
        // Extract error message from payload
        let errorMessage = 'Profile update failed';
        if (typeof result.payload === 'string') {
          errorMessage = result.payload;
        } else if (result.payload?.message) {
          errorMessage = result.payload.message;
        } else if (result.error?.message) {
          errorMessage = result.error.message;
        }
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error(' Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleEditCountry = () => {
    console.log(' Edit country pressed');
    dispatch(setFollowSomeoneSource('profile'));
    dispatch(setCurrentScreen('countrySelect'));
  };

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
    console.log(' App.js: Updating comment count for post:', postId, 'to:', newCommentCount);
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
    // Navigate to login screen instead of home
    setResetOTP(null);
    setForgotPasswordEmail('');
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
        console.log(' Profile update failed:', result.payload);
        // Extract error message from payload
        let errorMessage = 'Profile update failed';
        if (typeof result.payload === 'string') {
          errorMessage = result.payload;
        } else if (result.payload?.message) {
          errorMessage = result.payload.message;
        } else if (result.error?.message) {
          errorMessage = result.error.message;
        }
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error(' Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
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
      navigateToWelcomeImmediate();
    } catch (error) {
      console.error('Logout error:', error);
      navigateToWelcomeImmediate();
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
    navigateToWelcomeImmediate();
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
    const state = store.getState();
    const followSomeoneSource = state.ui.followSomeoneSource;
    
    if (followSomeoneSource === 'profile') {
      dispatch(setCurrentScreen('profile'));
    } else {
      // Default: go to country select (onboarding flow)
      dispatch(setCurrentScreen('countrySelect'));
    }
  };

  const handleBackToFollowSomeone = () => {
    const state = store.getState();
    const followSomeoneSource = state.ui.followSomeoneSource;
    console.log('🔙 Back from follow someone, source:', followSomeoneSource);
    
    if (followSomeoneSource === 'profile') {
      dispatch(setSelectedUserId(null));
      dispatch(setCurrentScreen('profile'));
    } else {
     
      dispatch(setCurrentScreen('fillProfile'));
    }
    
    // Clear the source
    dispatch(setFollowSomeoneSource(null));
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'splash':
        // Only allow auto-navigation if we're not initializing (manual splash screen access)
        return <SplashScreen onFinish={handleSplashFinish} shouldAutoNavigate={!isInitializing} />;
      case 'onboarding': {
        const slideTranslateX = onboardingSlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -Dimensions.get('window').width],
        });
        const opacity = onboardingSlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        });
        
        const slide2TranslateX = onboarding2SlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -Dimensions.get('window').width],
        });
        const opacity2 = onboarding2SlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        });

        if (isTransitioningToWelcome && transitioningFromStep) {
          const outgoingAnim = transitioningFromStep === 1 ? onboardingSlideAnim : onboarding2SlideAnim;
          const outgoingTranslateX = outgoingAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -Dimensions.get('window').width],
          });
          const outgoingOpacity = outgoingAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          });
          const welcomeSlideOverlay = welcomeSlideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [Dimensions.get('window').width, 0],
          });
          const welcomeOpacityOverlay = welcomeSlideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });
          const OutgoingComponent = transitioningFromStep === 1 ? OnboardingScreen : OnboardingScreen2;

          return (
            <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
              <Animated.View 
                style={{ 
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  transform: [{ translateX: outgoingTranslateX }],
                  opacity: outgoingOpacity 
                }}
              >
                <OutgoingComponent 
                  onNext={handleOnboardingNext}
                  onSkip={handleOnboardingSkip}
                />
              </Animated.View>

              <Animated.View 
                style={{ 
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  transform: [{ translateX: welcomeSlideOverlay }],
                  opacity: welcomeOpacityOverlay 
                }}
              >
                <WelcomeScreen 
                  onBack={() => {
                    welcomeSlideAnim.setValue(0);
                    setIsTransitioningToWelcome(false);
                    setTransitioningFromStep(null);
                    dispatch(setCurrentScreen('onboarding'));
                  }}
                  onSignUp={handleSignUp}
                  onSignInPassword={handleSignInPassword}
                  onGoogle={() => handleSocialLogin('google')}
                  onFacebook={() => handleSocialLogin('facebook')}
                  onApple={() => handleSocialLogin('apple')}
                />
              </Animated.View>
            </View>
          );
        }
        
        if (onboardingStep === 1) {
          return (
            <Animated.View 
              style={{ 
                flex: 1, 
                transform: [{ translateX: slideTranslateX }],
                opacity 
              }}
            >
              <OnboardingScreen 
                onNext={handleOnboardingNext}
                onSkip={handleOnboardingSkip}
              />
            </Animated.View>
          );
        } else {
          return (
            <Animated.View 
              style={{ 
                flex: 1, 
                transform: [{ translateX: slide2TranslateX }],
                opacity: opacity2 
                
              }}
            >
              <OnboardingScreen2 
                onNext={handleOnboardingNext}
                onSkip={handleOnboardingSkip}
              />
            </Animated.View>
          );
        }
      }
      case 'welcome':
        const welcomeSlideInX = welcomeSlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [Dimensions.get('window').width, 0],
        });
        const welcomeOpacity = welcomeSlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });
        
        return (
          <Animated.View 
            style={{ 
              flex: 1,
              transform: [{ translateX: welcomeSlideInX }],
              opacity: welcomeOpacity 
            }}
          >
            <WelcomeScreen 
              onBack={() => {
                welcomeSlideAnim.setValue(0);
                dispatch(setCurrentScreen('onboarding'));
              }}
              onSignUp={handleSignUp}
              onSignInPassword={handleSignInPassword}
              onGoogle={() => handleSocialLogin('google')}
              onFacebook={() => handleSocialLogin('facebook')}
              onApple={() => handleSocialLogin('apple')}
            />
          </Animated.View>
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
      case 'forgotPasswordOTP':
        return (
          <ForgotPasswordOTPScreen
            onBack={handleForgotPasswordOTPBack}
            onVerify={handleForgotPasswordOTPVerify}
            email={forgotPasswordEmail}
            loading={authLoading}
            error={authError}
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
            onBack={() => dispatch(setCurrentScreen('forgotPasswordOTP'))}
            onContinue={handleCreatePasswordContinue}
            resetOTP={resetOTP}
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
        // Get email from signupEmail state or from user object (after OTP verification)
        const userEmail = signupEmail || user?.email || '';
        return (
          <FillProfileScreen
            onBack={handleBackToCountrySelect}
            onContinue={handleFillProfileContinue}
            userData={{ email: userEmail }}
            isSignupFlow={true}
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
         
              const state = store.getState();
              const followSomeoneSource = state.ui.followSomeoneSource;
              if (followSomeoneSource === 'profile' && selectedUserId) {
                dispatch(setCurrentScreen('followSomeone'));
              } else {
              
                dispatch(setSelectedUserId(null));
                dispatch(setCurrentScreen('home'));
              }
            }}
            onEditProfile={handleEditProfile}
            onSettings={handleProfileSettings}
            onCreatePost={handleCreatePost}
            onFollowSomeone={handleProfileFollowSomeone}
            onUserProfilePress={handleUserProfilePress}
            route={{ params: { userId: selectedUserId } }}
            refreshTrigger={profileRefreshTrigger}
          />
        );
      case 'home':
        return (
          <FullHomeScreen 
            onLogout={handleLogout} 
            onProfilePress={handleProfilePress} 
            onCreatePost={handleCreatePost} 
            onViewComments={handleViewComments} 
            onEditPost={handleEditPost} 
            onPostUpdated={handlePostUpdated}
            onActivityPress={() => dispatch(setCurrentScreen('activity'))}
            onInboxPress={() => dispatch(setCurrentScreen('inbox'))}
            onUserProfilePress={handleUserProfilePress}
          />
        );
      case 'activity':
        return (
          <ActivityScreen
            onBack={() => dispatch(setCurrentScreen('home'))}
            onUserPress={handleUserProfilePress}
            onFollowPress={(userId, isFollowing) => {
              // Handle follow/unfollow - can be implemented later with backend
              console.log('Follow toggle:', userId, isFollowing);
            }}
          />
        );
      case 'inbox':
        return (
          <InboxScreen
            onBack={() => dispatch(setCurrentScreen('home'))}
            onUserPress={handleUserProfilePress}
            onMessagePress={(message) => {
              dispatch(setSelectedChatUser(message.user));
              dispatch(setCurrentScreen('chat'));
            }}
            onCreateMessage={() => {
              // Handle create message - can be implemented later
              console.log('Create message pressed');
            }}
          />
        );
      case 'chat':
        return (
          <ChatScreen
            onBack={() => {
              dispatch(setSelectedChatUser(null));
              dispatch(setCurrentScreen('inbox'));
            }}
            user={selectedChatUser}
          />
        );
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

  // Safety check: Only redirect if we're on home screen but have no user AND no token
  // This should rarely happen, but acts as a safety net
  useEffect(() => {
    // Only run this check once after initialization is complete
    if (!isInitializing && currentScreen === 'home') {
      // Small delay to ensure all state updates have completed
      const checkTimer = setTimeout(() => {
        if (!user) {
          getAuthToken().then(token => {
            if (!token) {
              console.log('⚠️ Safety check: No user and no token found, redirecting to onboarding');
              dispatch(setCurrentScreen('onboarding'));
            } else {
              console.log('⚠️ Safety check: Token exists but no user in state - this might be a state sync issue');
              // Token exists but user not in state - try reloading auth
              dispatch(loadStoredAuth());
            }
          });
        } else {
          console.log('✅ Safety check passed: User exists in state');
        }
      }, 500); // Small delay to avoid race conditions
      
      return () => clearTimeout(checkTimer);
    }
  }, [isInitializing, currentScreen, user, dispatch]);

  // Prevent rendering screens until auth initialization is complete
  // This fixes the issue where home screen flashes before redirecting to onboarding
  const renderApp = () => {
    // If still initializing, always show splash screen
    // This prevents the home screen from flashing before auth check completes
    // Pass shouldAutoNavigate=false to prevent SplashScreen from auto-navigating
    // since we handle navigation in initializeAuth
    if (isInitializing) {
      return <SplashScreen onFinish={handleSplashFinish} shouldAutoNavigate={false} />;
    }
    
    // After initialization, render the current screen
    return renderCurrentScreen();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {renderApp()}
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