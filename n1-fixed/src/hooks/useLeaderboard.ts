/**
 * useLeaderboard — Fetches and ranks traders by ROI/win-rate
 * using real N1 API data from known testnet accounts.
 *
 * FIXES applied:
 * 1. ROI calculation used live balance as denominator — wrong.
 *    ROI should be totalPnl / (totalPnl + currentBalance) to approximate
 *    initial capital. Use absolute value guard to avoid division by zero.
 * 2. SEED_ACCOUNT_IDS expanded — accounts 1-10 are likely system/empty on testnet.
 *    Added a broader range and filter for accounts with actual activity.
 * 3. Polling used stale `symbols` closure. Fixed by always re-fetching inside the callback.
 * 4. Memory leak: interval could fire after unmount even with mountedRef check —
 *    made the guard more robust.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { nordApi } from '../lib/n1Client';
import type { Trader, LeaderboardSort } from '../shared/types';

// Broader range of testnet accounts to find active traders.
// In production these come from a backend that indexes N1 activity.
const SEED_ACCOUNT_IDS: number[] = Array.from({ length: 30 }, (_, i) => i + 1);

const POLL_INTERVAL = 15_000; // 15 seconds

interface UseLeaderboardReturn {
  traders: Trader[];
  loading: boolean;
  error: string | null;
  sort: LeaderboardSort;
  setSort: (sort: LeaderboardSort) => void;
  refresh: () => void;
  lastUpdated: Date | null;
  marketSymbols: Record<number, string>;
}

async function fetchTraderData(
  accountId: number,
  _marketSymbols: Record<number, string>
): Promise<Trader | null> {
  try {
    const [account, pnlSummary, pnlHistory] = await Promise.all([
      nordApi.account(accountId),
      nordApi.accountPnlSummary(accountId).catch(() => ({ realizedPnl: 0, unrealizedPnl: 0 })),
      nordApi.accountPnlHistory(accountId, { pageSize: 50 }).catch(() => ({ items: [], nextStartInclusive: undefined })),
    ]);

    const pnlItems = pnlHistory?.items ?? [];

    // Win rate: trades with positive PnL
    const winTrades = pnlItems.filter(p => p.realizedPnl > 0).length;
    const totalTrades = pnlItems.length;
    const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;

    const realizedPnl = pnlSummary?.realizedPnl ?? 0;
    const unrealizedPnl = pnlSummary?.unrealizedPnl ?? 0;
    const totalPnl = realizedPnl + unrealizedPnl;

    // FIX: ROI = totalPnl / estimatedStartingCapital
    // Starting capital ≈ current USDC balance + realized losses (i.e. balance before pnl)
    // Simple approximation: startingCapital = currentBalance + |realizedPnl| if loss, or currentBalance if gain
    const usdcBalance = account.balances?.['0'] ?? account.balances?.['USDC'] ?? 0;
    const estimatedCapital = usdcBalance + Math.abs(Math.min(realizedPnl, 0));
    const roi = estimatedCapital > 1 ? (totalPnl / estimatedCapital) * 100 : 0;

    // Build cumulative PnL chart data from history
    let cumulative = 0;
    const recentPnl = pnlItems
      .slice(0, 30)
      .reverse()
      .map(item => {
        cumulative += item.realizedPnl;
        return {
          timestamp: new Date(item.time).getTime(),
          value: item.realizedPnl,
          cumulative,
        };
      });

    const positions = account.positions.map(p => ({ ...p }));

    return {
      walletAddress: `account-${accountId}`,
      accountId,
      displayName: `Trader #${accountId}`,
      roi,
      winRate,
      totalPnl,
      totalTrades,
      followers: 0,
      feePct: 10,
      aum: 0,
      positions,
      recentPnl,
      isActive: positions.some(p => p.baseSize !== 0),
      rank: 0,
      volume24h: 0,
      drawdown: 0,
    };
  } catch (err) {
    console.warn(`Could not fetch account ${accountId}:`, err);
    return null;
  }
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<LeaderboardSort>({ field: 'roi', direction: 'desc' });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [marketSymbols, setMarketSymbols] = useState<Record<number, string>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const loadMarkets = useCallback(async () => {
    try {
      const info = await nordApi.info();
      const symbols: Record<number, string> = {};
      info.markets.forEach(m => { symbols[m.id] = m.symbol; });
      if (mountedRef.current) setMarketSymbols(symbols);
      return symbols;
    } catch {
      return {};
    }
  }, []);

  const fetchLeaderboard = useCallback(async (symbols: Record<number, string>) => {
    try {
      // FIX: Batch in groups of 10 to avoid hammering the API with 30 parallel requests
      const batches: Promise<Trader | null>[][] = [];
      for (let i = 0; i < SEED_ACCOUNT_IDS.length; i += 10) {
        batches.push(SEED_ACCOUNT_IDS.slice(i, i + 10).map(id => fetchTraderData(id, symbols)));
      }

      const allResults: (Trader | null)[] = [];
      for (const batch of batches) {
        if (!mountedRef.current) return;
        const results = await Promise.allSettled(batch);
        results.forEach(r => allResults.push(r.status === 'fulfilled' ? r.value : null));
      }

      if (!mountedRef.current) return;

      const validTraders: Trader[] = allResults
        .filter((t): t is Trader => t !== null)
        .filter(t => t.totalTrades > 0 || t.positions.length > 0);

      const sorted = validTraders
        .sort((a, b) => b.roi - a.roi)
        .map((t, i) => ({ ...t, rank: i + 1 }));

      setTraders(sorted);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Failed to load leaderboard';
      setError(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    const symbols = await loadMarkets();
    await fetchLeaderboard(symbols);
  }, [loadMarkets, fetchLeaderboard]);

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      const symbols = await loadMarkets();
      await fetchLeaderboard(symbols);
    };

    init();

    // FIX: Interval callback re-fetches markets each time (no stale closure)
    intervalRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      const symbols = await loadMarkets();
      if (!mountedRef.current) return;
      fetchLeaderboard(symbols);
    }, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadMarkets, fetchLeaderboard]);

  // Apply sort
  const sortedTraders = [...traders].sort((a, b) => {
    const dir = sort.direction === 'desc' ? -1 : 1;
    const aVal = a[sort.field] as number;
    const bVal = b[sort.field] as number;
    return dir * (bVal - aVal);
  }).map((t, i) => ({ ...t, rank: i + 1 }));

  return {
    traders: sortedTraders,
    loading,
    error,
    sort,
    setSort,
    refresh,
    lastUpdated,
    marketSymbols,
  };
}
