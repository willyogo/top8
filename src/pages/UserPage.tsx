import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Top8Grid } from '../components/Top8Grid';
import { SearchModal } from '../components/SearchModal';
import { getUserByUsername, getReciprocalFollowers, NeynarUser } from '../lib/neynar';
import { getOrCreateTop8, updateTop8, upsertProfile } from '../lib/top8Service';
import { updateMetaTags, getOGImageUrl } from '../lib/metaTags';
import { useMiniAppContext } from '../lib/useMiniAppContext';
import { sdk } from '@farcaster/miniapp-sdk';

const NEYNAR_CLIENT_ID = import.meta.env.VITE_NEYNAR_CLIENT_ID || '1b18763f-472a-4933-b485-18fb1463766f';

declare global {
  interface Window {
    onSignInSuccess?: (data: any) => void;
  }
}

export function UserPage() {
  const { username } = useParams<{ username: string }>();
  const { isAuthenticated, user: authUser, signOut, signIn } = useAuth();
  const miniAppContext = useMiniAppContext();
  const [user, setUser] = useState<NeynarUser | null>(null);
  const [entries, setEntries] = useState<Array<{ slot: number; user?: NeynarUser; target_fid: number }>>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingTop8, setLoadingTop8] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const hiddenButtonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const isOwner = isAuthenticated && authUser?.username === username;

  const isMiniAppOwner = !!(miniAppContext.isInMiniApp &&
    miniAppContext.user &&
    user &&
    miniAppContext.user.fid === user.fid);

  const canEdit: boolean = isOwner || isMiniAppOwner;

  useEffect(() => {
    console.log('[UserPage] Auth state:', {
      isAuthenticated,
      authUser,
      username,
      isOwner,
      miniAppContext: {
        isInMiniApp: miniAppContext.isInMiniApp,
        user: miniAppContext.user,
      },
      pageUser: user ? { fid: user.fid, username: user.username } : null,
      isMiniAppOwner,
      canEdit,
    });
  }, [isAuthenticated, authUser, username, isOwner, miniAppContext, user, isMiniAppOwner, canEdit]);

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    window.onSignInSuccess = (data: any) => {
      console.log('Sign in successful:', data);
      signIn({
        fid: data.fid,
        username: data.user?.username || '',
        display_name: data.user?.display_name || '',
        pfp_url: data.user?.pfp_url || '',
        signer_uuid: data.signer_uuid,
      });
      setSignInModalOpen(false);
      if (data.user?.username) {
        window.location.href = `/${data.user.username}`;
      }
    };

    const existingScript = document.querySelector('script[src="https://neynarxyz.github.io/siwn/raw/1.2.0/index.js"]');

    if (existingScript) {
      setScriptLoaded(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://neynarxyz.github.io/siwn/raw/1.2.0/index.js';
      script.async = true;
      script.onload = () => {
        console.log('Neynar script loaded');
        setScriptLoaded(true);
      };
      document.body.appendChild(script);
    }

    return () => {
      delete window.onSignInSuccess;
    };
  }, [signIn]);

  const loadUserData = async () => {
    if (!username) {
      console.log('[UserPage] No username provided');
      return;
    }

    try {
      console.log('[UserPage] Loading user data for:', username);
      setLoadingUser(true);
      setError(null);

      const userData = await getUserByUsername(username);
      console.log('[UserPage] User data loaded:', userData);

      if (!userData) {
        console.log('[UserPage] User not found');
        setError('User not found');
        setLoadingUser(false);
        return;
      }

      setUser(userData);
      setLoadingUser(false);
      console.log('[UserPage] User state updated');
      await upsertProfile(userData);

      // Update meta tags for social sharing
      const pageUrl = `${window.location.origin}/${username}`;
      updateMetaTags({
        title: `${userData.display_name}'s Top 8 on Farcaster`,
        description: `Check out ${userData.display_name}'s Top 8 friends on Farcaster! MySpace for Farcaster.`,
        image: getOGImageUrl(username),
        url: pageUrl,
      });

      setLoadingTop8(true);
      getOrCreateTop8(userData.fid)
        .then(top8Data => {
          const newEntries = top8Data.entries.map(e => ({
            slot: e.slot,
            user: e.user,
            target_fid: e.target_fid,
          }));
          setEntries(newEntries);
          setLoadingTop8(false);
        })
        .catch(err => {
          console.error('Error loading Top 8:', err);
          setLoadingTop8(false);
        });

      setLoadingFriends(true);

      getReciprocalFollowers(userData.fid, 1)
        .then(async reciprocalData => {
          let totalFriends = reciprocalData.users.length;
          let cursor = reciprocalData.next_cursor;

          while (cursor) {
            const moreData = await getReciprocalFollowers(userData.fid, 100, cursor);
            totalFriends += moreData.users.length;
            cursor = moreData.next_cursor;
          }

          setFriendCount(totalFriends);
          setLoadingFriends(false);
        })
        .catch(err => {
          console.error('Error loading friends:', err);
          setLoadingFriends(false);
        });
    } catch (err) {
      console.error('Error loading user data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setLoadingUser(false);
      setLoadingTop8(false);
      setLoadingFriends(false);
    }
  };

  const handleCardClick = (slot: number) => {
    if (!isEditMode) return;
    setEditingSlot(slot);
    setSearchModalOpen(true);
  };

  const handleReorder = (newEntries: Array<{ slot: number; user?: NeynarUser; target_fid?: number }>) => {
    setEntries(newEntries.map(e => ({
      slot: e.slot,
      user: e.user,
      target_fid: e.target_fid || e.user?.fid || 0,
    })));
  };

  const handleUserSelect = async (selectedUser: NeynarUser) => {
    if (editingSlot === null) return;

    await upsertProfile(selectedUser);

    setEntries(prev =>
      prev.map(e =>
        e.slot === editingSlot
          ? { slot: editingSlot, user: selectedUser, target_fid: selectedUser.fid }
          : e
      ).concat(
        entries.some(e => e.slot === editingSlot)
          ? []
          : [{ slot: editingSlot, user: selectedUser, target_fid: selectedUser.fid }]
      )
    );

    setEditingSlot(null);
  };

  const handleSave = async () => {
    if (!user) return;

    if (isMiniAppOwner && !isAuthenticated) {
      try {
        const authenticatedUser = await miniAppContext.authenticate();
        if (authenticatedUser && authenticatedUser.fid) {
          signIn({
            fid: authenticatedUser.fid,
            username: authenticatedUser.username || '',
            display_name: authenticatedUser.displayName || authenticatedUser.username || '',
            pfp_url: authenticatedUser.pfpUrl || '',
            signer_uuid: '',
          });
        } else {
          alert('Authentication required to save changes');
          return;
        }
      } catch (error) {
        console.error('Mini app authentication failed:', error);
        alert('Authentication failed. Please try again.');
        return;
      }
    }

    if (!isAuthenticated && !isOwner && !isMiniAppOwner) {
      setSignInModalOpen(true);
      return;
    }

    try {
      await updateTop8(
        user.fid,
        entries.map(e => ({
          slot: e.slot,
          target_fid: e.target_fid,
          source: 'manual' as const,
        }))
      );
      setIsEditMode(false);
    } catch (err) {
      console.error('Error saving Top 8:', err);
      alert('Failed to save changes');
    }
  };

  const handleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  const handleCancel = () => {
    loadUserData();
    setIsEditMode(false);
  };

  const handleShare = async () => {
    if (!username) return;

    const url = `${window.location.origin}/${username}`;
    const ogImageUrl = getOGImageUrl(username);
    const texts = [
      `Just ranked my Top 8 on Farcaster 🔥`,
      `My Top 8 is live! Who made the cut? 👀`,
      `Brought back the MySpace classic: my Farcaster Top 8 💜`,
      `New Top 8 just dropped 📊`,
      `Updated my Top 8! Check out who made the list 🎯`,
    ];
    const text = texts[Math.floor(Math.random() * texts.length)];

    if (miniAppContext.isInMiniApp) {
      try {
        console.log('[Share] Using MiniKit SDK composeCast');
        const result = await sdk.actions.composeCast({
          text,
          embeds: [ogImageUrl, url],
        });

        if (result?.cast) {
          console.log('[Share] Cast created successfully:', result.cast.hash);
        } else {
          console.log('[Share] Cast creation cancelled by user');
        }
      } catch (error) {
        console.error('[Share] Error calling composeCast:', error);
      }
    } else {
      console.log('[Share] Using browser Warpcast compose URL');
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(ogImageUrl)}&embeds[]=${encodeURIComponent(url)}`;
      window.open(warpcastUrl, '_blank');
    }
  };

  const handleSignInModalClick = async () => {
    if (miniAppContext.isInMiniApp) {
      setSignInModalOpen(false);
      try {
        const authenticatedUser = await miniAppContext.authenticate();
        if (authenticatedUser && authenticatedUser.fid) {
          signIn({
            fid: authenticatedUser.fid,
            username: authenticatedUser.username || '',
            display_name: authenticatedUser.displayName || authenticatedUser.username || '',
            pfp_url: authenticatedUser.pfpUrl || '',
            signer_uuid: '',
          });

          if (authenticatedUser.username === username) {
            window.location.reload();
          } else if (authenticatedUser.username) {
            window.location.href = `/${authenticatedUser.username}`;
          }
        } else {
          alert('Authentication failed. Please try again.');
        }
      } catch (error) {
        console.error('Mini app authentication failed:', error);
        alert('Authentication failed. Please try again.');
      }
      return;
    }

    console.log('handleSignInModalClick called, scriptLoaded:', scriptLoaded);
    console.log('hiddenButtonRef.current:', hiddenButtonRef.current);

    if (!scriptLoaded) {
      console.log('Script not loaded yet, waiting...');
      alert('Authentication is loading. Please try again in a moment.');
      return;
    }

    const tryClick = (attempts = 0) => {
      const neynarButton = hiddenButtonRef.current?.querySelector('button');
      console.log(`Attempt ${attempts}: neynarButton found:`, !!neynarButton);

      if (neynarButton) {
        console.log('Clicking Neynar button');
        neynarButton.click();
        setSignInModalOpen(false);
      } else if (attempts < 50) {
        setTimeout(() => tryClick(attempts + 1), 200);
      } else {
        console.error('Neynar button not found after multiple attempts');
        console.log('Final hiddenButtonRef innerHTML:', hiddenButtonRef.current?.innerHTML);
        alert('Sign-in button failed to load. Please refresh the page and try again.');
      }
    };

    tryClick();
  };

  return (
    <>
      <div
        ref={hiddenButtonRef}
        className="neynar_signin hidden"
        data-client_id={NEYNAR_CLIENT_ID}
        data-success-callback="onSignInSuccess"
        data-theme="light"
      />

      {loadingUser && (
        <div className="h-screen w-screen bg-[#f8f8f8] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff9933] mb-4"></div>
            <div className="text-[#666] text-sm">Loading...</div>
          </div>
        </div>
      )}

      {(error || !user) && !loadingUser && (
        <div className="h-screen w-screen bg-[#f8f8f8] flex items-center justify-center">
          <div className="bg-[#ffffee] border border-[#aaa] p-6 text-center">
            <div className="text-red-600 mb-2">{error || 'User not found'}</div>
            <a href="/" className="text-[#0066cc] hover:underline">
              Go back home
            </a>
          </div>
        </div>
      )}

      {!loadingUser && !error && user && (
        <>

      <Top8Grid
        entries={entries}
        ownerDisplayName={user.display_name}
        friendCount={friendCount}
        ownerUsername={user.username}
        isEditMode={isEditMode}
        isOwner={canEdit}
        onEdit={canEdit ? handleEdit : undefined}
        onCancel={handleCancel}
        onShare={handleShare}
        onSignOut={isOwner ? signOut : undefined}
        onCardClick={handleCardClick}
        onReorder={handleReorder}
        loadingTop8={loadingTop8}
        loadingFriends={loadingFriends}
        onSignInClick={!canEdit && !miniAppContext.isInMiniApp ? () => setSignInModalOpen(true) : undefined}
      />

      {isEditMode && (
        <div className="fixed bottom-4 right-4 flex gap-2">
          <button
            onClick={handleEdit}
            className="bg-white text-[#333] px-4 py-2 border border-[#999] hover:bg-[#f0f0f0]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-gradient-to-b from-[#ffcc66] to-[#ff9933] text-white px-4 py-2 border border-[#999] hover:from-[#ffbb55] hover:to-[#ff8822]"
          >
            Save Changes
          </button>
        </div>
      )}

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false);
          setEditingSlot(null);
        }}
        onSelect={handleUserSelect}
        slot={editingSlot || 1}
      />

      {signInModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-[#ffffee] border border-[#aaa] shadow-lg max-w-md w-full my-auto">
            <div className="bg-gradient-to-b from-[#ffcc66] to-[#ff9933] border-b border-[#aaa] px-4 py-3 flex justify-between items-center">
              <h2 className="text-white text-xl font-bold">Sign In Required</h2>
              <button
                onClick={() => setSignInModalOpen(false)}
                className="text-white hover:text-[#333] text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-[#333] text-sm mb-4">
                Sign in with your Farcaster account to edit your Top 8.
              </p>
              <button
                onClick={handleSignInModalClick}
                className="w-full bg-gradient-to-b from-[#6b46c1] to-[#553c9a] text-white font-bold py-2 px-4 border border-[#999] hover:from-[#7c3aed] hover:to-[#6d28d9] transition-all"
              >
                Sign in with Farcaster
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </>
  );
}
