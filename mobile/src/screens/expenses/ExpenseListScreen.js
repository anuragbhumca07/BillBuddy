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
import { Chip, FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchExpenses,
  deleteExpense,
  selectExpenses,
  selectExpenseLoading,
} from '../../store/slices/expenseSlice';
import { selectUser } from '../../store/slices/authSlice';
import { selectHouse } from '../../store/slices/houseSlice';
import { colors } from '../../utils/theme';
import ExpenseCard from '../../components/ExpenseCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORIES = ['All', 'Rent', 'Groceries', 'Utilities', 'Internet', 'Cleaning', 'Other'];
const FILTERS = ['All', 'Mine'];

const ExpenseListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const expenses = useSelector(selectExpenses);
  const loading = useSelector(selectExpenseLoading);
  const user = useSelector(selectUser);
  const house = useSelector(selectHouse);

  const [activeFilter, setActiveFilter] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = house?.members?.find(
    (m) => (m.user?.id === user?.id || m.user === user?.id) && m.role === 'admin'
  );

  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchExpenses());
    setRefreshing(false);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const mineMatch =
      activeFilter === 'All' ||
      expense.paidBy?.id === user?.id ||
      expense.paidBy === user?.id;
    const categoryMatch =
      activeCategory === 'All' || expense.category === activeCategory;
    return mineMatch && categoryMatch;
  });

  const handleDelete = (expenseId) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(deleteExpense(expenseId)),
      },
    ]);
  };

  const renderExpense = useCallback(
    ({ item }) => (
      <ExpenseCard
        expense={item}
        currentUserId={user?.id}
        onPress={(exp) => navigation.navigate('ExpenseDetail', { expenseId: exp.id })}
      />
    ),
    [user, navigation]
  );

  if (loading && expenses.length === 0) {
    return <LoadingSpinner fullScreen message="Loading expenses..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Balances')}
          style={styles.balanceButton}
        >
          <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
          <Text style={styles.balanceButtonText}>Balances</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          {FILTERS.map((filter) => (
            <Chip
              key={filter}
              selected={activeFilter === filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.chip, activeFilter === filter && styles.chipSelected]}
              textStyle={[
                styles.chipText,
                activeFilter === filter && styles.chipTextSelected,
              ]}
              selectedColor={colors.primary}
            >
              {filter}
            </Chip>
          ))}
        </View>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              selected={activeCategory === item}
              onPress={() => setActiveCategory(item)}
              style={[styles.chip, activeCategory === item && styles.chipSelected]}
              textStyle={[
                styles.chipText,
                activeCategory === item && styles.chipTextSelected,
              ]}
              selectedColor={colors.primary}
            >
              {item}
            </Chip>
          )}
          ItemSeparatorComponent={() => <View style={{ width: 6 }} />}
          contentContainerStyle={styles.categoryRow}
        />
      </View>

      {/* Expense Count */}
      <Text style={styles.countText}>
        {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
      </Text>

      {/* List */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No expenses yet"
            message="Add your first expense to start tracking shared costs."
            actionLabel="Add Expense"
            onAction={() => navigation.navigate('AddExpense')}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => navigation.navigate('AddExpense')}
        color="#fff"
        customSize={56}
      />
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
  balanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  balanceButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  filtersContainer: {
    gap: 8,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
  },
  categoryRow: {
    paddingHorizontal: 16,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  countText: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingBottom: 4,
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

export default ExpenseListScreen;
