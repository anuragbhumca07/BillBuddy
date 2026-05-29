import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCategoryColor } from '../utils/formatters';

const CategoryBadge = ({ category, size = 'sm' }) => {
  const bgColor = getCategoryColor(category);
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bgColor + '22' }]}>
      <View style={[styles.dot, { backgroundColor: bgColor }]} />
      <Text
        style={[
          styles.text,
          { color: bgColor, fontSize: isSmall ? 11 : 13 },
        ]}
      >
        {category || 'Other'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: '600',
  },
});

export default CategoryBadge;
