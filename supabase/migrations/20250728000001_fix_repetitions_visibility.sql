-- Fix experiment repetitions visibility for all users
-- This migration updates the RLS policy to allow all authenticated users to view all experiment repetitions
-- Previously, users could only see repetitions for experiments they created

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view experiment repetitions" ON public.experiment_repetitions;

-- Create new policy that allows all authenticated users to view all repetitions
CREATE POLICY "Users can view experiment repetitions" ON public.experiment_repetitions
    FOR SELECT 
    TO authenticated
    USING (true);
