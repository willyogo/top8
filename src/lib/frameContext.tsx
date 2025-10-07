import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface FrameUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FrameContextType {
  isSDKLoaded: boolean;
  isInFrame: boolean;
  user: FrameUser | null;
  context: any;
  authenticate: () => Promise<FrameUser | null>;
}

const FrameContext = createContext<FrameContextType>({
  isSDKLoaded: false,
  isInFrame: false,
  user: null,
  context: null,
  authenticate: async () => null,
});

export function FrameProvider({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isInFrame, setIsInFrame] = useState(false);
  const [user, setUser] = useState<FrameUser | null>(null);
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        console.log('[Frame SDK] Initializing...');

        const isInMiniApp = await sdk.isInMiniApp(1500);
        console.log('[Frame SDK] isInMiniApp:', isInMiniApp);

        if (!isInMiniApp) {
          console.log('[Frame SDK] Not in miniapp environment, skipping full initialization');
          setIsSDKLoaded(true);
          setIsInFrame(false);
          return;
        }

        const contextTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Context load timeout')), 3000);
        });

        const frameContext = await Promise.race([
          sdk.context,
          contextTimeout
        ]);
        console.log('[Frame SDK] Context loaded:', frameContext);

        setContext(frameContext);

        if (frameContext?.client) {
          console.log('[Frame SDK] Running in frame environment');
          setIsInFrame(true);

          if (frameContext.user) {
            const frameUser: FrameUser = {
              fid: frameContext.user.fid,
              username: frameContext.user.username,
              displayName: frameContext.user.displayName,
              pfpUrl: frameContext.user.pfpUrl,
            };
            console.log('[Frame SDK] User context available:', frameUser);
            setUser(frameUser);
          } else {
            console.log('[Frame SDK] No user in context');
          }
        } else {
          console.log('[Frame SDK] Not running in frame environment');
          setIsInFrame(false);
        }

        await sdk.actions.ready();
        console.log('[Frame SDK] Ready signal sent');

        setIsSDKLoaded(true);
      } catch (error) {
        console.error('[Frame SDK] Initialization error:', error);
        setIsSDKLoaded(true);
        setIsInFrame(false);
      }
    };

    initializeSDK();
  }, []);

  const authenticate = useCallback(async (): Promise<FrameUser | null> => {
    if (!isInFrame) {
      console.log('[Frame SDK] Not in frame, cannot authenticate');
      return null;
    }

    try {
      console.log('[Frame SDK] Attempting authentication...');

      if (user) {
        console.log('[Frame SDK] User already available from context:', user);
        return user;
      }

      if (context?.user) {
        const frameUser: FrameUser = {
          fid: context.user.fid,
          username: context.user.username,
          displayName: context.user.displayName,
          pfpUrl: context.user.pfpUrl,
        };
        console.log('[Frame SDK] User from context:', frameUser);
        setUser(frameUser);
        return frameUser;
      }

      console.log('[Frame SDK] No user available');
      return null;
    } catch (error) {
      console.error('[Frame SDK] Authentication error:', error);
      return null;
    }
  }, [isInFrame, user, context]);

  return (
    <FrameContext.Provider
      value={{
        isSDKLoaded,
        isInFrame,
        user,
        context,
        authenticate,
      }}
    >
      {children}
    </FrameContext.Provider>
  );
}

export function useFrame() {
  const context = useContext(FrameContext);
  if (!context) {
    throw new Error('useFrame must be used within FrameProvider');
  }
  return context;
}
