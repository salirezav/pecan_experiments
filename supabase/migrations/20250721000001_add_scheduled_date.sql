-- Add scheduled_date field to experiments table
-- This migration adds support for storing when experiments are scheduled to run

-- Add scheduled_date column to experiments table
ALTER TABLE public.experiments 
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;

-- Create index for better performance when querying by scheduled date
CREATE INDEX IF NOT EXISTS idx_experiments_scheduled_date ON public.experiments(scheduled_date);

-- Add comment for documentation
COMMENT ON COLUMN public.experiments.scheduled_date IS 'Date and time when the experiment is scheduled to run';
