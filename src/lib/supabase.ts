import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Profile = {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  last_seen_at: string;
  created_at: string;
};

export type Top8Set = {
  owner_fid: number;
  algorithm_version: string;
  generated_at: string;
  customized: boolean;
  og_image_key: string;
  updated_at: string;
};

export type Top8Entry = {
  id: string;
  owner_fid: number;
  slot: number;
  target_fid: number;
  source: 'auto' | 'manual';
  mutual_affinity_score: number;
  created_at: string;
};
