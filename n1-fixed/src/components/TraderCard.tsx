import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Star, Zap, Copy } from 'lucide-react';
import type { Trader } from '../shared/types';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface TraderCardProps {
  trader: Trader;
  rank: number;
  onFollow: (trader: Trader) => void;
  isFollowing?: boolean;
  marketSymbols: Record<number, string>;
  delay?: number;
}

export default function TraderCard({
  trader,
  rank,
  onFollow,
  isFollowing = false,
  marketSymbols,
  delay = 0,
}: TraderCardProps) {
  const isPositive = trader.roi >= 0;
  const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
  const rankBgs = ['bg-yellow-400/10 border-yellow-400/30', 'bg-gray-400/10 border-gray-400/30', 'bg-amber-600/10 border-amber-600/30'];

  const chartData = trader.recentPnl.length > 0
    ? trader.recentPnl.map(p => ({ value: p.cumulative }))
    : [{ value: 0 }, { value: 0 }];

  const chartColor = trader.recentPnl.length > 0 && trader.recentPnl[trader.recentPnl.length - 1]?.cumulative >= 0
    ? '#10b981'
    : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
      className="group relative bg-[#0d1117]/80 border border-white/[0.06] hover:border-indigo-500/30 rounded-2xl p-4 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 via-transparent to-violet-500/0 group-hover:from-indigo-500/5 group-hover:to-violet-500/5 transition-all duration-500 pointer-events-none" />

      {/* Top row */}
      <div className="flex items-start gap-3 mb-3">
        {/* Rank badge */}
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${rank <= 3 ? rankBgs[rank - 1] + ' ' + rankColors[rank - 1] : 'bg-white/5 border-white/10 text-gray-400'}`}>
          {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
        </div>

        {/* Avatar */}
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${getTraderColor(trader.accountId)} 0%, ${getTraderColor(trader.accountId + 3)} 100%)`,
            }}
          >
            {trader.displayName?.charAt(0) ?? 'T'}
          </div>
          {trader.isActive && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d1117]" />
          )}
        </div>

        {/* Name & address */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {trader.displayName ?? `Account ${trader.accountId}`}
          </p>
          <p className="text-gray-500 text-xs font-mono truncate">
            acct #{trader.accountId}
          </p>
        </div>

        {/* ROI badge */}
        <div className={`shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
          {isPositive ? '+' : ''}{trader.roi.toFixed(1)}%
        </div>
      </div>

      {/* Mini chart */}
      <div className="h-14 mb-3 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, bottom: 2 }}>
            <defs>
              <linearGradient id={`grad-${trader.accountId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={1.5}
              fill={`url(#grad-${trader.accountId})`}
              dot={false}
              isAnimationActive={false}
            />
            <Tooltip
              content={() => null}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="Win Rate" value={`${trader.winRate.toFixed(0)}%`} positive={trader.winRate >= 50} />
        <Stat label="Total PnL" value={`$${formatNum(trader.totalPnl)}`} positive={trader.totalPnl >= 0} />
        <Stat label="Trades" value={String(trader.totalTrades)} />
      </div>

      {/* Active positions */}
      {trader.positions.filter(p => p.baseSize !== 0).length > 0 && (
        <div className="flex gap-1 mb-3 flex-wrap">
          {trader.positions
            .filter(p => p.baseSize !== 0)
            .slice(0, 3)
            .map((pos, i) => (
              <div
                key={i}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${pos.baseSize > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
              >
                {pos.baseSize > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {marketSymbols[pos.marketId] ?? `MKT-${pos.marketId}`}
              </div>
            ))}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users size={11} />
            {trader.followers} followers
          </span>
          <span className="flex items-center gap-1">
            <Star size={11} />
            {trader.feePct}% fee
          </span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onFollow(trader); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            isFollowing
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
          }`}
        >
          {isFollowing ? (
            <>
              <Zap size={11} />
              Copying
            </>
          ) : (
            <>
              <Copy size={11} />
              Copy
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-2">
      <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-xs font-semibold ${positive === undefined ? 'text-white' : positive ? 'text-emerald-400' : 'text-red-400'}`}>
        {value}
      </p>
    </div>
  );
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(2);
}

function getTraderColor(seed: number): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#06b6d4', '#f97316', '#84cc16',
  ];
  return colors[seed % colors.length];
}
