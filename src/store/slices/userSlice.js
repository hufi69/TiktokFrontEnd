import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG, buildUrl } from '../../config/api';
import { storeUserData } from '../../utils/helpers/storage';
import * as userApi from '../../services/api/userApi';
import * as followApi from '../../services/api/followApi';
import * as postsApi from '../../services/api/postsApi';

// Async thunks for API calls
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (userId, { getState, rejectWithValue }) => {
    try {
      console.log('Fetching user profile:', { userId });
      
      const data = await userApi.getUserProfile(userId);
      console.log('User profile response:', data);

      console.log('User profile fetched successfully:', data.data);
      return data.data;
    } catch (error) {
      console.error('User profile fetch error:', error);
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);


export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const { countryData } = getState().auth;
      
      const payload = {
        ...profileData,
        country: countryData?.value || profileData.country
      };

      console.log('Updating user profile:', payload);

      const data = await userApi.updateUserProfile(payload);
      console.log('Update user profile response:', data);

      // Store updated user data in AsyncStorage
      const updated = data.user || data.data || data.data?.user || data;
      if (updated) {
        await storeUserData(updated);
      }

      return updated;
    } catch (error) {
      console.error('Update user profile error:', error);
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const followUser = createAsyncThunk(
  'user/followUser',
  async (userId, { getState, rejectWithValue }) => {
    try {
      console.log('Follow user started for ID:', userId);
      
      const data = await followApi.followUser(userId);
      console.log('Follow user response:', data);

      console.log('Follow user successful');
      return { userId, isFollowing: true };
    } catch (error) {
      console.error('Follow user error:', error);
      return rejectWithValue(error.message || 'Failed to follow user');
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'user/unfollowUser',
  async (userId, { getState, rejectWithValue }) => {
    try {
      console.log('Unfollow user started for ID:', userId);
      
      const data = await followApi.unfollowUser(userId);
      console.log('Unfollow user response:', data);

      return { userId, isFollowing: false };
    } catch (error) {
      console.error('Unfollow user error:', error);
      return rejectWithValue(error.message || 'Failed to unfollow user');
    }
  }
);

export const fetchUserFollowers = createAsyncThunk(
  'user/fetchUserFollowers',
  async (userId, { getState, rejectWithValue }) => {
    try {
      console.log('Fetch user followers started for ID:', userId);
      
      const data = await followApi.getFollowers();
      console.log('Fetch followers response:', data);

      // Fetching users
      const raw = data.followers || data.data || [];
      const simplified = await Promise.all(
        raw.map(async (f) => {
          const uid = f?.follower?._id || f?.follower || f?._id;
          if (!uid) return null;
          try {
            const userData = await getUserProfile(uid);
            const user = userData?.data || userData?.user || userData;
            return user;
          } catch (_e) {
            return f?.follower || f;
          }
        })
      );
      const followers = simplified.filter(Boolean);
      return { userId, followers };
    } catch (error) {
      console.error('Fetch followers error:', error);
      return rejectWithValue(error.message || 'Failed to fetch followers');
    }
  }
);

export const fetchUserFollowing = createAsyncThunk(
  'user/fetchUserFollowing',
  async (userId, { getState, rejectWithValue }) => {
    try {
      console.log('Fetch user following started for ID:', userId);
      
      const data = await followApi.getFollowing();
      console.log('Fetch following response:', data);

      // Normalize to user profiles with occupation by fetching each user
      const raw = data.following || data.data || [];
      const simplified = await Promise.all(
        raw.map(async (f) => {
          const uid = f?.following?._id || f?.following || f?._id;
          if (!uid) return null;
          try {
            const userData = await getUserProfile(uid);
            const user = userData?.data || userData?.user || userData;
            return user;
          } catch (_e) {
            return f?.following || f;
          }
        })
      );
      const following = simplified.filter(Boolean);
      return { userId, following };
    } catch (error) {
      console.error('Fetch following error:', error);
      return rejectWithValue(error.message || 'Failed to fetch following');
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
      console.log('Get followers count started for ID:', userId);
      
      const data = await followApi.getFollowersCount();
      console.log('Get followers count response:', data);

      return { userId, count: data.followersCount ?? data.data?.followersCount ?? 0 };
    } catch (error) {
      console.error('Get followers count error:', error);
      return rejectWithValue(error.message || 'Failed to fetch followers count');
    }
  }
);

export const getFollowingCount = createAsyncThunk(
  'user/getFollowingCount',
  async (userId, { getState, rejectWithValue }) => {
    try {
      console.log('Get following count started for ID:', userId);
      
      const data = await followApi.getFollowingCount();
      console.log('Get following count response:', data);

      return { userId, count: data.followingCount ?? data.data?.followingCount ?? 0 };
    } catch (error) {
      console.error('Get following count error:', error);
      return rejectWithValue(error.message || 'Failed to fetch following count');
    }
  }
);

export const fetchUserPosts = createAsyncThunk(
  'user/fetchUserPosts',
  async (userId, { getState, rejectWithValue }) => {
    try {
      console.log('Fetch user posts started for ID:', userId);
      
      // Fetch posts by author (user) using the correct endpoint
      const data = await postsApi.getUserPosts(userId);
      console.log('Fetch user posts response:', data);

      return { userId, posts: data.data?.posts || [] };
    } catch (error) {
      console.error('Fetch user posts error:', error);
      return rejectWithValue(error.message || 'Failed to fetch user posts');
    }
  }
);

export const checkIsFollowing = createAsyncThunk(
  'user/checkIsFollowing',
  async (userId, { getState, rejectWithValue }) => {
    try {
      // Use the followApi instead of direct fetch for consistency
      const data = await followApi.getFollowing();
      const raw = data.following || data.data || [];
      
      // Backend returns Follow documents with populated 'following' field
      // Extract user ID from the populated 'following' field
      const normalize = (followDoc) => {
        if (followDoc?.following?._id) {
          return followDoc.following._id.toString();
        }
        if (followDoc?.following) {
          return followDoc.following.toString();
        }
        return followDoc?._id?.toString();
      };
      
      const userIdStr = userId?.toString();
      const isFollowing = raw.some(f => normalize(f) === userIdStr);
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
      console.log('Fetching all users');
      
      // Fetch all users, following list, and followers list in parallel
      const [usersData, followingData, followersData] = await Promise.all([
        userApi.getAllUsers(),
        followApi.getFollowing().catch(() => ({ following: [] })), 
        followApi.getFollowers().catch(() => ({ followers: [] })) 
      ]);
      
      console.log('Fetch users response:', usersData);
      console.log('Fetch following response:', followingData);
      console.log('Fetch followers response:', followersData);

      const users = usersData.data || [];
      const rawFollowing = followingData.following || followingData.data || [];
      const rawFollowers = followersData.followers || followersData.data || [];
      
      const normalizeFollowing = (followDoc) => {
      
        if (followDoc?.following?._id) {
          return followDoc.following._id;
        }
        // If following is just an ObjectId
        if (followDoc?.following) {
          return followDoc.following;
        }
        return followDoc?._id;
      };
      
      const normalizeFollower = (followDoc) => {
        // If follower is populated (object), get its _id
        if (followDoc?.follower?._id) {
          return followDoc.follower._id;
        }
        // If follower is just an ObjectId
        if (followDoc?.follower) {
          return followDoc.follower;
        }
        return followDoc?._id;
      };
      
      // Create Sets of followed and follower user IDs 
      const followingIds = new Set(
        rawFollowing
          .map(f => {
            const userId = normalizeFollowing(f);
            return userId ? userId.toString() : null;
          })
          .filter(Boolean)
      );

      const followerIds = new Set(
        rawFollowers
          .map(f => {
            const userId = normalizeFollower(f);
            return userId ? userId.toString() : null;
          })
          .filter(Boolean)
      );

      console.log('Following IDs set:', Array.from(followingIds));
      console.log('Follower IDs set:', Array.from(followerIds));

      // Add isFollowing and followsMe properties to each user
      const usersWithFollowingStatus = users.map(user => {
        const userStrId = user._id?.toString();
        const isFollowing = followingIds.has(userStrId);
        const followsMe = followerIds.has(userStrId);
        return {
          ...user,
          isFollowing: isFollowing,
          followsMe: followsMe,
          isMutual: isFollowing && followsMe 
        };
      });

      console.log('Users with following status (first 3):', usersWithFollowingStatus.slice(0, 3).map(u => ({ 
        id: u._id, 
        name: u.fullName || u.userName, 
        isFollowing: u.isFollowing,
        followsMe: u.followsMe,
        isMutual: u.isMutual
      })));
      
      return usersWithFollowingStatus;
    } catch (error) {
      console.error('Fetch users error:', error);
      return rejectWithValue(error.message || 'Failed to fetch users');
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
    clearUserPosts: (state) => {
      state.userPosts = [];
      state.postsCount = 0;
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
        state.userPosts = [];
        state.postsCount = 0;
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
        const userIdStr = userId?.toString();
        
        // Update in allUsers array - use string comparison for consistency
        const userIndex = state.allUsers.findIndex(user => user._id?.toString() === userIdStr);
        if (userIndex !== -1) {
          state.allUsers[userIndex].isFollowing = isFollowing;
          // Update isMutual: true only if both follow each other
          state.allUsers[userIndex].isMutual = isFollowing && (state.allUsers[userIndex].followsMe || false);
        }
        
        // Update in viewedUser if exists
        if (state.viewedUser && state.viewedUser._id?.toString() === userIdStr) {
          state.viewedUser.isFollowing = isFollowing;
          state.viewedUser.isMutual = isFollowing && (state.viewedUser.followsMe || false);
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
        const userIdStr = userId?.toString();
        
        // Update in allUsers array - use string comparison for consistency
        const userIndex = state.allUsers.findIndex(user => user._id?.toString() === userIdStr);
        if (userIndex !== -1) {
          state.allUsers[userIndex].isFollowing = isFollowing;
          // When unfollowing, isMutual becomes false (since isFollowing is now false)
          state.allUsers[userIndex].isMutual = false;
        }
        
        // Update in viewedUser if exists
        if (state.viewedUser && state.viewedUser._id?.toString() === userIdStr) {
          state.viewedUser.isFollowing = isFollowing;
          state.viewedUser.isMutual = false;
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
        const userIdStr = userId?.toString();
        // Update in allUsers array - use string comparison for consistency
        const userIndex = state.allUsers.findIndex(user => user._id?.toString() === userIdStr);
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
  clearUserPosts,
  setProfileUpdated,
} = userSlice.actions;

export default userSlice.reducer;
