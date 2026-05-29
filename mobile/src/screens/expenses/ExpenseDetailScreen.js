import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchExpenseDetail,
  deleteExpense,
  selectSelectedExpense,
  selectExpenseLoading,
} from '../../store/slices/expenseSlice';
import { selectUser } from '../../store/slices/authSlice';
import { selectHouse } from '../../store/slices/houseSlice';
import { colors, shadows } from '../../utils/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import CategoryBadge from '../../components/CategoryBadge';
import MemberAvatar from '../../components/MemberAvatar';
import LoadingSpinner from '../../components/LoadingSpinner';

const ExpenseDetailScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { expenseId } = route.params || {};
  const expense = useSelector(selectSelectedExpense);
  const loading = useSelector(selectExpenseLoading);
  const user = useSelector(selectUser);
  const house = useSelector(selectHouse);

  const isAdmin = house?.members?.find(
    (m) => (m.user?.id === user?.id || m.user === user?.id) && m.role === 'admin'
  );
  const isPayer =
    expense?.paidBy?.id === user?.id || expense?.paidBy === user?.id;
  const canDelete = isAdmin || isPayer;

  useEffect(() => {
    if (expenseId) {
      dispatch(fetchExpenseDetail(expenseId));
    }
  }, [expenseId, dispatch]);

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await dispatch(deleteExpense(expenseId));
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading || !expense) {
    return <LoadingSpinner fullScreen message="Loading expense..." />;
  }

  const settledSplits = expense.splits?.filter((s) => s.settled) || [];
  const unsettledSplits = expense.splits?.filter((s) => !s.settled) || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Amount Header */}
      <View style={styles.amountCard}>
        <CategoryBadge category={expense.category} size="md" />
        <Text style={styles.expenseTitle}>{expense.title}</Text>
        <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
        <Text style={styles.expenseDate}>{formatDate(expense.date || expense.createdAt)}</Text>
      </View>

      {/* Paid By */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Paid By</Text>
        <View style={styles.payerRow}>
          <MemberAvatar user={expense.paidBy} size={44} />
          <View>
            <Text style={styles.payerName}>
              {expense.paidBy?.id === user?.id ? 'You' : expense.paidBy?.name || 'Unknown'}
            </Text>
            <Text style={styles.payerAmount}>{formatCurrency(expense.amount)}</Text>
          </View>
        </View>
      </View>

      {/* Split Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Split Between {expense.splits?.length || 0} People
        </Text>
        <View style={styles.splitType}>
          <Ionicons
            name={expense.splitType === 'equal' ? 'git-branch-outline' : 'calculator-outline'}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.splitTypeText}>
            {expense.splitType === 'equal' ? 'Split Equally' : 'Custom Split'}
          </Text>
        </View>

        {/* Unsettled */}
        {unsettledSplits.length > 0 && (
          <View style={styles.splitGroup}>
            <Text style={styles.splitGroupTitle}>Outstanding</Text>
            {unsettledSplits.map((split, index) => {
              const splitUser = split.user;
              const isMe = splitUser?.id === user?.id || splitUser === user?.id;
              return (
                <View key={index} style={styles.splitRow}>
                  <View style={styles.splitLeft}>
                    <MemberAvatar user={splitUser} size={32} />
                    <Text style={styles.splitName}>
                      {isMe ? 'You' : splitUser?.name || 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.splitRight}>
                    <Text style={[styles.splitAmount, styles.unsettledAmount]}>
                      {formatCurrency(split.amount)}
                    </Text>
                    <View style={styles.owedBadge}>
                      <Text style={styles.owedBadgeText}>Owes</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Settled */}
        {settledSplits.length > 0 && (
          <View style={styles.splitGroup}>
            <Text style={styles.splitGroupTitle}>Settled</Text>
            {settledSplits.map((split, index) => {
              const splitUser = split.user;
              const isMe = splitUser?.id === user?.id || splitUser === user?.id;
              return (
                <View key={index} style={[styles.splitRow, styles.settledRow]}>
                  <View style={styles.splitLeft}>
                    <MemberAvatar user={splitUser} size={32} />
                    <Text style={[styles.splitName, styles.settledText]}>
                      {isMe ? 'You' : splitUser?.name || 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.splitRight}>
                    <Text style={[styles.splitAmount, styles.settledAmount]}>
                      {formatCurrency(split.amount)}
                    </Text>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Receipt */}
      {expense.receiptUrl && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Receipt</Text>
          <Image
            source={{ uri: expense.receiptUrl }}
            style={styles.receiptImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('SettleUp')}
          style={styles.settleButton}
          buttonColor={colors.success}
          icon="handshake-outline"
        >
          Settle Up
        </Button>
        {canDelete && (
          <Button
            mode="outlined"
            onPress={handleDelete}
            style={styles.deleteButton}
            textColor={colors.danger}
            icon="trash-can-outline"
          >
            Delete
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  amountCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  expenseTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  expenseAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  expenseDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  payerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  payerAmount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  splitType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  splitTypeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  splitGroup: {
    gap: 8,
  },
  splitGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  settledRow: {
    opacity: 0.7,
  },
  splitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splitName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  settledText: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  splitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  unsettledAmount: {
    color: colors.danger,
  },
  settledAmount: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  owedBadge: {
    backgroundColor: colors.danger + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  owedBadgeText: {
    fontSize: 10,
    color: colors.danger,
    fontWeight: '600',
  },
  receiptImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  settleButton: {
    flex: 1,
    borderRadius: 12,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: colors.danger,
  },
});

export default ExpenseDetailScreen;
