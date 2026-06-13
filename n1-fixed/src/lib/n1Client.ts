/**
 * N1 API Base Client
 * Wraps all REST calls to Nord (trading engine) and Proton (protocol layer)
 * Base URL: https://api.n1.xyz (testnet)
 *
 * FIX: Nord and Proton use different base paths, not the same root.
 *      Also added CORS-safe fetch with 'cors' mode.
 */

// N1 Testnet API base — Nord trading engine
export const N1_NORD_BASE = 'https://api.n1.xyz';
// N1 Testnet API base — Proton protocol layer (same host, different path prefix)
export const N1_PROTON_BASE = 'https://api.n1.xyz';

// FIX: WebSocket should use wss:// — already correct, but add /ws path clarification
export const N1_WS_BASE = 'wss://api.n1.xyz';

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

class N1ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'N1ApiError';
  }
}

function buildUrl(base: string, path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
  const url = new URL(path, base);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

// FIX: Added timeout (10s) to all API calls — without this, stalled requests hang forever
async function n1Fetch<T>(base: string, path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOpts } = options;
  const url = buildUrl(base, path, params);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      ...fetchOpts,
      // FIX: explicit mode:'cors' — N1 API supports CORS on testnet
      mode: 'cors',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...fetchOpts.headers,
      },
    });

    if (!response.ok) {
      let message = `N1 API error ${response.status}`;
      try {
        const errJson = await response.json();
        message = errJson?.message || errJson?.error || message;
      } catch {
        // ignore parse error
      }
      throw new N1ApiError(message, response.status);
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Nord (Trading Engine) API ──────────────────────────────────────────────

export const nordApi = {
  /** GET /live — liveness probe */
  live: () => n1Fetch<void>(N1_NORD_BASE, '/live'),

  /** GET /health — operational health */
  health: () => n1Fetch<{ status: string }>(N1_NORD_BASE, '/health'),

  /** GET /info — markets and tokens list */
  info: () => n1Fetch<{
    markets: Array<{
      id: number;
      symbol: string;
      baseDecimals: number;
      quoteDecimals: number;
    }>;
    tokens: Array<{
      id: number;
      symbol: string;
      decimals: number;
    }>;
  }>(N1_NORD_BASE, '/info'),

  /** GET /markets/live — all markets live info */
  marketsLive: () => n1Fetch<Record<string, {
    indexPrice: number;
    markPrice: number;
    fundingRate: number;
    openInterest?: number;
  }>>(N1_NORD_BASE, '/markets/live'),

  /** GET /market/{market_id}/live */
  marketLive: (marketId: number) =>
    n1Fetch<{
      marketId: number;
      indexPrice: number;
      markPrice: number;
      fundingRate: number;
    }>(N1_NORD_BASE, `/market/${marketId}/live`),

  /** GET /market/{market_id}/stats */
  marketStats: (marketId: number) =>
    n1Fetch<{
      marketId: number;
      indexPrice: number;
      markPrice: number;
      fundingRate: number;
      openInterest: number;
      volume: number;
    }>(N1_NORD_BASE, `/market/${marketId}/stats`),

  /** GET /market/{market_id}/orderbook */
  orderbook: (marketId: number) =>
    n1Fetch<{
      asks: [number, number][];
      bids: [number, number][];
    }>(N1_NORD_BASE, `/market/${marketId}/orderbook`),

  /** GET /user/{pubkey} — account IDs for a wallet */
  user: (pubkey: string) =>
    n1Fetch<{
      accounts: Array<{ accountId: number; sessionKey?: string }>;
    }>(N1_NORD_BASE, `/user/${pubkey}`),

  /** GET /account/{account_id} — full account snapshot */
  account: (accountId: number) =>
    n1Fetch<{
      accountId: number;
      balances: Record<string, number>;
      positions: Array<{
        marketId: number;
        baseSize: number;
        price: number;
        updatedFundingRateIndex?: number;
      }>;
    }>(N1_NORD_BASE, `/account/${accountId}`),

  /** GET /account/{account_id}/orders */
  accountOrders: (
    accountId: number,
    opts?: { startInclusive?: number; pageSize?: number }
  ) =>
    n1Fetch<{
      items: Array<{
        orderId: number;
        marketId: number;
        side: 'bid' | 'ask';
        price: number;
        size: number;
        remainingSize: number;
        time: string;
      }>;
      nextStartInclusive?: number;
    }>(N1_NORD_BASE, `/account/${accountId}/orders`, { params: opts }),

  /** GET /account/{account_id}/history/pnl */
  accountPnlHistory: (
    accountId: number,
    opts?: {
      marketId?: number;
      since?: string;
      until?: string;
      startInclusive?: number;
      pageSize?: number;
    }
  ) =>
    n1Fetch<{
      items: Array<{
        time: string;
        actionId: number;
        marketId: number;
        realizedPnl: number;
      }>;
      nextStartInclusive?: number;
    }>(N1_NORD_BASE, `/account/${accountId}/history/pnl`, { params: opts }),

  /** GET /account/{account_id}/pnl/summary */
  accountPnlSummary: (
    accountId: number,
    opts?: {
      marketId?: number;
      since?: string;
      until?: string;
    }
  ) =>
    n1Fetch<{
      realizedPnl: number;
      unrealizedPnl: number;
    }>(N1_NORD_BASE, `/account/${accountId}/pnl/summary`, { params: opts }),

  /** GET /account/{account_id}/history/position */
  accountPositionHistory: (
    accountId: number,
    opts?: {
      marketId?: number;
      since?: string;
      until?: string;
      startInclusive?: string;
      pageSize?: number;
    }
  ) =>
    n1Fetch<{
      items: Array<{
        time: string;
        marketId: number;
        baseSize: number;
        price: number;
      }>;
      nextStartInclusive?: string;
    }>(N1_NORD_BASE, `/account/${accountId}/history/position`, { params: opts }),

  /** GET /account/{account_id}/fees/withdrawal */
  withdrawalFee: (accountId: number) =>
    n1Fetch<number>(N1_NORD_BASE, `/account/${accountId}/fees/withdrawal`),

  /** GET /action/last-executed-id */
  lastExecutedActionId: () =>
    n1Fetch<number>(N1_NORD_BASE, '/action/last-executed-id'),

  /** GET /timestamp */
  timestamp: () =>
    n1Fetch<number>(N1_NORD_BASE, '/timestamp'),

  /** GET /tokens/{token_id}/stats */
  tokenStats: (tokenId: number) =>
    n1Fetch<{
      price: number;
      tokenId: number;
    }>(N1_NORD_BASE, `/tokens/${tokenId}/stats`),

  /** GET /market/{market_id}/fees/{fee_kind}/{account_id} */
  marketFees: (marketId: number, feeKind: 'maker' | 'taker', accountId: number) =>
    n1Fetch<number>(N1_NORD_BASE, `/market/${marketId}/fees/${feeKind}/${accountId}`),

  /** GET /tv/history — TradingView-compatible candle history */
  tvHistory: (params: {
    market_id?: number;
    symbol?: string;
    from?: string;
    to: string;
    resolution: string;
    countback?: number;
  }) =>
    n1Fetch<{
      s: 'ok' | 'no_data';
      t?: number[];
      o?: number[];
      h?: number[];
      l?: number[];
      c?: number[];
      v?: number[];
    }>(N1_NORD_BASE, '/tv/history', { params: params as Record<string, string | number | boolean | undefined | null> }),
};

// ─── Proton (Protocol Layer) API ────────────────────────────────────────────

export const protonApi = {
  /** GET /proton/v0/config */
  config: () =>
    n1Fetch<Record<string, unknown>>(N1_PROTON_BASE, '/proton/v0/config'),

  /** GET /proton/v0/last-block-ids */
  lastBlockIds: () =>
    n1Fetch<{ blockId: string; slot: number }>(N1_PROTON_BASE, '/proton/v0/last-block-ids'),

  /** GET /proton/v0/deposits/by-recipient/{pubkey} */
  depositsByRecipient: (pubkey: string) =>
    n1Fetch<Array<{
      amount: number;
      tokenId: number;
      slot: number;
      txHash: string;
    }>>(N1_PROTON_BASE, `/proton/v0/deposits/by-recipient/${pubkey}`),
};

// ─── WebSocket Helper ───────────────────────────────────────────────────────

export type WsStreamType =
  | `trades@${string}`
  | `deltas@${string}`
  | `account@${number}`
  | `candle@${string}:${string}`;

// FIX: Added reconnect logic with exponential backoff.
// Original had no reconnect — a single network blip killed the live feed forever.
export function createN1WebSocket(
  streams: WsStreamType[],
  onMessage: (data: unknown) => void,
  onError?: (err: Event) => void,
  onClose?: () => void,
  maxRetries = 5
): { close: () => void } {
  let ws: WebSocket;
  let retries = 0;
  let closed = false;

  function connect() {
    const streamPath = streams.join('&');
    ws = new WebSocket(`${N1_WS_BASE}/ws/${streamPath}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        onMessage(data);
      } catch {
        // ignore parse error
      }
    };

    ws.onerror = (err) => {
      if (onError) onError(err);
    };

    ws.onclose = () => {
      if (closed) {
        if (onClose) onClose();
        return;
      }
      if (retries < maxRetries) {
        retries++;
        const delay = Math.min(1000 * 2 ** retries, 30_000);
        setTimeout(connect, delay);
      } else {
        if (onClose) onClose();
      }
    };
  }

  connect();

  return {
    close: () => {
      closed = true;
      ws?.close();
    },
  };
}

export default { nordApi, protonApi, createN1WebSocket };
