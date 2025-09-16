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
        
        ignoredActions: ['persist/PERSIST'],
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
    }),
});

export const getRootState = () => store.getState();
export const getAppDispatch = () => store.dispatch;
