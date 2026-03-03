-- Add performed_at strictly to the logs
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE exercise_logs ADD COLUMN performed_at TIMESTAMP DEFAULT NOW();
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column performed_at already exists in exercise_logs.';
  END;
END $$;