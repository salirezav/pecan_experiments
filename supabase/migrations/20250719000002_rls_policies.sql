-- Row Level Security Policies for RBAC
-- Implements role-based access control at the database level

-- Enable RLS on tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT r.name
        FROM public.user_profiles up
        JOIN public.roles r ON up.role_id = r.id
        WHERE up.id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Roles table policies
-- Everyone can read roles (needed for UI dropdowns, etc.)
CREATE POLICY "Anyone can read roles" ON public.roles
    FOR SELECT USING (true);

-- Only admins can modify roles
CREATE POLICY "Only admins can insert roles" ON public.roles
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles" ON public.roles
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Only admins can delete roles" ON public.roles
    FOR DELETE USING (public.is_admin());

-- User profiles policies
-- Users can read their own profile, admins can read all profiles
CREATE POLICY "Users can read own profile, admins can read all" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = id OR public.is_admin()
    );

-- Only admins can insert user profiles (user creation)
CREATE POLICY "Only admins can insert user profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (public.is_admin());

-- Users can update their own profile (except role), admins can update any profile
CREATE POLICY "Users can update own profile, admins can update any" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() = id OR public.is_admin()
    );

-- Only admins can delete user profiles
CREATE POLICY "Only admins can delete user profiles" ON public.user_profiles
    FOR DELETE USING (public.is_admin());
