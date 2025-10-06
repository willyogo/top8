import { supabase, Profile, Top8Set } from './supabase';
import { getBestFriends, getBulkUsers, NeynarUser } from './neynar';

export async function getOrCreateTop8(ownerFid: number) {
  const { data: existingSet } = await supabase
    .from('top8_sets')
    .select('*')
    .eq('owner_fid', ownerFid)
    .maybeSingle();

  if (existingSet) {
    const { data: entries } = await supabase
      .from('top8_entries')
      .select('*')
      .eq('owner_fid', ownerFid)
      .order('slot', { ascending: true });

    const targetFids = entries?.map(e => e.target_fid) || [];
    const users = targetFids.length > 0 ? await getBulkUsers(targetFids) : [];

    const usersMap = new Map(users.map(u => [u.fid, u]));

    return {
      set: existingSet as Top8Set,
      entries: (entries || []).map(e => ({
        ...e,
        user: usersMap.get(e.target_fid),
      })),
    };
  }

  const bestFriends = await getBestFriends(ownerFid, 12);
  const top8 = bestFriends.slice(0, 8);

  if (top8.length === 0) {
    return {
      set: null as any,
      entries: [],
    };
  }

  // Get FIDs from the top 8 friends to fetch full user details
  const friendFids = top8.map(f => f.user.fid);
  const profileFids = [ownerFid, ...friendFids];
  const usersToStore = await getBulkUsers(profileFids);

  for (const user of usersToStore) {
    await upsertProfile(user);
  }

  // Delete any existing entries first to avoid conflicts
  await supabase
    .from('top8_entries')
    .delete()
    .eq('owner_fid', ownerFid);

  // Upsert the set
  const { data: newSet } = await supabase
    .from('top8_sets')
    .upsert({
      owner_fid: ownerFid,
      algorithm_version: 'neynar_best_friends_v1',
      customized: false,
    })
    .select()
    .single();

  const entriesToInsert = top8.map((friend, index) => ({
    owner_fid: ownerFid,
    slot: index + 1,
    target_fid: friend.user.fid,
    source: 'auto' as const,
    mutual_affinity_score: friend.mutual_affinity_score,
  }));

  const { data: newEntries, error: insertError } = await supabase
    .from('top8_entries')
    .insert(entriesToInsert)
    .select();

  // Create a map of fid to full user details
  const userMap = new Map(usersToStore.map(u => [u.fid, u]));

  // Even if database insert fails, return the data we have from the API
  if (insertError) {
    console.error('Failed to insert top8 entries to database:', insertError);
    return {
      set: newSet as Top8Set,
      entries: top8.map((friend, index) => ({
        owner_fid: ownerFid,
        slot: index + 1,
        target_fid: friend.user.fid,
        source: 'auto' as const,
        mutual_affinity_score: friend.mutual_affinity_score,
        user: userMap.get(friend.user.fid),
      })),
    };
  }

  const finalEntries = (newEntries || []).map(e => ({
    ...e,
    user: userMap.get(e.target_fid),
  }));

  return {
    set: newSet as Top8Set,
    entries: finalEntries,
  };
}

export async function upsertProfile(user: NeynarUser) {
  await supabase
    .from('profiles')
    .upsert({
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      pfp_url: user.pfp_url,
      last_seen_at: new Date().toISOString(),
    });
}

export async function updateTop8(ownerFid: number, entries: Array<{ slot: number; target_fid: number; source: 'auto' | 'manual' }>) {
  await supabase
    .from('top8_entries')
    .delete()
    .eq('owner_fid', ownerFid);

  await supabase
    .from('top8_entries')
    .insert(
      entries.map(e => ({
        owner_fid: ownerFid,
        slot: e.slot,
        target_fid: e.target_fid,
        source: e.source,
        mutual_affinity_score: 0,
      }))
    );

  await supabase
    .from('top8_sets')
    .update({
      customized: true,
      updated_at: new Date().toISOString(),
    })
    .eq('owner_fid', ownerFid);
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  return data;
}
