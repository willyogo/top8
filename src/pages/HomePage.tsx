import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { SignInButton } from '../components/SignInButton';
import { useMiniAppContext } from '../lib/useMiniAppContext';
import { getUserByFid } from '../lib/neynar';

export function HomePage() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userParam = searchParams.get('user');
  const { isAuthenticated, user } = useAuth();
  const miniAppContext = useMiniAppContext();
  const [loadingMiniAppUser, setLoadingMiniAppUser] = useState(false);
  const [miniAppUserLoaded, setMiniAppUserLoaded] = useState(false);

  React.useEffect(() => {
    if (userParam) {
      navigate(`/${userParam}`);
    }
  }, [userParam, navigate]);

  React.useEffect(() => {
    if (isAuthenticated && user?.username) {
      navigate(`/${user.username}`);
    }
  }, [isAuthenticated, user, navigate]);

  React.useEffect(() => {
    if (miniAppContext.user && miniAppContext.user.fid && !miniAppUserLoaded) {
      setMiniAppUserLoaded(true);
      setLoadingMiniAppUser(true);

      const fetchAndSetUsername = async () => {
        try {
          if (miniAppContext.user?.username) {
            setUsername(miniAppContext.user.username);
          } else if (miniAppContext.user?.fid) {
            const userData = await getUserByFid(miniAppContext.user.fid);
            if (userData?.username) {
              setUsername(userData.username);
            }
          }
        } catch (err) {
          console.error('Error loading mini app user:', err);
        } finally {
          setLoadingMiniAppUser(false);
        }
      };

      fetchAndSetUsername();
    }
  }, [miniAppContext.user, miniAppUserLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      navigate(`/${username.trim()}`);
    }
  };

  if (loadingMiniAppUser) {
    return (
      <div className="h-screen w-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff9933] mb-4"></div>
          <div className="text-[#666] text-sm">Loading your Top 8...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#f8f8f8] font-['Verdana',_Arial,_sans-serif] flex flex-col overflow-hidden">
      <div className="bg-[#ffffee] border-b border-[#aaa] h-full flex flex-col">
        <div className="bg-gradient-to-b from-[#ffcc66] to-[#ff9933] border-b border-[#aaa] px-4 py-3 flex-shrink-0">
          <h1 className="text-white text-2xl font-bold text-center">
            Top 8
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <p className="text-[#333] text-sm mb-2">
                Remember Myspace's "Top 8"? Now for Farcaster.
              </p>
              <p className="text-[#666] text-xs">
                Auto-generated from your interactions, fully customizable.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#333] text-sm font-bold mb-1">
                  Enter a Farcaster username:
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full px-3 py-2 border border-[#999] text-sm focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-b from-[#ffcc66] to-[#ff9933] text-white font-bold py-2 px-4 border border-[#999] hover:from-[#ffbb55] hover:to-[#ff8822]"
              >
                View Top 8
              </button>
            </form>

            {!miniAppContext.isInMiniApp && (
              <div className="mt-6 pt-6 border-t border-[#ccc]">
                <div className="flex justify-center mb-2">
                  <SignInButton />
                </div>
                <p className="text-[#666] text-xs text-center">
                  Sign in to manage your own Top 8
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
