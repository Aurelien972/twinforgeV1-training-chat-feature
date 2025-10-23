/*
  # Add photo_url column to meals table

  1. Changes
    - Add `photo_url` column to `meals` table to store meal photo URLs
    - Column allows NULL values for backward compatibility

  2. Purpose
    - Enables storing meal photos from scan feature
    - Supports both image analysis and barcode scanning workflows
*/

-- Add photo_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meals' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE meals ADD COLUMN photo_url text;
  END IF;
END $$;
