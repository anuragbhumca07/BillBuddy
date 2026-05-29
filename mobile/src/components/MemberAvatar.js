import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';
import { getInitials } from '../utils/formatters';

const AVATAR_COLORS = [
  '#4F46E5', '#7C3AED', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#3B82F6', '#06B6D4',
];

const getColorForName = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const MemberAvatar = ({
  user,
  size = 40,
  showName = false,
  nameBelow = false,
  style,
}) => {
  const name = user?.name || user?.email || '?';
  const avatarUrl = user?.avatar || user?.avatarUrl;
  const initials = getInitials(name);
  const bgColor = getColorForName(name);
  const fontSize = size * 0.38;

  return (
    <View style={[styles.wrapper, nameBelow && styles.wrapperColumn, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        )}
      </View>
      {showName && (
        <Text
          style={[
            styles.name,
            nameBelow ? styles.nameBelow : styles.nameRight,
          ]}
          numberOfLines={1}
        >
          {name.split(' ')[0]}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrapperColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontWeight: '500',
  },
  nameRight: {
    marginLeft: 8,
    fontSize: 14,
  },
  nameBelow: {
    marginTop: 4,
    fontSize: 12,
    maxWidth: 56,
    textAlign: 'center',
  },
});

export default MemberAvatar;
