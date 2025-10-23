/*
  # Fix Activities Table - Add Missing Wearable Metrics Columns
  
  ## Description
  This migration adds all missing wearable metrics columns to the activities table.
  The columns were defined in previous migrations but not applied.
  
  ## New Columns Added
  - Heart Rate metrics (hr_avg, hr_max, hr_min, hr_zones)
  - HRV metrics (hrv_pre_activity, hrv_post_activity, hrv_avg_overnight)
  - Performance metrics (vo2max_estimated, efficiency_score, training_load_score)
  - Distance/Movement metrics (distance_meters, avg_pace, avg_speed_kmh, elevation)
  - Cadence/Power metrics (avg_cadence_rpm, avg_power_watts, normalized_power)
  - Recovery metrics (recovery_score, sleep_quality_score, stress_level_pre)
  - Wearable metadata (device_id, activity_id, synced_at, raw_data)
  
  ## Security
  - All columns are nullable (backward compatible)
  - RLS policies remain unchanged
  - Existing data is not affected
*/

-- Données de Fréquence Cardiaque
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS hr_avg INTEGER CHECK (hr_avg >= 30 AND hr_avg <= 250),
ADD COLUMN IF NOT EXISTS hr_max INTEGER CHECK (hr_max >= 30 AND hr_max <= 250),
ADD COLUMN IF NOT EXISTS hr_min INTEGER CHECK (hr_min >= 30 AND hr_min <= 250),
ADD COLUMN IF NOT EXISTS hr_resting_pre INTEGER CHECK (hr_resting_pre >= 30 AND hr_resting_pre <= 120),
ADD COLUMN IF NOT EXISTS hr_recovery_1min INTEGER CHECK (hr_recovery_1min >= 30 AND hr_recovery_1min <= 200);

-- Distribution des Zones de Fréquence Cardiaque
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS hr_zone1_minutes INTEGER CHECK (hr_zone1_minutes >= 0 AND hr_zone1_minutes <= 600),
ADD COLUMN IF NOT EXISTS hr_zone2_minutes INTEGER CHECK (hr_zone2_minutes >= 0 AND hr_zone2_minutes <= 600),
ADD COLUMN IF NOT EXISTS hr_zone3_minutes INTEGER CHECK (hr_zone3_minutes >= 0 AND hr_zone3_minutes <= 600),
ADD COLUMN IF NOT EXISTS hr_zone4_minutes INTEGER CHECK (hr_zone4_minutes >= 0 AND hr_zone4_minutes <= 600),
ADD COLUMN IF NOT EXISTS hr_zone5_minutes INTEGER CHECK (hr_zone5_minutes >= 0 AND hr_zone5_minutes <= 600);

-- Variabilité de la Fréquence Cardiaque (HRV)
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS hrv_pre_activity NUMERIC(6, 2) CHECK (hrv_pre_activity >= 0 AND hrv_pre_activity <= 200),
ADD COLUMN IF NOT EXISTS hrv_post_activity NUMERIC(6, 2) CHECK (hrv_post_activity >= 0 AND hrv_post_activity <= 200),
ADD COLUMN IF NOT EXISTS hrv_avg_overnight NUMERIC(6, 2) CHECK (hrv_avg_overnight >= 0 AND hrv_avg_overnight <= 200);

-- Métriques de Performance
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS vo2max_estimated NUMERIC(5, 2) CHECK (vo2max_estimated >= 10 AND vo2max_estimated <= 100),
ADD COLUMN IF NOT EXISTS training_load_score NUMERIC(8, 2) CHECK (training_load_score >= 0 AND training_load_score <= 1000),
ADD COLUMN IF NOT EXISTS efficiency_score NUMERIC(6, 2) CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
ADD COLUMN IF NOT EXISTS fatigue_index NUMERIC(5, 2) CHECK (fatigue_index >= 0 AND fatigue_index <= 100);

-- Métriques de Distance et Mouvement
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS distance_meters NUMERIC(10, 2) CHECK (distance_meters >= 0),
ADD COLUMN IF NOT EXISTS avg_pace TEXT,
ADD COLUMN IF NOT EXISTS avg_speed_kmh NUMERIC(6, 2) CHECK (avg_speed_kmh >= 0 AND avg_speed_kmh <= 100),
ADD COLUMN IF NOT EXISTS elevation_gain_meters NUMERIC(8, 2) CHECK (elevation_gain_meters >= 0),
ADD COLUMN IF NOT EXISTS elevation_loss_meters NUMERIC(8, 2) CHECK (elevation_loss_meters >= 0);

-- Métriques de Cadence et Puissance
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS avg_cadence_rpm NUMERIC(6, 2) CHECK (avg_cadence_rpm >= 0 AND avg_cadence_rpm <= 300),
ADD COLUMN IF NOT EXISTS max_cadence_rpm NUMERIC(6, 2) CHECK (max_cadence_rpm >= 0 AND max_cadence_rpm <= 300),
ADD COLUMN IF NOT EXISTS avg_power_watts NUMERIC(7, 2) CHECK (avg_power_watts >= 0 AND avg_power_watts <= 2000),
ADD COLUMN IF NOT EXISTS max_power_watts NUMERIC(7, 2) CHECK (max_power_watts >= 0 AND max_power_watts <= 3000),
ADD COLUMN IF NOT EXISTS normalized_power NUMERIC(7, 2) CHECK (normalized_power >= 0 AND normalized_power <= 2000);

-- Métriques de Récupération et Sommeil
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS sleep_quality_score NUMERIC(5, 2) CHECK (sleep_quality_score >= 0 AND sleep_quality_score <= 100),
ADD COLUMN IF NOT EXISTS sleep_duration_hours NUMERIC(4, 2) CHECK (sleep_duration_hours >= 0 AND sleep_duration_hours <= 24),
ADD COLUMN IF NOT EXISTS recovery_score NUMERIC(5, 2) CHECK (recovery_score >= 0 AND recovery_score <= 100),
ADD COLUMN IF NOT EXISTS stress_level_pre NUMERIC(5, 2) CHECK (stress_level_pre >= 0 AND stress_level_pre <= 100),
ADD COLUMN IF NOT EXISTS body_battery_pre NUMERIC(5, 2) CHECK (body_battery_pre >= 0 AND body_battery_pre <= 100);

-- Métadonnées Wearable (skip foreign key if connected_devices doesn't exist yet)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connected_devices') THEN
    ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS wearable_device_id UUID REFERENCES public.connected_devices(id) ON DELETE SET NULL;
  ELSE
    ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS wearable_device_id UUID;
  END IF;
END $$;

ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS wearable_activity_id TEXT,
ADD COLUMN IF NOT EXISTS wearable_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS wearable_raw_data JSONB;

-- Indicateurs de Qualité
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS data_completeness_score NUMERIC(5, 2) CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
ADD COLUMN IF NOT EXISTS gps_accuracy_meters NUMERIC(6, 2) CHECK (gps_accuracy_meters >= 0),
ADD COLUMN IF NOT EXISTS sensor_quality_score NUMERIC(5, 2) CHECK (sensor_quality_score >= 0 AND sensor_quality_score <= 100);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_hr_avg
  ON public.activities(user_id, hr_avg)
  WHERE hr_avg IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_vo2max
  ON public.activities(user_id, vo2max_estimated, timestamp DESC)
  WHERE vo2max_estimated IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_wearable_synced
  ON public.activities(user_id, wearable_synced_at DESC)
  WHERE wearable_synced_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_recovery
  ON public.activities(user_id, recovery_score, timestamp DESC)
  WHERE recovery_score IS NOT NULL;
