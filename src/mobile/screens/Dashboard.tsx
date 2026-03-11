import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { 
  VictoryChart, 
  VictoryBar, 
  VictoryStack, 
  VictoryAxis, 
  VictoryVoronoiContainer,
  VictoryTooltip 
} from 'victory-native';
import { useTheme } from '../theme/useTheme';
import { calculateNutritionStats } from '../utils/stats';
import type { Meal, NutritionTargets } from '../types';

// Mock Data for the chart
const WEEKLY_DATA = [
  { day: 'Mon', protein: 450, carbs: 800, fat: 400, calories: 1650 },
  { day: 'Tue', protein: 500, carbs: 700, fat: 450, calories: 1650 },
  { day: 'Wed', protein: 480, carbs: 900, fat: 380, calories: 1760 },
  { day: 'Thu', protein: 550, carbs: 750, fat: 500, calories: 1800 },
  { day: 'Fri', protein: 600, carbs: 850, fat: 420, calories: 1870 },
  { day: 'Sat', protein: 400, carbs: 1200, fat: 600, calories: 2200 },
  { day: 'Sun', protein: 350, carbs: 1000, fat: 550, calories: 1900 },
];

const MOCK_TARGETS: NutritionTargets = { calories: 2500, protein: 180, carbs: 250, fat: 70 };
const MOCK_MEALS: Meal[] = [
  { id: '1', name: 'Oatmeal & Berries', calories: 350, protein: 12, carbs: 65, fat: 5, timestamp: '08:30 AM', type: 'breakfast' },
  { id: '2', name: 'Grilled Chicken Salad', calories: 450, protein: 45, carbs: 12, fat: 18, timestamp: '12:45 PM', type: 'lunch' },
];

export const NutritionDashboard = () => {
  const { theme } = useTheme();
  const stats = calculateNutritionStats(MOCK_MEALS, MOCK_TARGETS);

  const renderQuickAdd = ({ item }: { item: Meal }) => (
    <TouchableOpacity style={[styles.quickAddCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.imgPlaceholder, { backgroundColor: theme.colors.border }]} />
      <Text style={[styles.quickAddTitle, { color: theme.colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={[styles.quickAddCals, { color: theme.colors.primary }]}>
        {item.calories} KCAL
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>NUTRITION SCORE</Text>
          <Text style={[styles.scoreValue, { color: theme.colors.text }]}>{stats.score}</Text>
        </View>
        <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
          Let's start logging your first meal!
        </Text>
      </View>

      {/* Primary CTA */}
      <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.buttonText}>+ Log New Meal</Text>
      </TouchableOpacity>

      {/* Interactive Stacked Bar Chart */}
      <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Weekly Calories</Text>
        
        <VictoryChart
          height={220}
          padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }: { datum: any }) => `${datum.day}: ${datum.calories} kcal`}
              labelComponent={
                <VictoryTooltip
                  flyoutStyle={{ fill: theme.colors.surface, stroke: theme.colors.border }}
                  style={{ fill: theme.colors.text, fontSize: 10 }}
                />
              }
            />
          }
        >
          <VictoryAxis
            style={{
              axis: { stroke: 'transparent' },
              tickLabels: { fill: theme.colors.textSecondary, fontSize: 10, fontWeight: '600' }
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: 'transparent' },
              grid: { stroke: theme.colors.border, strokeDasharray: '4, 4' },
              tickLabels: { fill: theme.colors.textSecondary, fontSize: 10 }
            }}
          />
          <VictoryStack colorScale={[theme.colors.protein, theme.colors.carbs, theme.colors.fat]}>
            <VictoryBar 
              data={WEEKLY_DATA} 
              x="day" 
              y="protein" 
              barWidth={12} 
              cornerRadius={{ top: 0, bottom: 6 }}
            />
            <VictoryBar 
              data={WEEKLY_DATA} 
              x="day" 
              y="carbs" 
              barWidth={12}
            />
            <VictoryBar 
              data={WEEKLY_DATA} 
              x="day" 
              y="fat" 
              barWidth={12} 
              cornerRadius={{ top: 6, bottom: 0 }}
            />
          </VictoryStack>
        </VictoryChart>

        <View style={styles.legend}>
          <LegendItem color={theme.colors.protein} label="Protein" />
          <LegendItem color={theme.colors.carbs} label="Carbs" />
          <LegendItem color={theme.colors.fat} label="Fat" />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Browse Meals</Text>
        <TouchableOpacity><Text style={{ color: theme.colors.primary }}>View All</Text></TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_MEALS}
        renderItem={renderQuickAdd}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    </ScrollView>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginTop: 40, marginBottom: 24 },
  scoreLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  scoreValue: { fontSize: 64, fontWeight: '900', marginVertical: -4 },
  greeting: { fontSize: 14, fontWeight: '500' },
  mainButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  chartContainer: { padding: 16, borderRadius: 20, marginBottom: 24 },
  chartTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendLabel: { fontSize: 10, fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  horizontalList: { paddingRight: 20 },
  quickAddCard: { width: 140, padding: 12, borderRadius: 16, marginRight: 16 },
  imgPlaceholder: { width: '100%', height: 80, borderRadius: 12, marginBottom: 8 },
  quickAddTitle: { fontSize: 14, fontWeight: '700' },
  quickAddCals: { fontSize: 12, fontWeight: '800', marginTop: 2 },
});
