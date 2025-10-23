/*
  # Add "No Issues" Health Declaration Flags

  1. New Columns
    - `no_medical_conditions` (BOOLEAN) - User declares no medical conditions
    - `no_medications` (BOOLEAN) - User declares no current medications
    - `no_allergies` (BOOLEAN) - User declares no allergies
    - `no_physical_limitations` (BOOLEAN) - User declares no physical limitations
    - `no_dietary_constraints` (BOOLEAN) - User declares no dietary constraints

  2. Purpose
    - Allow users to quickly declare they have no health issues in specific categories
    - System can understand and take into account these declarations for training recommendations
    - Improves user experience by reducing form friction
    - Provides explicit confirmation rather than assuming empty = no issues

  3. Security
    - No RLS policy changes needed (inherits from user_profile table)
    - All columns nullable with default NULL
    - Only the authenticated user can update their own health flags

  4. Important Notes
    - These flags work alongside existing data fields
    - If user adds items (e.g., a medical condition), the corresponding flag should be set to false
    - Training system should consider these flags when generating recommendations
    - A NULL value means user hasn't explicitly declared either way
    - TRUE means user explicitly says "no issues in this category"
    - FALSE means user has items or previously had items in this category
*/

-- Add no_medical_conditions flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'no_medical_conditions'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN no_medical_conditions BOOLEAN DEFAULT NULL;
    RAISE NOTICE 'Added no_medical_conditions column';
  ELSE
    RAISE NOTICE 'Column no_medical_conditions already exists';
  END IF;
END $$;

-- Add no_medications flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'no_medications'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN no_medications BOOLEAN DEFAULT NULL;
    RAISE NOTICE 'Added no_medications column';
  ELSE
    RAISE NOTICE 'Column no_medications already exists';
  END IF;
END $$;

-- Add no_allergies flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'no_allergies'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN no_allergies BOOLEAN DEFAULT NULL;
    RAISE NOTICE 'Added no_allergies column';
  ELSE
    RAISE NOTICE 'Column no_allergies already exists';
  END IF;
END $$;

-- Add no_physical_limitations flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'no_physical_limitations'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN no_physical_limitations BOOLEAN DEFAULT NULL;
    RAISE NOTICE 'Added no_physical_limitations column';
  ELSE
    RAISE NOTICE 'Column no_physical_limitations already exists';
  END IF;
END $$;

-- Add no_dietary_constraints flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'no_dietary_constraints'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN no_dietary_constraints BOOLEAN DEFAULT NULL;
    RAISE NOTICE 'Added no_dietary_constraints column';
  ELSE
    RAISE NOTICE 'Column no_dietary_constraints already exists';
  END IF;
END $$;

-- Create index for querying users with no health issues (useful for training system)
CREATE INDEX IF NOT EXISTS idx_user_profile_no_health_issues
  ON user_profile(no_medical_conditions, no_medications, no_allergies, no_physical_limitations)
  WHERE no_medical_conditions = true
  AND no_medications = true
  AND no_allergies = true
  AND no_physical_limitations = true;

-- Add helpful comment on the table
COMMENT ON COLUMN user_profile.no_medical_conditions IS 'User explicitly declares having no medical conditions (NULL = not declared, TRUE = no conditions, FALSE = has or had conditions)';
COMMENT ON COLUMN user_profile.no_medications IS 'User explicitly declares taking no medications (NULL = not declared, TRUE = no medications, FALSE = takes or took medications)';
COMMENT ON COLUMN user_profile.no_allergies IS 'User explicitly declares having no allergies (NULL = not declared, TRUE = no allergies, FALSE = has allergies)';
COMMENT ON COLUMN user_profile.no_physical_limitations IS 'User explicitly declares having no physical limitations (NULL = not declared, TRUE = no limitations, FALSE = has limitations)';
COMMENT ON COLUMN user_profile.no_dietary_constraints IS 'User explicitly declares having no dietary constraints (NULL = not declared, TRUE = no constraints, FALSE = has constraints)';

-- Validation and summary
DO $$
DECLARE
  v_column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'user_profile'
  AND column_name IN (
    'no_medical_conditions',
    'no_medications',
    'no_allergies',
    'no_physical_limitations',
    'no_dietary_constraints'
  );

  RAISE NOTICE '=== No Issues Health Flags Migration Completed ===';
  RAISE NOTICE 'Health declaration columns added: %', v_column_count;
  RAISE NOTICE 'Expected: 5 columns';

  IF v_column_count = 5 THEN
    RAISE NOTICE 'SUCCESS: All "no issues" health flags are in place';
    RAISE NOTICE 'Training system can now consider explicit "no issues" declarations';
  ELSE
    RAISE WARNING 'INCOMPLETE: Expected 5 columns but found %', v_column_count;
  END IF;
END $$;
