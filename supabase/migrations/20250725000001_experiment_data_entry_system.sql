-- Phase-Specific Draft System Migration
-- Creates tables for the new phase-specific draft management system

-- Create experiment_phase_drafts table for phase-specific draft management
CREATE TABLE IF NOT EXISTS public.experiment_phase_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    repetition_id UUID NOT NULL REFERENCES public.experiment_repetitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    phase_name TEXT NOT NULL CHECK (phase_name IN ('pre-soaking', 'air-drying', 'cracking', 'shelling')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'withdrawn')),
    draft_name TEXT, -- Optional name for the draft (e.g., "Morning Run", "Batch A")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE, -- When status changed to 'submitted'
    withdrawn_at TIMESTAMP WITH TIME ZONE -- When status changed to 'withdrawn'
);

-- Add repetition locking support
ALTER TABLE public.experiment_repetitions
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES public.user_profiles(id);

-- Create experiment_phase_data table for phase-specific measurements
CREATE TABLE IF NOT EXISTS public.experiment_phase_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_draft_id UUID NOT NULL REFERENCES public.experiment_phase_drafts(id) ON DELETE CASCADE,
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
    
    -- Constraint: One record per phase draft
    CONSTRAINT unique_phase_per_draft UNIQUE (phase_draft_id, phase_name)
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
CREATE INDEX IF NOT EXISTS idx_experiment_phase_drafts_experiment_id ON public.experiment_phase_drafts(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_phase_drafts_repetition_id ON public.experiment_phase_drafts(repetition_id);
CREATE INDEX IF NOT EXISTS idx_experiment_phase_drafts_user_id ON public.experiment_phase_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_phase_drafts_phase_name ON public.experiment_phase_drafts(phase_name);
CREATE INDEX IF NOT EXISTS idx_experiment_phase_drafts_status ON public.experiment_phase_drafts(status);
CREATE INDEX IF NOT EXISTS idx_experiment_repetitions_is_locked ON public.experiment_repetitions(is_locked);

CREATE INDEX IF NOT EXISTS idx_experiment_phase_data_draft_id ON public.experiment_phase_data(phase_draft_id);
CREATE INDEX IF NOT EXISTS idx_experiment_phase_data_phase_name ON public.experiment_phase_data(phase_name);

CREATE INDEX IF NOT EXISTS idx_pecan_diameter_measurements_phase_data_id ON public.pecan_diameter_measurements(phase_data_id);

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_experiment_phase_drafts
    BEFORE UPDATE ON public.experiment_phase_drafts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_experiment_phase_data
    BEFORE UPDATE ON public.experiment_phase_data
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to set submitted_at and withdrawn_at timestamps for phase drafts
CREATE OR REPLACE FUNCTION public.handle_phase_draft_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Set submitted_at when status changes to 'submitted'
    IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
        NEW.submitted_at = NOW();
        NEW.withdrawn_at = NULL;
    END IF;

    -- Set withdrawn_at when status changes to 'withdrawn'
    IF NEW.status = 'withdrawn' AND OLD.status = 'submitted' THEN
        NEW.withdrawn_at = NOW();
    END IF;

    -- Clear timestamps when status changes back to 'draft'
    IF NEW.status = 'draft' AND OLD.status IN ('submitted', 'withdrawn') THEN
        NEW.submitted_at = NULL;
        NEW.withdrawn_at = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamps_experiment_phase_drafts
    BEFORE UPDATE ON public.experiment_phase_drafts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_phase_draft_status_change();

-- Enable RLS on all tables
ALTER TABLE public.experiment_phase_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_phase_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pecan_diameter_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experiment_phase_drafts table

-- Policy: All authenticated users can view all phase drafts
CREATE POLICY "experiment_phase_drafts_select_policy" ON public.experiment_phase_drafts
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: All authenticated users can insert phase drafts
CREATE POLICY "experiment_phase_drafts_insert_policy" ON public.experiment_phase_drafts
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own phase drafts if repetition is not locked, admins can update any
CREATE POLICY "experiment_phase_drafts_update_policy" ON public.experiment_phase_drafts
    FOR UPDATE
    TO authenticated
    USING (
        (user_id = auth.uid() AND NOT EXISTS (
            SELECT 1 FROM public.experiment_repetitions
            WHERE id = repetition_id AND is_locked = true
        )) OR public.is_admin()
    )
    WITH CHECK (
        (user_id = auth.uid() AND NOT EXISTS (
            SELECT 1 FROM public.experiment_repetitions
            WHERE id = repetition_id AND is_locked = true
        )) OR public.is_admin()
    );

-- Policy: Users can delete their own draft phase drafts if repetition is not locked, admins can delete any
CREATE POLICY "experiment_phase_drafts_delete_policy" ON public.experiment_phase_drafts
    FOR DELETE
    TO authenticated
    USING (
        (user_id = auth.uid() AND status = 'draft' AND NOT EXISTS (
            SELECT 1 FROM public.experiment_repetitions
            WHERE id = repetition_id AND is_locked = true
        )) OR public.is_admin()
    );

-- RLS Policies for experiment_phase_data table

-- Policy: All authenticated users can view phase data
CREATE POLICY "experiment_phase_data_select_policy" ON public.experiment_phase_data
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Users can insert phase data for their own phase drafts
CREATE POLICY "experiment_phase_data_insert_policy" ON public.experiment_phase_data
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.experiment_phase_drafts epd
            WHERE epd.id = phase_draft_id AND epd.user_id = auth.uid()
        )
    );

-- Policy: Users can update phase data for their own phase drafts
CREATE POLICY "experiment_phase_data_update_policy" ON public.experiment_phase_data
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.experiment_phase_drafts epd
            WHERE epd.id = phase_draft_id AND epd.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.experiment_phase_drafts epd
            WHERE epd.id = phase_draft_id AND epd.user_id = auth.uid()
        )
    );

-- Policy: Users can delete phase data for their own draft phase drafts
CREATE POLICY "experiment_phase_data_delete_policy" ON public.experiment_phase_data
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.experiment_phase_drafts epd
            WHERE epd.id = phase_draft_id AND epd.user_id = auth.uid() AND epd.status = 'draft'
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
            JOIN public.experiment_phase_drafts epdr ON epd.phase_draft_id = epdr.id
            WHERE epd.id = phase_data_id AND epdr.user_id = auth.uid()
        )
    );

-- Policy: Users can update measurements for their own phase data
CREATE POLICY "pecan_diameter_measurements_update_policy" ON public.pecan_diameter_measurements
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.experiment_phase_data epd
            JOIN public.experiment_phase_drafts epdr ON epd.phase_draft_id = epdr.id
            WHERE epd.id = phase_data_id AND epdr.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.experiment_phase_data epd
            JOIN public.experiment_phase_drafts epdr ON epd.phase_draft_id = epdr.id
            WHERE epd.id = phase_data_id AND epdr.user_id = auth.uid()
        )
    );

-- Policy: Users can delete measurements for their own draft phase drafts
CREATE POLICY "pecan_diameter_measurements_delete_policy" ON public.pecan_diameter_measurements
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.experiment_phase_data epd
            JOIN public.experiment_phase_drafts epdr ON epd.phase_draft_id = epdr.id
            WHERE epd.id = phase_data_id AND epdr.user_id = auth.uid() AND epdr.status = 'draft'
        )
    );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experiment_phase_drafts_repetition_id ON public.experiment_phase_drafts(repetition_id);
CREATE INDEX IF NOT EXISTS idx_experiment_phase_drafts_user_id ON public.experiment_phase_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_phase_drafts_phase_name ON public.experiment_phase_drafts(phase_name);
CREATE INDEX IF NOT EXISTS idx_experiment_phase_drafts_status ON public.experiment_phase_drafts(status);
CREATE INDEX IF NOT EXISTS idx_experiment_repetitions_is_locked ON public.experiment_repetitions(is_locked);

-- Add comments for documentation
COMMENT ON TABLE public.experiment_phase_drafts IS 'Phase-specific draft records for experiment data entry with status tracking';
COMMENT ON TABLE public.experiment_phase_data IS 'Phase-specific measurement data for experiments';
COMMENT ON TABLE public.pecan_diameter_measurements IS 'Individual pecan diameter measurements (up to 10 per phase)';

COMMENT ON COLUMN public.experiment_phase_drafts.status IS 'Draft status: draft (editable), submitted (final), or withdrawn (reverted from submitted)';
COMMENT ON COLUMN public.experiment_phase_drafts.draft_name IS 'Optional descriptive name for the draft';
COMMENT ON COLUMN public.experiment_phase_drafts.submitted_at IS 'Timestamp when draft was submitted (status changed to submitted)';
COMMENT ON COLUMN public.experiment_phase_drafts.withdrawn_at IS 'Timestamp when draft was withdrawn (status changed from submitted to withdrawn)';

COMMENT ON COLUMN public.experiment_repetitions.is_locked IS 'Admin lock to prevent draft modifications and withdrawals';
COMMENT ON COLUMN public.experiment_repetitions.locked_at IS 'Timestamp when repetition was locked';
COMMENT ON COLUMN public.experiment_repetitions.locked_by IS 'User who locked the repetition';

COMMENT ON COLUMN public.experiment_phase_data.phase_name IS 'Experiment phase: pre-soaking, air-drying, cracking, or shelling';
COMMENT ON COLUMN public.experiment_phase_data.avg_pecan_diameter_in IS 'Average of up to 10 individual diameter measurements';

COMMENT ON COLUMN public.pecan_diameter_measurements.measurement_number IS 'Measurement sequence number (1-10)';
COMMENT ON COLUMN public.pecan_diameter_measurements.diameter_in IS 'Individual pecan diameter measurement in inches';

-- Add unique constraint to prevent multiple drafts of same phase by same user for same repetition
ALTER TABLE public.experiment_phase_drafts
ADD CONSTRAINT unique_user_phase_repetition_draft
UNIQUE (user_id, repetition_id, phase_name, status)
DEFERRABLE INITIALLY DEFERRED;

-- Add function to prevent withdrawal of submitted drafts when repetition is locked
CREATE OR REPLACE FUNCTION public.check_repetition_lock_before_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if repetition is locked when trying to withdraw a submitted draft
    IF NEW.status = 'withdrawn' AND OLD.status = 'submitted' THEN
        IF EXISTS (
            SELECT 1 FROM public.experiment_repetitions
            WHERE id = NEW.repetition_id AND is_locked = true
        ) THEN
            RAISE EXCEPTION 'Cannot withdraw submitted draft: repetition is locked by admin';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_lock_before_withdrawal
    BEFORE UPDATE ON public.experiment_phase_drafts
    FOR EACH ROW
    EXECUTE FUNCTION public.check_repetition_lock_before_withdrawal();
