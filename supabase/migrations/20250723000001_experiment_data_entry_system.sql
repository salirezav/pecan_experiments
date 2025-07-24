-- Experiment Data Entry System Migration
-- Creates tables for collaborative data entry with draft functionality and phase-based organization

-- Create experiment_data_entries table for main data entry records
CREATE TABLE IF NOT EXISTS public.experiment_data_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
    entry_name TEXT, -- Optional name for the entry (e.g., "Morning Run", "Batch A")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE, -- When status changed to 'submitted'
    
    -- Constraint: Only one submitted entry per user per experiment
    CONSTRAINT unique_submitted_entry_per_user_experiment 
        EXCLUDE (experiment_id WITH =, user_id WITH =) 
        WHERE (status = 'submitted')
);

-- Create experiment_phase_data table for phase-specific measurements
CREATE TABLE IF NOT EXISTS public.experiment_phase_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_entry_id UUID NOT NULL REFERENCES public.experiment_data_entries(id) ON DELETE CASCADE,
    phase_name TEXT NOT NULL CHECK (phase_name IN ('pre-soaking', 'air-drying', 'cracking', 'shelling')),
    
    -- Pre-soaking phase data
    batch_initial_weight_lbs FLOAT CHECK (batch_initial_weight_lbs >= 0),
    initial_shell_moisture_pct FLOAT CHECK (initial_shell_moisture_pct >= 0 AND initial_shell_moisture_pct <= 100),
    initial_kernel_moisture_pct FLOAT CHECK (initial_kernel_moisture_pct >= 0 AND initial_kernel_moisture_pct <= 100),
    soaking_start_time TIMESTAMP WITH TIME ZONE,
    
    -- Air-drying phase data
    airdrying_start_time TIMESTAMP WITH TIME ZONE,
    post_soak_weight_lbs FLOAT CHECK (post_soak_weight_lbs >= 0),
    post_soak_kernel_moisture_pct FLOAT CHECK (post_soak_kernel_moisture_pct >= 0 AND post_soak_kernel_moisture_pct <= 100),
    post_soak_shell_moisture_pct FLOAT CHECK (post_soak_shell_moisture_pct >= 0 AND post_soak_shell_moisture_pct <= 100),
    avg_pecan_diameter_in FLOAT CHECK (avg_pecan_diameter_in >= 0),
    
    -- Cracking phase data
    cracking_start_time TIMESTAMP WITH TIME ZONE,
    
    -- Shelling phase data
    shelling_start_time TIMESTAMP WITH TIME ZONE,
    bin_1_weight_lbs FLOAT CHECK (bin_1_weight_lbs >= 0),
    bin_2_weight_lbs FLOAT CHECK (bin_2_weight_lbs >= 0),
    bin_3_weight_lbs FLOAT CHECK (bin_3_weight_lbs >= 0),
    discharge_bin_weight_lbs FLOAT CHECK (discharge_bin_weight_lbs >= 0),
    bin_1_full_yield_oz FLOAT CHECK (bin_1_full_yield_oz >= 0),
    bin_2_full_yield_oz FLOAT CHECK (bin_2_full_yield_oz >= 0),
    bin_3_full_yield_oz FLOAT CHECK (bin_3_full_yield_oz >= 0),
    bin_1_half_yield_oz FLOAT CHECK (bin_1_half_yield_oz >= 0),
    bin_2_half_yield_oz FLOAT CHECK (bin_2_half_yield_oz >= 0),
    bin_3_half_yield_oz FLOAT CHECK (bin_3_half_yield_oz >= 0),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: One record per phase per data entry
    CONSTRAINT unique_phase_per_data_entry UNIQUE (data_entry_id, phase_name)
);

-- Create pecan_diameter_measurements table for individual diameter measurements
CREATE TABLE IF NOT EXISTS public.pecan_diameter_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_data_id UUID NOT NULL REFERENCES public.experiment_phase_data(id) ON DELETE CASCADE,
    measurement_number INTEGER NOT NULL CHECK (measurement_number >= 1 AND measurement_number <= 10),
    diameter_in FLOAT NOT NULL CHECK (diameter_in >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Unique measurement number per phase data
    CONSTRAINT unique_measurement_per_phase UNIQUE (phase_data_id, measurement_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experiment_data_entries_experiment_id ON public.experiment_data_entries(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_data_entries_user_id ON public.experiment_data_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_data_entries_status ON public.experiment_data_entries(status);
CREATE INDEX IF NOT EXISTS idx_experiment_data_entries_created_at ON public.experiment_data_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_experiment_phase_data_entry_id ON public.experiment_phase_data(data_entry_id);
CREATE INDEX IF NOT EXISTS idx_experiment_phase_data_phase_name ON public.experiment_phase_data(phase_name);

CREATE INDEX IF NOT EXISTS idx_pecan_diameter_measurements_phase_data_id ON public.pecan_diameter_measurements(phase_data_id);

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_experiment_data_entries
    BEFORE UPDATE ON public.experiment_data_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_experiment_phase_data
    BEFORE UPDATE ON public.experiment_phase_data
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to set submitted_at timestamp
CREATE OR REPLACE FUNCTION public.handle_data_entry_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Set submitted_at when status changes to 'submitted'
    IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
        NEW.submitted_at = NOW();
    END IF;
    
    -- Clear submitted_at when status changes from 'submitted' to 'draft'
    IF NEW.status = 'draft' AND OLD.status = 'submitted' THEN
        NEW.submitted_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_submitted_at_experiment_data_entries
    BEFORE UPDATE ON public.experiment_data_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_data_entry_submission();

-- Enable RLS on all tables
ALTER TABLE public.experiment_data_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_phase_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pecan_diameter_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experiment_data_entries table

-- Policy: All authenticated users can view all data entries
CREATE POLICY "experiment_data_entries_select_policy" ON public.experiment_data_entries
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: All authenticated users can insert data entries
CREATE POLICY "experiment_data_entries_insert_policy" ON public.experiment_data_entries
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own data entries
CREATE POLICY "experiment_data_entries_update_policy" ON public.experiment_data_entries
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own draft entries
CREATE POLICY "experiment_data_entries_delete_policy" ON public.experiment_data_entries
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() AND status = 'draft');

-- RLS Policies for experiment_phase_data table

-- Policy: All authenticated users can view phase data
CREATE POLICY "experiment_phase_data_select_policy" ON public.experiment_phase_data
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Users can insert phase data for their own data entries
CREATE POLICY "experiment_phase_data_insert_policy" ON public.experiment_phase_data
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.experiment_data_entries ede
            WHERE ede.id = data_entry_id AND ede.user_id = auth.uid()
        )
    );

-- Policy: Users can update phase data for their own data entries
CREATE POLICY "experiment_phase_data_update_policy" ON public.experiment_phase_data
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.experiment_data_entries ede
            WHERE ede.id = data_entry_id AND ede.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.experiment_data_entries ede
            WHERE ede.id = data_entry_id AND ede.user_id = auth.uid()
        )
    );

-- Policy: Users can delete phase data for their own draft entries
CREATE POLICY "experiment_phase_data_delete_policy" ON public.experiment_phase_data
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.experiment_data_entries ede
            WHERE ede.id = data_entry_id AND ede.user_id = auth.uid() AND ede.status = 'draft'
        )
    );

-- RLS Policies for pecan_diameter_measurements table

-- Policy: All authenticated users can view diameter measurements
CREATE POLICY "pecan_diameter_measurements_select_policy" ON public.pecan_diameter_measurements
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Users can insert measurements for their own phase data
CREATE POLICY "pecan_diameter_measurements_insert_policy" ON public.pecan_diameter_measurements
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.experiment_phase_data epd
            JOIN public.experiment_data_entries ede ON epd.data_entry_id = ede.id
            WHERE epd.id = phase_data_id AND ede.user_id = auth.uid()
        )
    );

-- Policy: Users can update measurements for their own phase data
CREATE POLICY "pecan_diameter_measurements_update_policy" ON public.pecan_diameter_measurements
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.experiment_phase_data epd
            JOIN public.experiment_data_entries ede ON epd.data_entry_id = ede.id
            WHERE epd.id = phase_data_id AND ede.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.experiment_phase_data epd
            JOIN public.experiment_data_entries ede ON epd.data_entry_id = ede.id
            WHERE epd.id = phase_data_id AND ede.user_id = auth.uid()
        )
    );

-- Policy: Users can delete measurements for their own draft entries
CREATE POLICY "pecan_diameter_measurements_delete_policy" ON public.pecan_diameter_measurements
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.experiment_phase_data epd
            JOIN public.experiment_data_entries ede ON epd.data_entry_id = ede.id
            WHERE epd.id = phase_data_id AND ede.user_id = auth.uid() AND ede.status = 'draft'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.experiment_data_entries IS 'Main data entry records for experiments with draft/submitted status tracking';
COMMENT ON TABLE public.experiment_phase_data IS 'Phase-specific measurement data for experiments';
COMMENT ON TABLE public.pecan_diameter_measurements IS 'Individual pecan diameter measurements (up to 10 per phase)';

COMMENT ON COLUMN public.experiment_data_entries.status IS 'Entry status: draft (editable) or submitted (final)';
COMMENT ON COLUMN public.experiment_data_entries.entry_name IS 'Optional descriptive name for the data entry';
COMMENT ON COLUMN public.experiment_data_entries.submitted_at IS 'Timestamp when entry was submitted (status changed to submitted)';

COMMENT ON COLUMN public.experiment_phase_data.phase_name IS 'Experiment phase: pre-soaking, air-drying, cracking, or shelling';
COMMENT ON COLUMN public.experiment_phase_data.avg_pecan_diameter_in IS 'Average of up to 10 individual diameter measurements';

COMMENT ON COLUMN public.pecan_diameter_measurements.measurement_number IS 'Measurement sequence number (1-10)';
COMMENT ON COLUMN public.pecan_diameter_measurements.diameter_in IS 'Individual pecan diameter measurement in inches';
