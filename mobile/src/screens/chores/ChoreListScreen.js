import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchChores,
  completeChore,
  deleteChore,
  selectChores,
  selectChoreLoading,
} from '../../store/slices/choreSlice';
import { selectUser } from '../../store/slices/authSlice';
import { selectHouse } from '../../store/slices/houseSlice';
import { colors } from '../../utils/theme';
import ChoreCard from '../../components/ChoreCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';

const TABS = ['My Chores', 'All Chores'];

const ChoreListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const chores = useSelector(selectChores);
  const loading = useSelector(selectChoreLoading);
  const user = useSelector(selectUser);
  const house = useSelector(selectHouse);
  const [activeTab, setActiveTab] = useState('My Chores');
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = house?.members?.find(
    (m) => (m.user?.id === user?.id || m.user === user?.id) && m.role === 'admin'
  );

  useEffect(() => {
    dispatch(fetchChores());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchChores());
    setRefreshing(false);
  };

  const filteredChores = chores.filter((chore) => {
    if (activeTab === 'My Chores') {
      return chore.assignedTo?.id === user?.id || chore.assignedTo === user?.id;
    }
    return true;
  });

  const sortedChores = [...filteredChores].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const handleComplete = (choreId) => {
    Alert.alert('Complete Chore', 'Mark this chore as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => dispatch(completeChore(choreId)),
      },
    ]);
  };

  const handleDelete = (choreId) => {
    Alert.alert('Delete Chore', 'Are you sure you want to delete this chore?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(deleteChore(choreId)),
      },
    ]);
  };

  const renderChore = useCallback(
    ({ item }) => (
      <ChoreCard
        chore={item}
        currentUserId={user?.id}
        onPress={(c) => navigation.navigate('ChoreDetail', { choreId: c.id })}
        onComplete={handleComplete}
        showCompleteButton={
          item.assignedTo?.id === user?.id || item.assignedTo === user?.id || isAdmin
        }
      />
    ),
    [user, navigation, isAdmin]
  );

  if (loading && chores.length === 0) {
    return <LoadingSpinner fullScreen message="Loading chores..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chores</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ChoreHistory', {})}
          style={styles.historyButton}
        >
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
            {tab === 'My Chores' && (
              <View style={[styles.badge, activeTab === tab && styles.badgeActive]}>
                <Text style={[styles.badgeText, activeTab === tab && styles.badgeTextActive]}>
                  {chores.filter(
                    (c) => !c.completed && (c.assignedTo?.id === user?.id || c.assignedTo === user?.id)
                  ).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {sortedChores.filter((c) => !c.completed).length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, styles.completedStat]}>
            {sortedChores.filter((c) => c.completed).length}
          </Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, styles.overdueStat]}>
            {sortedChores.filter(
              (c) => !c.completed && c.dueDate && new Date(c.dueDate) < new Date()
            ).length}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={sortedChores}
        keyExtractor={(item) => item.id}
        renderItem={renderChore}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title={activeTab === 'My Chores' ? 'No chores assigned to you' : 'No chores yet'}
            message={
              activeTab === 'My Chores'
                ? 'You have no assigned chores. Enjoy your free time!'
                : 'Add your first chore to keep the household organized.'
            }
            actionLabel={isAdmin ? 'Add Chore' : undefined}
            onAction={isAdmin ? () => navigation.navigate('AddChore') : undefined}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      {(isAdmin || true) && (
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom + 16 }]}
          onPress={() => navigation.navigate('AddChore')}
          color="#fff"
          customSize={56}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  historyButton: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  historyButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.border + '60',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: colors.border,
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  badgeTextActive: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.warning,
  },
  completedStat: {
    color: colors.success,
  },
  overdueStat: {
    color: colors.danger,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 28,
  },
});

export default ChoreListScreen;
