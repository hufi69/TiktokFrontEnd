// Professional Constants Organization
export * from './theme';


export const APP_CONSTANTS = {
  APP_NAME: 'TokTok',
  APP_VERSION: '1.0.0',
  SUPPORTED_LANGUAGES: ['en', 'es', 'fr', 'de'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
};

export const API_CONSTANTS = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@toktok_auth_token',
  USER_DATA: '@toktok_user_data',
  COUNTRY_DATA: '@toktok_country_data',
  THEME_PREFERENCE: '@toktok_theme_preference',
  LANGUAGE_PREFERENCE: '@toktok_language_preference',
};

// Screen Names
export const SCREEN_NAMES = {
  SPLASH: 'SplashScreen',
  ONBOARDING: 'OnboardingScreen',
  WELCOME: 'WelcomeScreen',
  LOGIN: 'LoginScreen',
  SIGNUP: 'SignupScreen',
  FORGOT_PASSWORD: 'ForgotPasswordScreen',
  CREATE_NEW_PASSWORD: 'CreateNewPasswordScreen',
  CHANGE_PASSWORD: 'ChangePasswordScreen',
  OTP_VERIFICATION: 'OtpVerificationScreen',
  COUNTRY_SELECT: 'CountrySelectScreen',
  FILL_PROFILE: 'FillProfileScreen',
  RESET_SUCCESS: 'ResetSuccessScreen',
  FULL_HOME: 'FullHomeScreen',
  CREATE_POST: 'CreatePostScreen',
  EDIT_POST: 'EditPostScreen',
  COMMENT: 'CommentScreen',
  PROFILE: 'ProfileScreen',
  FOLLOW_SOMEONE: 'FollowSomeoneScreen',
};

// Animation Constants
export const ANIMATION_CONSTANTS = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
};

// Validation Constants
export const VALIDATION_CONSTANTS = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  FULL_NAME_MAX_LENGTH: 50,
  BIO_MAX_LENGTH: 160,
};
