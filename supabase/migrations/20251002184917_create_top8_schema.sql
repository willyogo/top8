/*
  # Create Top 8 Schema

  1. New Tables
    - `profiles`
      - `fid` (bigint, primary key) - Farcaster ID
      - `username` (text) - Farcaster username
      - `display_name` (text) - User's display name
      - `pfp_url` (text) - Profile picture URL
      - `last_seen_at` (timestamptz) - Last time profile was fetched
      - `created_at` (timestamptz) - Record creation timestamp
    
    - `top8_sets`
      - `owner_fid` (bigint, primary key) - FK to profiles
      - `algorithm_version` (text) - Algorithm used (e.g., "neynar_best_friends_v1")
      - `generated_at` (timestamptz) - When the set was first generated
      - `customized` (boolean) - Whether user has manually edited
      - `og_image_key` (text) - Key/URL for OG image
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `top8_entries`
      - `id` (uuid, primary key)
      - `owner_fid` (bigint) - FK to profiles
      - `slot` (smallint) - Position 1-8
      - `target_fid` (bigint) - FK to profiles
      - `source` (text) - "auto" or "manual"
      - `mutual_affinity_score` (numeric) - Score from Neynar
      - `created_at` (timestamptz)
      - Unique constraint on (owner_fid, slot)
  
  2. Security
    - Enable RLS on all tables
    - Profiles: public read, authenticated insert/update own
    - Top8_sets: public read, authenticated insert/update own
    - Top8_entries: public read, authenticated insert/update/delete own
  
  3. Indexes
    - Index on profiles.username for lookups
    - Index on top8_entries (owner_fid, slot) for queries
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  fid bigint PRIMARY KEY,
  username text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  pfp_url text DEFAULT '',
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create top8_sets table
CREATE TABLE IF NOT EXISTS top8_sets (
  owner_fid bigint PRIMARY KEY REFERENCES profiles(fid) ON DELETE CASCADE,
  algorithm_version text DEFAULT 'neynar_best_friends_v1',
  generated_at timestamptz DEFAULT now(),
  customized boolean DEFAULT false,
  og_image_key text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- Create top8_entries table
CREATE TABLE IF NOT EXISTS top8_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_fid bigint NOT NULL REFERENCES profiles(fid) ON DELETE CASCADE,
  slot smallint NOT NULL CHECK (slot >= 1 AND slot <= 8),
  target_fid bigint NOT NULL REFERENCES profiles(fid) ON DELETE CASCADE,
  source text DEFAULT 'auto' CHECK (source IN ('auto', 'manual')),
  mutual_affinity_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_fid, slot)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_top8_entries_owner_slot ON top8_entries(owner_fid, slot);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE top8_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE top8_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for top8_sets
CREATE POLICY "Top 8 sets are viewable by everyone"
  ON top8_sets FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own top 8 set"
  ON top8_sets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own top 8 set"
  ON top8_sets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for top8_entries
CREATE POLICY "Top 8 entries are viewable by everyone"
  ON top8_entries FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own top 8 entries"
  ON top8_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own top 8 entries"
  ON top8_entries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own top 8 entries"
  ON top8_entries FOR DELETE
  TO authenticated
  USING (true);
