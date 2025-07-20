-- Seed Admin User
-- Creates the initial admin user with specified credentials

-- Function to create admin user
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS VOID AS $$
DECLARE
    admin_user_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get admin role ID
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
    
    -- Check if admin user already exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 's.alireza.v@gmail.com'
    ) THEN
        -- Insert user into auth.users (this simulates user registration)
        -- Note: In production, this would be done through Supabase Auth API
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            uuid_generate_v4(),
            'authenticated',
            'authenticated',
            's.alireza.v@gmail.com',
            crypt('2517392', gen_salt('bf')), -- Hash the password
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
        
        -- Insert user profile
        INSERT INTO public.user_profiles (id, email, role_id)
        VALUES (admin_user_id, 's.alireza.v@gmail.com', admin_role_id);
        
        RAISE NOTICE 'Admin user created successfully with email: s.alireza.v@gmail.com';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create admin user
SELECT public.create_admin_user();

-- Drop the function as it's no longer needed
DROP FUNCTION public.create_admin_user();
