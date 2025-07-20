-- Fix role_id constraint in user_profiles table
-- Make role_id nullable since we now use user_roles junction table

-- Remove the NOT NULL constraint from role_id column
ALTER TABLE public.user_profiles 
ALTER COLUMN role_id DROP NOT NULL;

-- Update the RLS helper functions to work with the new multiple roles system
-- Replace the old get_user_role function that relied on single role_id
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    -- Return the first role found (for backward compatibility)
    -- In practice, use get_user_roles() for multiple roles
    RETURN (
        SELECT r.name
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_admin function to use the new multiple roles system
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(role_names TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = ANY(role_names)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the create_user_with_roles function to handle potential errors better
CREATE OR REPLACE FUNCTION public.create_user_with_roles(
    user_email TEXT,
    role_names TEXT[],
    temp_password TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    role_record RECORD;
    generated_password TEXT;
    result JSON;
    role_count INTEGER;
BEGIN
    -- Only admins can create users
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can create users';
    END IF;
    
    -- Validate that at least one role is provided
    IF array_length(role_names, 1) IS NULL OR array_length(role_names, 1) = 0 THEN
        RAISE EXCEPTION 'At least one role must be assigned to the user';
    END IF;
    
    -- Validate that all provided roles exist
    SELECT COUNT(*) INTO role_count
    FROM public.roles 
    WHERE name = ANY(role_names);
    
    IF role_count != array_length(role_names, 1) THEN
        RAISE EXCEPTION 'One or more specified roles do not exist';
    END IF;
    
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        RAISE EXCEPTION 'User with email % already exists', user_email;
    END IF;
    
    -- Generate password if not provided
    IF temp_password IS NULL THEN
        generated_password := public.generate_temp_password();
    ELSE
        generated_password := temp_password;
    END IF;
    
    -- Generate new user ID
    new_user_id := uuid_generate_v4();
    
    -- Insert into auth.users (simulating user creation)
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
        new_user_id,
        'authenticated',
        'authenticated',
        user_email,
        crypt(generated_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    
    -- Insert user profile (without role_id since it's now nullable)
    INSERT INTO public.user_profiles (id, email, status)
    VALUES (new_user_id, user_email, 'active');
    
    -- Assign roles through the user_roles junction table
    FOR role_record IN 
        SELECT id FROM public.roles WHERE name = ANY(role_names)
    LOOP
        INSERT INTO public.user_roles (user_id, role_id, assigned_by)
        VALUES (new_user_id, role_record.id, auth.uid());
    END LOOP;
    
    -- Return result
    result := json_build_object(
        'user_id', new_user_id,
        'email', user_email,
        'temp_password', generated_password,
        'roles', role_names,
        'status', 'active'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Clean up any partial inserts
        DELETE FROM public.user_roles WHERE user_id = new_user_id;
        DELETE FROM public.user_profiles WHERE id = new_user_id;
        DELETE FROM auth.users WHERE id = new_user_id;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
