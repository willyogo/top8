const NEYNAR_API_KEY = import.meta.env.VITE_NEYNAR_API_KEY;
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';

if (!NEYNAR_API_KEY) {
  console.warn('Neynar API key not configured');
}

const headers = {
  'accept': 'application/json',
  'api_key': NEYNAR_API_KEY || '',
};

export type NeynarUser = {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count?: number;
  following_count?: number;
};

export type BestFriend = {
  user: NeynarUser;
  mutual_affinity_score: number;
};

export async function getBestFriends(fid: number, limit = 12): Promise<BestFriend[]> {
  if (!NEYNAR_API_KEY) {
    throw new Error('Neynar API key not configured. Please add VITE_NEYNAR_API_KEY to your .env file.');
  }

  const response = await fetch(
    `${NEYNAR_BASE_URL}/farcaster/user/best_friends?fid=${fid}&limit=${limit}`,
    { headers }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch best friends: ${errorText}`);
  }

  const data = await response.json();

  if (!data.users || !Array.isArray(data.users)) {
    console.warn('Unexpected best friends response structure:', data);
    return [];
  }

  // Best friends API only returns fid, username, and mutual_affinity_score
  // Full user details (including pfp_url) must be fetched via getBulkUsers
  return data.users.map((item: any) => ({
    user: {
      fid: item.fid,
      username: item.username,
      display_name: item.username,
      pfp_url: '',
      follower_count: 0,
      following_count: 0,
    },
    mutual_affinity_score: item.mutual_affinity_score || 0,
  }));
}

export async function getReciprocalFollowers(fid: number, limit = 100, cursor?: string) {
  if (!NEYNAR_API_KEY) {
    throw new Error('Neynar API key not configured. Please add VITE_NEYNAR_API_KEY to your .env file.');
  }

  const url = new URL(`${NEYNAR_BASE_URL}/farcaster/followers/reciprocal`);
  url.searchParams.set('fid', fid.toString());
  url.searchParams.set('limit', limit.toString());
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch reciprocal followers: ${errorText}`);
  }

  const data = await response.json();

  // Extract the actual user objects from the wrapper objects
  const users = (data.users || []).map((item: any) => item.user);

  return {
    users: users,
    next_cursor: data.next?.cursor,
  };
}

export async function searchUsers(query: string, limit = 10) {
  const response = await fetch(
    `${NEYNAR_BASE_URL}/farcaster/user/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to search users: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result?.users || [];
}

export async function getBulkUsers(fids: number[]): Promise<NeynarUser[]> {
  if (fids.length === 0) return [];

  const response = await fetch(
    `${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fids.join(',')}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch bulk users: ${response.statusText}`);
  }

  const data = await response.json();
  return data.users || [];
}

export async function getUserByUsername(username: string): Promise<NeynarUser | null> {
  if (!NEYNAR_API_KEY) {
    throw new Error('Neynar API key not configured. Please add VITE_NEYNAR_API_KEY to your .env file.');
  }

  const response = await fetch(
    `${NEYNAR_BASE_URL}/farcaster/user/by_username?username=${username}`,
    { headers }
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch user ${username}: ${errorText}`);
  }

  const data = await response.json();
  return data.user || null;
}

export async function getUserByFid(fid: number): Promise<NeynarUser | null> {
  const users = await getBulkUsers([fid]);
  return users[0] || null;
}