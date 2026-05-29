import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchBalances, selectBalances, selectExpenseLoading } from '../../store/slices/expenseSlice';
import { selectUser } from '../../store/slices/authSlice';
import { colors, shadows } from '../../utils/theme';
import { formatCurrency } from '../../utils/formatters';
import MemberAvatar from '../../components/MemberAvatar';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const BalancesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const balances = useSelector(selectBalances);
  const loading = useSelector(selectExpenseLoading);
  const user = useSelector(selectUser);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchBalances());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchBalances());
    setRefreshing(false);
  };

  if (loading && !balances) {
    return <LoadingSpinner fullScreen message="Loading balances..." />;
  }

  const youOweList = balances?.debts?.filter((d) => d.from === user?.id) || [];
  const youAreOwedList = balances?.debts?.filter((d) => d.to === user?.id) || [];

  const netBalance = (balances?.youAreOwed || 0) - (balances?.youOwe || 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Net Balance Card */}
      <View
        style={[
          styles.netCard,
          netBalance >= 0 ? styles.netPositiveCard : styles.netNegativeCard,
        ]}
      >
        <Text style={styles.netLabel}>
          {netBalance === 0 ? 'All Settled Up!' : netBalance > 0 ? 'You Are Owed' : 'You Owe'}
        </Text>
        <Text style={styles.netAmount}>{formatCurrency(Math.abs(netBalance))}</Text>
        {netBalance !== 0 && (
          <Text style={styles.netSub}>
            {netBalance > 0
              ? `Owe ${formatCurrency(balances?.youOwe || 0)} · Owed ${formatCurrency(balances?.youAreOwed || 0)}`
              : `Owe ${formatCurrency(balances?.youOwe || 0)} · Owed ${formatCurrency(balances?.youAreOwed || 0)}`}
          </Text>
        )}
      </View>

      {/* You Owe */}
      {youOweList.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>You Owe</Text>
          {youOweList.map((debt, index) => (
            <View key={index} style={styles.debtCard}>
              <View style={styles.debtLeft}>
                <MemberAvatar user={debt.toUser} size={44} />
                <View style={styles.debtInfo}>
                  <Text style={styles.debtName}>{debt.toUser?.name || 'Unknown'}</Text>
                  <Text style={styles.debtSub}>Tap to settle</Text>
                </View>
              </View>
              <View style={styles.debtRight}>
                <Text style={[styles.debtAmount, styles.oweAmount]}>
                  {formatCurrency(debt.amount)}
                </Text>
                <TouchableOpacity
                  style={styles.settleButton}
                  onPress={() =>
                    navigation.navigate('SettleUp', { debtId: debt.id, toUser: debt.toUser, amount: debt.amount })
                  }
                >
                  <Text style={styles.settleButtonText}>Settle</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* You Are Owed */}
      {youAreOwedList.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>You Are Owed</Text>
          {youAreOwedList.map((debt, index) => (
            <View key={index} style={styles.debtCard}>
              <View style={styles.debtLeft}>
                <MemberAvatar user={debt.fromUser} size={44} />
                <View style={styles.debtInfo}>
                  <Text style={styles.debtName}>{debt.fromUser?.name || 'Unknown'}</Text>
                  <Text style={styles.debtSub}>Waiting for payment</Text>
                </View>
              </View>
              <Text style={[styles.debtAmount, styles.owedAmount]}>
                {formatCurrency(debt.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* All members balance */}
      {balances?.memberBalances && balances.memberBalances.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Members</Text>
          {balances.memberBalances.map((mb, index) => {
            const isMe = mb.user?.id === user?.id;
            const net = mb.net || 0;
            return (
              <View key={index} style={styles.memberBalanceCard}>
                <View style={styles.debtLeft}>
                  <MemberAvatar user={mb.user} size={40} />
                  <Text style={styles.memberName}>
                    {isMe ? 'You' : mb.user?.name || 'Unknown'}
                  </Text>
                </View>
                <View style={styles.memberBalanceRight}>
                  <Text
                    style={[
                      styles.memberNetAmount,
                      net > 0 ? styles.owedAmount : net < 0 ? styles.oweAmount : styles.evenAmount,
                    ]}
                  >
                    {net === 0 ? 'Even' : net > 0 ? `+${formatCurrency(net)}` : formatCurrency(net)}
                  </Text>
                  {net !== 0 && (
                    <Text style={styles.memberNetLabel}>
                      {net > 0 ? 'is owed' : 'owes'}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {youOweList.length === 0 && youAreOwedList.length === 0 && (
        <EmptyState
          icon="checkmark-circle-outline"
          title="All settled up!"
          message="No outstanding balances. Everyone is even."
        />
      )}
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
    gap: 16,
    paddingBottom: 40,
  },
  netCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 6,
  },
  netPositiveCard: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  netNegativeCard: {
    backgroundColor: colors.danger + '15',
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  netLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  netAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
  },
  netSub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  debtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  debtInfo: {
    gap: 2,
  },
  debtName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  debtSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  debtRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  oweAmount: {
    color: colors.danger,
  },
  owedAmount: {
    color: colors.success,
  },
  settleButton: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  settleButtonText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  memberBalanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  memberBalanceRight: {
    alignItems: 'flex-end',
  },
  memberNetAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  evenAmount: {
    color: colors.textSecondary,
  },
  memberNetLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default BalancesScreen;
