/*
  # Phase 6 - Step 1: Complete Missing Tempo Data

  ## Overview
  Adds tempo data for the 6 remaining Strongman exercises without tempo.

  ## Changes
  - Updates 6 Strongman exercises with appropriate tempo values
  - Atlas Stone movements: explosive concentric, controlled eccentric
  - Farmers Walk/Sled: continuous tension pattern
  - Sandbag Over Bar: explosive pattern

  ## Security
  - No schema changes
  - Data enrichment only
*/

-- ============================================================================
-- COMPLETE TEMPO FOR STRONGMAN EXERCISES
-- ============================================================================

-- Atlas Stone Load (explosive lift, controlled negative)
UPDATE exercises 
SET tempo = '10X0'
WHERE name = 'Atlas Stone Load' AND tempo IS NULL;

-- Atlas Stone Lap (explosive lift, controlled placement)
UPDATE exercises 
SET tempo = '10X0'
WHERE name = 'Atlas Stone Lap' AND tempo IS NULL;

-- Farmers Walk Heavy (continuous tension, no distinct phases)
UPDATE exercises 
SET tempo = 'XXXX'
WHERE name = 'Farmers Walk Heavy' AND tempo IS NULL;

-- Sled Push Heavy (continuous tension, steady pace)
UPDATE exercises 
SET tempo = 'XXXX'
WHERE name = 'Sled Push Heavy' AND tempo IS NULL;

-- Tire Flip for Distance (explosive lift, controlled reset)
UPDATE exercises 
SET tempo = '10X1'
WHERE name = 'Tire Flip for Distance' AND tempo IS NULL;

-- Sandbag Over Bar (explosive throw, quick reset)
UPDATE exercises 
SET tempo = '10X0'
WHERE name = 'Sandbag Over Bar' AND tempo IS NULL;
