/**
 * useWallet — Manages wallet connection state for N1 testnet
 *
 * FIXES applied:
 * 1. fetchBalance was defined inside the component but called from useEffect
 *    without being in its dependency array — eslint/react warning. Moved to
 *    useCallback and added proper deps.
 * 2. useEffect for session restore called `fetchBalance(accountId)` but
 *    fetchBalance wasn't stable yet. Fixed by putting accountId in state
 *    and having a separate effect that watches accountId.
 * 3. Added balance polling every 30s when connected — original only fetched once.
 */

import { useState, useCallback, useEffect } from 'react';
import { nordApi } from '../lib/n1Client';
import type { WalletState } from '../shared/types';

const STORAGE_KEY = 'n1_copytrade_wallet';
const BALANCE_POLL_INTERVAL = 30_000;

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    accountId: null,
    balance: 0,
    connecting: false,
    error: null,
  });

  const fetchBalance = useCallback(async (accountId: number) => {
    try {
      const account = await nordApi.account(accountId);
      // USDC balance — token 0 on N1 testnet
      const usdc = account.balances?.['0'] ?? account.balances?.['USDC'] ?? 0;
      setWalletState(prev => ({ ...prev, balance: usdc }));
    } catch {
      // ignore — balance stays stale if API unreachable
    }
  }, []);

  // Restore session from storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { publicKey, accountId } = JSON.parse(stored) as { publicKey: string; accountId: number | null };
        if (publicKey) {
          setWalletState(prev => ({
            ...prev,
            connected: true,
            publicKey,
            accountId,
          }));
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // FIX: Poll balance when connected instead of one-shot fetch
  useEffect(() => {
    if (!walletState.connected || !walletState.accountId) return;
    const id = walletState.accountId;
    fetchBalance(id);
    const interval = setInterval(() => fetchBalance(id), BALANCE_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [walletState.connected, walletState.accountId, fetchBalance]);

  const connect = useCallback(async (pubkeyOverride?: string) => {
    setWalletState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      let pubkey = pubkeyOverride;

      if (!pubkey && typeof window !== 'undefined' && (window as unknown as { solana?: { connect: () => Promise<{ publicKey: { toString: () => string } }> } }).solana) {
        try {
          const solana = (window as unknown as { solana: { connect: () => Promise<{ publicKey: { toString: () => string } }> } }).solana;
          const resp = await solana.connect();
          pubkey = resp.publicKey.toString();
        } catch {
          // Phantom rejected or not installed
        }
      }

      if (!pubkey) {
        throw new Error('No wallet found. Install Phantom or Backpack, or enter a public key manually.');
      }

      // Lookup accounts on N1 for this pubkey
      let accountId: number | null = null;
      try {
        const userData = await nordApi.user(pubkey);
        if (userData.accounts && userData.accounts.length > 0) {
          accountId = userData.accounts[0].accountId;
        }
      } catch {
        // New user — no account yet on N1 testnet
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ publicKey: pubkey, accountId }));

      setWalletState({
        connected: true,
        publicKey: pubkey,
        accountId,
        balance: 0,
        connecting: false,
        error: null,
      });
      // Balance will be fetched by the polling effect above
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setWalletState(prev => ({
        ...prev,
        connecting: false,
        error: message,
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setWalletState({
      connected: false,
      publicKey: null,
      accountId: null,
      balance: 0,
      connecting: false,
      error: null,
    });
  }, []);

  const refreshBalance = useCallback(() => {
    if (walletState.accountId) fetchBalance(walletState.accountId);
  }, [walletState.accountId, fetchBalance]);

  return {
    ...walletState,
    connect,
    disconnect,
    refreshBalance,
  };
}

export type UseWalletReturn = ReturnType<typeof useWallet>;
