import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, TrendingUp, Users, Trophy, RefreshCw, AlertTriangle,
  Zap, BarChart2, Globe, ChevronUp, ChevronDown,
} from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import TraderCard from '../components/TraderCard';
import FollowModal from '../components/FollowModal';
import HeroSection from '../components/HeroSection';
import { useMarketsLive, useMarketsInfo } from '../hooks/useN1Api';
import type { Trader, LeaderboardSort } from '../shared/types';
import type { UseWalletReturn } from '../hooks/useWallet';

interface LeaderboardProps {
  wallet: UseWalletReturn;
}

type SortField = LeaderboardSort['field'];

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'roi', label: 'ROI' },
  { field: 'winRate', label: 'Win Rate' },
  { field: 'totalPnl', label: 'Total PnL' },
  { field: 'followers', label: 'Followers' },
];

export default function Leaderboard({ wallet }: LeaderboardProps) {
  const { traders, loading, error, sort, setSort, refresh, lastUpdated, marketSymbols } = useLeaderboard();
  const marketsLive = useMarketsLive();
  const marketsInfo = useMarketsInfo();
  const [search, setSearch] = useState('');
  const [followTarget, setFollowTarget] = useState<Trader | null>(null);
  const [following, setFollowing] = useState<Set<number>>(new Set());

  const liveMarkets = marketsLive.data ?? {};
  const markets = marketsInfo.data?.markets ?? [];

  const filteredTraders = traders.filter(t =>
    !search ||
    t.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    String(t.accountId).includes(search)
  );

  const handleFollow = (trader: Trader) => {
    if (!wallet.connected) return;
    setFollowTarget(trader);
  };

  const handleConfirmFollow = async (trader: Trader, depositAmount: number) => {
    // In production: POST to our backend, which stores the follow relationship
    // and begins polling the expert's N1 account for trades to mirror
    console.log('Follow confirmed:', { trader: trader.accountId, depositAmount });
    await new Promise(r => setTimeout(r, 1500)); // simulate API call
    setFollowing(prev => new Set([...prev, trader.accountId]));
  };

  const handleSortField = (field: SortField) => {
    if (sort.field === field) {
      setSort({ field, direction: sort.direction === 'desc' ? 'asc' : 'desc' });
    } else {
      setSort({ field, direction: 'desc' });
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ChevronUp size={12} className="text-gray-600" />;
    return sort.direction === 'desc'
      ? <ChevronDown size={12} className="text-indigo-400" />
      : <ChevronUp size={12} className="text-indigo-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Hero */}
      <HeroSection />

      {/* Live market prices */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-2 mb-8 mt-4"
      >
        {markets.slice(0, 8).map(market => {
          const live = liveMarkets[market.symbol];
          return (
            <motion.div
              key={market.id}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs"
            >
              <span className="text-gray-400 font-medium">{market.symbol}</span>
              {live ? (
                <span className="text-white font-mono font-semibold">
                  ${(live.indexPrice ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              ) : (
                <span className="text-gray-600 font-mono">—</span>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Leaderboard stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
      >
        {[
          { icon: Trophy, label: 'Tracked Traders', value: traders.length, color: 'text-yellow-400' },
          { icon: TrendingUp, label: 'Avg ROI', value: `${traders.length > 0 ? (traders.reduce((s, t) => s + t.roi, 0) / traders.length).toFixed(1) : '0'}%`, color: 'text-emerald-400' },
          { icon: Users, label: 'Total Followers', value: traders.reduce((s, t) => s + t.followers, 0), color: 'text-indigo-400' },
          { icon: Zap, label: 'Live Markets', value: markets.length, color: 'text-violet-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-[#0d1117]/80 border border-white/[0.06] rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon size={12} className={color} />
              <span className="text-gray-500 text-xs">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search traders..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/40 text-white placeholder-gray-600 text-sm outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.field}
              onClick={() => handleSortField(opt.field)}
              className={`flex items-center gap-1 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                sort.field === opt.field
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {opt.label}
              <SortIcon field={opt.field} />
            </button>
          ))}

          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white text-xs transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-xs text-gray-600 mb-4 flex items-center gap-1">
          <Globe size={10} />
          Last updated: {lastUpdated.toLocaleTimeString()} · Polling every 15s
        </p>
      )}

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-6"
        >
          <AlertTriangle size={16} className="shrink-0" />
          <div>
            <p className="font-medium">N1 API Notice</p>
            <p className="text-amber-500/80 text-xs mt-0.5">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {loading && traders.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#0d1117]/80 border border-white/[0.06] rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/5" />
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <div className="flex-1">
                  <div className="h-3 bg-white/5 rounded w-24 mb-1" />
                  <div className="h-2 bg-white/5 rounded w-16" />
                </div>
              </div>
              <div className="h-14 bg-white/5 rounded-lg mb-3" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-10 bg-white/5 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No traders */}
      {!loading && filteredTraders.length === 0 && (
        <div className="text-center py-16">
          <BarChart2 size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No traders found</p>
          <p className="text-gray-600 text-sm mt-1">
            {search ? 'Try a different search term' : 'N1 API accounts are loading — try refreshing'}
          </p>
          <button onClick={refresh} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-sm hover:bg-indigo-600/30 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Trader grid */}
      {filteredTraders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTraders.map((trader, i) => (
            <TraderCard
              key={trader.accountId}
              trader={trader}
              rank={trader.rank}
              onFollow={handleFollow}
              isFollowing={following.has(trader.accountId)}
              marketSymbols={marketSymbols}
              delay={i * 0.05}
            />
          ))}
        </div>
      )}

      {/* Follow modal */}
      {followTarget && (
        <FollowModal
          trader={followTarget}
          onClose={() => setFollowTarget(null)}
          onConfirm={handleConfirmFollow}
          userBalance={wallet.balance}
          isFollowing={following.has(followTarget.accountId)}
        />
      )}
    </div>
  );
}
