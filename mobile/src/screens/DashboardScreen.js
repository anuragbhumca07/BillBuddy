import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectUser } from '../store/slices/authSlice';
import { fetchExpenses, fetchBalances, selectExpenses, selectBalances } from '../store/slices/expenseSlice';
import { fetchChores, selectChores } from '../store/slices/choreSlice';
import { fetchAnnouncements, selectAnnouncements } from '../store/slices/announcementSlice';
import { fetchHouse, selectHouse } from '../store/slices/houseSlice';
import { colors, shadows } from '../utils/theme';
import { formatCurrency, formatDateShort, isOverdue } from '../utils/formatters';
import MemberAvatar from '../components/MemberAvatar';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const user = useSelector(selectUser);
  const house = useSelector(selectHouse);
  const expenses = useSelector(selectExpenses);
  const balances = useSelector(selectBalances);
  const chores = useSelector(selectChores);
  const announcements = useSelector(selectAnnouncements);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = useCallback(async () => {
    try {
      await Promise.allSettled([
        dispatch(fetchHouse()),
        dispatch(fetchExpenses()),
        dispatch(fetchBalances()),
        dispatch(fetchChores()),
        dispatch(fetchAnnouncements()),
      ]);
    } catch {}
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const upcomingChores = chores
    .filter((c) => !c.completed)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const latestAnnouncement = announcements[0];

  const netBalance = balances
    ? (balances.youAreOwed || 0) - (balances.youOwe || 0)
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            Hello, {user?.name?.split(' ')[0] || 'there'} 👋
          </Text>
          {house && (
            <Text style={styles.houseName}>{house.name}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <MemberAvatar user={user} size={40} />
          </TouchableOpacity>
        </View>
      </View>

      {/* No house state */}
      {!house && (
        <View style={styles.noHouseCard}>
          <Ionicons name="home-outline" size={32} color={colors.primary} />
          <Text style={styles.noHouseTitle}>No household yet</Text>
          <Text style={styles.noHouseText}>Create or join a household to get started</Text>
          <View style={styles.noHouseButtons}>
            <TouchableOpacity
              style={[styles.houseBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('CreateHouse')}
            >
              <Text style={styles.houseBtnText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.houseBtn, { backgroundColor: colors.secondary }]}
              onPress={() => navigation.navigate('JoinHouse')}
            >
              <Text style={styles.houseBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Balance Summary Card */}
      {balances !== null && (
        <TouchableOpacity
          style={[
            styles.balanceCard,
            netBalance >= 0 ? styles.balancePositive : styles.balanceNegative,
          ]}
          onPress={() => navigation.navigate('Balances')}
        >
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>
              {netBalance >= 0 ? 'You are owed' : 'You owe'}
            </Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(Math.abs(netBalance || 0))}
            </Text>
            {balances.youOwe > 0 && balances.youAreOwed > 0 && (
              <Text style={styles.balanceDetail}>
                Owe {formatCurrency(balances.youOwe)} · Owed {formatCurrency(balances.youAreOwed)}
              </Text>
            )}
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={netBalance >= 0 ? colors.success : colors.danger}
          />
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('AddChore')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
            </View>
            <Text style={styles.quickActionText}>Add Chore</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Members')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary + '15' }]}>
              <Ionicons name="people-outline" size={24} color={colors.secondary} />
            </View>
            <Text style={styles.quickActionText}>Members</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('HouseRules')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="document-text-outline" size={24} color={colors.warning} />
            </View>
            <Text style={styles.quickActionText}>Rules</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Chores */}
      {upcomingChores.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Chores</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Chores')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {upcomingChores.map((chore) => {
            const overdue = isOverdue(chore.dueDate);
            return (
              <TouchableOpacity
                key={chore.id}
                style={styles.choreItem}
                onPress={() => navigation.navigate('ChoreDetail', { choreId: chore.id })}
              >
                <View style={[styles.choreIcon, overdue && styles.choreIconOverdue]}>
                  <Ionicons
                    name={overdue ? 'alert-circle' : 'time-outline'}
                    size={18}
                    color={overdue ? colors.danger : colors.warning}
                  />
                </View>
                <View style={styles.choreInfo}>
                  <Text style={styles.choreName} numberOfLines={1}>{chore.title}</Text>
                  <Text style={[styles.choreDue, overdue && styles.choreOverdueText]}>
                    {overdue ? 'Overdue' : formatDateShort(chore.dueDate)}
                  </Text>
                </View>
                <MemberAvatar user={chore.assignedTo} size={28} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Recent Expenses */}
      {recentExpenses.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentExpenses.map((expense) => (
            <TouchableOpacity
              key={expense.id}
              style={styles.expenseItem}
              onPress={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id })}
            >
              <View style={styles.expenseIcon}>
                <Ionicons name="receipt-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseName} numberOfLines={1}>{expense.title}</Text>
                <Text style={styles.expensePayer}>
                  {expense.paid_by === user?.id ? 'You paid' : `${expense.paidBy?.name || 'Someone'} paid`}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Latest Announcement */}
      {latestAnnouncement && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Announcement</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.announcementCard}
            onPress={() => navigation.navigate('Announcements')}
          >
            <View style={styles.announcementHeader}>
              <Ionicons name="megaphone-outline" size={18} color={colors.secondary} />
              <Text style={styles.announcementTitle} numberOfLines={1}>
                {latestAnnouncement.title}
              </Text>
            </View>
            <Text style={styles.announcementMessage} numberOfLines={2}>
              {latestAnnouncement.message}
            </Text>
            <Text style={styles.announcementPoster}>
              {latestAnnouncement.postedBy?.name || 'Admin'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  houseName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  noHouseCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
    ...shadows.sm,
  },
  noHouseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  noHouseText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noHouseButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  houseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  houseBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    ...shadows.md,
  },
  balancePositive: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  balanceNegative: {
    backgroundColor: colors.danger + '15',
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  balanceContent: {
    gap: 2,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  balanceDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  choreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choreIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choreIconOverdue: {
    backgroundColor: colors.danger + '15',
  },
  choreInfo: {
    flex: 1,
    gap: 2,
  },
  choreName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  choreDue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  choreOverdueText: {
    color: colors.danger,
    fontWeight: '500',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: {
    flex: 1,
    gap: 2,
  },
  expenseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  expensePayer: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  announcementCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  announcementMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  announcementPoster: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '500',
  },
});

export default DashboardScreen;
