import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postsReducer from './slices/postsSlice';
import storiesReducer from './slices/storiesSlice';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';
import likesReducer from './slices/likesSlice';
import commentsReducer from './slices/commentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    stories: storiesReducer,
    user: userReducer,
    ui: uiReducer,
    likes: likesReducer,
    comments: commentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
});

// JavaScript version - no TypeScript types needed
export const getRootState = () => store.getState();
export const getAppDispatch = () => store.dispatch;
