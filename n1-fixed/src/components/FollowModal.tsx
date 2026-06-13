import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, AlertCircle, TrendingUp, Users, Star, Shield, CheckCircle2 } from 'lucide-react';
import type { Trader } from '../shared/types';

interface FollowModalProps {
  trader: Trader | null;
  onClose: () => void;
  onConfirm: (trader: Trader, depositAmount: number) => Promise<void>;
  userBalance: number;
  isFollowing?: boolean;
}

export default function FollowModal({
  trader,
  onClose,
  onConfirm,
  userBalance,
  isFollowing = false,
}: FollowModalProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!trader) return null;

  const amount = parseFloat(depositAmount) || 0;
  const percentages = [25, 50, 75, 100];

  const handleConfirm = async () => {
    if (amount <= 0) { setError('Enter a deposit amount'); return; }
    if (amount > userBalance) { setError('Insufficient balance'); return; }
    if (amount < 10) { setError('Minimum deposit is $10 USDC'); return; }

    setError('');
    setLoading(true);
    try {
      await onConfirm(trader, amount);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-md bg-[#0e1117] border border-white/10 rounded-2xl shadow-2xl z-10 overflow-hidden"
        >
          {/* Header gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isFollowing ? 'Stop Copying' : 'Copy Trader'}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {isFollowing ? 'Withdraw your copy allocation' : 'Set your copy allocation'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {success ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-semibold text-lg">You're now copying!</p>
                <p className="text-gray-400 text-sm mt-1">
                  Trades will be mirrored instantly via N1 atomics
                </p>
              </motion.div>
            ) : (
              <>
                {/* Trader summary */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, #6366f1, #8b5cf6)`,
                      }}
                    >
                      {trader.displayName?.charAt(0) ?? 'T'}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{trader.displayName}</p>
                      <p className="text-gray-500 text-xs font-mono">acct #{trader.accountId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-emerald-400 font-bold">{trader.roi >= 0 ? '+' : ''}{trader.roi.toFixed(1)}%</p>
                      <p className="text-gray-500 text-xs">ROI</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">{trader.winRate.toFixed(0)}%</p>
                      <p className="text-gray-500 text-xs">Win Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">{trader.feePct}%</p>
                      <p className="text-gray-500 text-xs">Copy Fee</p>
                    </div>
                  </div>
                </div>

                {!isFollowing && (
                  <>
                    {/* Deposit amount */}
                    <div className="mb-4">
                      <label className="text-sm text-gray-400 mb-2 block">
                        Copy allocation (USDC)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={e => setDepositAmount(e.target.value)}
                          placeholder="0.00"
                          min="10"
                          max={userBalance}
                          step="0.01"
                          className="w-full pl-7 pr-20 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/60 text-white placeholder-gray-500 font-mono text-sm outline-none transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                          Max: ${userBalance.toFixed(0)}
                        </span>
                      </div>

                      {/* Percentage shortcuts */}
                      <div className="flex gap-2 mt-2">
                        {percentages.map(pct => (
                          <button
                            key={pct}
                            onClick={() => setDepositAmount(((userBalance * pct) / 100).toFixed(2))}
                            className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/40 text-gray-400 hover:text-indigo-300 text-xs transition-all"
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fee breakdown */}
                    {amount > 0 && (
                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 mb-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-400">
                          <span>Allocation</span>
                          <span className="text-white font-mono">${amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Expert fee on profits ({trader.feePct}%)</span>
                          <span className="text-yellow-400 font-mono">Deducted from gains</span>
                        </div>
                        <div className="border-t border-white/[0.06] pt-2 flex justify-between text-white font-semibold">
                          <span>Your net trade size</span>
                          <span className="font-mono">${amount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* How it works */}
                <div className="space-y-2 mb-4">
                  {[
                    { icon: Zap, text: 'Trades execute in ~40ms via N1 atomics', color: 'text-indigo-400' },
                    { icon: Shield, text: 'All-or-nothing execution — no partial fills', color: 'text-violet-400' },
                    { icon: TrendingUp, text: 'Proportional sizing based on your allocation', color: 'text-emerald-400' },
                    { icon: Users, text: 'Expert earns % only when you profit', color: 'text-blue-400' },
                    { icon: Star, text: 'Cancel anytime — full withdrawal on close', color: 'text-yellow-400' },
                  ].map(({ icon: Icon, text, color }, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                      <Icon size={12} className={color} />
                      {text}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading || (!isFollowing && amount <= 0)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFollowing
                        ? 'bg-red-500 hover:bg-red-400 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : isFollowing ? 'Stop Copying' : 'Start Copying'}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
