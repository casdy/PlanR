/**
 * @file src/engine/holisticEngine.ts
 * @description The Unified Health Progress Engine.
 *
 * This engine cross-references the user's workout data (from volumeEngine / LocalService),
 * their recovery logs (sleep, soreness), and their granular nutrition history to surface
 * elite-level coaching insights dynamically.
 */
import { supabase } from '../lib/supabase';
import { generateLocalCoachingPlan } from './coachEngine';
import { LocalService } from '../services/localService';

const COACH_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export interface HolisticInsight {
  id: string;
  type: 'performance' | 'metabolism' | 'food_quality' | 'behavior' | 'auto_regulation';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  icon: 'flame' | 'zap' | 'activity' | 'alert-triangle' | 'droplets' | 'leaf';
  variables?: Record<string, string | number>;
}

export interface HolisticMetrics {
  avgProtein: number;
  avgCarbs: number;
  avgCalories: number;
  avgSoreness: number;
  avgSleep: number;
  workoutVolume: number;
}

export interface HolisticReport {
  insights: HolisticInsight[];
  metrics: HolisticMetrics;
}

/**
 * Generates an array of intelligent, cross-referenced insights for the user.
 */
export async function generateHolisticInsights(userId: string): Promise<HolisticReport> {
  const insights: HolisticInsight[] = [];
  
  // If no user or guest, skip Supabase calls to avoid errors but still provide fallbacks
  const isGuest = !userId || userId === 'guest';

  // --- AGGREGATE DATA ---
  let avgProtein = 0;
  let avgCarbs = 0;
  let avgCalories = 0;
  let avgSoreness = NaN;
  let avgSleep = NaN;
  let workoutVolume = 0;

  try {
    let nutritionLogs: any[] = [];
    let recoveryLogs: any[] = [];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (!isGuest) {
        // 1. Fetch recent nutrition data (last 7 days)
        const { data: nLogs } = await supabase
          .from('nutrition_logs')
          .select('calories, protein, carbs, fat, created_at')
          .eq('user_id', userId)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });
          
        nutritionLogs = nLogs || [];

        // 2. Fetch recent recovery logs
        const { data: rLogs } = await supabase
          .from('recovery_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('logged_at', sevenDaysAgo.toISOString())
          .order('logged_at', { ascending: false });
          
        recoveryLogs = rLogs || [];
    }

    // 3. Fetch workout history (LocalService)
    const workoutLogs = LocalService.getLogs(userId) || [];
    const recentWorkouts = workoutLogs.filter(w => 
      w.completedAt && new Date(w.completedAt) >= sevenDaysAgo
    );
    workoutVolume = recentWorkouts.length;

    // --- CALCULATE AVERAGES ---
    if (nutritionLogs && nutritionLogs.length > 0) {
      const sum = nutritionLogs.reduce(
        (acc, log) => ({
          protein: acc.protein + (log.protein || 0),
          carbs: acc.carbs + (log.carbs || 0),
          calories: acc.calories + (log.calories || 0)
        }),
        { protein: 0, carbs: 0, calories: 0 }
      );
      
      // Calculate averages based on distinct days logged
      const distinctDays = new Set(nutritionLogs.map(l => l.created_at.split('T')[0])).size;
      avgProtein = sum.protein / (distinctDays || 1);
      avgCarbs = sum.carbs / (distinctDays || 1);
      avgCalories = sum.calories / (distinctDays || 1);
    }

    if (recoveryLogs && recoveryLogs.length > 0) {
       avgSoreness = recoveryLogs.reduce((acc, log) => acc + (log.soreness_score || 0), 0) / recoveryLogs.length;
       avgSleep = recoveryLogs.reduce((acc, log) => acc + (log.sleep_score || 0), 0) / recoveryLogs.length;
    }

    // --- GENERATE INSIGHTS ---

    // Insight 1: Performance & Recovery Correlation (Protein vs Soreness)
    if (!isNaN(avgSoreness) && avgProtein > 0) {
      if (avgSoreness >= 7 && avgProtein < 120) {
        insights.push({
          id: 'protein-soreness-high',
          type: 'performance',
          title: 'insight_1_title',
          description: 'insight_1_desc',
          variables: { avgSoreness: avgSoreness.toFixed(1), avgProtein: Math.round(avgProtein) },
          severity: 'warning',
          icon: 'activity'
        });
      } else if (avgSoreness <= 4 && avgProtein > 140) {
         insights.push({
          id: 'protein-soreness-optimal',
          type: 'performance',
          title: 'insight_2_title',
          description: 'insight_2_desc',
          variables: { avgProtein: Math.round(avgProtein) },
          severity: 'success',
          icon: 'zap'
        });
      }
    }

    // Insight 2: Metabolic Trend (Carbs vs Workout Volume)
    if (recentWorkouts.length > 0 && avgCarbs > 0) {
      if (avgCarbs < 150 && recentWorkouts.length >= 4) {
         insights.push({
          id: 'carb-volume-mismatch',
          type: 'performance',
          title: 'insight_3_title',
          description: 'insight_3_desc',
          variables: { sessions: recentWorkouts.length, avgCarbs: Math.round(avgCarbs) },
          severity: 'warning',
          icon: 'flame'
        });
      }
    }

    // Insight 3: Auto-Regulation (Diet Breaks / Sleep Disruption)
    if (!isNaN(avgSleep) && avgCalories > 0) {
        if (avgSleep < 5) {
             insights.push({
              id: 'sleep-disruption-critical',
              type: 'behavior',
              title: 'insight_4_title',
              description: 'insight_4_desc',
              severity: 'critical',
              icon: 'alert-triangle'
            });
        }
    }
    
    // Insight 4: General Data Adherence
    if (nutritionLogs && nutritionLogs.length === 0) {
        insights.push({
          id: 'nutrition-tracking-lapse',
          type: 'behavior',
          title: 'insight_5_title',
          description: 'insight_5_desc',
          severity: 'info',
          icon: 'leaf'
        });
    }
    
    // --- INTEGRATE GEMINI COACHING (PHASE 2) ---
    try {
      const cached = localStorage.getItem('planR_coaching_plan');
      const cachedTs = localStorage.getItem('planR_coaching_plan_ts');
      const isExpired = cachedTs && (Date.now() - parseInt(cachedTs) > COACH_CACHE_EXPIRY);
      let coachPlan = cached ? JSON.parse(cached) : null;
      
      if (!coachPlan || isExpired) {
        try {
          const response = await fetch('/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               metrics: { avgCalories, avgProtein, avgCarbs, workoutVolume },
               goal: 'elite_performance'
            })
          });
          
          if (response.ok) {
            coachPlan = await response.json();
            LocalService.saveCoachingPlan(coachPlan);
          } else {
            console.warn('[HolisticEngine] API failed, using mock.');
            throw new Error('404');
          }
        } catch (e) {
          // Rule-based fallback using the original apps engine logic
          coachPlan = await generateLocalCoachingPlan(userId);
        }
      }
      
      if (coachPlan && coachPlan.length > 0) {
        const ts = parseInt(localStorage.getItem('planR_coaching_plan_ts') || Date.now().toString());
        const daysSinceStart = Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
        const todayIdx = daysSinceStart % 7;
        const today = coachPlan[todayIdx] || coachPlan[0];

        insights.push({
          id: `gemini-motivation-${todayIdx}`,
          type: 'behavior',
          title: 'AI COACH: MOTIVATION',
          description: today.motivation_message,
          severity: 'success',
          icon: 'zap'
        }, {
          id: `gemini-nutrition-${todayIdx}`,
          type: 'food_quality',
          title: 'AI COACH: NUTRITION',
          description: today.nutrition_focus,
          severity: 'info',
          icon: 'leaf'
        }, {
          id: `gemini-workout-${todayIdx}`,
          type: 'performance',
          title: 'AI COACH: WORKOUT',
          description: today.workout_focus,
          severity: 'info',
          icon: 'activity'
        });
      }
    } catch (coachError) {
      console.warn('[HolisticEngine] Coaching integration failed.', coachError);
    }

  } catch (error) {
    console.error('Error generating holistic insights:', error);
  }

  // Fallback defaults if the array is perfectly clean
  if (insights.length === 0) {
      insights.push({
          id: 'baseline-optimal',
          type: 'auto_regulation',
          title: 'insight_6_title',
          description: 'insight_6_desc',
          severity: 'success',
          icon: 'activity'
      });
  }

  // Fallbacks for NaN
  const metrics = {
    avgProtein: isNaN(avgProtein) ? 0 : avgProtein,
    avgCarbs: isNaN(avgCarbs) ? 0 : avgCarbs,
    avgCalories: isNaN(avgCalories) ? 0 : avgCalories,
    avgSoreness: isNaN(avgSoreness) ? 0 : avgSoreness,
    avgSleep: isNaN(avgSleep) ? 0 : avgSleep,
    workoutVolume: workoutVolume
  };

  return { insights, metrics };
}
