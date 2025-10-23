-- =====================================================
-- INSERT ALL WEARABLE DEVICES FOR TESTING
-- =====================================================
--
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- You can find your user ID in the Supabase dashboard under Authentication
--
-- Example: 'd8ec065f-93f3-4806-9190-5c4c461200bb'
--
-- This script inserts 4 wearable devices:
-- 1. Apple Watch Series 8 (Connected)
-- 2. Apple Health Test Simulation (Disconnected)
-- 3. Google Fit sur Pixel 7 (Connected)
-- 4. Google Fit Test Simulation (Disconnected)
-- 5. Strava Test Simulation (Disconnected)
-- =====================================================

-- Set your user ID here
\set user_id 'YOUR_USER_ID_HERE'

-- =====================================================
-- APPLE HEALTH DEVICES
-- =====================================================

-- Apple Watch Series 8 (Connected)
INSERT INTO connected_devices (
  user_id,
  provider,
  provider_user_id,
  display_name,
  device_type,
  status,
  scopes,
  last_sync_at,
  metadata,
  connected_at,
  created_at,
  updated_at
) VALUES (
  :'user_id',
  'apple_health',
  'apple-health-user-aw8-12345',
  'Apple Watch Series 8',
  'smartwatch',
  'connected',
  ARRAY['health_read'],
  NOW() - INTERVAL '2 hours',
  jsonb_build_object(
    'device_model', 'Apple Watch Series 8',
    'os_version', 'watchOS 10.5',
    'paired_iphone', 'iPhone 14 Pro',
    'watch_size', '45mm',
    'real_device', true
  ),
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '2 hours'
) ON CONFLICT (user_id, provider, provider_user_id) DO UPDATE SET
  last_sync_at = NOW() - INTERVAL '2 hours',
  updated_at = NOW() - INTERVAL '2 hours',
  status = 'connected',
  display_name = EXCLUDED.display_name,
  metadata = EXCLUDED.metadata;

-- Apple Health Test Simulation (Disconnected)
INSERT INTO connected_devices (
  user_id,
  provider,
  provider_user_id,
  display_name,
  device_type,
  status,
  scopes,
  last_sync_at,
  metadata,
  connected_at,
  created_at,
  updated_at
) VALUES (
  :'user_id',
  'apple_health',
  'apple-health-test-sim-99999',
  'Apple Health (Test Simulation)',
  'smartwatch',
  'disconnected',
  ARRAY['health_read'],
  NOW() - INTERVAL '5 days',
  jsonb_build_object(
    'simulated', true,
    'test_device', true,
    'purpose', 'Test reconnection flow',
    'version', '1.0'
  ),
  NOW() - INTERVAL '21 days',
  NOW() - INTERVAL '21 days',
  NOW() - INTERVAL '5 days'
) ON CONFLICT (user_id, provider, provider_user_id) DO UPDATE SET
  status = 'disconnected',
  last_sync_at = NOW() - INTERVAL '5 days',
  updated_at = NOW() - INTERVAL '5 days',
  display_name = EXCLUDED.display_name,
  metadata = EXCLUDED.metadata;

-- =====================================================
-- GOOGLE FIT DEVICES
-- =====================================================

-- Google Fit on Pixel 7 (Connected)
INSERT INTO connected_devices (
  user_id,
  provider,
  provider_user_id,
  display_name,
  device_type,
  status,
  scopes,
  last_sync_at,
  metadata,
  connected_at,
  created_at,
  updated_at
) VALUES (
  :'user_id',
  'google_fit',
  'google-fit-user-pixel7-67890',
  'Google Fit sur Pixel 7',
  'smartwatch',
  'connected',
  ARRAY['https://www.googleapis.com/auth/fitness.activity.read', 'https://www.googleapis.com/auth/fitness.heart_rate.read'],
  NOW() - INTERVAL '1 hour',
  jsonb_build_object(
    'device_model', 'Google Pixel 7',
    'os_version', 'Android 14',
    'google_fit_version', '2.84',
    'real_device', true,
    'total_records', 88
  ),
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '1 hour'
) ON CONFLICT (user_id, provider, provider_user_id) DO UPDATE SET
  last_sync_at = NOW() - INTERVAL '1 hour',
  updated_at = NOW() - INTERVAL '1 hour',
  status = 'connected',
  display_name = EXCLUDED.display_name,
  metadata = EXCLUDED.metadata;

-- Google Fit Test Simulation (Disconnected)
INSERT INTO connected_devices (
  user_id,
  provider,
  provider_user_id,
  display_name,
  device_type,
  status,
  scopes,
  last_sync_at,
  metadata,
  connected_at,
  created_at,
  updated_at
) VALUES (
  :'user_id',
  'google_fit',
  'google-fit-test-sim-88888',
  'Google Fit (Test Simulation)',
  'fitness_tracker',
  'disconnected',
  ARRAY['https://www.googleapis.com/auth/fitness.activity.read'],
  NOW() - INTERVAL '6 days',
  jsonb_build_object(
    'simulated', true,
    'test_device', true,
    'purpose', 'Test reconnection flow',
    'version', '1.0'
  ),
  NOW() - INTERVAL '18 days',
  NOW() - INTERVAL '18 days',
  NOW() - INTERVAL '6 days'
) ON CONFLICT (user_id, provider, provider_user_id) DO UPDATE SET
  status = 'disconnected',
  last_sync_at = NOW() - INTERVAL '6 days',
  updated_at = NOW() - INTERVAL '6 days',
  display_name = EXCLUDED.display_name,
  metadata = EXCLUDED.metadata;

-- =====================================================
-- STRAVA DEVICE
-- =====================================================

INSERT INTO connected_devices (
  user_id,
  provider,
  provider_user_id,
  display_name,
  device_type,
  status,
  scopes,
  last_sync_at,
  metadata,
  connected_at,
  created_at,
  updated_at
) VALUES (
  :'user_id',
  'strava',
  'sim-strava-user-12345',
  'Strava (Test Simulation)',
  'smartwatch',
  'disconnected',
  ARRAY['read', 'activity:read_all', 'activity:read'],
  NOW() - INTERVAL '3 days',
  jsonb_build_object('simulated', true, 'test_device', true, 'version', '1.0'),
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '3 days'
) ON CONFLICT (user_id, provider, provider_user_id) DO UPDATE SET
  status = 'disconnected',
  last_sync_at = NOW() - INTERVAL '3 days',
  updated_at = NOW() - INTERVAL '3 days',
  display_name = EXCLUDED.display_name,
  metadata = EXCLUDED.metadata;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all devices for user
SELECT
  provider,
  display_name,
  status,
  last_sync_at,
  connected_at
FROM connected_devices
WHERE user_id = :'user_id'
ORDER BY provider, display_name;

-- Count devices by status
SELECT
  status,
  COUNT(*) as count
FROM connected_devices
WHERE user_id = :'user_id'
GROUP BY status;
