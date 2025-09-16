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

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      
      const loginPayload = {
        email: credentials.email,
        password: credentials.password
      };

      

      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });

      console.log(' Response status:', response.status);
      const data = await response.json();
      console.log(' Response data:', data);

      
      if (!response.ok || (data.status && data.status !== 'success')) {
        console.log(' API error:', data);
        const errorMessage = data.message || data.error || 'Login failed';
        return rejectWithValue(errorMessage);
      }

      console.log('Login successful:', data);

      // Store token and user data in AsyncStoragee
      if (data.token) {
        await storeAuthToken(data.token);
      }
      if (data.user) {
        await storeUserData(data.user);
      }

      return data;
    } catch (error) {
      
      console.log(' Login network error:', error);
      console.log(' Error name:', error.name);
      console.log(' Error message:', error.message);
      console.log(' Error stack:', error.stack);
      
      if (error.message.includes('Network request failed')) {
        console.log(' Network request failed - checking connectivity...');
        
        try {
          const testResponse = await fetch('https://httpbin.org/get');
          console.log(' Test request successful:', testResponse.status);
        } catch (testError) {
          console.log(' Test request failed:', testError.message);
        }
      }
      
      return rejectWithValue(error.message || 'Network request failed');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async (userData, { rejectWithValue }) => {
    try {
      console.log(' Signup thunk called with:', userData);
      
      const signupPayload = {
        email: userData.email,
        password: userData.password
      };

      console.log(' Sending payload:', signupPayload);
      console.log(' API URL:', buildUrl(API_CONFIG.ENDPOINTS.SIGNUP));

      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.SIGNUP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupPayload),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      
      if (!response.ok || (data.status && data.status !== 'success')) {
        console.log(' API error:', data);
        const errorMessage = data.message || data.error || 'Signup failed';
        return rejectWithValue(errorMessage);
      }

      console.log(' Signup successful:', data);
      return data;
    } catch (error) {
      console.log(' Network error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (otpData, { rejectWithValue }) => {
    try {
      
      const otpPayload = {
        otp: otpData.otp
      };

      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.VERIFY_OTP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otpPayload),
      });

      const data = await response.json();

      
      if (!response.ok || (data.status && data.status !== 'success')) {
        const errorMessage = data.message || data.error || 'OTP verification failed';
        return rejectWithValue(errorMessage);
      }

      // Persist token and user data in AsyncStorage
      if (data.token) {
        await storeAuthToken(data.token);
      }
      if (data.user) {
        await storeUserData(data.user);
      }
      

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (emailData, { rejectWithValue }) => {
    try {
      
      const email = typeof emailData === 'string' ? emailData : emailData.email;
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Password reset failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password, newPassword, confirmNewPassword }, { rejectWithValue }) => {
    try {
      
      const body = {
        newPassword: newPassword || password,
        confirmNewPassword: confirmNewPassword || password,
      };

      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.RESET_PASSWORD, { token }), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Password reset failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.CHANGE_PASSWORD), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to change password');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (_, { rejectWithValue }) => {
    try {
      
      //implement later
      const googleLoginUrl = buildUrl(API_CONFIG.ENDPOINTS.GOOGLE_LOGIN);
      
      //implement later
      
      // For now, we'll return a placeholder
      return { message: 'Google login initiated' };
    } catch (error) {
      return rejectWithValue(error.message);
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
  async (_, { getState, rejectWithValue }) => {
    try {
      let { token, user } = getState().auth;

      
      if (!token) {
        token = await getAuthToken();
        if (!token) {
          return rejectWithValue('No token found');
        }
      }

      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.VERIFY_TOKEN), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      
      if (!response.ok) {
        await removeAuthToken();
        await removeUserData();
        return rejectWithValue('Token verification failed');
      }

      //use existing user from storage/state
      const storedUser = user || (await getUserData());
      return { status: 'success', user: storedUser };
    } catch (error) {
      await removeAuthToken();
      await removeUserData();
      return rejectWithValue(error.message);
    }
  }
);

export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (email, { rejectWithValue }) => {
    try {
      console.log(' Resend OTP called for:', email);
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.RESEND_OTP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log(' Resend OTP response:', data);

      if (!response.ok || (data.status && data.status !== 'success')) {
        const errorMessage = data.message || data.error || 'Failed to resend OTP';
        return rejectWithValue(errorMessage);
      }

      console.log(' OTP resent successfully');
      return data;
    } catch (error) {
      console.log(' Resend OTP error:', error);
      return rejectWithValue(error.message);
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
      
      console.log('📱 Loading stored auth data:', {
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
        
        state.user = action.payload;
        console.log('Auth user updated after profile update:', action.payload);
      });
  },
});

export const { logout, clearError, setToken, setUser } = authSlice.actions;
export default authSlice.reducer;
