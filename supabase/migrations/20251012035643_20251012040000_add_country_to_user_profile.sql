/*
  # Add country column to user_profile

  1. Changes
    - Add `country` column to `user_profile` table
      - Type: text (nullable)
      - Stores the user's country selection from profile identity tab
  
  2. Notes
    - This field is optional and used for personalization
    - No RLS changes needed as user_profile already has proper policies
*/

-- Add country column to user_profile table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profile' AND column_name = 'country'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN country text;
  END IF;
END $$;