import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, TrendingUp, TrendingDown, DollarSign, Zap, Shield,
  Users, X, AlertCircle, BarChart2, Activity, CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAccount, useAccountPnlSummary, useAccountPnlHistory } from '../hooks/useN1Api';
import PnLChart from '../components/PnLChart';
import TradeLog from '../components/TradeLog';
import type { UseWalletReturn } from '../hooks/useWallet';
import type { Follow } from '../shared/types';

interface FollowerDashboardProps {
  wallet: UseWalletReturn;
}

// In production these would come from our Postgres backend
const MOCK_FOLLOWS: Follow[] = [];

export default function FollowerDashboard({ wallet }: FollowerDashboardProps) {
  const [follows] = useState<Follow[]>(MOCK_FOLLOWS);
  const [exitTarget, setExitTarget] = useState<Follow | null>(null);
  const [exiting, setExiting] = useState(false);

  const accountQuery = useAccount(wallet.accountId);
  const pnlQuery = useAccountPnlSummary(wallet.accountId);
  const pnlHistoryQuery = useAccountPnlHistory(wallet.accountId, { pageSize: 50 });

  const account = accountQuery.data;
  const pnl = pnlQuery.data;
  const pnlItems = pnlHistoryQuery.data?.items ?? [];

  const usdcBalance = account?.balances?.['0'] ?? account?.balances?.['USDC'] ?? 0;
  const positions = account?.positions?.filter(p => p.baseSize !== 0) ?? [];
  const totalPnl = pnl ? (pnl.realizedPnl ?? 0) + (pnl.unrealizedPnl ?? 0) : 0;

  const winTrades = pnlItems.filter(p => p.realizedPnl > 0).length;
  const winRate = pnlItems.length > 0 ? (winTrades / pnlItems.length) * 100 : 0;

  const handleExit = async () => {
    setExiting(true);
    await new Promise(r => setTimeout(r, 1200));
    setExiting(false);
    setExitTarget(null);
  };

  if (!wallet.connected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Shield size={48} className="text-gray-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Follower Dashboard</h2>
        <p className="text-gray-400">Connect your wallet to view your copy trading positions.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs text-violet-400 font-medium">Follower Mode · N1 Testnet</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">My Copy Portfolio</h1>
        <p className="text-gray-500 font-mono text-sm mt-0.5">
          Account #{wallet.accountId ?? '—'} · {wallet.publicKey?.slice(0, 8)}...
        </p>
      </motion.div>

      {/* Account stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        {[
          {
            icon: DollarSign,
            label: 'USDC Balance',
            value: accountQuery.isLoading ? '...' : `$${usdcBalance.toFixed(2)}`,
            color: 'text-white',
          },
          {
            icon: TrendingUp,
            label: 'Total PnL',
            value: pnlQuery.isLoading ? '...' : `${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toFixed(2)}`,
            color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400',
          },
          {
            icon: Copy,
            label: 'Active Copies',
            value: follows.filter(f => f.active).length,
            color: 'text-violet-400',
          },
          {
            icon: BarChart2,
            label: 'Win Rate',
            value: `${winRate.toFixed(0)}%`,
            color: winRate >= 50 ? 'text-emerald-400' : 'text-red-400',
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-[#0d1117]/80 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={12} className={color} />
              <span className="text-gray-500 text-xs">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active copy positions + PnL chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active copies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0d1117]/80 border border-white/[0.06] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-violet-400" />
                <h2 className="text-sm font-semibold text-gray-300">Active Copy Positions</h2>
              </div>
              <a
                href="/"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                Browse traders
                <ExternalLink size={10} />
              </a>
            </div>

            {follows.filter(f => f.active).length === 0 ? (
              <div className="text-center py-12">
                <Copy size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">Not copying anyone yet</p>
                <p className="text-gray-600 text-sm mt-1 mb-4">
                  Browse the leaderboard and follow a top trader to get started
                </p>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
                >
                  View Leaderboard
                  <TrendingUp size={14} />
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {follows.filter(f => f.active).map(follow => (
                  <FollowCard
                    key={`${follow.followerWallet}-${follow.expertWallet}`}
                    follow={follow}
                    onExit={() => setExitTarget(follow)}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* PnL Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0d1117]/80 border border-white/[0.06] rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={16} className="text-violet-400" />
              <h2 className="text-sm font-semibold text-gray-300">Your PnL History</h2>
            </div>
            {wallet.accountId ? (
              <PnLChart accountId={wallet.accountId} title="Follower PnL" />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                No account ID found
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Open positions + Live feed */}
        <div className="space-y-6">
          {/* Live account positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0d1117]/80 border border-white/[0.06] rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-violet-400" />
              <h2 className="text-sm font-semibold text-gray-300">Open Positions</h2>
            </div>

            {accountQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Activity size={20} className="mx-auto mb-2" />
                <p className="text-sm">No open positions</p>
              </div>
            ) : (
              <div className="space-y-2">
                {positions.map((pos, i) => {
                  const isLong = pos.baseSize > 0;
                  return (
                    <div key={i} className={`p-3 rounded-xl border ${isLong ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-semibold text-sm">MKT-{pos.marketId}</span>
                        <span className={`flex items-center gap-1 text-xs font-bold ${isLong ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isLong ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isLong ? 'LONG' : 'SHORT'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Size: <span className="text-gray-300 font-mono">{Math.abs(pos.baseSize).toFixed(4)}</span></span>
                        <span>@ <span className="text-gray-300 font-mono">${pos.price.toLocaleString()}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Live trade feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0d1117]/80 border border-white/[0.06] rounded-2xl p-5"
          >
            <TradeLog marketSymbol="BTCUSDC" maxItems={8} />
          </motion.div>
        </div>
      </div>

      {/* Exit modal */}
      <AnimatePresence>
        {exitTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setExitTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#0e1117] border border-white/10 rounded-2xl p-6 z-10"
            >
              <button onClick={() => setExitTarget(null)} className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white">
                <X size={16} />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Exit Copy Trade?</h3>
                  <p className="text-gray-500 text-xs">This will close your copy position</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Your allocation of <span className="text-white font-bold">${exitTarget.depositAmount}</span> will be returned.
                Any open copied positions will be closed at market price.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setExitTarget(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm font-semibold">
                  Keep Copying
                </button>
                <button
                  onClick={handleExit}
                  disabled={exiting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-all disabled:opacity-60"
                >
                  {exiting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Exiting...
                    </span>
                  ) : 'Exit Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FollowCard({ follow, onExit }: { follow: Follow; onExit: () => void }) {
  const pnlColor = (follow.totalCopiedPnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
            T
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Trader #{follow.expertAccountId}</p>
            <p className="text-gray-500 text-xs">{new Date(follow.startedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs">Active</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p className="text-gray-600 text-xs">Allocated</p>
          <p className="text-white text-sm font-mono font-semibold">${follow.depositAmount}</p>
        </div>
        <div>
          <p className="text-gray-600 text-xs">Copy PnL</p>
          <p className={`text-sm font-mono font-semibold ${pnlColor}`}>
            {(follow.totalCopiedPnl ?? 0) >= 0 ? '+' : ''}${(follow.totalCopiedPnl ?? 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-gray-600 text-xs">Fees Paid</p>
          <p className="text-yellow-400 text-sm font-mono font-semibold">${(follow.totalFeePaid ?? 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <CheckCircle2 size={11} className="text-emerald-400" />
          Atomic execution
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-all"
        >
          <Users size={11} />
          Exit
        </button>
      </div>
    </div>
  );
}
