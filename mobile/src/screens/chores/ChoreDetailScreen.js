import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchChoreDetail,
  completeChore,
  deleteChore,
  selectSelectedChore,
  selectChoreLoading,
} from '../../store/slices/choreSlice';
import { selectUser } from '../../store/slices/authSlice';
import { selectHouse } from '../../store/slices/houseSlice';
import { colors, shadows } from '../../utils/theme';
import { formatDate, isOverdue } from '../../utils/formatters';
import MemberAvatar from '../../components/MemberAvatar';
import LoadingSpinner from '../../components/LoadingSpinner';

const FREQUENCY_LABELS = {
  Daily: 'Repeats Daily',
  Weekly: 'Repeats Weekly',
  Monthly: 'Repeats Monthly',
  Once: 'One-time Task',
};

const ChoreDetailScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { choreId } = route.params || {};
  const chore = useSelector(selectSelectedChore);
  const loading = useSelector(selectChoreLoading);
  const user = useSelector(selectUser);
  const house = useSelector(selectHouse);

  const isAdmin = house?.members?.find(
    (m) => (m.user?.id === user?.id || m.user === user?.id) && m.role === 'admin'
  );

  const isAssignedToMe =
    chore?.assignedTo?.id === user?.id || chore?.assignedTo === user?.id;

  const canComplete = isAssignedToMe || isAdmin;
  const canEdit = isAdmin || isAssignedToMe;
  const canDelete = isAdmin;
  const overdue = chore && isOverdue(chore.dueDate) && !chore.completed;

  useEffect(() => {
    if (choreId) {
      dispatch(fetchChoreDetail(choreId));
    }
  }, [choreId, dispatch]);

  const handleComplete = () => {
    Alert.alert('Complete Chore', 'Mark this chore as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          await dispatch(completeChore(choreId));
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Chore', 'Are you sure you want to delete this chore?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await dispatch(deleteChore(choreId));
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading || !chore) {
    return <LoadingSpinner fullScreen message="Loading chore..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Banner */}
      <View
        style={[
          styles.statusBanner,
          chore.completed
            ? styles.completedBanner
            : overdue
            ? styles.overdueBanner
            : styles.pendingBanner,
        ]}
      >
        <Ionicons
          name={
            chore.completed
              ? 'checkmark-circle'
              : overdue
              ? 'alert-circle'
              : 'time-outline'
          }
          size={28}
          color={
            chore.completed ? colors.success : overdue ? colors.danger : colors.warning
          }
        />
        <Text
          style={[
            styles.statusText,
            chore.completed
              ? styles.completedStatusText
              : overdue
              ? styles.overdueStatusText
              : styles.pendingStatusText,
          ]}
        >
          {chore.completed ? 'Completed' : overdue ? 'Overdue' : 'Pending'}
        </Text>
      </View>

      {/* Main Info */}
      <View style={styles.card}>
        <Text style={styles.choreTitle}>{chore.title}</Text>
        {chore.description ? (
          <Text style={styles.choreDescription}>{chore.description}</Text>
        ) : null}

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="repeat-outline" size={18} color={colors.primary} />
            <Text style={styles.infoLabel}>Frequency</Text>
            <Text style={styles.infoValue}>{FREQUENCY_LABELS[chore.frequency] || chore.frequency}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={18} color={overdue ? colors.danger : colors.primary} />
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={[styles.infoValue, overdue && styles.overdueText]}>
              {formatDate(chore.dueDate)}
            </Text>
          </View>
        </View>
      </View>

      {/* Assigned To */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Assigned To</Text>
        <View style={styles.assigneeRow}>
          <MemberAvatar user={chore.assignedTo} size={48} />
          <View style={styles.assigneeInfo}>
            <Text style={styles.assigneeName}>
              {isAssignedToMe ? 'You' : chore.assignedTo?.name || 'Unknown'}
            </Text>
            {isAssignedToMe && (
              <View style={styles.meIndicator}>
                <Text style={styles.meIndicatorText}>That's you!</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Completion Info */}
      {chore.completed && chore.completedBy && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Completed By</Text>
          <View style={styles.assigneeRow}>
            <MemberAvatar user={chore.completedBy} size={44} />
            <View style={styles.assigneeInfo}>
              <Text style={styles.assigneeName}>
                {chore.completedBy?.id === user?.id ? 'You' : chore.completedBy?.name}
              </Text>
              {chore.completedAt && (
                <Text style={styles.completedDate}>
                  {formatDate(chore.completedAt)}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {canComplete && !chore.completed && (
          <Button
            mode="contained"
            onPress={handleComplete}
            style={styles.completeButton}
            contentStyle={styles.buttonContent}
            buttonColor={colors.success}
            labelStyle={styles.buttonLabel}
            icon="checkmark-circle-outline"
          >
            Mark as Complete
          </Button>
        )}

        {canEdit && !chore.completed && (
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('EditChore', { choreId })}
            style={styles.editButton}
            textColor={colors.primary}
            icon="pencil-outline"
          >
            Edit Chore
          </Button>
        )}

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('ChoreHistory', { choreId })}
        >
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.historyButtonText}>View History</Text>
        </TouchableOpacity>

        {canDelete && (
          <Button
            mode="outlined"
            onPress={handleDelete}
            style={styles.deleteButton}
            textColor={colors.danger}
            icon="trash-can-outline"
          >
            Delete Chore
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  completedBanner: {
    backgroundColor: colors.success + '15',
  },
  overdueBanner: {
    backgroundColor: colors.danger + '15',
  },
  pendingBanner: {
    backgroundColor: colors.warning + '15',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  completedStatusText: { color: colors.success },
  overdueStatusText: { color: colors.danger },
  pendingStatusText: { color: colors.warning },
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
  choreTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  choreDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  overdueText: {
    color: colors.danger,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  assigneeInfo: {
    gap: 4,
  },
  assigneeName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  meIndicator: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  meIndicatorText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  completedDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actions: {
    gap: 10,
  },
  completeButton: {
    borderRadius: 14,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    borderRadius: 12,
    borderColor: colors.primary,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  historyButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 12,
    borderColor: colors.danger,
  },
});

export default ChoreDetailScreen;
