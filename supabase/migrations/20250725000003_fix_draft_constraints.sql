-- Fix Draft Constraints Migration
-- Allows multiple drafts per phase while preventing multiple submitted drafts

-- Drop the overly restrictive constraint
ALTER TABLE public.experiment_phase_drafts 
DROP CONSTRAINT IF EXISTS unique_user_phase_repetition_draft;

-- Add a proper constraint that only prevents multiple submitted drafts
-- Users can have multiple drafts in 'draft' or 'withdrawn' status, but only one 'submitted' per phase
ALTER TABLE public.experiment_phase_drafts 
ADD CONSTRAINT unique_submitted_draft_per_user_phase 
EXCLUDE (user_id WITH =, repetition_id WITH =, phase_name WITH =) 
WHERE (status = 'submitted');

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT unique_submitted_draft_per_user_phase ON public.experiment_phase_drafts 
IS 'Ensures only one submitted draft per user per phase per repetition, but allows multiple draft/withdrawn entries';
