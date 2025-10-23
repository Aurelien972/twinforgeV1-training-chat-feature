/*
  # Add country_timezone column to user_profile

  1. Changes
    - Add `country_timezone` column to `user_profile` table
      - Type: text (nullable, defaults to 'Europe/Paris')
      - Stores the user's timezone for theme auto-switching

  2. Notes
    - This field is populated automatically based on country selection
    - Used by the theme auto-switching service to adapt light/dark mode
    - No RLS changes needed as user_profile already has proper policies
*/

-- Add country_timezone column to user_profile table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'country_timezone'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN country_timezone text DEFAULT 'Europe/Paris';
  END IF;
END $$;
