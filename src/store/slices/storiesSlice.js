import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG, buildUrl } from '../../config/api';

// Async thunks for API calls
export const fetchStories = createAsyncThunk(
  'stories/fetchStories',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.STORIES), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch stories');
      }

      return data.stories;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// STORY UPLOAD CODE - COMMENTED OUT
// export const uploadStory = createAsyncThunk(
//   'stories/uploadStory',
//   async (storyData, { getState, rejectWithValue }) => {
//     try {
//       const { token } = getState().auth;
//       
//       const formData = new FormData();
//       formData.append('image', {
//         uri: storyData.image.uri,
//         type: storyData.image.type || 'image/jpeg',
//         name: 'story.jpg',
//       });

//       if (storyData.caption) {
//         formData.append('caption', storyData.caption);
//       }

//       const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.STORIES), {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'multipart/form-data',
//         },
//         body: formData,
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         return rejectWithValue(data.message || 'Failed to upload story');
//       }

//       return data.story;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

export const likeStory = createAsyncThunk(
  'stories/likeStory',
  async ({ storyId, userId }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.STORIES) + `/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to like story');
      }

      return { storyId, userId, isLiked: data.isLiked };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const replyToStory = createAsyncThunk(
  'stories/replyToStory',
  async ({ storyId, message }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.STORIES) + `/${storyId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to reply to story');
      }

      return { storyId, reply: data.reply };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const shareStory = createAsyncThunk(
  'stories/shareStory',
  async ({ storyId, userIds, message }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.STORIES) + `/${storyId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to share story');
      }

      return { storyId, sharedWith: userIds };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  stories: [],
  myStories: [],
  isLoading: false,
  error: null,
  currentStoryIndex: 0,
  showStoryViewer: false,
};

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    clearStoriesError: (state) => {
      state.error = null;
    },
    setStories: (state, action) => {
      state.stories = action.payload;
    },
    setMyStories: (state, action) => {
      state.myStories = action.payload;
    },
    addStory: (state, action) => {
      state.stories.unshift(action.payload);
    },
    addMyStory: (state, action) => {
      state.myStories.unshift(action.payload);
    },
    removeStory: (state, action) => {
      state.stories = state.stories.filter(story => story.id !== action.payload);
    },
    removeMyStory: (state, action) => {
      state.myStories = state.myStories.filter(story => story.id !== action.payload);
    },
    setCurrentStoryIndex: (state, action) => {
      state.currentStoryIndex = action.payload;
    },
    setShowStoryViewer: (state, action) => {
      state.showStoryViewer = action.payload;
    },
    toggleStoryLike: (state, action) => {
      const { storyId } = action.payload;
      const story = state.stories.find(s => s.id === storyId);
      if (story) {
        story.isLiked = !story.isLiked;
        story.likes = story.isLiked ? story.likes + 1 : story.likes - 1;
      }
    },
    incrementStoryReplies: (state, action) => {
      const { storyId } = action.payload;
      const story = state.stories.find(s => s.id === storyId);
      if (story) {
        story.replies = story.replies + 1;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Stories
    builder
      .addCase(fetchStories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stories = action.payload;
        state.error = null;
      })
      .addCase(fetchStories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // STORY UPLOAD CODE - COMMENTED OUT
    // Upload Story
    // builder
    //   .addCase(uploadStory.pending, (state) => {
    //     state.isLoading = true;
    //     state.error = null;
    //   })
    //   .addCase(uploadStory.fulfilled, (state, action) => {
    //     state.isLoading = false;
    //     state.myStories.unshift(action.payload);
    //     state.error = null;
    //   })
    //   .addCase(uploadStory.rejected, (state, action) => {
    //     state.isLoading = false;
    //     state.error = action.payload;
    //   });

    // Like Story
    builder
      .addCase(likeStory.fulfilled, (state, action) => {
        const { storyId, isLiked } = action.payload;
        const story = state.stories.find(s => s.id === storyId);
        if (story) {
          story.isLiked = isLiked;
          story.likes = isLiked ? story.likes + 1 : story.likes - 1;
        }
      });

    // Reply to Story
    builder
      .addCase(replyToStory.fulfilled, (state, action) => {
        const { storyId, reply } = action.payload;
        const story = state.stories.find(s => s.id === storyId);
        if (story) {
          story.replies = story.replies + 1;
          // You might want to add the reply to a replies array if you're storing them
        }
      });

    // Share Story
    builder
      .addCase(shareStory.fulfilled, (state, action) => {
        const { storyId, sharedWith } = action.payload;
        const story = state.stories.find(s => s.id === storyId);
        if (story) {
          story.shares = story.shares + sharedWith.length;
        }
      });
  },
});

export const {
  clearStoriesError,
  setStories,
  setMyStories,
  addStory,
  addMyStory,
  removeStory,
  removeMyStory,
  setCurrentStoryIndex,
  setShowStoryViewer,
  toggleStoryLike,
  incrementStoryReplies,
} = storiesSlice.actions;

export default storiesSlice.reducer;
