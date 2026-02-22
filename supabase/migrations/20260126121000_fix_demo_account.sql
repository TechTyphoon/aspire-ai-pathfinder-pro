-- Temporarily disable email confirmation for demo functionality
-- This can be re-enabled later via Supabase dashboard

-- Note: This SQL will attempt to modify auth settings
-- In practice, auth settings are usually managed via Supabase dashboard
-- But we'll create a user with confirmed email instead

-- Create a confirmed demo user if it doesn't exist
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Check if demo user exists
    SELECT id INTO demo_user_id 
    FROM auth.users 
    WHERE email = 'demo@aspiroai.com';
    
    IF demo_user_id IS NULL THEN
        -- Insert demo user with confirmed email
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::UUID,
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'demo@aspiroai.com',
            crypt('demo123456', gen_salt('bf')),
            NOW(),
            NULL,
            NULL,
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Demo User"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
    ELSE
        -- Update existing demo user to be confirmed
        UPDATE auth.users 
        SET 
            email_confirmed_at = NOW(),
            encrypted_password = crypt('demo123456', gen_salt('bf')),
            updated_at = NOW()
        WHERE email = 'demo@aspiroai.com';
    END IF;
END $$;