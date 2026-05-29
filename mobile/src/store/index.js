import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import houseReducer from './slices/houseSlice';
import expenseReducer from './slices/expenseSlice';
import choreReducer from './slices/choreSlice';
import announcementReducer from './slices/announcementSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    house: houseReducer,
    expenses: expenseReducer,
    chores: choreReducer,
    announcements: announcementReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/loadStoredAuth/fulfilled'],
      },
    }),
});

export default store;
