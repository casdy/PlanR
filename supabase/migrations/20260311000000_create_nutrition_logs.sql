-- SQL to create the `nutrition_logs` table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    calories NUMERIC DEFAULT 0,
    protein NUMERIC DEFAULT 0,
    carbs NUMERIC DEFAULT 0,
    fat NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own logs
CREATE POLICY "Users can insert their own nutrition logs." 
    ON public.nutrition_logs 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to view their own logs
CREATE POLICY "Users can view their own nutrition logs." 
    ON public.nutrition_logs 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Create policy to allow users to update their own logs
CREATE POLICY "Users can update their own nutrition logs." 
    ON public.nutrition_logs 
    FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own logs
CREATE POLICY "Users can delete their own nutrition logs." 
    ON public.nutrition_logs 
    FOR DELETE 
    USING (auth.uid() = user_id);
