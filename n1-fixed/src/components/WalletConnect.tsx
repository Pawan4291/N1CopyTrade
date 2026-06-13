import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, X, AlertCircle, Loader2, CheckCircle2, ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react';
import type { UseWalletReturn } from '../hooks/useWallet';

interface WalletConnectProps {
  wallet: UseWalletReturn;
}

export default function WalletConnect({ wallet }: WalletConnectProps) {
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualKey, setManualKey] = useState('');
  const [copied, setCopied] = useState(false);

  const shortAddr = wallet.publicKey
    ? `${wallet.publicKey.slice(0, 4)}...${wallet.publicKey.slice(-4)}`
    : null;

  const handleCopy = () => {
    if (wallet.publicKey) {
      navigator.clipboard.writeText(wallet.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async (pubkey?: string) => {
    await wallet.connect(pubkey);
    setShowModal(false);
  };

  const handleManualConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualKey.trim()) {
      handleConnect(manualKey.trim());
      setManualKey('');
    }
  };

  if (wallet.connected && shortAddr) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-400/60 text-indigo-300 transition-all duration-200 text-sm font-medium"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono">{shortAddr}</span>
          {wallet.balance > 0 && (
            <span className="text-emerald-400 font-semibold">
              ${wallet.balance.toFixed(2)}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-64 bg-[#0e1117] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">Connected to N1 Testnet</span>
                  </div>
                  <p className="font-mono text-xs text-gray-400 break-all">{wallet.publicKey}</p>
                  {wallet.accountId && (
                    <p className="text-xs text-gray-500 mt-1">Account ID: {wallet.accountId}</p>
                  )}
                </div>

                <div className="p-2">
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 text-sm transition-colors"
                  >
                    {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Address'}
                  </button>
                  <a
                    href={`https://app.n1.xyz/account/${wallet.accountId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 text-sm transition-colors"
                  >
                    <ExternalLink size={14} />
                    View on N1 App
                  </a>
                  <button
                    onClick={() => { wallet.disconnect(); setShowDropdown(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 text-sm transition-colors"
                  >
                    <LogOut size={14} />
                    Disconnect
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="relative group flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25"
      >
        <Wallet size={16} />
        Connect Wallet
        <span className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-[#0e1117] border border-white/10 rounded-2xl shadow-2xl p-6 z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Connect to N1</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Testnet — No real funds at risk</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {wallet.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
                  <AlertCircle size={16} className="shrink-0" />
                  {wallet.error}
                </div>
              )}

              {/* Phantom / Backpack */}
              <button
                onClick={() => handleConnect()}
                disabled={wallet.connecting}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#ab9ff2]/10 border border-[#ab9ff2]/30 hover:border-[#ab9ff2]/60 text-white transition-all mb-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#ab9ff2] flex items-center justify-center text-black font-bold text-lg">
                  👻
                </div>
                <div className="text-left">
                  <p className="font-semibold">Phantom</p>
                  <p className="text-xs text-gray-400">Solana wallet</p>
                </div>
                {wallet.connecting && <Loader2 size={16} className="ml-auto animate-spin text-indigo-400" />}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-500">
                  <span className="bg-[#0e1117] px-3">or enter pubkey manually</span>
                </div>
              </div>

              {/* Manual pubkey for testnet */}
              <form onSubmit={handleManualConnect} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={manualKey}
                    onChange={e => setManualKey(e.target.value)}
                    placeholder="Solana public key (base58)..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/60 text-white placeholder-gray-500 font-mono text-sm outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualKey.trim() || wallet.connecting}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all"
                >
                  {wallet.connecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Connecting...
                    </span>
                  ) : 'Connect'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500 mt-4">
                Connecting to N1 Testnet. Trade with test funds only.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
