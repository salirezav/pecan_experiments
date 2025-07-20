-- Multiple Roles Support Migration
-- Adds support for multiple roles per user and user status management

-- Add status column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled'));

-- Create user_roles junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES public.user_profiles(id),
    UNIQUE(user_id, role_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles table
-- Users can read their own role assignments, admins can read all
CREATE POLICY "Users can read own roles, admins can read all" ON public.user_roles
    FOR SELECT USING (
        user_id = auth.uid() OR public.is_admin()
    );

-- Only admins can insert role assignments
CREATE POLICY "Only admins can assign roles" ON public.user_roles
    FOR INSERT WITH CHECK (public.is_admin());

-- Only admins can update role assignments
CREATE POLICY "Only admins can update role assignments" ON public.user_roles
    FOR UPDATE USING (public.is_admin());

-- Only admins can delete role assignments
CREATE POLICY "Only admins can remove role assignments" ON public.user_roles
    FOR DELETE USING (public.is_admin());

-- Update the get_user_role function to return multiple roles
CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT r.name
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the is_admin function to work with multiple roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN 'admin' = ANY(public.get_user_roles());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN role_name = ANY(public.get_user_roles());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate existing single role assignments to multiple roles
CREATE OR REPLACE FUNCTION public.migrate_single_roles_to_multiple()
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Migrate existing role assignments
    FOR user_record IN 
        SELECT id, role_id 
        FROM public.user_profiles 
        WHERE role_id IS NOT NULL
    LOOP
        -- Insert into user_roles if not already exists
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (user_record.id, user_record.role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Migration completed: existing role assignments moved to user_roles table';
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT public.migrate_single_roles_to_multiple();

-- Drop the migration function as it's no longer needed
DROP FUNCTION public.migrate_single_roles_to_multiple();

-- Function to generate secure temporary password
CREATE OR REPLACE FUNCTION public.generate_temp_password()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..12 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user with roles (for admin use)
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
BEGIN
    -- Only admins can create users
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can create users';
    END IF;
    
    -- Validate that at least one role is provided
    IF array_length(role_names, 1) IS NULL OR array_length(role_names, 1) = 0 THEN
        RAISE EXCEPTION 'At least one role must be assigned to the user';
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
    
    -- Insert user profile
    INSERT INTO public.user_profiles (id, email, status)
    VALUES (new_user_id, user_email, 'active');
    
    -- Assign roles
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
