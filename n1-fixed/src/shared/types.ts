// ─── N1 API Types (from Nord OpenAPI spec) ─────────────────────────────────

export interface N1MarketInfo {
  id: number;
  symbol: string;
  baseDecimals: number;
  quoteDecimals: number;
  baseName?: string;
  quoteName?: string;
}

export interface N1MarketsInfo {
  markets: N1MarketInfo[];
  tokens: N1TokenInfo[];
}

export interface N1TokenInfo {
  id: number;
  symbol: string;
  decimals: number;
  mint?: string;
}

export interface N1MarketLiveInfo {
  marketId: number;
  indexPrice: number;
  markPrice: number;
  fundingRate: number;
  openInterest?: number;
  volume24h?: number;
}

export interface N1MarketStats {
  marketId: number;
  indexPrice: number;
  markPrice: number;
  fundingRate: number;
  openInterest: number;
  volume: number;
  high24h?: number;
  low24h?: number;
}

export interface N1Position {
  marketId: number;
  baseSize: number;   // positive = long, negative = short
  price: number;      // average entry price
  updatedFundingRateIndex?: number;
}

export interface N1Account {
  accountId: number;
  balances: Record<string, number>;
  positions: N1Position[];
  orders?: N1OrderInfo[];
}

export interface N1OrderInfo {
  orderId: bigint | number;
  marketId: number;
  side: 'bid' | 'ask';
  price: number;
  size: number;
  remainingSize: number;
  time: string;
}

export interface N1PnlEntry {
  time: string;
  actionId: number;
  marketId: number;
  realizedPnl: number;
  unrealizedPnl?: number;
}

export interface N1PnlSummary {
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
}

export interface N1User {
  accounts: N1AccountRef[];
}

export interface N1AccountRef {
  accountId: number;
  sessionKey?: string;
}

export interface N1TradeHistory {
  time: string;
  actionId: number;
  marketId: number;
  side: 'bid' | 'ask';
  price: number;
  size: number;
  pnl?: number;
}

export interface N1PositionHistory {
  time: string;
  marketId: number;
  baseSize: number;
  price: number;
}

// ─── App-Level Types ────────────────────────────────────────────────────────

export type UserRole = 'expert' | 'follower' | 'none';

export interface AppUser {
  walletAddress: string;
  accountId?: number;
  role: UserRole;
  feePct?: number;          // for experts: their fee %
  createdAt?: string;
}

export interface Trader {
  walletAddress: string;
  accountId: number;
  displayName?: string;
  roi: number;              // % return on investment
  winRate: number;          // % of profitable trades
  totalPnl: number;         // cumulative PnL in USDC
  totalTrades: number;
  followers: number;
  feePct: number;           // copy fee charged to followers
  aum: number;              // assets under management (followers' deposits)
  positions: N1Position[];
  recentPnl: PnlPoint[];
  isActive: boolean;
  rank: number;
  volume24h: number;
  drawdown: number;         // max drawdown %
}

export interface PnlPoint {
  timestamp: number;
  value: number;
  cumulative: number;
}

export interface Follow {
  followerWallet: string;
  expertWallet: string;
  expertAccountId: number;
  depositAmount: number;    // USDC deposited to copy
  active: boolean;
  startedAt: string;
  totalCopiedPnl?: number;
  totalFeePaid?: number;
}

export interface CopyTrade {
  id: string;
  expertWallet: string;
  followerWallet: string;
  marketId: number;
  marketSymbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice?: number;
  pnl?: number;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
  feePaid?: number;
}

export interface FeeSplit {
  id: string;
  followId: string;
  tradeId: string;
  followerProfit: number;
  expertCut: number;
  settledAt: string;
}

export interface AtomicTxBundle {
  expertWallet: string;
  marketId: number;
  side: 'bid' | 'ask';
  followers: FollowerOrder[];
  timestamp: number;
}

export interface FollowerOrder {
  followerWallet: string;
  accountId: number;
  size: number;
  proportionalRatio: number;  // follower deposit / expert position size
}

export interface LeaderboardSort {
  field: 'roi' | 'winRate' | 'totalPnl' | 'followers' | 'aum';
  direction: 'asc' | 'desc';
}

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  accountId: number | null;
  balance: number;
  connecting: boolean;
  error: string | null;
}

// ─── WebSocket Stream Types ─────────────────────────────────────────────────

export interface WsTradeUpdate {
  action_id: number;
  physical_time: string;
  trade_id: number;
  side: 'bid' | 'ask';
  price: number;
  size: number;
  order_id: number;
}

export interface WsAccountUpdate {
  account_id: number;
  fills: Record<string, WsFillUpdate>;
  places: Record<string, WsOrderUpdate>;
  cancels: Record<string, WsOrderUpdate>;
  balances: Record<string, number>;
}

export interface WsFillUpdate {
  action_id: number;
  physical_time: string;
  trade_ids: number[];
  side: 'bid' | 'ask';
  quantity: number;
  remaining: number;
  price: number;
  order_id: number;
  market_id: number;
  maker_id: number;
  taker_id: number;
}

export interface WsOrderUpdate {
  action_id: number;
  physical_time: string;
  side: 'bid' | 'ask';
  current_size: number;
  price: number;
  market_id: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── API Response Wrappers ──────────────────────────────────────────────────

export interface PageResult<Cursor, Item> {
  items: Item[];
  nextStartInclusive?: Cursor;
}

export type N1ApiError = {
  type: 'not_found' | 'bad_request' | 'server_error' | 'network_error';
  message: string;
  status?: number;
};
