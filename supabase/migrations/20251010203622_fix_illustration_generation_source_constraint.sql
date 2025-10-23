/*
  # Fix illustration_library generation_source constraint
  
  1. Problem
    - Current constraint only allows: 'flux', 'dalle', 'stable-diffusion', 'procedural', 'manual'
    - Edge function tries to insert 'gpt-image-1' and 'icon-fallback'
    - This causes "violates check constraint" errors
  
  2. Solution
    - Drop the old constraint
    - Add new constraint with all needed values including:
      - gpt-image-1 (primary AI generation)
      - icon-fallback (fallback when AI fails)
      - Keep existing values for backward compatibility
  
  3. Impact
    - Allows Edge Function to successfully insert illustrations
    - Maintains data integrity with proper validation
*/

-- Drop the old constraint if it exists
ALTER TABLE illustration_library 
DROP CONSTRAINT IF EXISTS illustration_library_generation_source_check;

-- Add new constraint with all supported generation sources
ALTER TABLE illustration_library
ADD CONSTRAINT illustration_library_generation_source_check 
CHECK (generation_source IN (
  'gpt-image-1',      -- New: OpenAI GPT Image 1 (high quality)
  'icon-fallback',    -- New: Icon-based fallback illustration
  'flux',             -- Existing: Flux AI
  'dalle',            -- Existing: DALL-E
  'stable-diffusion', -- Existing: Stable Diffusion
  'procedural',       -- Existing: Procedurally generated
  'manual'            -- Existing: Manually created
));