import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { settleDebt, fetchBalances } from '../../store/slices/expenseSlice';
import { selectUser } from '../../store/slices/authSlice';
import { colors, shadows } from '../../utils/theme';
import { formatCurrency } from '../../utils/formatters';
import MemberAvatar from '../../components/MemberAvatar';

const SettleUpScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { debtId, toUser, amount } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [settled, setSettled] = useState(false);

  const handleSettle = async () => {
    Alert.alert(
      'Confirm Settlement',
      `Mark ${formatCurrency(amount || 0)} as settled with ${toUser?.name || 'this person'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle',
          onPress: async () => {
            setLoading(true);
            try {
              await dispatch(
                settleDebt({
                  debtId,
                  toUserId: toUser?.id,
                  amount,
                })
              ).unwrap();
              await dispatch(fetchBalances());
              setSettled(true);
            } catch (error) {
              Alert.alert('Error', error || 'Failed to settle. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (settled) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
        </View>
        <Text style={styles.successTitle}>Settled!</Text>
        <Text style={styles.successMessage}>
          {formatCurrency(amount || 0)} has been marked as settled with {toUser?.name || 'your roommate'}.
        </Text>
        <Button
          mode="contained"
          onPress={() => {
            navigation.goBack();
            navigation.goBack();
          }}
          style={styles.doneButton}
          buttonColor={colors.success}
        >
          Done
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Settlement Card */}
      <View style={styles.settlementCard}>
        <View style={styles.avatarsRow}>
          <MemberAvatar user={user} size={60} />
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={24} color={colors.primary} />
          </View>
          <MemberAvatar user={toUser} size={60} />
        </View>

        <Text style={styles.settleTitle}>Settle Payment</Text>
        <Text style={styles.settleDescription}>
          You are settling your debt with{' '}
          <Text style={styles.bold}>{toUser?.name || 'your roommate'}</Text>
        </Text>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount to Settle</Text>
          <Text style={styles.amountValue}>{formatCurrency(amount || 0)}</Text>
        </View>
      </View>

      {/* Payment Methods Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          This only marks the debt as settled in BillBuddy. Make sure you've actually paid{' '}
          <Text style={styles.bold}>{toUser?.name || 'your roommate'}</Text> through your preferred
          payment method (cash, bank transfer, etc.) before settling.
        </Text>
      </View>

      {/* Payment Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Payment Tips</Text>
        {[
          { icon: 'cash-outline', text: 'Pay in cash and get a confirmation' },
          { icon: 'phone-portrait-outline', text: 'Use Venmo, PayPal, or Zelle' },
          { icon: 'card-outline', text: 'Transfer via bank or mobile banking' },
        ].map((tip, index) => (
          <View key={index} style={styles.tipRow}>
            <Ionicons name={tip.icon} size={18} color={colors.primary} />
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}
      </View>

      {/* Settle Button */}
      <Button
        mode="contained"
        onPress={handleSettle}
        loading={loading}
        disabled={loading}
        style={styles.settleButton}
        contentStyle={styles.settleButtonContent}
        buttonColor={colors.success}
        labelStyle={styles.settleButtonLabel}
        icon="handshake-outline"
      >
        {loading ? 'Settling...' : 'Mark as Settled'}
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={styles.cancelButton}
        textColor={colors.textSecondary}
      >
        Cancel
      </Button>
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
  settlementCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    ...shadows.md,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  settleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: colors.text,
  },
  amountContainer: {
    backgroundColor: colors.success + '15',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  amountLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.success,
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primary + '10',
    borderRadius: 14,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  settleButton: {
    borderRadius: 14,
    marginTop: 4,
  },
  settleButtonContent: {
    paddingVertical: 8,
  },
  settleButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 12,
    borderColor: colors.border,
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  successIcon: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  doneButton: {
    borderRadius: 14,
    marginTop: 16,
    paddingHorizontal: 32,
  },
});

export default SettleUpScreen;
