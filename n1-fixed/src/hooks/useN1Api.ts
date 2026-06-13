/**
 * useN1Api — React Query wrappers for all N1 REST API calls
 */

import { useQuery } from '@tanstack/react-query';
import { nordApi } from '../lib/n1Client';

// ─── Markets ──────────────────────────────────────────────────────────────

export function useMarketsInfo() {
  return useQuery({
    queryKey: ['markets', 'info'],
    queryFn: () => nordApi.info(),
    staleTime: 60_000, // 1 min — market list rarely changes
    retry: 2,
  });
}

export function useMarketsLive() {
  return useQuery({
    queryKey: ['markets', 'live'],
    queryFn: () => nordApi.marketsLive(),
    refetchInterval: 2_000, // refresh every 2s
    retry: 1,
  });
}

export function useMarketLive(marketId: number | undefined) {
  return useQuery({
    queryKey: ['market', marketId, 'live'],
    queryFn: () => nordApi.marketLive(marketId!),
    enabled: marketId !== undefined,
    refetchInterval: 2_000,
    retry: 1,
  });
}

export function useMarketStats(marketId: number | undefined) {
  return useQuery({
    queryKey: ['market', marketId, 'stats'],
    queryFn: () => nordApi.marketStats(marketId!),
    enabled: marketId !== undefined,
    refetchInterval: 5_000,
    retry: 1,
  });
}

export function useOrderbook(marketId: number | undefined) {
  return useQuery({
    queryKey: ['market', marketId, 'orderbook'],
    queryFn: () => nordApi.orderbook(marketId!),
    enabled: marketId !== undefined,
    refetchInterval: 1_000,
    retry: 1,
  });
}

// ─── Account / User ────────────────────────────────────────────────────────

export function useUser(pubkey: string | null) {
  return useQuery({
    queryKey: ['user', pubkey],
    queryFn: () => nordApi.user(pubkey!),
    enabled: !!pubkey,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAccount(accountId: number | null) {
  return useQuery({
    queryKey: ['account', accountId],
    queryFn: () => nordApi.account(accountId!),
    enabled: accountId !== null,
    refetchInterval: 3_000,
    retry: 1,
  });
}

export function useAccountOrders(accountId: number | null) {
  return useQuery({
    queryKey: ['account', accountId, 'orders'],
    queryFn: () => nordApi.accountOrders(accountId!, { pageSize: 50 }),
    enabled: accountId !== null,
    refetchInterval: 3_000,
    retry: 1,
  });
}

// ─── PnL & History ────────────────────────────────────────────────────────

export function useAccountPnlSummary(
  accountId: number | null,
  opts?: { marketId?: number; since?: string; until?: string }
) {
  return useQuery({
    queryKey: ['account', accountId, 'pnl', 'summary', opts],
    queryFn: () => nordApi.accountPnlSummary(accountId!, opts),
    enabled: accountId !== null,
    refetchInterval: 5_000,
    retry: 1,
  });
}

export function useAccountPnlHistory(
  accountId: number | null,
  opts?: {
    marketId?: number;
    since?: string;
    until?: string;
    pageSize?: number;
  }
) {
  return useQuery({
    queryKey: ['account', accountId, 'pnl', 'history', opts],
    queryFn: () => nordApi.accountPnlHistory(accountId!, {
      ...opts,
      pageSize: opts?.pageSize ?? 50,
    }),
    enabled: accountId !== null,
    refetchInterval: 10_000,
    retry: 1,
  });
}

export function useAccountPositionHistory(
  accountId: number | null,
  opts?: {
    marketId?: number;
    since?: string;
    until?: string;
    pageSize?: number;
  }
) {
  return useQuery({
    queryKey: ['account', accountId, 'positions', 'history', opts],
    queryFn: () => nordApi.accountPositionHistory(accountId!, {
      ...opts,
      pageSize: opts?.pageSize ?? 50,
    }),
    enabled: accountId !== null,
    refetchInterval: 10_000,
    retry: 1,
  });
}

// ─── Fees ──────────────────────────────────────────────────────────────────

export function useWithdrawalFee(accountId: number | null) {
  return useQuery({
    queryKey: ['account', accountId, 'fees', 'withdrawal'],
    queryFn: () => nordApi.withdrawalFee(accountId!),
    enabled: accountId !== null,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useMarketFees(
  marketId: number | undefined,
  feeKind: 'maker' | 'taker',
  accountId: number | null
) {
  return useQuery({
    queryKey: ['market', marketId, 'fees', feeKind, accountId],
    queryFn: () => nordApi.marketFees(marketId!, feeKind, accountId!),
    enabled: marketId !== undefined && accountId !== null,
    staleTime: 60_000,
    retry: 1,
  });
}

// ─── Network State ─────────────────────────────────────────────────────────

export function useNetworkTimestamp() {
  return useQuery({
    queryKey: ['network', 'timestamp'],
    queryFn: () => nordApi.timestamp(),
    refetchInterval: 5_000,
    retry: 1,
  });
}

export function useLastActionId() {
  return useQuery({
    queryKey: ['network', 'last-action-id'],
    queryFn: () => nordApi.lastExecutedActionId(),
    refetchInterval: 2_000,
    retry: 1,
  });
}

// ─── Candle / Chart History ─────────────────────────────────────────────────

export function useTvHistory(params: {
  market_id?: number;
  symbol?: string;
  resolution: string;
  to: string;
  from?: string;
  countback?: number;
}) {
  return useQuery({
    queryKey: ['tv', 'history', params],
    queryFn: () => nordApi.tvHistory(params),
    enabled: !!(params.market_id || params.symbol),
    staleTime: 30_000,
    retry: 1,
  });
}
