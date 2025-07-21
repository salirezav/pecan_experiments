-- Seed data for testing experiment scheduling functionality

-- Insert some sample experiments for testing
INSERT INTO public.experiments (
    experiment_number,
    reps_required,
    soaking_duration_hr,
    air_drying_time_min,
    plate_contact_frequency_hz,
    throughput_rate_pecans_sec,
    crush_amount_in,
    entry_exit_height_diff_in,
    schedule_status,
    results_status,
    created_by
) VALUES 
(
    1001,
    5,
    2.5,
    30,
    50.0,
    2.5,
    0.005,
    1.2,
    'pending schedule',
    'valid',
    (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')
),
(
    1002,
    3,
    1.0,
    15,
    45.0,
    3.0,
    0.003,
    0.8,
    'pending schedule',
    'valid',
    (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')
),
(
    1003,
    4,
    3.0,
    45,
    55.0,
    2.0,
    0.007,
    1.5,
    'scheduled',
    'valid',
    (SELECT id FROM public.user_profiles WHERE email = 's.alireza.v@gmail.com')
);

-- Update one experiment to have a scheduled date for testing
UPDATE public.experiments 
SET scheduled_date = NOW() + INTERVAL '2 days'
WHERE experiment_number = 1003;
