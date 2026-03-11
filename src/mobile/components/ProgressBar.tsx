import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';

interface ProgressBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ label, current, target, color, unit = 'g' }) => {
  const { theme } = useTheme();
  const progress = useSharedValue(0);
  
  useEffect(() => {
    const percentage = target > 0 ? Math.min(current / target, 1) : 0;
    progress.value = withSpring(percentage, { damping: 15 });
  }, [current, target]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.colors.textSecondary }]}>
          {current}{unit} / {target}{unit}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.colors.border }]}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, animatedStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  value: {
    fontSize: 12,
    fontWeight: '500',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
