import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Users, TrendingUp, DollarSign, Zap, Shield,
  Edit3, CheckCircle2, BarChart2, Activity, Info,
} from 'lucide-react';
import { useAccount, useAccountPnlSummary, useAccountOrders } from '../hooks/useN1Api';
import PnLChart from '../components/PnLChart';
import TradeLog from '../components/TradeLog';
import type { UseWalletReturn } from '../hooks/useWallet';
import { useMarketsInfo } from '../hooks/useN1Api';

interface ExpertDashboardProps {
  wallet: UseWalletReturn;
}

export default function ExpertDashboard({ wallet }: ExpertDashboardProps) {
  const [feePct, setFeePct] = useState(10);
  const [editingFee, setEditingFee] = useState(false);
  const [pendingFee, setPendingFee] = useState(10);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeSaved, setFeeSaved] = useState(false);

  const accountQuery = useAccount(wallet.accountId);
  const pnlQuery = useAccountPnlSummary(wallet.accountId);
  const ordersQuery = useAccountOrders(wallet.accountId);
  const marketsQuery = useMarketsInfo();

  const account = accountQuery.data;
  const pnl = pnlQuery.data;
  const orders = ordersQuery.data?.items ?? [];
  const markets = marketsQuery.data?.markets ?? [];

  const marketSymbolMap = Object.fromEntries(markets.map(m => [m.id, m.symbol]));

  const usdcBalance = account?.balances?.['0'] ?? account?.balances?.['USDC'] ?? 0;
  const positions = account?.positions?.filter(p => p.baseSize !== 0) ?? [];

  const totalPnl = pnl ? (pnl.realizedPnl ?? 0) + (pnl.unrealizedPnl ?? 0) : 0;
  const isPositive = totalPnl >= 0;

  const saveFee = async () => {
    setFeeLoading(true);
    // In production: POST to backend to update fee for this expert wallet
    await new Promise(r => setTimeout(r, 800));
    setFeePct(pendingFee);
    setEditingFee(false);
    setFeeLoading(false);
    setFeeSaved(true);
    setTimeout(() => setFeeSaved(false), 3000);
  };

  if (!wallet.connected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Shield size={48} className="text-gray-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Expert Dashboard</h2>
        <p className="text-gray-400">Connect your wallet to view your expert trading dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Expert Mode · N1 Testnet</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Expert Dashboard</h1>
          <p className="text-gray-500 font-mono text-sm mt-0.5">
            Account #{wallet.accountId ?? '—'} · {wallet.publicKey?.slice(0, 8)}...
          </p>
        </div>

        {/* Fee settings */}
        <div className="bg-[#0d1117]/80 border border-white/[0.08] rounded-xl p-4 min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <Settings size={10} />
              Copy Fee
            </span>
            {!editingFee ? (
              <button
                onClick={() => { setEditingFee(true); setPendingFee(feePct); }}
                className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
              >
                <Edit3 size={12} />
              </button>
            ) : (
              <button
                onClick={() => setEditingFee(false)}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {editingFee ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={50}
                value={pendingFee}
                onChange={e => setPendingFee(Number(e.target.value))}
                className="w-16 px-2 py-1 rounded-lg bg-white/5 border border-indigo-500/40 text-white text-sm font-mono outline-none"
              />
              <span className="text-gray-400">%</span>
              <button
                onClick={saveFee}
                disabled={feeLoading}
                className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
              >
                {feeLoading ? '...' : 'Save'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{feePct}%</span>
              {feeSaved && (
                <span className="flex items-center gap-1 text-emerald-400 text-xs">
                  <CheckCircle2 size={12} />
                  Saved
                </span>
              )}
            </div>
          )}
          <p className="text-gray-600 text-xs mt-1">of follower profits</p>
        </div>
      </motion.div>

      {/* Stats row */}
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
            value: `$${usdcBalance.toFixed(2)}`,
            sub: 'Available',
            color: 'text-white',
            loading: accountQuery.isLoading,
          },
          {
            icon: TrendingUp,
            label: 'Total PnL',
            value: `${isPositive ? '+' : ''}$${Math.abs(totalPnl).toFixed(2)}`,
            sub: 'All time',
            color: isPositive ? 'text-emerald-400' : 'text-red-400',
            loading: pnlQuery.isLoading,
          },
          {
            icon: Activity,
            label: 'Open Positions',
            value: positions.length,
            sub: 'Active',
            color: 'text-indigo-400',
            loading: accountQuery.isLoading,
          },
          {
            icon: Users,
            label: 'Open Orders',
            value: orders.length,
            sub: 'Pending',
            color: 'text-violet-400',
            loading: ordersQuery.isLoading,
          },
        ].map(({ icon: Icon, label, value, sub, color, loading }) => (
          <div key={label} className="bg-[#0d1117]/80 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={12} className={color} />
              <span className="text-gray-500 text-xs">{label}</span>
            </div>
            {loading ? (
              <div className="h-7 bg-white/5 rounded animate-pulse w-20" />
            ) : (
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            )}
            <p className="text-gray-600 text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PnL Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-[#0d1117]/80 border border-white/[0.06] rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-gray-300">Your PnL History</h2>
            <span className="text-xs text-gray-600">· from N1 API</span>
          </div>
          {wallet.accountId ? (
            <PnLChart accountId={wallet.accountId} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
              No account ID found
            </div>
          )}
        </motion.div>

        {/* Live positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117]/80 border border-white/[0.06] rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-gray-300">Open Positions</h2>
          </div>

          {accountQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Activity size={20} className="mx-auto mb-2" />
              <p className="text-sm">No open positions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {positions.map((pos, i) => {
                const symbol = marketSymbolMap[pos.marketId] ?? `MKT-${pos.marketId}`;
                const isLong = pos.baseSize > 0;
                return (
                  <div key={i} className={`p-3 rounded-xl border ${isLong ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold text-sm">{symbol}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isLong ? 'LONG' : 'SHORT'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Size: <span className="text-white font-mono">{Math.abs(pos.baseSize).toFixed(4)}</span></span>
                      <span>Entry: <span className="text-white font-mono">${pos.price.toLocaleString()}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Live trade feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-[#0d1117]/80 border border-white/[0.06] rounded-2xl p-5"
      >
        <TradeLog
          expertAccountId={wallet.accountId ?? undefined}
          marketSymbol={markets[0]?.symbol ?? 'BTCUSDC'}
        />
      </motion.div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-indigo-300 text-sm"
      >
        <Info size={16} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">How Expert Copy Trading Works on N1</p>
          <p className="text-indigo-400/70 text-xs leading-relaxed">
            When you trade normally on N1, our system polls your positions every 500ms. When an open/close event is detected,
            an atomic TX bundle is built for all your followers simultaneously. Every follower's trade executes in the same
            atomic transaction (~40ms) — no intermediate state, no partial fills. You earn {feePct}% of each follower's profit.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
