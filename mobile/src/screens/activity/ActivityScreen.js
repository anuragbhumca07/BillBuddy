import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import api from '../../services/api';
import MemberAvatar from '../../components/MemberAvatar';
import { colors, shadows } from '../../utils/theme';

const TYPE_CONFIG = {
  expense: { color: '#4F46E5', bg: '#EEF2FF', icon: 'receipt-outline' },
  chore:   { color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
  group:   { color: '#D97706', bg: '#FFFBEB', icon: 'people-outline' },
  message: { color: '#0EA5E9', bg: '#F0F9FF', icon: 'chatbubble-outline' },
  member:  { color: '#7C3AED', bg: '#F5F3FF', icon: 'person-add-outline' },
};

const formatTime = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
};

const ActivityItem = ({ item }) => {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.expense;
  return (
    <View style={styles.item}>
      <View style={[styles.iconWrapper, { backgroundColor: cfg.bg }]}>
        <Ionicons name={item.icon || cfg.icon} size={20} color={cfg.color} />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.itemMeta}>
          {item.user && (
            <View style={styles.userChip}>
              <MemberAvatar user={item.user} size={16} />
              <Text style={styles.userName}>{item.user.name}</Text>
            </View>
          )}
          <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    </View>
  );
};

const ActivityScreen = () => {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectUser);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/activity');
      const data = res.data?.activities || res.data || [];
      setActivities(Array.isArray(data) ? data : []);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
        <Text style={styles.headerSub}>Recent events in your groups</Text>
      </View>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityItem item={item} />}
        contentContainerStyle={[styles.list, activities.length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>
              Add an expense, complete a chore, or send a message to see activity here.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyList: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  userName: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ActivityScreen;
