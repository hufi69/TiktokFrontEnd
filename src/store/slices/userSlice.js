import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG, buildUrl } from '../../config/api';
import { storeUserData } from '../../utils/helpers/storage';

// Async thunks for API calls
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const url = buildUrl(API_CONFIG.ENDPOINTS.USER_PROFILE, { id: userId });
      
      console.log('Fetching user profile:', { userId, url, hasToken: !!token });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('User profile response:', { status: response.status, data });

      if (!response.ok) {
        console.log(' User profile fetch failed:', data);
        return rejectWithValue(data.message || 'Failed to fetch user profile');
      }

      console.log(' User profile fetched successfully:', data.data);
      return data.data;
    } catch (error) {
      console.error('User profile fetch error:', error);
      return rejectWithValue(error.message);
    }
  }
);


export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const { countryData } = getState().auth;
      
      const formData = new FormData();
      const payload = {};
      if (profileData.fullName) payload.fullName = profileData.fullName;
      if (profileData.username) payload.userName = profileData.username;
      if (profileData.occupation) payload.occupation = profileData.occupation;
      if (profileData.email) payload.email = profileData.email;
      if (profileData.dateOfBirth) payload.dateOfBirth = profileData.dateOfBirth;
      if (countryData?.value) payload.country = countryData.value;

      formData.append('data', JSON.stringify(payload));

      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, String(v));
      });

    
      if (profileData && (profileData.avatar || profileData.profileImage)) {
        const img = profileData.avatar || profileData.profileImage;
        const uri = img?.uri || img?.path || '';
        const looksRemote = typeof uri === 'string' && /^https?:\/\//i.test(uri);
        const looksBase64 = typeof uri === 'string' && /^data:image\//i.test(uri);
        const shouldUpload = uri && !looksRemote && !looksBase64;

        if (shouldUpload) {
          const name = img.fileName || img.name || `profile_${Date.now()}.jpg`;
          const type = img.type || 'image/jpeg';
          formData.append('profilePicture', { uri, type, name });
        }
      }

      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.UPDATE_ME), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || data.error || 'Failed to update profile');
      }

      // Store updated user data in AsyncStorage
      const updated = data.user || data.data || data.data?.user || data;
      if (updated) {
        await storeUserData(updated);
      }

      return updated;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const followUser = createAsyncThunk(
  'user/followUser',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const url = buildUrl(API_CONFIG.ENDPOINTS.FOLLOW_USER);
      console.log(' Follow user :', url);
      console.log(' Follow user token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      console.log(' Follow user response:', { status: response.status, data });

      if (!response.ok || (data.status && data.status !== 'success')) {
        
        const msg = (data && (data.message || data.error || '')) || '';
        if (String(data?.code) === '11000' || /duplicate/i.test(msg) || /already/i.test(msg)) {
          console.log(' Already following; treating as success');
          return { userId, isFollowing: true };
        }
        console.log('Follow user failed:', data);
        return rejectWithValue(data.message || 'Failed to follow user');
      }

      console.log(' Follow user successful');
      return { userId, isFollowing: true };
    } catch (error) {
      console.error('Follow user error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'user/unfollowUser',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.UNFOLLOW_USER), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok || (data.status && data.status !== 'success')) {
        // If already unfollowed success 
        const msg = (data && (data.message || data.error || '')) || '';
        if (/not\s*found/i.test(msg) || /not\s*following/i.test(msg)) {
          console.log(' Already unfollowed; treating as success');
          return { userId, isFollowing: false };
        }
        return rejectWithValue(data.message || 'Failed to unfollow user');
      }

      return { userId, isFollowing: false };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserFollowers = createAsyncThunk(
  'user/fetchUserFollowers',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.ALL_FOLLOWERS), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || (data.status && data.status !== 'success')) {
        return rejectWithValue(data.message || 'Failed to fetch followers');
      }

      // fecthing users
      const raw = data.followers || data.data || [];
      const simplified = await Promise.all(
        raw.map(async (f) => {
          const uid = f?.follower?._id || f?.follower || f?._id;
          if (!uid) return null;
          try {
            const res = await fetch(buildUrl(API_CONFIG.ENDPOINTS.USER_PROFILE, { id: uid }), {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            const json = await res.json();
            const user = json?.data || json?.user || json;
            return user;
          } catch (_e) {
            
            return f?.follower || f;
          }
        })
      );
      const followers = simplified.filter(Boolean);
      return { userId, followers };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserFollowing = createAsyncThunk(
  'user/fetchUserFollowing',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.ALL_FOLLOWING), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || (data.status && data.status !== 'success')) {
        return rejectWithValue(data.message || 'Failed to fetch following');
      }

      // Normalize to user profiles with occupation by fetching each user
      const raw = data.following || data.data || [];
      const simplified = await Promise.all(
        raw.map(async (f) => {
          const uid = f?.following?._id || f?.following || f?._id;
          if (!uid) return null;
          try {
            const res = await fetch(buildUrl(API_CONFIG.ENDPOINTS.USER_PROFILE, { id: uid }), {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            const json = await res.json();
            const user = json?.data || json?.user || json;
            return user;
          } catch (_e) {
            return f?.following || f;
          }
        })
      );
      const following = simplified.filter(Boolean);
      return { userId, following };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMutualFollows = createAsyncThunk(
  'user/fetchMutualFollows',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

     // backend mutuals expects req.body.userId on a GET, which isn't possible. //remember this for next 
      const followingRes = await fetch(buildUrl(API_CONFIG.ENDPOINTS.ALL_FOLLOWING), {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const followingJson = await followingRes.json();
      if (!followingRes.ok) return rejectWithValue(followingJson.message || 'Failed to fetch following');

      const followersRes = await fetch(buildUrl(API_CONFIG.ENDPOINTS.ALL_FOLLOWERS), {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const followersJson = await followersRes.json();
      if (!followersRes.ok) return rejectWithValue(followersJson.message || 'Failed to fetch followers');

      const normalize = (obj, key) => obj?.[key]?._id || obj?.[key] || obj?._id;
      const followingIds = new Set((followingJson.following || followingJson.data || []).map(f => normalize(f, 'following')).filter(Boolean));
      const mutualIds = (followersJson.followers || followersJson.data || [])
        .map(f => normalize(f, 'follower'))
        .filter(id => id && followingIds.has(id));

      return { userId, mutualFollows: mutualIds };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getFollowersCount = createAsyncThunk(
  'user/getFollowersCount',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.FOLLOWERS_COUNT), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || (data.status && data.status !== 'success')) {
        return rejectWithValue(data.message || 'Failed to fetch followers count');
      }

      return { userId, count: data.followersCount ?? data.data?.followersCount ?? 0 };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getFollowingCount = createAsyncThunk(
  'user/getFollowingCount',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.FOLLOWING_COUNT), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || (data.status && data.status !== 'success')) {
        return rejectWithValue(data.message || 'Failed to fetch following count');
      }

      return { userId, count: data.followingCount ?? data.data?.followingCount ?? 0 };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserPosts = createAsyncThunk(
  'user/fetchUserPosts',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      // Fetch posts by author (user)
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.POSTS) + `?author=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch user posts');
      }

      return { userId, posts: data.data?.posts || [] };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkIsFollowing = createAsyncThunk(
  'user/checkIsFollowing',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      // Derive following list and check membership
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.ALL_FOLLOWING), {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to fetch following');
      const raw = data.following || data.data || [];
      const normalize = (obj) => obj?.following?._id || obj?.following || obj?._id;
      const isFollowing = raw.some(f => normalize(f) === userId);
      return { userId, isFollowing };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  'user/fetchAllUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      console.log('🔧 Fetching all users with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.ALL_USERS), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(' Fetch users response:', { status: response.status, data });

      if (!response.ok || (data.status && data.status !== 'success')) {
        console.log(' Fetch users failed:', data);
        return rejectWithValue(data.message || 'Failed to fetch users');
      }

      console.log(' Fetch users successful:', data.data);
      return data.data || [];
    } catch (error) {
      console.error(' Fetch users error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  currentUser: null,
  viewedUser: null,
  followers: [],
  following: [],
  allUsers: [],
  userPosts: [], // Add user posts state
  followersCount: 0,
  followingCount: 0,
  postsCount: 0, // Add posts count
  isLoading: false,
  error: null,
  isProfileUpdated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    setViewedUser: (state, action) => {
      state.viewedUser = action.payload;
    },
    updateCurrentUser: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
    },
    clearViewedUser: (state) => {
      state.viewedUser = null;
      state.followers = [];
      state.following = [];
    },
    setProfileUpdated: (state, action) => {
      state.isProfileUpdated = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch User Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.viewedUser = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update User Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
        // Also update viewedUser if it's the same user (viewing own profile)
        if (state.viewedUser && state.viewedUser._id === action.payload._id) {
          state.viewedUser = action.payload;
        }
        state.isProfileUpdated = true;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Follow User
    builder
      .addCase(followUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const { userId, isFollowing } = action.payload;
        
        // Update in allUsers array
        const userIndex = state.allUsers.findIndex(user => user._id === userId);
        if (userIndex !== -1) {
          state.allUsers[userIndex].isFollowing = isFollowing;
        }
        
        // Update in viewedUser if exists
        if (state.viewedUser && state.viewedUser._id === userId) {
          state.viewedUser.isFollowing = isFollowing;
          state.viewedUser.followersCount = isFollowing 
            ? (state.viewedUser.followersCount || 0) + 1 
            : Math.max(0, (state.viewedUser.followersCount || 0) - 1);
        }
        state.error = null;
      })
      .addCase(followUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Unfollow User
    builder
      .addCase(unfollowUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const { userId, isFollowing } = action.payload;
        
        // Update in allUsers array
        const userIndex = state.allUsers.findIndex(user => user._id === userId);
        if (userIndex !== -1) {
          state.allUsers[userIndex].isFollowing = isFollowing;
        }
        
        // Update in viewedUser if exists
        if (state.viewedUser && state.viewedUser._id === userId) {
          state.viewedUser.isFollowing = isFollowing;
          state.viewedUser.followersCount = isFollowing 
            ? (state.viewedUser.followersCount || 0) + 1 
            : Math.max(0, (state.viewedUser.followersCount || 0) - 1);
        }
        state.error = null;
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch All Users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allUsers = action.payload;
        state.error = null;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Followers
    builder
      .addCase(fetchUserFollowers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserFollowers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.followers = action.payload.followers;
        state.error = null;
      })
      .addCase(fetchUserFollowers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Following
    builder
      .addCase(fetchUserFollowing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserFollowing.fulfilled, (state, action) => {
        state.isLoading = false;
        state.following = action.payload.following;
        state.error = null;
      })
      .addCase(fetchUserFollowing.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Followers Count
    builder
      .addCase(getFollowersCount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFollowersCount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.followersCount = action.payload.count;
        state.error = null;
      })
      .addCase(getFollowersCount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Following Count
    builder
      .addCase(getFollowingCount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFollowingCount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.followingCount = action.payload.count;
        state.error = null;
      })
      .addCase(getFollowingCount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Check Is Following
    builder
      .addCase(checkIsFollowing.fulfilled, (state, action) => {
        const { userId, isFollowing } = action.payload;
        // Update in allUsers array
        const userIndex = state.allUsers.findIndex(user => user._id === userId);
        if (userIndex !== -1) {
          state.allUsers[userIndex].isFollowing = isFollowing;
        }
      });

    // Fetch User Posts
    builder
      .addCase(fetchUserPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userPosts = action.payload.posts;
        state.postsCount = action.payload.posts.length;
        state.error = null;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearUserError,
  setCurrentUser,
  setViewedUser,
  updateCurrentUser,
  clearViewedUser,
  setProfileUpdated,
} = userSlice.actions;

export default userSlice.reducer;
