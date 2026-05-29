import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAuthenticated, selectAuth, loadStoredAuth, clearCredentials } from '../store/slices/authSlice';
import { clearHouseData } from '../store/slices/houseSlice';
import AuthNavigator from './AuthNavigator';
import HouseNavigator from './HouseNavigator';
import LoadingSpinner from '../components/LoadingSpinner';
import { socketService } from '../services/socketService';
import { addExpenseFromSocket } from '../store/slices/expenseSlice';
import { updateChoreFromSocket } from '../store/slices/choreSlice';
import { addNotification } from '../store/slices/notificationSlice';

const AppNavigator = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { isLoading, isInitialized } = useSelector(selectAuth);

  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    // Set up global auth failure handler for token refresh failure
    global.onAuthFailure = () => {
      dispatch(clearCredentials());
      dispatch(clearHouseData());
      socketService.disconnect();
    };

    return () => {
      global.onAuthFailure = null;
    };
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      // Connect socket and subscribe to events
      socketService.connect().then(() => {
        socketService.on('expense:new', (expense) => {
          dispatch(addExpenseFromSocket(expense));
        });

        socketService.on('chore:updated', (chore) => {
          dispatch(updateChoreFromSocket(chore));
        });

        socketService.on('notification:new', (notification) => {
          dispatch(addNotification(notification));
        });
      });
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.off('expense:new');
      socketService.off('chore:updated');
      socketService.off('notification:new');
    };
  }, [isAuthenticated, dispatch]);

  // Show loading while restoring auth state
  if (!isInitialized || isLoading) {
    return <LoadingSpinner fullScreen message="Loading BillBuddy..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <HouseNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
