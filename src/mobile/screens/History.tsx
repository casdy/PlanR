import React, { useState } from 'react';
import { View, Text, StyleSheet, SectionList, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { MacroBadge } from '../components/Common';
import { Meal } from '../types';

const MOCK_SECTIONS = [
  {
    title: 'Jun 23, 2025',
    data: [
      { id: '1', name: 'Protein Shake', calories: 220, protein: 30, carbs: 5, fat: 8, timestamp: '10:00 AM' },
      { id: '2', name: 'Ribeye Steak', calories: 750, protein: 55, carbs: 0, fat: 60, timestamp: '07:30 PM' },
    ]
  },
  {
    title: 'Jun 22, 2025',
    data: [
      { id: '3', name: 'Greek Yogurt', calories: 150, protein: 15, carbs: 12, fat: 2, timestamp: '03:00 PM' },
    ]
  }
];

export const NutritionHistory = () => {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');

  const renderMeal = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.mealName, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.time, { color: theme.colors.textSecondary }]}>{item.timestamp}</Text>
        </View>
        <Text style={[styles.calories, { color: theme.colors.text }]}>{item.calories} <Text style={{ fontSize: 10 }}>KCAL</Text></Text>
      </View>
      <View style={styles.badgeRow}>
        <MacroBadge label="C" value={item.carbs} color={theme.colors.carbs} />
        <MacroBadge label="P" value={item.protein} color={theme.colors.protein} />
        <MacroBadge label="F" value={item.fat} color={theme.colors.fat} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Nutrition History</Text>
      </View>
      
      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Search meals..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <SectionList
        sections={MOCK_SECTIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderMeal}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>{title}</Text>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginTop: 40, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900' },
  searchBar: { padding: 12, borderRadius: 12, marginBottom: 20 },
  input: { fontSize: 16, fontWeight: '500' },
  sectionHeader: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 10 },
  listContent: { paddingBottom: 40 },
  card: { padding: 16, borderRadius: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  mealName: { fontSize: 16, fontWeight: '700' },
  time: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  calories: { fontSize: 18, fontWeight: '900' },
  badgeRow: { flexDirection: 'row' },
});
