import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../utils/theme';
import { formatCurrency, formatDateShort } from '../utils/formatters';
import CategoryBadge from './CategoryBadge';
import MemberAvatar from './MemberAvatar';

const ExpenseCard = ({ expense, onPress, currentUserId }) => {
  const isPayer = expense.paidBy?.id === currentUserId || expense.paidBy === currentUserId;
  const userSplit = expense.splits?.find(
    (s) => s.user?.id === currentUserId || s.user === currentUserId
  );
  const settled = userSplit?.settled || false;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(expense)}
      activeOpacity={0.85}
    >
      <View style={styles.leftSection}>
        <View style={styles.iconBox}>
          <Ionicons name="receipt-outline" size={20} color={colors.primary} />
        </View>
      </View>

      <View style={styles.middleSection}>
        <Text style={styles.title} numberOfLines={1}>
          {expense.title}
        </Text>
        <View style={styles.metaRow}>
          <CategoryBadge category={expense.category} />
          <Text style={styles.date}>{formatDateShort(expense.date || expense.createdAt)}</Text>
        </View>
        <View style={styles.payerRow}>
          <MemberAvatar user={expense.paidBy} size={18} />
          <Text style={styles.payerText} numberOfLines={1}>
            {isPayer ? 'You paid' : `${expense.paidBy?.name || 'Someone'} paid`}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
        {!isPayer && userSplit && (
          <Text
            style={[
              styles.yourShare,
              settled ? styles.settled : styles.owed,
            ]}
          >
            {settled ? 'Settled' : `You owe ${formatCurrency(userSplit.amount)}`}
          </Text>
        )}
        {isPayer && (
          <Text style={styles.paidByYou}>You paid</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    gap: 12,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leftSection: {
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleSection: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  payerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  payerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  yourShare: {
    fontSize: 11,
    fontWeight: '500',
  },
  owed: {
    color: colors.danger,
  },
  settled: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  paidByYou: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '500',
  },
});

export default ExpenseCard;
