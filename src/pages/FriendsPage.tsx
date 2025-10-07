import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getUserByUsername, getReciprocalFollowers, NeynarUser } from '../lib/neynar';

export function FriendsPage() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<NeynarUser | null>(null);
  const [friends, setFriends] = useState<NeynarUser[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<NeynarUser[]>([]);
  const [displayedFriends, setDisplayedFriends] = useState<NeynarUser[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const FRIENDS_PER_PAGE = 20;

  useEffect(() => {
    loadFriends();
  }, [username]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredFriends(
      friends.filter(
        f =>
          f.username?.toLowerCase().includes(query) ||
          f.display_name?.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, friends]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredFriends]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * FRIENDS_PER_PAGE;
    const endIndex = startIndex + FRIENDS_PER_PAGE;
    setDisplayedFriends(filteredFriends.slice(startIndex, endIndex));
  }, [currentPage, filteredFriends]);

  const loadFriends = async () => {
    if (!username) return;

    try {
      setLoadingUser(true);
      setError(null);

      const userData = await getUserByUsername(username);
      if (!userData) {
        setError('User not found');
        setLoadingUser(false);
        return;
      }

      setUser(userData);
      setLoadingUser(false);

      setLoadingFriends(true);
      let allFriends: NeynarUser[] = [];
      let cursor: string | undefined = undefined;

      do {
        const data = await getReciprocalFollowers(userData.fid, 100, cursor);
        allFriends = [...allFriends, ...data.users];

        // Update state progressively as we load more friends
        setFriends([...allFriends]);
        setFilteredFriends([...allFriends]);

        cursor = data.next_cursor;
      } while (cursor);

      setLoadingFriends(false);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends');
      setLoadingUser(false);
      setLoadingFriends(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="h-screen w-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff9933] mb-4"></div>
          <div className="text-[#666] text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="h-screen w-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="bg-[#ffffee] border border-[#aaa] p-6 text-center">
          <div className="text-red-600 mb-2">{error || 'User not found'}</div>
          <a href="/" className="text-[#0066cc] hover:underline">
            Go back home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#f8f8f8] font-['Verdana',_Arial,_sans-serif] flex flex-col overflow-hidden">
      <div className="bg-[#ffffee] border-b border-[#aaa] h-full flex flex-col">
        <div className="bg-gradient-to-b from-[#ffcc66] to-[#ff9933] border-b border-[#aaa] px-4 py-2 flex-shrink-0">
          <h1 className="text-white text-xl font-bold">
            {user.display_name}'s Friends
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-8">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-[#333] text-sm">
                <strong className="text-[#0066cc]">{friends.length.toLocaleString()}</strong> total friends
              </p>
              <a
                href={`/${username}`}
                className="text-[#0066cc] text-sm hover:underline"
              >
                Back to {user.display_name}'s profile
              </a>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full px-3 py-2 border border-[#999] text-sm focus:outline-none focus:border-[#0066cc]"
              />
            </div>

            {loadingFriends && displayedFriends.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: FRIENDS_PER_PAGE }).map((_, index) => (
                  <div key={index} className="bg-white border border-[#ccc] p-3 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 animate-pulse border border-[#999]"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 animate-pulse rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center text-[#999] py-8">
                {loadingFriends ? 'Loading friends...' : 'No friends found'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedFriends.map((friend) => (
                    <div
                      key={friend.fid}
                      className="bg-white border border-[#ccc] p-3 flex items-center gap-3 hover:border-[#0066cc]"
                    >
                      <img
                        src={friend.pfp_url || ''}
                        alt={friend.display_name || 'User'}
                        className="w-12 h-12 border border-[#999] object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Crect width="48" height="48" fill="%23ddd"/%3E%3Ctext x="24" y="24" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="20"%3E?%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[#0066cc] font-bold text-sm truncate hover:underline cursor-pointer">
                          {friend.display_name || 'Unknown'}
                        </div>
                        <div className="text-[#666] text-xs truncate">
                          @{friend.username || 'unknown'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {loadingFriends && (
                  <div className="mt-4 text-center text-[#666] text-sm">
                    Loading more friends...
                  </div>
                )}

                {filteredFriends.length > FRIENDS_PER_PAGE && (
                  <div className="mt-6 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-[#999] bg-white text-[#333] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f0f0f0]"
                    >
                      Previous
                    </button>
                    <span className="text-[#666] text-sm">
                      Page {currentPage} of {Math.ceil(filteredFriends.length / FRIENDS_PER_PAGE)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredFriends.length / FRIENDS_PER_PAGE), p + 1))}
                      disabled={currentPage >= Math.ceil(filteredFriends.length / FRIENDS_PER_PAGE)}
                      className="px-4 py-2 border border-[#999] bg-white text-[#333] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f0f0f0]"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}
