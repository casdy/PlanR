import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { RingChart } from '../components/RingChart';
import { ProgressBar } from '../components/ProgressBar';
import { calculateNutritionStats } from '../utils/stats';
import { Meal, NutritionTargets } from '../types';

const MOCK_TARGETS: NutritionTargets = { calories: 2500, protein: 180, carbs: 250, fat: 70 };
const MOCK_MEALS: Meal[] = [
  { id: '1', name: 'Oatmeal & Berries', calories: 350, protein: 12, carbs: 65, fat: 5, timestamp: '08:30 AM', type: 'breakfast' },
];

export const DailyBreakdown = () => {
  const { theme } = useTheme();
  const { totals } = calculateNutritionStats(MOCK_MEALS, MOCK_TARGETS);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.ringWrapper}>
        <RingChart current={totals.calories} target={MOCK_TARGETS.calories} />
      </View>

      <Text style={[styles.motivation, { color: theme.colors.text }]}>
        You're on track for your calorie goal today!
      </Text>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <ProgressBar 
          label="Protein" 
          current={totals.protein} 
          target={MOCK_TARGETS.protein} 
          color={theme.colors.protein} 
        />
        <ProgressBar 
          label="Carbs" 
          current={totals.carbs} 
          target={MOCK_TARGETS.carbs} 
          color={theme.colors.carbs} 
        />
        <ProgressBar 
          label="Fat" 
          current={totals.fat} 
          target={MOCK_TARGETS.fat} 
          color={theme.colors.fat} 
        />
      </View>
      
      <View style={styles.historyPreview}>
        <Text style={[styles.previewTitle, { color: theme.colors.text }]}>Recent History</Text>
        {MOCK_MEALS.map(meal => (
          <View key={meal.id} style={[styles.mealLine, { borderBottomColor: theme.colors.border }]}>
             <Text style={[styles.mealName, { color: theme.colors.text }]}>{meal.name}</Text>
             <Text style={[styles.mealCals, { color: theme.colors.primary }]}>{meal.calories} kcal</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  ringWrapper: { paddingVertical: 40, alignItems: 'center' },
  motivation: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 32 },
  card: { padding: 20, borderRadius: 24, marginBottom: 24 },
  historyPreview: { marginTop: 10 },
  previewTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  mealLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  mealName: { fontSize: 14, fontWeight: '600' },
  mealCals: { fontSize: 14, fontWeight: '700' },
});
