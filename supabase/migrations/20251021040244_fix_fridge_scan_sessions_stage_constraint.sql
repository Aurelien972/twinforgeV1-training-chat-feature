/*
  # Fix Fridge Scan Sessions Stage Constraint

  1. Changes
    - Update the CHECK constraint on `fridge_scan_sessions.stage` to accept the correct values
    - Replace 'analysis' with 'analyze' to match TypeScript enum
    - Add 'generating_recipes' as a valid stage value
    - Maintain backward compatibility with existing sessions

  2. Valid Stage Values
    - photo: Initial photo capture stage
    - analyze: AI analysis of captured photos (was 'analysis')
    - complement: AI suggestions for complementary items
    - validation: User review and editing stage
    - generating_recipes: AI recipe generation stage (new)
    - recipes: Final recipes display stage

  3. Security
    - No changes to RLS policies
    - Maintains existing data integrity

  Important Notes:
  - This fixes the constraint violation error when saving sessions with 'analyze' or 'generating_recipes' stages
  - Existing sessions with 'analysis' stage will continue to work but new sessions will use 'analyze'
  - This aligns the database constraint with the TypeScript enum definition
*/

-- Drop the existing constraint
ALTER TABLE fridge_scan_sessions DROP CONSTRAINT IF EXISTS fridge_scan_sessions_stage_check;

-- Add the updated constraint with correct stage values
ALTER TABLE fridge_scan_sessions ADD CONSTRAINT fridge_scan_sessions_stage_check
CHECK (stage IN ('photo', 'analyze', 'complement', 'validation', 'generating_recipes', 'recipes'));

-- Update any existing 'analysis' values to 'analyze' for consistency
UPDATE fridge_scan_sessions
SET stage = 'analyze'
WHERE stage = 'analysis';
