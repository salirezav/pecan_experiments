-- Experiment Repetitions System Migration
-- Transforms experiments into blueprints/templates with schedulable repetitions
-- This migration creates the repetitions table and removes scheduling from experiments

-- Note: Data clearing removed since this runs during fresh database setup

-- Create experiment_repetitions table
CREATE TABLE IF NOT EXISTS public.experiment_repetitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    repetition_number INTEGER NOT NULL CHECK (repetition_number > 0),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    schedule_status TEXT NOT NULL DEFAULT 'pending schedule' 
        CHECK (schedule_status IN ('pending schedule', 'scheduled', 'canceled', 'aborted')),
    completion_status BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    
    -- Ensure unique repetition numbers per experiment
    CONSTRAINT unique_repetition_per_experiment UNIQUE (experiment_id, repetition_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experiment_repetitions_experiment_id ON public.experiment_repetitions(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_repetitions_schedule_status ON public.experiment_repetitions(schedule_status);
CREATE INDEX IF NOT EXISTS idx_experiment_repetitions_completion_status ON public.experiment_repetitions(completion_status);
CREATE INDEX IF NOT EXISTS idx_experiment_repetitions_scheduled_date ON public.experiment_repetitions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_experiment_repetitions_created_by ON public.experiment_repetitions(created_by);
CREATE INDEX IF NOT EXISTS idx_experiment_repetitions_created_at ON public.experiment_repetitions(created_at);

-- Remove scheduling fields from experiments table since experiments are now blueprints
ALTER TABLE public.experiments DROP COLUMN IF EXISTS scheduled_date;
ALTER TABLE public.experiments DROP COLUMN IF EXISTS schedule_status;

-- Drop related indexes that are no longer needed
DROP INDEX IF EXISTS idx_experiments_schedule_status;
DROP INDEX IF EXISTS idx_experiments_scheduled_date;

-- Note: experiment_data_entries table is replaced by experiment_phase_drafts in the new system

-- Function to validate repetition number doesn't exceed experiment's reps_required
CREATE OR REPLACE FUNCTION validate_repetition_number()
RETURNS TRIGGER AS $$
DECLARE
    max_reps INTEGER;
BEGIN
    -- Get the reps_required for this experiment
    SELECT reps_required INTO max_reps
    FROM public.experiments
    WHERE id = NEW.experiment_id;

    -- Check if repetition number exceeds the limit
    IF NEW.repetition_number > max_reps THEN
        RAISE EXCEPTION 'Repetition number % exceeds maximum allowed repetitions % for experiment',
            NEW.repetition_number, max_reps;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function for experiment_repetitions
CREATE OR REPLACE FUNCTION update_experiment_repetitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate repetition number
CREATE TRIGGER trigger_validate_repetition_number
    BEFORE INSERT OR UPDATE ON public.experiment_repetitions
    FOR EACH ROW
    EXECUTE FUNCTION validate_repetition_number();

-- Create trigger for updated_at on experiment_repetitions
CREATE TRIGGER trigger_experiment_repetitions_updated_at
    BEFORE UPDATE ON public.experiment_repetitions
    FOR EACH ROW
    EXECUTE FUNCTION update_experiment_repetitions_updated_at();

-- Enable RLS on experiment_repetitions table
ALTER TABLE public.experiment_repetitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for experiment_repetitions
-- Users can view repetitions for experiments they have access to
CREATE POLICY "Users can view experiment repetitions" ON public.experiment_repetitions
    FOR SELECT USING (
        experiment_id IN (
            SELECT id FROM public.experiments
            WHERE created_by = auth.uid()
        )
        OR public.is_admin()
    );

-- Users can insert repetitions for experiments they created or if they're admin
CREATE POLICY "Users can create experiment repetitions" ON public.experiment_repetitions
    FOR INSERT WITH CHECK (
        experiment_id IN (
            SELECT id FROM public.experiments
            WHERE created_by = auth.uid()
        )
        OR public.is_admin()
    );

-- Users can update repetitions for experiments they created or if they're admin
CREATE POLICY "Users can update experiment repetitions" ON public.experiment_repetitions
    FOR UPDATE USING (
        experiment_id IN (
            SELECT id FROM public.experiments
            WHERE created_by = auth.uid()
        )
        OR public.is_admin()
    );

-- Users can delete repetitions for experiments they created or if they're admin
CREATE POLICY "Users can delete experiment repetitions" ON public.experiment_repetitions
    FOR DELETE USING (
        experiment_id IN (
            SELECT id FROM public.experiments
            WHERE created_by = auth.uid()
        )
        OR public.is_admin()
    );

-- Add comments for documentation
COMMENT ON TABLE public.experiment_repetitions IS 'Individual repetitions of experiment blueprints that can be scheduled and executed';
COMMENT ON COLUMN public.experiment_repetitions.experiment_id IS 'Reference to the experiment blueprint';
COMMENT ON COLUMN public.experiment_repetitions.repetition_number IS 'Sequential number of this repetition (1, 2, 3, etc.)';
COMMENT ON COLUMN public.experiment_repetitions.scheduled_date IS 'Date and time when this repetition is scheduled to run';
COMMENT ON COLUMN public.experiment_repetitions.schedule_status IS 'Current scheduling status of this repetition';
COMMENT ON COLUMN public.experiment_repetitions.completion_status IS 'Whether this repetition has been completed';
-- Note: experiment_data_entries table is replaced by experiment_phase_drafts in the new system
