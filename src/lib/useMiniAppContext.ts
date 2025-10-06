import { useFrame } from './frameContext';

interface MiniAppUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface MiniAppContext {
  user: MiniAppUser | null;
  isInMiniApp: boolean;
  authenticate: () => Promise<MiniAppUser | null>;
}

export function useMiniAppContext(): MiniAppContext {
  const { isInFrame, user, authenticate } = useFrame();

  return {
    user,
    isInMiniApp: isInFrame,
    authenticate,
  };
}
