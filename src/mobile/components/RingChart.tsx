import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingChartProps {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export const RingChart: React.FC<RingChartProps> = ({ 
  current, 
  target, 
  size = 180, 
  strokeWidth = 15 
}) => {
  const { theme } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressValue = useSharedValue(0);

  useEffect(() => {
    const percentage = target > 0 ? Math.min(current / target, 1) : 0;
    progressValue.value = withSpring(percentage, { damping: 20 });
  }, [current, target]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressValue.value),
  }));

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          {/* Background Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Fill */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.calories}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedProps}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        
        {/* Center Text */}
        <View style={styles.centerText}>
           <Text style={[styles.consumedLabel, { color: theme.colors.textSecondary }]}>Left</Text>
           <Text style={[styles.mainValue, { color: theme.colors.text }]}>
             {Math.max(0, target - current)}
           </Text>
           <Text style={[styles.unit, { color: theme.colors.textSecondary }]}>KCAL</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  consumedLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainValue: {
    fontSize: 32,
    fontWeight: '900',
    marginVertical: -2,
  },
  unit: {
    fontSize: 10,
    fontWeight: '800',
  },
});
