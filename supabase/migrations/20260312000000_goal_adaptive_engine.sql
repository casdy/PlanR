-- SQL Migration: Goal-Adaptive Training Engine
-- Adds primary_fitness_goal to user_biometrics and creates body_measurements table

-- 1. Create the fitness goal enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fitness_goal') THEN
        CREATE TYPE fitness_goal AS ENUM ('fat_loss', 'muscle_gain', 'strength', 'maintenance');
    END IF;
END
$$;

-- 2. Update user_biometrics table
ALTER TABLE public.user_biometrics 
ADD COLUMN IF NOT EXISTS primary_fitness_goal fitness_goal DEFAULT 'maintenance';

-- 3. Create body_measurements table
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    waist_cm NUMERIC,
    chest_cm NUMERIC,
    left_bicep_cm NUMERIC,
    right_bicep_cm NUMERIC,
    body_fat_percentage NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies for body_measurements
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'body_measurements' AND policyname = 'Users can manage their own measurements'
  ) THEN
    CREATE POLICY "Users can manage their own measurements"
    ON public.body_measurements
    FOR ALL
    USING (auth.uid() = user_id);
  END IF;
END $$;
