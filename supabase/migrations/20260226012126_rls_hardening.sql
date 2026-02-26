-- 1. Enable RLS on Public Tables
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Add Basic Owner Policies for New Protected Tables

-- 'users' table links to auth via the 'id' column
CREATE POLICY "Users own their profiles" ON public.users
    FOR ALL USING (id::text = (select auth.uid())::text);

-- 'workout_history' links to auth via the 'user_id' column
CREATE POLICY "Users own their workout history" ON public.workout_history
    FOR ALL USING (user_id::text = (select auth.uid())::text);

-- 'exercise_logs' has no direct user link, but belongs to a 'workout_history' row via 'workout_id'. 
-- We join them to ensure security.
CREATE POLICY "Users own their exercise logs" ON public.exercise_logs
    FOR ALL USING (
        workout_id IN (
            SELECT id FROM public.workout_history WHERE user_id::text = (select auth.uid())::text
        )
    );

-- 3. Optimize Existing Policies for Suboptimal Performance
-- Drop old suboptimal policies
DROP POLICY IF EXISTS "Users own their programs" ON public.workout_programs;
DROP POLICY IF EXISTS "Users own their logs" ON public.workout_logs;

-- Recreate with optimized subquery (select auth.uid())
CREATE POLICY "Users own their programs" ON public.workout_programs
    FOR ALL USING (user_id::text = (select auth.uid())::text);

CREATE POLICY "Users own their logs" ON public.workout_logs
    FOR ALL USING (user_id::text = (select auth.uid())::text);
