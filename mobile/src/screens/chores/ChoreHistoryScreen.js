import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchHistory, selectChoreHistory, selectChoreLoading } from '../../store/slices/choreSlice';
import { colors, shadows } from '../../utils/theme';
import { formatDate, timeAgo } from '../../utils/formatters';
import MemberAvatar from '../../components/MemberAvatar';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const ChoreHistoryScreen = ({ route }) => {
  const dispatch = useDispatch();
  const { choreId } = route.params || {};
  const history = useSelector(selectChoreHistory);
  const loading = useSelector(selectChoreLoading);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchHistory(choreId));
  }, [choreId, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchHistory(choreId));
    setRefreshing(false);
  };

  const renderHistoryItem = ({ item, index }) => (
    <View style={styles.historyItem}>
      <View style={styles.timelineLeft}>
        <View style={styles.timelineDot} />
        {index < history.length - 1 && <View style={styles.timelineLine} />}
      </View>

      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <MemberAvatar user={item.completedBy} size={36} />
          <View style={styles.historyInfo}>
            <Text style={styles.historyName}>
              {item.completedBy?.name || 'Unknown'}
            </Text>
            <Text style={styles.historyTime}>{timeAgo(item.completedAt)}</Text>
          </View>
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.completedText}>Done</Text>
          </View>
        </View>

        {item.choreName && (
          <Text style={styles.choreName}>{item.choreName}</Text>
        )}

        <Text style={styles.historyDate}>{formatDate(item.completedAt)}</Text>

        {item.note && (
          <View style={styles.noteContainer}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading && history.length === 0) {
    return <LoadingSpinner fullScreen message="Loading history..." />;
  }

  return (
    <View style={styles.container}>
      {history.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{history.length}</Text>
            <Text style={styles.statLabel}>Total Completions</Text>
          </View>
          {history.length > 0 && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDate(history[0]?.completedAt)}</Text>
              <Text style={styles.statLabel}>Last Done</Text>
            </View>
          )}
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={(item, index) => item.id || String(index)}
        renderItem={renderHistoryItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No history yet"
            message="Completed chores will appear here."
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  historyItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 20,
    paddingTop: 14,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
    zIndex: 1,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
    marginBottom: -4,
  },
  historyCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 8,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  historyTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  choreName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

export default ChoreHistoryScreen;
