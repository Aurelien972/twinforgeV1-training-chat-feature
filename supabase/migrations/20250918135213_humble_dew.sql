/*
  # Debug User Profile RLS Policies

  1. Check Current Policies
    - List all policies on user_profile table
    - Verify policy conditions and roles
  
  2. Test Policy Effectiveness
    - Ensure users can read their own data after updates
    - Verify upsert operations work correctly
*/

-- Check current policies on user_profile table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_profile' 
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profile';

-- Test basic SELECT policy (should work for authenticated users)
-- This will be executed as the authenticated user
-- SELECT * FROM user_profile WHERE user_id = auth.uid();

-- Check if there are any triggers that might interfere
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_profile';

-- Verify the table structure matches expectations
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profile' 
  AND column_name IN (
    'user_id', 'display_name', 'phone_number', 'activity_level', 
    'objective', 'job_category', 'updated_at'
  )
ORDER BY ordinal_position;