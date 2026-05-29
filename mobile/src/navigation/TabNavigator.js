import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectUnreadCount } from '../store/slices/notificationSlice';
import DashboardScreen from '../screens/DashboardScreen';
import ExpenseListScreen from '../screens/expenses/ExpenseListScreen';
import ChoreListScreen from '../screens/chores/ChoreListScreen';
import AnnouncementsScreen from '../screens/announcements/AnnouncementsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { colors } from '../utils/theme';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const unreadCount = useSelector(selectUnreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Dashboard: focused ? 'home' : 'home-outline',
            Expenses: focused ? 'receipt' : 'receipt-outline',
            Chores: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
            Announcements: focused ? 'megaphone' : 'megaphone-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          const iconName = icons[route.name] || 'ellipse-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpenseListScreen}
        options={{ tabBarLabel: 'Expenses' }}
      />
      <Tab.Screen
        name="Chores"
        component={ChoreListScreen}
        options={{ tabBarLabel: 'Chores' }}
      />
      <Tab.Screen
        name="Announcements"
        component={AnnouncementsScreen}
        options={{ tabBarLabel: 'Updates' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 10 },
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
