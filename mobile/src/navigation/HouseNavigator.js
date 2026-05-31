import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TabNavigator from './TabNavigator';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import EditExpenseScreen from '../screens/expenses/EditExpenseScreen';
import ExpenseDetailScreen from '../screens/expenses/ExpenseDetailScreen';
import BalancesScreen from '../screens/expenses/BalancesScreen';
import SettleUpScreen from '../screens/expenses/SettleUpScreen';
import AddChoreScreen from '../screens/chores/AddChoreScreen';
import EditChoreScreen from '../screens/chores/EditChoreScreen';
import ChoreDetailScreen from '../screens/chores/ChoreDetailScreen';
import ChoreHistoryScreen from '../screens/chores/ChoreHistoryScreen';
import AddAnnouncementScreen from '../screens/announcements/AddAnnouncementScreen';
import HouseRulesScreen from '../screens/rules/HouseRulesScreen';
import MembersScreen from '../screens/house/MembersScreen';
import CreateHouseScreen from '../screens/house/CreateHouseScreen';
import JoinHouseScreen from '../screens/house/JoinHouseScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import GroupChatScreen from '../screens/chat/GroupChatScreen';
import DirectMessageScreen from '../screens/chat/DirectMessageScreen';
import ReferralScreen from '../screens/referral/ReferralScreen';
import { colors } from '../utils/theme';

const Stack = createStackNavigator();

const backBtn = (navigation) => (
  <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 8, padding: 4 }}>
    <Ionicons name="arrow-back" size={24} color={colors.text} />
  </TouchableOpacity>
);

const HouseNavigator = () => (
  <Stack.Navigator
    screenOptions={({ navigation }) => ({
      headerStyle: { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.text },
      headerLeft: () => backBtn(navigation),
      cardStyle: { backgroundColor: colors.background },
    })}
  >
    <Stack.Screen name="Tabs"             component={TabNavigator}          options={{ headerShown: false }} />
    <Stack.Screen name="AddExpense"       component={AddExpenseScreen}      options={{ title: 'Add Expense' }} />
    <Stack.Screen name="EditExpense"      component={EditExpenseScreen}     options={{ title: 'Edit Expense' }} />
    <Stack.Screen name="ExpenseDetail"    component={ExpenseDetailScreen}   options={{ title: 'Expense Details' }} />
    <Stack.Screen name="Balances"         component={BalancesScreen}        options={{ title: 'Balances' }} />
    <Stack.Screen name="SettleUp"         component={SettleUpScreen}        options={{ title: 'Settle Up' }} />
    <Stack.Screen name="AddChore"         component={AddChoreScreen}        options={{ title: 'Add Chore' }} />
    <Stack.Screen name="EditChore"        component={EditChoreScreen}       options={{ title: 'Edit Chore' }} />
    <Stack.Screen name="ChoreDetail"      component={ChoreDetailScreen}     options={{ title: 'Chore Details' }} />
    <Stack.Screen name="ChoreHistory"     component={ChoreHistoryScreen}    options={{ title: 'Chore History' }} />
    <Stack.Screen name="AddAnnouncement"  component={AddAnnouncementScreen} options={{ title: 'New Announcement' }} />
    <Stack.Screen name="HouseRules"       component={HouseRulesScreen}      options={{ title: 'House Rules' }} />
    <Stack.Screen name="Members"          component={MembersScreen}         options={{ title: 'Members & Groups' }} />
    <Stack.Screen name="CreateHouse"      component={CreateHouseScreen}     options={{ title: 'Create Household' }} />
    <Stack.Screen name="JoinHouse"        component={JoinHouseScreen}       options={{ title: 'Join Household' }} />
    <Stack.Screen name="Notifications"    component={NotificationsScreen}   options={{ headerShown: false }} />
    <Stack.Screen name="GroupChat"        component={GroupChatScreen}       options={{ headerShown: false }} />
    <Stack.Screen name="DirectMessage"    component={DirectMessageScreen}   options={{ headerShown: false }} />
    <Stack.Screen name="Referral"         component={ReferralScreen}        options={{ headerShown: false }} />
  </Stack.Navigator>
);

export default HouseNavigator;
