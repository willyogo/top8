/*
  # Fix RLS Policies to Allow Anonymous Access

  1. Changes
    - Drop existing restrictive INSERT/UPDATE policies
    - Add new policies that allow anonymous (anon) role to INSERT and UPDATE
    - This allows the app to auto-generate Top 8 data for any user being viewed
    - Maintains public read access for all data
  
  2. Security Notes
    - Since this is a public viewing app, we allow anonymous inserts/updates
    - Data is based on public Farcaster data from Neynar API
    - Future: Add auth checks when SIWN is implemented for user-owned edits
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own top 8 set" ON top8_sets;
DROP POLICY IF EXISTS "Users can update own top 8 set" ON top8_sets;
DROP POLICY IF EXISTS "Users can insert own top 8 entries" ON top8_entries;
DROP POLICY IF EXISTS "Users can update own top 8 entries" ON top8_entries;
DROP POLICY IF EXISTS "Users can delete own top 8 entries" ON top8_entries;

-- Create new permissive policies for profiles
CREATE POLICY "Anyone can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
  ON profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create new permissive policies for top8_sets
CREATE POLICY "Anyone can insert top 8 sets"
  ON top8_sets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update top 8 sets"
  ON top8_sets FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create new permissive policies for top8_entries
CREATE POLICY "Anyone can insert top 8 entries"
  ON top8_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update top 8 entries"
  ON top8_entries FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete top 8 entries"
  ON top8_entries FOR DELETE
  USING (true);
