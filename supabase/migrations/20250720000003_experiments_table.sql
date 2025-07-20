-- Experiments Table Migration
-- Creates the experiments table for managing pecan processing experiment definitions

-- Create experiments table
CREATE TABLE IF NOT EXISTS public.experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_number INTEGER UNIQUE NOT NULL,
    reps_required INTEGER NOT NULL CHECK (reps_required > 0),
    rep_number INTEGER NOT NULL CHECK (rep_number > 0),
    soaking_duration_hr FLOAT NOT NULL CHECK (soaking_duration_hr >= 0),
    air_drying_time_min INTEGER NOT NULL CHECK (air_drying_time_min >= 0),
    plate_contact_frequency_hz FLOAT NOT NULL CHECK (plate_contact_frequency_hz > 0),
    throughput_rate_pecans_sec FLOAT NOT NULL CHECK (throughput_rate_pecans_sec > 0),
    crush_amount_in FLOAT NOT NULL CHECK (crush_amount_in >= 0),
    entry_exit_height_diff_in FLOAT NOT NULL,
    schedule_status TEXT NOT NULL DEFAULT 'pending schedule' CHECK (schedule_status IN ('pending schedule', 'scheduled', 'canceled', 'aborted')),
    results_status TEXT NOT NULL DEFAULT 'valid' CHECK (results_status IN ('valid', 'invalid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES public.user_profiles(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experiments_experiment_number ON public.experiments(experiment_number);
CREATE INDEX IF NOT EXISTS idx_experiments_created_by ON public.experiments(created_by);
CREATE INDEX IF NOT EXISTS idx_experiments_schedule_status ON public.experiments(schedule_status);
CREATE INDEX IF NOT EXISTS idx_experiments_results_status ON public.experiments(results_status);
CREATE INDEX IF NOT EXISTS idx_experiments_created_at ON public.experiments(created_at);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_experiments
    BEFORE UPDATE ON public.experiments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on experiments table
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has admin or conductor role
CREATE OR REPLACE FUNCTION public.can_manage_experiments()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles up
        JOIN public.user_roles ur ON up.id = ur.user_id
        JOIN public.roles r ON ur.role_id = r.id
        WHERE up.id = auth.uid()
        AND r.name IN ('admin', 'conductor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for experiments table

-- Policy: All authenticated users can view experiments
CREATE POLICY "experiments_select_policy" ON public.experiments
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only admin and conductor roles can insert experiments
CREATE POLICY "experiments_insert_policy" ON public.experiments
    FOR INSERT
    TO authenticated
    WITH CHECK (public.can_manage_experiments());

-- Policy: Only admin and conductor roles can update experiments
CREATE POLICY "experiments_update_policy" ON public.experiments
    FOR UPDATE
    TO authenticated
    USING (public.can_manage_experiments())
    WITH CHECK (public.can_manage_experiments());

-- Policy: Only admin role can delete experiments
CREATE POLICY "experiments_delete_policy" ON public.experiments
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_profiles up
            JOIN public.user_roles ur ON up.id = ur.user_id
            JOIN public.roles r ON ur.role_id = r.id
            WHERE up.id = auth.uid()
            AND r.name = 'admin'
        )
    );

-- Add comment to table for documentation
COMMENT ON TABLE public.experiments IS 'Stores experiment definitions for pecan processing with parameters and status tracking';
COMMENT ON COLUMN public.experiments.experiment_number IS 'User-defined unique experiment identifier';
COMMENT ON COLUMN public.experiments.reps_required IS 'Total number of repetitions needed for this experiment';
COMMENT ON COLUMN public.experiments.rep_number IS 'Current repetition number for this entry';
COMMENT ON COLUMN public.experiments.soaking_duration_hr IS 'Soaking process duration in hours';
COMMENT ON COLUMN public.experiments.air_drying_time_min IS 'Air drying duration in minutes';
COMMENT ON COLUMN public.experiments.plate_contact_frequency_hz IS 'JC Cracker machine plate contact frequency in Hz';
COMMENT ON COLUMN public.experiments.throughput_rate_pecans_sec IS 'Pecan processing rate in pecans per second';
COMMENT ON COLUMN public.experiments.crush_amount_in IS 'Crushing amount in thousandths of an inch';
COMMENT ON COLUMN public.experiments.entry_exit_height_diff_in IS 'Height difference between entry/exit points in inches (can be negative)';
COMMENT ON COLUMN public.experiments.schedule_status IS 'Current scheduling status of the experiment';
COMMENT ON COLUMN public.experiments.results_status IS 'Validity status of experiment results';
