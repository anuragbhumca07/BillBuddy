import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

const LoadingSpinner = ({ message, fullScreen, size = 'large', color }) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color || colors.primary} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={color || colors.primary} />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  inline: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
  },
  inlineMessage: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default LoadingSpinner;
