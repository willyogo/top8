import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { searchUsers, NeynarUser } from '../lib/neynar';

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: NeynarUser) => void;
  slot: number;
};

export function SearchModal({ isOpen, onClose, onSelect, slot }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NeynarUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchUsers(query);
        setResults(users);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-[#999] max-w-md w-full max-h-[600px] flex flex-col">
        <div className="bg-gradient-to-b from-[#ffcc66] to-[#ff9933] border-b border-[#999] px-4 py-2 flex justify-between items-center">
          <h2 className="text-white font-bold">
            Select Friend for Slot {slot}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-[#333]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-[#ccc]">
          <div className="relative">
            <Search size={16} className="absolute left-2 top-2 text-[#999]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username..."
              className="w-full pl-8 pr-3 py-1 border border-[#999] text-sm focus:outline-none focus:border-[#0066cc]"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center text-[#999] text-sm">
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="text-center text-[#999] text-sm">
              No users found
            </div>
          )}

          {!loading && !query && (
            <div className="text-center text-[#999] text-sm">
              Type to search for users
            </div>
          )}

          <div className="space-y-2">
            {results.map((user) => (
              <button
                key={user.fid}
                onClick={() => {
                  onSelect(user);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-2 border border-[#ccc] hover:border-[#0066cc] hover:bg-[#f8f8f8] text-left"
              >
                <img
                  src={user.pfp_url}
                  alt={user.display_name}
                  className="w-12 h-12 border border-[#999]"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[#333] font-bold text-sm truncate">
                    {user.display_name}
                  </div>
                  <div className="text-[#666] text-xs truncate">
                    @{user.username}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
