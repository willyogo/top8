import { Pencil } from 'lucide-react';
import { NeynarUser } from '../lib/neynar';

type Top8Entry = {
  slot: number;
  user?: NeynarUser;
};

type Top8GridProps = {
  entries: Top8Entry[];
  ownerDisplayName: string;
  friendCount: number;
  ownerUsername: string;
  isEditMode?: boolean;
  isOwner?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onShare?: () => void;
  onSignOut?: () => void;
  onCardClick?: (slot: number) => void;
  loadingTop8?: boolean;
  loadingFriends?: boolean;
  onSignInClick?: () => void;
};

export function Top8Grid({
  entries,
  ownerDisplayName,
  friendCount,
  ownerUsername,
  isEditMode = false,
  isOwner = false,
  onEdit,
  onCancel,
  onShare,
  onSignOut,
  onCardClick,
  loadingTop8 = false,
  loadingFriends = false,
  onSignInClick,
}: Top8GridProps) {
  return (
    <div className="h-screen w-screen bg-[#f8f8f8] font-['Verdana',_Arial,_sans-serif] flex flex-col overflow-hidden">
      <div className="bg-[#ffffee] border-b border-[#aaa] h-full flex flex-col">
        <div className="bg-gradient-to-b from-[#ffcc66] to-[#ff9933] border-b border-[#aaa] px-4 py-2 flex justify-between items-center flex-shrink-0">
            <h1 className="text-white text-xl font-bold tracking-tight">
              {ownerDisplayName}'s Top 8
            </h1>
            <div className="flex gap-2">
              {onShare && (
                <button
                  onClick={onShare}
                  className="bg-white text-[#333] px-3 py-1 text-sm border border-[#999] hover:bg-[#f0f0f0]"
                >
                  Share
                </button>
              )}
              {!isOwner && onSignInClick && (
                <button
                  onClick={onSignInClick}
                  className="bg-white text-[#333] px-3 py-1 text-sm border border-[#999] hover:bg-[#f0f0f0]"
                >
                  Edit
                </button>
              )}
              {isOwner && onEdit && (
                <button
                  onClick={isEditMode ? onCancel : onEdit}
                  className="bg-white text-[#333] px-3 py-1 text-sm border border-[#999] hover:bg-[#f0f0f0]"
                >
                  {isEditMode ? 'Cancel' : 'Edit'}
                </button>
              )}
              {isOwner && onSignOut && (
                <button
                  onClick={onSignOut}
                  className="bg-white text-[#333] px-3 py-1 text-sm border border-[#999] hover:bg-[#f0f0f0]"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <p className="text-[#333] text-sm mb-4">
              <strong>{ownerDisplayName}</strong> has{' '}
              {loadingFriends ? (
                <span className="inline-block w-16 h-4 bg-gray-200 animate-pulse rounded"></span>
              ) : (
                <strong className="text-[#0066cc]">{friendCount.toLocaleString()}</strong>
              )}
              {' '}friends.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {Array.from({ length: 8 }).map((_, index) => {
                const entry = entries.find(e => e.slot === index + 1);
                const user = entry?.user;

                const handleCardClick = () => {
                  if (isEditMode && onCardClick) {
                    onCardClick(index + 1);
                  } else if (user) {
                    window.location.href = `/${user.username}`;
                  }
                };

                return (
                  <div
                    key={index}
                    className={`bg-white border border-[#ccc] p-3 relative ${
                      isEditMode && onCardClick ? 'cursor-pointer hover:border-[#0066cc]' : user ? 'cursor-pointer hover:border-[#0066cc]' : ''
                    }`}
                    onClick={handleCardClick}
                  >
                    {isEditMode && (
                      <div className="absolute top-1 right-1 bg-white border border-[#999] rounded-full p-1">
                        <Pencil size={12} className="text-[#666]" />
                      </div>
                    )}

                    <div className="absolute top-1 left-1 bg-[#ff9933] text-white text-xs px-2 py-0.5 font-bold">
                      {index + 1}
                    </div>

                    {user ? (
                      <>
                        <img
                          src={user.pfp_url}
                          alt={user.display_name}
                          className="w-full aspect-square object-cover border border-[#999] mb-2 mt-4"
                        />
                        <div className="text-center">
                          <div className="text-[#0066cc] font-bold text-sm truncate hover:underline cursor-pointer">
                            {user.display_name}
                          </div>
                          <div className="text-[#666] text-xs truncate">
                            @{user.username}
                          </div>
                        </div>
                      </>
                    ) : loadingTop8 ? (
                      <>
                        <div className="w-full aspect-square bg-gray-200 animate-pulse border border-[#999] mb-2 mt-4"></div>
                        <div className="text-center">
                          <div className="h-4 bg-gray-200 animate-pulse rounded mb-1"></div>
                          <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4 mx-auto"></div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full aspect-square bg-[#f0f0f0] border border-[#999] mb-2 mt-4 flex items-center justify-center">
                        <span className="text-[#999] text-xl">+</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-right">
              <a
                href={`/friends/${ownerUsername}`}
                className="text-[#0066cc] text-sm hover:underline"
              >
                View all of {ownerDisplayName}'s friends
              </a>
            </div>
          </div>
      </div>
    </div>
  );
}
