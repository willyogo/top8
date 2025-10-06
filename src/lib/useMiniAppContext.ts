import { useState, useEffect, useMemo, useCallback } from 'react';

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

declare global {
  interface Window {
    MiniKit?: {
      context?: {
        user?: {
          fid?: number;
          username?: string;
          displayName?: string;
          pfpUrl?: string;
        };
      };
      actions?: {
        ready?: () => Promise<void>;
        authenticate?: () => Promise<{
          fid: number;
          username?: string;
          displayName?: string;
          pfpUrl?: string;
          custody?: string;
          verifications?: string[];
        }>;
      };
      wallet?: {
        request?: (params: {
          method: string;
          params?: any[];
        }) => Promise<any>;
      };
    };
    miniapp?: {
      sdk?: {
        context?: {
          user?: {
            fid: number;
            username?: string;
            displayName?: string;
            pfpUrl?: string;
          };
        };
        actions?: {
          ready?: () => Promise<void>;
          authenticate?: () => Promise<{
            fid: number;
            username?: string;
            displayName?: string;
            pfpUrl?: string;
          }>;
        };
      };
    };
  }
}

export function useMiniAppContext(): MiniAppContext {
  const [user, setUser] = useState<MiniAppUser | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);

  useEffect(() => {
    const initMiniApp = async () => {
      if (typeof window === 'undefined') return;

      console.log('[MiniApp] Initializing...');

      // Check for Base MiniKit
      if (window.MiniKit) {
        console.log('[MiniApp] MiniKit detected');
        console.log('[MiniApp] MiniKit object:', window.MiniKit);

        // Call ready if available
        if (window.MiniKit.actions?.ready) {
          try {
            await window.MiniKit.actions.ready();
            console.log('[MiniApp] MiniKit ready() called successfully');
          } catch (error) {
            console.error('[MiniApp] MiniKit ready() error:', error);
          }
        }

        // Get user context - check if context is a function or object
        console.log('[MiniApp] MiniKit.context type:', typeof window.MiniKit.context);
        console.log('[MiniApp] MiniKit.context value:', window.MiniKit.context);

        let contextData = window.MiniKit.context;

        // If context is a function, call it
        if (typeof contextData === 'function') {
          try {
            contextData = await contextData();
            console.log('[MiniApp] Context resolved from function:', contextData);
          } catch (err) {
            console.error('[MiniApp] Error calling context function:', err);
          }
        }

        // Only set isInMiniApp if we have actual user context with FID
        if (contextData?.user?.fid) {
          console.log('[MiniApp] Valid MiniKit context with user FID found');
          setIsInMiniApp(true);

          const contextUser = contextData.user;
          console.log('[MiniApp] MiniKit context user:', contextUser);

          const miniAppUser: MiniAppUser = {
            fid: contextUser.fid,
            username: contextUser.username,
            displayName: contextUser.displayName,
            pfpUrl: contextUser.pfpUrl,
          };
          console.log('[MiniApp] Setting MiniKit user:', miniAppUser);
          setUser(miniAppUser);
        } else {
          console.log('[MiniApp] No user found in MiniKit context - not in mini app');
        }
      }
      // Check for generic Farcaster mini app SDK
      else if (window.miniapp?.sdk) {
        console.log('[MiniApp] Generic Farcaster SDK detected');

        // Call ready
        if (window.miniapp.sdk.actions?.ready) {
          try {
            await window.miniapp.sdk.actions.ready();
            console.log('[MiniApp] Generic SDK ready() called successfully');
          } catch (error) {
            console.error('[MiniApp] Generic SDK ready() error:', error);
          }
        }

        // Get user context
        if (window.miniapp.sdk.context?.user) {
          try {
            const contextUser = window.miniapp.sdk.context.user;
            console.log('[MiniApp] Generic SDK context user (raw):', contextUser);

            // The generic SDK returns promises/functions for properties
            const fid = await Promise.resolve(contextUser.fid);
            const username = await Promise.resolve(contextUser.username);
            const displayName = await Promise.resolve(contextUser.displayName);
            const pfpUrl = await Promise.resolve(contextUser.pfpUrl);

            console.log('[MiniApp] Resolved user data:', { fid, username, displayName, pfpUrl });

            // Only set isInMiniApp if we have a valid FID
            if (fid) {
              console.log('[MiniApp] Valid generic SDK context with user FID found');
              setIsInMiniApp(true);

              const miniAppUser: MiniAppUser = {
                fid: typeof fid === 'number' ? fid : parseInt(String(fid), 10),
                username: username ? String(username) : undefined,
                displayName: displayName ? String(displayName) : undefined,
                pfpUrl: pfpUrl ? String(pfpUrl) : undefined,
              };
              console.log('[MiniApp] Setting mini app user:', miniAppUser);
              setUser(miniAppUser);
            } else {
              console.log('[MiniApp] No valid FID in generic SDK context - not in mini app');
            }
          } catch (err) {
            console.error('[MiniApp] Error resolving user context:', err);
          }
        } else {
          console.log('[MiniApp] No user context in generic SDK - not in mini app');
        }
      } else {
        console.log('[MiniApp] Not in mini app environment');
      }
    };

    if (document.readyState === 'complete') {
      initMiniApp();
    } else {
      window.addEventListener('load', initMiniApp);
      return () => window.removeEventListener('load', initMiniApp);
    }
  }, []);

  const authenticate = useCallback(async (): Promise<MiniAppUser | null> => {
    try {
      console.log('[MiniApp] authenticate() called');

      // Try Base MiniKit first
      if (window.MiniKit) {
        console.log('[MiniApp] Checking MiniKit authentication options...');

        // Check if context is a function
        let contextData = window.MiniKit.context;
        if (typeof contextData === 'function') {
          try {
            contextData = await contextData();
            console.log('[MiniApp] Context resolved from function:', contextData);
          } catch (err) {
            console.error('[MiniApp] Error calling context function:', err);
          }
        }

        // If user already in context, use wallet auth to confirm
        if (contextData?.user?.fid) {
          console.log('[MiniApp] User found in context, using wallet auth...');

          try {
            // Request wallet connection if available
            if (window.MiniKit.wallet?.request) {
              console.log('[MiniApp] Requesting wallet accounts...');
              const accounts = await window.MiniKit.wallet.request({
                method: 'eth_requestAccounts',
              });
              console.log('[MiniApp] Wallet accounts received:', accounts);
            }

            // Return the context user
            const contextUser = contextData.user;
            const authenticatedUser: MiniAppUser = {
              fid: contextUser.fid,
              username: contextUser.username,
              displayName: contextUser.displayName,
              pfpUrl: contextUser.pfpUrl,
            };
            console.log('[MiniApp] Wallet auth successful, using context user:', authenticatedUser);
            setUser(authenticatedUser);
            return authenticatedUser;
          } catch (err) {
            console.error('[MiniApp] Wallet auth error:', err);
            // Still return the context user even if wallet request fails
            const contextUser = contextData.user;
            const authenticatedUser: MiniAppUser = {
              fid: contextUser.fid,
              username: contextUser.username,
              displayName: contextUser.displayName,
              pfpUrl: contextUser.pfpUrl,
            };
            setUser(authenticatedUser);
            return authenticatedUser;
          }
        }

        // Try authenticate action if available
        if (window.MiniKit.actions?.authenticate) {
          console.log('[MiniApp] Using MiniKit.actions.authenticate()...');
          const result = await window.MiniKit.actions.authenticate();

          const authenticatedUser: MiniAppUser = {
            fid: result.fid,
            username: result.username,
            displayName: result.displayName,
            pfpUrl: result.pfpUrl,
          };

          console.log('[MiniApp] MiniKit authentication successful:', authenticatedUser);
          setUser(authenticatedUser);
          return authenticatedUser;
        }
      }

      // Try generic Farcaster SDK
      if (window.miniapp?.sdk) {
        if (window.miniapp.sdk.actions?.authenticate) {
          console.log('[MiniApp] Using generic SDK authenticate()...');
          const result = await window.miniapp.sdk.actions.authenticate();

          const fid = await Promise.resolve(result.fid);
          const username = await Promise.resolve(result.username);
          const displayName = await Promise.resolve(result.displayName);
          const pfpUrl = await Promise.resolve(result.pfpUrl);

          const authenticatedUser: MiniAppUser = {
            fid: typeof fid === 'number' ? fid : parseInt(String(fid), 10),
            username: username ? String(username) : undefined,
            displayName: displayName ? String(displayName) : undefined,
            pfpUrl: pfpUrl ? String(pfpUrl) : undefined,
          };

          console.log('[MiniApp] Generic SDK authentication successful:', authenticatedUser);
          setUser(authenticatedUser);
          return authenticatedUser;
        } else if (window.miniapp.sdk.context?.user) {
          // Already authenticated via context - return the existing user
          console.log('[MiniApp] Already authenticated via generic SDK context');
          try {
            const contextUser = window.miniapp.sdk.context.user;
            const fid = await Promise.resolve(contextUser.fid);
            const username = await Promise.resolve(contextUser.username);
            const displayName = await Promise.resolve(contextUser.displayName);
            const pfpUrl = await Promise.resolve(contextUser.pfpUrl);

            const authenticatedUser: MiniAppUser = {
              fid: typeof fid === 'number' ? fid : parseInt(String(fid), 10),
              username: username ? String(username) : undefined,
              displayName: displayName ? String(displayName) : undefined,
              pfpUrl: pfpUrl ? String(pfpUrl) : undefined,
            };
            setUser(authenticatedUser);
            return authenticatedUser;
          } catch (err) {
            console.error('[MiniApp] Error resolving context user for auth:', err);
          }
        }
      }

      console.error('[MiniApp] No authentication method available');
      return null;
    } catch (error) {
      console.error('[MiniApp] Authentication error:', error);
      return null;
    }
  }, []);

  return useMemo(() => ({
    user,
    isInMiniApp,
    authenticate,
  }), [user, isInMiniApp, authenticate]);
}
