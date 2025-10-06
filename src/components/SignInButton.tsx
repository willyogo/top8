import { useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { useMiniAppContext } from '../lib/useMiniAppContext';

const NEYNAR_CLIENT_ID = import.meta.env.VITE_NEYNAR_CLIENT_ID || '1b18763f-472a-4933-b485-18fb1463766f';

declare global {
  interface Window {
    onSignInSuccess?: (data: any) => void;
  }
}

export function SignInButton() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const miniAppContext = useMiniAppContext();
  const hiddenButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('SignInButton mounted, client ID:', NEYNAR_CLIENT_ID);

    window.onSignInSuccess = (data: any) => {
      console.log('Sign in successful:', data);
      signIn({
        fid: data.fid,
        username: data.user?.username || '',
        display_name: data.user?.display_name || '',
        pfp_url: data.user?.pfp_url || '',
        signer_uuid: data.signer_uuid,
      });
      if (data.user?.username) {
        navigate(`/${data.user.username}`);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://neynarxyz.github.io/siwn/raw/1.2.0/index.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://neynarxyz.github.io/siwn/raw/1.2.0/index.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
      delete window.onSignInSuccess;
    };
  }, [signIn, navigate]);

  const handleClick = () => {
    const neynarButton = hiddenButtonRef.current?.querySelector('button');
    if (neynarButton) {
      neynarButton.click();
    }
  };

  // Don't show if already authenticated in standalone mode
  if (isAuthenticated && !miniAppContext.isInMiniApp) {
    return null;
  }

  // Don't show in mini app at all (they use native auth)
  if (miniAppContext.isInMiniApp) {
    return null;
  }

  return (
    <>
      <div
        ref={hiddenButtonRef}
        className="neynar_signin hidden"
        data-client_id={NEYNAR_CLIENT_ID}
        data-success-callback="onSignInSuccess"
        data-theme="light"
      />
      <button
        onClick={handleClick}
        className="w-full bg-gradient-to-b from-[#6b46c1] to-[#553c9a] text-white font-bold py-2 px-4 border border-[#999] hover:from-[#7c3aed] hover:to-[#6d28d9] transition-all"
      >
        Sign in with Farcaster
      </button>
    </>
  );
}
