/**
 * @file src/engine/coachEngine.ts
 * @description Legacy Rule-Based Coaching Engine for PlanR.
 * 
 * Provides a resilient local fallback for when the AI service is unreachable.
 * Uses goal-based heuristics and historically established motivational strings.
 */
import { useSettingsStore } from '../store/settingsStore';
import { getUserBiometrics } from './calorieEngine';
import { LocalService } from '../services/localService';

const LEGACY_MOTIVATION = {
  fat_loss: [
    "Burn the day off. Your session is waiting.",
    "Small steps lead to big changes. Let's hit that workout!",
    "Success starts with self-discipline. Time to sweat.",
    "Consistency is the enemy of fat. Keep moving.",
    "Focus on the long game. Every rep counts towards the deficit.",
    "You are stronger than your excuses. Let's conquer today.",
    "The secret of getting ahead is getting started."
  ],
  muscle_gain: [
    "Time to grow. Don't skip today's volume.",
    "Fuel the pump. Your strength session is calling.",
    "Consistency is key to muscle growth. Let's lift!",
    "Progressive overload is your best friend today.",
    "Don't just go through the motions. Make the motions count.",
    "Eat, sleep, lift, repeat. The gains are coming.",
    "Hypertrophy is earned, not given. Focus on the squeeze."
  ],
  strength: [
    "Heavy day ahead. Focus and conquer.",
    "Build the foundation. Your strength is earned today.",
    "Power through the plateau. Let's go!",
    "Neurological strength starts with intent. Stay focused.",
    "Respect the bar, but dominate it. One set at a time.",
    "Strength is a skill. Practice it with perfect form today.",
    "Lift heavy, live strong."
  ],
  maintenance: [
    "Keep the momentum. Stay active and stay healthy.",
    "Consistency over intensity. Get your movement in.",
    "Balance is key. Let's maintain your progress!",
    "A healthy body is a consistent body. Stick to the plan.",
    "Health is wealth. Your daily activity is your investment.",
    "Sustainability is the goal. Keep the routine alive.",
    "You've built a great foundation. Now protect it."
  ]
};

const LEGACY_ADVICE = {
  fat_loss: {
    workout: "Higher repetition ranges (12-15) and reduced rest periods to maximize metabolic demand.",
    nutrition: "Target a 300-500 calorie deficit. Prioritize protein to preserve lean muscle tissue."
  },
  muscle_gain: {
    workout: "Focus on progressive overload in the 8-12 rep range with 90-120s rest periods.",
    nutrition: "Target a 200-300 calorie surplus. Ensure at least 2g of protein per kg of body weight."
  },
  strength: {
    workout: "High intensity, low volume (3-5 reps) with longer rest (3-5 min) for neurological recovery.",
    nutrition: "Focus on performance fueling; maintain maintenance calories with high carb intake on heavy days."
  },
  maintenance: {
    workout: "Balanced volume and intensity to retain current lean mass and cardiovascular capability.",
    nutrition: "Eat at maintenance calories; focus on whole food quality and micronutrient density."
  }
};

/**
 * Generates a rule-based 7-day coaching plan based on the original PlanR engine logic.
 */
export async function generateLocalCoachingPlan(userId: string) {
  // 1. Determine Goal
  // We prefer the SettingsStore if accessible, but for background engine tasks 
  // we might check biometrics database as primary source of truth.
  const biometrics = await getUserBiometrics(userId);
  const settingsGoal = useSettingsStore.getState().primaryFitnessGoal;
  const goal = biometrics?.primary_fitness_goal || settingsGoal || 'maintenance';

  const quotes = LEGACY_MOTIVATION[goal as keyof typeof LEGACY_MOTIVATION] || LEGACY_MOTIVATION.maintenance;
  const advice = LEGACY_ADVICE[goal as keyof typeof LEGACY_ADVICE] || LEGACY_ADVICE.maintenance;

  // 2. Build 7-day plan
  const plan = Array(7).fill(null).map((_, i) => ({
    day: i + 1,
    motivation_message: quotes[i % quotes.length],
    praise_message: "Solid work today. Consistency is the foundation of progress!",
    workout_focus: advice.workout,
    nutrition_focus: advice.nutrition
  }));

  // 3. Save and return
  LocalService.saveCoachingPlan(plan);
  return plan;
}
