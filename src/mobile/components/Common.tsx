import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface MacroBadgeProps {
  label: string;
  value: number;
  color: string;
}

export const MacroBadge: React.FC<MacroBadgeProps> = ({ label, value, color }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
       <Text style={[styles.badgeText, { color: color }]}>{label}: {value}g</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  }
});
