import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG, buildUrl } from '../../config/api';
import { 
  storeAuthToken, 
  getAuthToken, 
  removeAuthToken, 
  storeUserData, 
  getUserData, 
  removeUserData,
  storeCountryData,
  getCountryData,
  removeCountryData
} from '../../utils/helpers/storage';
import { updateUserProfile } from './userSlice';
import * as authApi from '../../services/api/authApi';


export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('🔐 Login attempt:', {
        email: credentials.email,
        passwordLength: credentials.password?.length,
        hasPassword: !!credentials.password,
      });
      
      const data = await authApi.signIn(credentials);
      console.log('✅ Login successful:', {
        hasToken: !!data.token,
        hasUser: !!data.user,
        userId: data.user?._id,
      });

      // Store token and user data in AsyncStorage
      if (data.token) {
        await storeAuthToken(data.token);
      }
      if (data.user) {
        await storeUserData(data.user);
      }

      return data;
    } catch (error) {
      console.error('❌ Login failed:', {
        message: error.message,
        email: credentials.email,
      });
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Signup started with:', userData.email);
      
      const data = await authApi.signUp(userData);
      console.log('Signup successful:', data);
      
      return data;
    } catch (error) {
      console.log('Signup error:', error);
      return rejectWithValue(error.message || 'Signup failed');
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (otpData, { rejectWithValue }) => {
    try {
      console.log('OTP verification started');
      
      const data = await authApi.verifyOTP(otpData);
      console.log('OTP verification successful:', data);

      // Persist token and user data in AsyncStorage
      if (data.token) {
        await storeAuthToken(data.token);
      }
      if (data.user) {
        await storeUserData(data.user);
      }

      return data;
    } catch (error) {
      console.log('OTP verification error:', error);
      return rejectWithValue(error.message || 'OTP verification failed');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (emailData, { rejectWithValue }) => {
    try {
      console.log('Forgot password started');
      
      const email = typeof emailData === 'string' ? emailData : emailData.email;
      const data = await authApi.forgotPassword(email);
      
      console.log('Forgot password successful');
      return { ...data, email }; // Include email in response for OTP screen
    } catch (error) {
      console.log('Forgot password error:', error);
      return rejectWithValue(error.message || 'Password reset failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password, newPassword, confirmNewPassword }, { rejectWithValue }) => {
    try {
      console.log('Reset password started');
      
      const passwordData = {
        newPassword: newPassword || password,
        confirmNewPassword: confirmNewPassword || password,
      };

      const data = await authApi.resetPassword(token, passwordData);
      console.log('Reset password response:', data);

      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      return rejectWithValue(error.message || 'Password reset failed');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { getState, rejectWithValue }) => {
    try {
      console.log('Change password started');
      
      const data = await authApi.changePassword(passwordData);
      console.log('Change password response:', data);

      return data;
    } catch (error) {
      console.error('Change password error:', error);
      return rejectWithValue(error.message || 'Failed to change password');
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Google login started');
      
      // For now, we'll return a placeholder
      // TODO: Implement Google OAuth when ready
      return { message: 'Google login initiated' };
    } catch (error) {
      console.error('Google login error:', error);
      return rejectWithValue(error.message || 'Google login failed');
    }
  }
);

export const googleCalendarAuth = createAsyncThunk(
  'auth/googleCalendarAuth',
  async (_, { rejectWithValue }) => {
    try {
      const googleCalendarUrl = buildUrl(API_CONFIG.ENDPOINTS.GOOGLE_CALENDAR);
      
      //implement later
      return { message: 'Google Calendar auth initiated' };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      let { token, user } = getState().auth;

      if (!token) {
        token = await getAuthToken();
        if (!token) {
          return rejectWithValue('No token found');
        }
      }

      const data = await authApi.verifyToken();
      
      // Use existing user from storage/state
      const storedUser = user || (await getUserData());
      return { status: 'success', user: storedUser };
    } catch (error) {
      await removeAuthToken();
      await removeUserData();
      return rejectWithValue(error.message || 'Token verification failed');
    }
  }
);

export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (email, { rejectWithValue }) => {
    try {
      console.log('Resend OTP called for:', email);
      
      const data = await authApi.resendOTP(email);
      console.log('OTP resent successfully');
      
      return data;
    } catch (error) {
      console.log('Resend OTP error:', error);
      return rejectWithValue(error.message || 'Failed to resend OTP');
    }
  }
);

export const updateUserCountry = createAsyncThunk(
  'auth/updateUserCountry',
  async (countryData, { rejectWithValue }) => {
    try {
      // Persist locally for later profile update
      await storeCountryData(countryData);
      return countryData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      console.log(' Logging out user...');
      
      // Clear AsyncStorage
      await removeAuthToken();
      await removeUserData();
      await removeCountryData();
      
      console.log(' AsyncStorage cleared successfully');
      return true;
    } catch (error) {
      console.error(' Logout error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      const userData = await getUserData();
      const countryData = await getCountryData();
      
      console.log('Loading stored auth data:', {
        hasToken: !!token,
        hasUserData: !!userData,
        hasCountryData: !!countryData,
        countryData
      });
      
      if (token && userData) {
        return { token, user: userData, countryData };
      }
      
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isTokenVerified: false,
  countryData: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isTokenVerified = false;
      state.error = null;
      state.countryData = null;
      
      // Clear AsyncStorage
      removeAuthToken();
      removeUserData();
      removeCountryData();
    },
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Signup
    builder
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns OTP flow by default; only set auth if token present
        if (action.payload && action.payload.token) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Verify OTP
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Verify Token
    builder
      .addCase(verifyToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isTokenVerified = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.isLoading = false;
        state.isTokenVerified = false;
        state.error = action.payload;
      });

    // Update Country
    builder
      .addCase(updateUserCountry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserCountry.fulfilled, (state, action) => {
        state.isLoading = false;
        state.countryData = action.meta.arg; // Store the country data that was sent
        state.error = null;
      })
      .addCase(updateUserCountry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Load Stored Auth
    builder
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.countryData = action.payload.countryData;
          state.isAuthenticated = true;
          console.log('Stored auth loaded successfully:', {
            user: action.payload.user?.email,
            hasCountry: !!action.payload.countryData,
            country: action.payload.countryData?.value
          });
        }
      })

    // Logout User
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isTokenVerified = false;
        state.error = null;
        state.countryData = null;
        console.log(' User logged out successfully');
      })
      .addCase(logoutUser.rejected, (state, action) => {
        console.error(' Logout failed:', action.payload);
        // Even if logout fails, clear the state
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isTokenVerified = false;
        state.error = null;
        state.countryData = null;
      })

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

    // Google OAuth
    builder
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

    // Google Calendar Auth
    builder
      .addCase(googleCalendarAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleCalendarAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(googleCalendarAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    
    builder
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        // Only update user if payload valid to prevent silent logout
        if (action.payload && typeof action.payload === 'object' && action.payload._id) {
          state.user = action.payload;
          console.log('Auth user updated after profile update:', action.payload);
        } else {
          console.warn('################# updateUserProfile returned invalid payload, keeping existing user:', action.payload);
        }
      });
  },
});

export const { logout, clearError, setToken, setUser } = authSlice.actions;
export default authSlice.reducer;

