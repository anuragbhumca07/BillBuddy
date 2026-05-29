import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchNotifications,
  markNotificationRead,
  markAllRead,
  selectNotifications,
  selectNotificationLoading,
} from '../../store/slices/notificationSlice';
import { colors, shadows } from '../../utils/theme';
import { timeAgo } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const NOTIFICATION_ICONS = {
  expense: 'receipt-outline',
  chore: 'checkmark-circle-outline',
  announcement: 'megaphone-outline',
  payment: 'cash-outline',
  reminder: 'alarm-outline',
  default: 'notifications-outline',
};

const NOTIFICATION_COLORS = {
  expense: colors.primary,
  chore: colors.success,
  announcement: colors.secondary,
  payment: colors.warning,
  reminder: colors.danger,
  default: colors.textSecondary,
};

const NotificationsScreen = () => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const notifications = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationLoading);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications());
    setRefreshing(false);
  };

  const handleMarkRead = (notificationId) => {
    dispatch(markNotificationRead(notificationId));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllRead());
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }) => {
    const type = item.type || 'default';
    const icon = NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default;
    const color = NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.default;

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.unreadCard]}
        onPress={() => !item.read && handleMarkRead(item.id)}
        activeOpacity={0.8}
      >
        {!item.read && <View style={styles.unreadDot} />}

        <View style={[styles.notifIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>

        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, !item.read && styles.unreadTitle]} numberOfLines={2}>
            {item.title || 'Notification'}
          </Text>
          {item.message && (
            <Text style={styles.notifMessage} numberOfLines={2}>
              {item.message}
            </Text>
          )}
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>

        {item.read && (
          <Ionicons name="checkmark" size={16} color={colors.border} style={styles.readIcon} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading && notifications.length === 0) {
    return <LoadingSpinner fullScreen message="Loading notifications..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <Button
            mode="text"
            onPress={handleMarkAllRead}
            textColor={colors.primary}
            compact
          >
            Mark all read
          </Button>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No notifications"
            message="You're all caught up! Notifications will appear here."
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  unreadCount: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 6,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  unreadCard: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '05',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    left: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notifMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  readIcon: {
    marginTop: 2,
  },
});

export default NotificationsScreen;
