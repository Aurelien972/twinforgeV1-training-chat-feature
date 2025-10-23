/*
  # Add meal name column to meals table

  1. New Columns
    - `meal_name` (text, nullable) - AI-generated descriptive name for the meal
  
  2. Purpose
    - Allow AI to provide descriptive names for scanned meals
    - Enhance user experience with meaningful meal identification
    - Support better meal organization and recognition
*/

-- Add meal_name column to meals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meals' AND column_name = 'meal_name'
  ) THEN
    ALTER TABLE meals ADD COLUMN meal_name text;
  END IF;
END $$;