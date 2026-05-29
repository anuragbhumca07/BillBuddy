import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../utils/theme';
import { formatDateShort, isOverdue } from '../utils/formatters';
import MemberAvatar from './MemberAvatar';

const FREQUENCY_LABELS = {
  Daily: 'Daily',
  Weekly: 'Weekly',
  Monthly: 'Monthly',
  Once: 'One-time',
};

const ChoreCard = ({ chore, onPress, onComplete, showCompleteButton, currentUserId }) => {
  const overdue = isOverdue(chore.dueDate) && !chore.completed;
  const isAssignedToMe =
    chore.assignedTo?.id === currentUserId || chore.assignedTo === currentUserId;

  return (
    <TouchableOpacity
      style={[styles.card, overdue && styles.overdueCard]}
      onPress={() => onPress && onPress(chore)}
      activeOpacity={0.85}
    >
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={[
            styles.checkCircle,
            chore.completed && styles.checkCircleCompleted,
          ]}
          onPress={() => showCompleteButton && !chore.completed && onComplete && onComplete(chore.id)}
          disabled={!showCompleteButton || chore.completed}
        >
          {chore.completed && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.middleSection}>
        <Text
          style={[
            styles.title,
            chore.completed && styles.titleCompleted,
          ]}
          numberOfLines={1}
        >
          {chore.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={[styles.frequencyBadge, overdue && styles.overdueBadge]}>
            <Text style={[styles.frequencyText, overdue && styles.overdueText]}>
              {FREQUENCY_LABELS[chore.frequency] || chore.frequency}
            </Text>
          </View>
          {chore.dueDate && (
            <View style={styles.dueDateRow}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={overdue ? colors.danger : colors.textSecondary}
              />
              <Text
                style={[
                  styles.dueDate,
                  overdue && styles.overdueDateText,
                ]}
              >
                {overdue ? 'Overdue · ' : ''}
                {formatDateShort(chore.dueDate)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.assigneeRow}>
          <MemberAvatar user={chore.assignedTo} size={18} />
          <Text style={styles.assigneeName}>
            {isAssignedToMe ? 'Assigned to you' : chore.assignedTo?.name || 'Unassigned'}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {chore.completed ? (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>
        ) : overdue ? (
          <Ionicons name="alert-circle" size={20} color={colors.danger} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.border} />
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
  overdueCard: {
    borderColor: colors.danger + '40',
    backgroundColor: colors.danger + '05',
  },
  leftSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  middleSection: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  titleCompleted: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  overdueBadge: {
    backgroundColor: colors.danger + '15',
  },
  frequencyText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  overdueText: {
    color: colors.danger,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dueDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  overdueDateText: {
    color: colors.danger,
    fontWeight: '500',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assigneeName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    alignItems: 'center',
  },
});

export default ChoreCard;
