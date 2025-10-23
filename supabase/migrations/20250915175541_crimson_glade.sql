/*
  # Create meals table for nutrition tracking

  1. New Tables
    - `meals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `timestamp` (timestamptz, when the meal was consumed)
      - `items` (jsonb, detailed nutritional data and food list)
      - `total_kcal` (integer, total calories)
      - `meal_type` (text, breakfast/lunch/dinner/snack)
      - `created_at` (timestamptz, when record was created)
  
  2. Security
    - Enable RLS on `meals` table
    - Add policies for users to manage their own meals
    - Add policies for coaches to view client meals
  
  3. Indexes
    - Index on `user_id` and `timestamp` for efficient queries
    - Index for meal history and analytics
*/

-- Create meals table if it doesn't exist
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  items jsonb DEFAULT '[]'::jsonb,
  total_kcal integer,
  meal_type text,
  created_at timestamptz DEFAULT now()
);

-- Add constraint for meal_type validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'meals' AND constraint_name = 'meals_meal_type_check'
  ) THEN
    ALTER TABLE meals ADD CONSTRAINT meals_meal_type_check 
    CHECK (meal_type = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text, 'snack'::text]));
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meals_user_timestamp 
ON meals USING btree (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS meals_user_id_timestamp_idx 
ON meals USING btree (user_id, timestamp DESC);

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own meals" ON meals;
DROP POLICY IF EXISTS "Coaches can view client meals" ON meals;
DROP POLICY IF EXISTS "client_reads_own_meals" ON meals;
DROP POLICY IF EXISTS "coach_reads_client_meals" ON meals;
DROP POLICY IF EXISTS "users_insert_own_meals" ON meals;
DROP POLICY IF EXISTS "users_update_own_meals" ON meals;
DROP POLICY IF EXISTS "users_delete_own_meals" ON meals;

-- Create RLS policies for users to manage their own meals
CREATE POLICY "users_insert_own_meals"
  ON meals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_meals"
  ON meals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_meals"
  ON meals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "client_reads_own_meals"
  ON meals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policy for coaches to view client meals
CREATE POLICY "coach_reads_client_meals"
  ON meals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM coach_clients cc
      WHERE cc.coach_id = auth.uid()
        AND cc.client_id = meals.user_id
        AND cc.status = 'active'::text
    )
  );

-- Legacy compatibility policies (for existing code)
CREATE POLICY "Users can manage own meals"
  ON meals
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view client meals"
  ON meals
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM coach_clients cc
      WHERE cc.coach_id = auth.uid()
        AND cc.client_id = meals.user_id
        AND cc.status = 'active'::text
    )
  );