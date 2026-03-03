-- 1. Extend users safely
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE users ADD COLUMN training_mode TEXT DEFAULT 'casual';
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column training_mode already exists in users.';
  END;

  BEGIN
    ALTER TABLE users ADD COLUMN experience_level TEXT DEFAULT 'beginner';
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column experience_level already exists in users.';
  END;

  BEGIN
    ALTER TABLE users ADD COLUMN mev_multiplier NUMERIC DEFAULT 1.0;
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column mev_multiplier already exists in users.';
  END;

  BEGIN
    ALTER TABLE users ADD COLUMN mrv_multiplier NUMERIC DEFAULT 1.0;
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column mrv_multiplier already exists in users.';
  END;
END $$;

-- 2. Exercise Logs Table safely
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  rpe NUMERIC,
  performed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Recovery Logs Table safely
CREATE TABLE IF NOT EXISTS recovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_score INTEGER CHECK (sleep_score BETWEEN 1 AND 10),
  soreness_score INTEGER CHECK (soreness_score BETWEEN 1 AND 10),
  stress_score INTEGER CHECK (stress_score BETWEEN 1 AND 10),
  energy_score INTEGER CHECK (energy_score BETWEEN 1 AND 10),
  logged_at TIMESTAMP DEFAULT NOW()
);

-- 4. Enable Row Level Security (Critical)
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_logs ENABLE ROW LEVEL SECURITY;

-- 5. Safely Create Policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exercise_logs' AND policyname = 'Users can manage their logs'
  ) THEN
    CREATE POLICY "Users can manage their logs"
    ON exercise_logs
    FOR ALL
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recovery_logs' AND policyname = 'Users can manage their recovery logs'
  ) THEN
    CREATE POLICY "Users can manage their recovery logs"
    ON recovery_logs
    FOR ALL
    USING (auth.uid() = user_id);
  END IF;
END $$;
