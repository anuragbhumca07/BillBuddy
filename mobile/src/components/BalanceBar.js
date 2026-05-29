import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';
import { formatCurrency } from '../utils/formatters';

const BalanceBar = ({ youOwe = 0, youAreOwed = 0 }) => {
  const net = youAreOwed - youOwe;
  const isPositive = net >= 0;
  const isZero = net === 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>You Owe</Text>
          <Text style={[styles.amount, styles.danger]}>
            {formatCurrency(youOwe)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.column}>
          <Text style={styles.label}>You Are Owed</Text>
          <Text style={[styles.amount, styles.success]}>
            {formatCurrency(youAreOwed)}
          </Text>
        </View>
      </View>

      <View style={[styles.netContainer, isZero ? styles.netZero : isPositive ? styles.netPositive : styles.netNegative]}>
        <Text style={styles.netLabel}>
          {isZero
            ? 'All settled up!'
            : isPositive
            ? `Net: You are owed ${formatCurrency(Math.abs(net))}`
            : `Net: You owe ${formatCurrency(Math.abs(net))}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
  },
  danger: {
    color: colors.danger,
  },
  success: {
    color: colors.success,
  },
  netContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  netZero: {
    backgroundColor: colors.success + '20',
  },
  netPositive: {
    backgroundColor: colors.success + '20',
  },
  netNegative: {
    backgroundColor: colors.danger + '20',
  },
  netLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});

export default BalanceBar;
