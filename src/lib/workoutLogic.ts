/**
 * Utility logic for progressive overload calculation.
 * Suggests targets for the next session based on current performance and user feedback.
 */

export interface SessionData {
    exerciseId: string;
    completedReps: number;
    completedWeight: number;
    targetReps: number;
    targetSets: number;
    userFeedback: 'easy' | 'moderate' | 'hard' | 'failed';
}

export const calculateNextSessionTargets = (session: SessionData) => {
    let nextWeight = session.completedWeight;
    let nextReps = session.targetReps;

    const allSetsCompleted = session.completedReps >= (session.targetReps * session.targetSets);

    if (session.userFeedback === 'easy' && allSetsCompleted) {
        // Aggressive push: 5% increase or +2 reps
        nextWeight = Math.ceil((session.completedWeight * 1.05) / 2.5) * 2.5;
        // If weight didn't move (low weight), push reps
        if (nextWeight === session.completedWeight) nextReps += 2;
    } 
    else if (session.userFeedback === 'moderate' && allSetsCompleted) {
        // Standard progression: 2.5% increase
        nextWeight = Math.ceil((session.completedWeight * 1.025) / 2.5) * 2.5;
        if (nextWeight === session.completedWeight) nextReps += 1;
    }
    else if (session.userFeedback === 'hard') {
        // Stay at current weight, aim for consistency
        nextWeight = session.completedWeight;
    }
    else if (session.userFeedback === 'failed') {
        // Deload: -10% or stay but reduce volume
        nextWeight = Math.floor((session.completedWeight * 0.9) / 2.5) * 2.5;
    }

    return {
        nextWeight,
        nextReps,
        notes: session.userFeedback === 'easy' ? 'Feeling strong! Progressive overload applied.' : ''
    };
};

/**
 * AI adaptation prompt generator.
 */
export const generateAIAdaptationPrompt = (weeklyVolume: number, fatigueScore: number) => {
    return `Analyze the following weekly training data: 
    Total Volume: ${weeklyVolume} lbs
    Fatigue Score: ${fatigueScore}/10
    
    Output a JSON object with:
    1. plateau_detected (boolean)
    2. suggested_volume_adjustment (percentage)
    3. specific_exercise_feedback (array of strings)
    
    Focus on preventing injury and optimizing hypertrophy.`;
};
