import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows } from '../utils/theme';
import { timeAgo } from '../utils/formatters';
import MemberAvatar from './MemberAvatar';

const AnnouncementCard = ({ announcement, onPress, onDelete, isAdmin }) => {
  const poster = announcement.postedBy || announcement.createdBy;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(announcement)}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MemberAvatar user={poster} size={36} />
          <View style={styles.posterInfo}>
            <Text style={styles.posterName}>{poster?.name || 'Unknown'}</Text>
            <Text style={styles.timeAgo}>{timeAgo(announcement.createdAt)}</Text>
          </View>
        </View>
        {isAdmin && onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(announcement.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>{announcement.title}</Text>
      <Text style={styles.message} numberOfLines={3}>
        {announcement.message}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    gap: 10,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  posterInfo: {
    gap: 1,
  },
  posterName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timeAgo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '500',
  },
});

export default AnnouncementCard;
