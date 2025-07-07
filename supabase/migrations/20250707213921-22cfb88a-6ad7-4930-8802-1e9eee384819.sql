
-- PHASE 1: Create registration_logs table for comprehensive logging
CREATE TABLE IF NOT EXISTS public.registration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'ERROR', 'DUPLICATE', 'RETRY')),
    message TEXT NOT NULL,
    error_details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_registration_logs_user_id ON public.registration_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_logs_timestamp ON public.registration_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_registration_logs_status ON public.registration_logs(status);

-- Enable RLS for security
ALTER TABLE public.registration_logs ENABLE ROW LEVEL SECURITY;

-- Allow superadmins to view all logs
CREATE POLICY "Superadmins can view all registration logs"
ON public.registration_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'superadmin'::user_role
    )
);

-- Allow system to insert logs
CREATE POLICY "System can insert registration logs"
ON public.registration_logs
FOR INSERT
WITH CHECK (true);

-- PHASE 2: Drop existing trigger and function to rebuild from scratch
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- PHASE 2: Create new robust handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_full_name TEXT;
    v_email TEXT;
    v_user_id UUID;
    v_error_message TEXT;
    v_error_details JSONB DEFAULT '{}';
    v_retry_count INTEGER DEFAULT 0;
    v_max_retries INTEGER DEFAULT 3;
BEGIN
    -- Extract key variables
    v_user_id := NEW.id;
    v_email := NEW.email;
    
    -- Log registration attempt start
    INSERT INTO public.registration_logs (user_id, status, message, metadata)
    VALUES (v_user_id, 'RETRY', 'Registration attempt started', 
            jsonb_build_object(
                'email', v_email,
                'attempt', 1,
                'raw_metadata', NEW.raw_user_meta_data
            ));
    
    -- Extract full name from metadata with fallbacks
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'display_name',
        split_part(v_email, '@', 1), -- Use email username as fallback
        'Usuario' -- Final fallback
    );
    
    -- Retry logic for profile insertion
    WHILE v_retry_count < v_max_retries LOOP
        BEGIN
            -- Attempt to insert profile
            INSERT INTO public.profiles (
                id, 
                email, 
                full_name, 
                role, 
                is_active,
                created_at,
                updated_at
            ) VALUES (
                v_user_id,
                v_email,
                v_full_name,
                'admin'::user_role,  -- Always admin by default
                true,
                now(),
                now()
            );
            
            -- Success - log and exit
            INSERT INTO public.registration_logs (user_id, status, message, metadata)
            VALUES (v_user_id, 'SUCCESS', 'Profile created successfully', 
                    jsonb_build_object(
                        'email', v_email,
                        'full_name', v_full_name,
                        'role', 'admin',
                        'retry_count', v_retry_count
                    ));
            
            RAISE LOG 'SUCCESS: Profile created for user % (email: %, name: %)', 
                     v_user_id, v_email, v_full_name;
            
            RETURN NEW;
            
        EXCEPTION
            WHEN unique_violation THEN
                -- Profile already exists - check if it's valid
                DECLARE
                    existing_profile RECORD;
                BEGIN
                    SELECT * INTO existing_profile 
                    FROM public.profiles 
                    WHERE id = v_user_id;
                    
                    IF FOUND THEN
                        -- Profile exists and is valid
                        INSERT INTO public.registration_logs (user_id, status, message, metadata)
                        VALUES (v_user_id, 'DUPLICATE', 'Profile already exists', 
                                jsonb_build_object(
                                    'existing_role', existing_profile.role,
                                    'existing_email', existing_profile.email,
                                    'retry_count', v_retry_count
                                ));
                        
                        RAISE LOG 'DUPLICATE: Profile already exists for user % with role %', 
                                 v_user_id, existing_profile.role;
                        
                        RETURN NEW;
                    END IF;
                END;
                
            WHEN OTHERS THEN
                -- Capture error details
                GET STACKED DIAGNOSTICS 
                    v_error_message = MESSAGE_TEXT;
                
                v_error_details := jsonb_build_object(
                    'sqlstate', SQLSTATE,
                    'message', v_error_message,
                    'retry_count', v_retry_count,
                    'context', PG_EXCEPTION_CONTEXT
                );
                
                v_retry_count := v_retry_count + 1;
                
                -- Log retry attempt
                INSERT INTO public.registration_logs (user_id, status, message, error_details, metadata)
                VALUES (v_user_id, 'RETRY', 
                        format('Registration retry %s of %s: %s', v_retry_count, v_max_retries, v_error_message),
                        v_error_details,
                        jsonb_build_object('attempt', v_retry_count + 1));
                
                -- If max retries reached, fail with detailed error
                IF v_retry_count >= v_max_retries THEN
                    -- Log final failure
                    INSERT INTO public.registration_logs (user_id, status, message, error_details)
                    VALUES (v_user_id, 'ERROR', 
                            format('Registration failed after %s attempts: %s', v_max_retries, v_error_message),
                            v_error_details);
                    
                    RAISE LOG 'ERROR: Failed to create profile for user % after % attempts: %', 
                             v_user_id, v_max_retries, v_error_message;
                    
                    -- Critical failure - halt auth process
                    RAISE EXCEPTION 'REGISTRATION_FAILED: Unable to create user profile after % attempts. Error: %', 
                                   v_max_retries, v_error_message;
                END IF;
                
                -- Wait briefly before retry (simulated)
                PERFORM pg_sleep(0.1);
        END;
    END LOOP;
    
    -- This should never be reached, but safety net
    RAISE EXCEPTION 'REGISTRATION_FAILED: Unexpected exit from retry loop for user %', v_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Final catch-all error handler
        GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
        
        -- Log catastrophic failure
        INSERT INTO public.registration_logs (user_id, status, message, error_details)
        VALUES (v_user_id, 'ERROR', 
                format('Catastrophic registration failure: %s', v_error_message),
                jsonb_build_object(
                    'sqlstate', SQLSTATE,
                    'context', PG_EXCEPTION_CONTEXT,
                    'function', 'handle_new_user'
                ));
        
        RAISE LOG 'CATASTROPHIC ERROR in handle_new_user for user %: %', v_user_id, v_error_message;
        
        -- Re-raise to halt auth process
        RAISE;
END;
$$;

-- PHASE 2: Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- PHASE 4: Create helper functions for monitoring registration success rates
CREATE OR REPLACE FUNCTION public.get_registration_stats(days_back INTEGER DEFAULT 7)
RETURNS TABLE(
    total_attempts BIGINT,
    successful_registrations BIGINT,
    failed_registrations BIGINT,
    duplicate_attempts BIGINT,
    success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE status IN ('SUCCESS', 'DUPLICATE')) as success_count,
            COUNT(*) FILTER (WHERE status = 'ERROR') as error_count,
            COUNT(*) FILTER (WHERE status = 'DUPLICATE') as duplicate_count,
            COUNT(*) as total_count
        FROM public.registration_logs 
        WHERE timestamp >= now() - (days_back || ' days')::interval
        AND status IN ('SUCCESS', 'ERROR', 'DUPLICATE')  -- Exclude RETRY entries
    )
    SELECT 
        total_count,
        success_count - duplicate_count as successful_registrations,
        error_count,
        duplicate_count,
        CASE 
            WHEN total_count > 0 THEN ROUND((success_count::numeric / total_count::numeric) * 100, 2)
            ELSE 0
        END as success_rate
    FROM stats;
END;
$$;

-- PHASE 4: Create function to get recent registration failures for debugging
CREATE OR REPLACE FUNCTION public.get_recent_registration_failures(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    user_id UUID,
    message TEXT,
    error_details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow superadmins to view failure details
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'superadmin'::user_role
    ) THEN
        RAISE EXCEPTION 'Access denied: Only superadmins can view registration failures';
    END IF;
    
    RETURN QUERY
    SELECT 
        rl.user_id,
        rl.message,
        rl.error_details,
        rl.timestamp
    FROM public.registration_logs rl
    WHERE rl.status = 'ERROR'
    ORDER BY rl.timestamp DESC
    LIMIT limit_count;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Robust user registration handler with comprehensive logging, retry logic, and error handling. Always assigns admin role by default.';
COMMENT ON TABLE public.registration_logs IS 'Comprehensive logging for user registration attempts, successes, and failures.';
