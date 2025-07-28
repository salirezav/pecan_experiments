-- Seed data for testing experiment repetitions functionality

-- Insert experiments from phase_2_experimental_run_sheet.csv
-- These are experiment blueprints/templates with their parameters
-- Using run_number from CSV as experiment_number in database
-- Note: Some run_numbers are duplicated in the CSV, so we'll only insert unique ones
INSERT INTO public.experiments (
    experiment_number,
    reps_required,
    soaking_duration_hr,
    air_drying_time_min,
    plate_contact_frequency_hz,
    throughput_rate_pecans_sec,
    crush_amount_in,
    entry_exit_height_diff_in,
    results_status,
    created_by
) VALUES
-- Unique experiments based on run_number from CSV
(0, 3, 34, 19, 53, 28, 0.05, -0.09, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(1, 3, 24, 27, 34, 29, 0.03, 0.01, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(2, 3, 38, 10, 60, 28, 0.06, -0.1, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(3, 3, 11, 36, 42, 13, 0.07, -0.07, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(4, 3, 13, 41, 41, 38, 0.05, 0.03, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(5, 3, 30, 33, 30, 36, 0.05, -0.04, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(6, 3, 10, 22, 37, 30, 0.06, 0.02, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(7, 3, 15, 30, 35, 32, 0.05, -0.07, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(8, 3, 27, 12, 55, 24, 0.04, 0.04, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(9, 3, 32, 26, 47, 26, 0.07, 0.03, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(10, 3, 26, 60, 44, 12, 0.08, -0.1, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(11, 3, 24, 59, 42, 25, 0.07, -0.05, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(12, 3, 28, 59, 37, 23, 0.06, -0.08, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(13, 3, 21, 59, 41, 21, 0.06, -0.09, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(14, 3, 22, 59, 45, 17, 0.07, -0.08, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(15, 3, 16, 60, 30, 24, 0.07, 0.02, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(16, 3, 20, 59, 41, 14, 0.07, 0.04, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(17, 3, 34, 60, 34, 29, 0.07, -0.09, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(18, 3, 18, 49, 38, 35, 0.07, -0.08, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
(19, 3, 11, 25, 56, 34, 0.06, -0.09, 'valid', (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com'));

-- Create repetitions for all experiments based on CSV data
-- Each experiment has 3 repetitions as specified in the CSV
INSERT INTO public.experiment_repetitions (
    experiment_id,
    repetition_number,
    schedule_status,
    scheduled_date,
    completion_status,
    created_by
) VALUES
-- Experiment 0 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 0), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 0), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 0), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 1 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 1), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 1), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 1), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 2 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 2), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 2), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 2), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 3 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 3), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 3), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 3), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 4 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 4), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 4), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 4), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 5 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 5), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 5), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 5), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 6 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 6), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 6), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 6), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 7 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 7), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 7), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 7), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 8 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 8), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 8), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 8), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 9 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 9), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 9), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 9), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 10 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 10), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 10), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 10), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 11 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 11), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 11), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 11), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 12 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 12), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 12), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 12), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 13 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 13), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 13), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 13), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 14 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 14), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 14), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 14), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 15 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 15), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 15), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 15), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 16 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 16), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 16), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 16), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 17 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 17), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 17), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 17), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 18 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 18), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 18), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 18), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
-- Experiment 19 repetitions
((SELECT id FROM public.experiments WHERE experiment_number = 19), 1, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 19), 2, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')),
((SELECT id FROM public.experiments WHERE experiment_number = 19), 3, 'pending schedule', NULL, false, (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com'));