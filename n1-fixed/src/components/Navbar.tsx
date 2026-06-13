import { motion } from 'framer-motion';
import { Zap, BarChart2, Copy, TrendingUp, ExternalLink } from 'lucide-react';
import WalletConnect from './WalletConnect';
import type { UseWalletReturn } from '../hooks/useWallet';

interface NavbarProps {
  wallet: UseWalletReturn;
  currentPage: 'leaderboard' | 'expert' | 'follower';
  onNavigate: (page: 'leaderboard' | 'expert' | 'follower') => void;
}

export default function Navbar({ wallet, currentPage, onNavigate }: NavbarProps) {
  const navItems = [
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: BarChart2 },
    { id: 'expert' as const, label: 'Expert', icon: TrendingUp },
    { id: 'follower' as const, label: 'Follower', icon: Copy },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 bg-[#080b12]/80 backdrop-blur-xl border-b border-white/[0.06]"
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate('leaderboard')}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={14} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-white font-extrabold text-sm tracking-tight">N1</span>
            <span className="text-indigo-400 font-extrabold text-sm"> CopyTrade</span>
          </div>
        </button>

        {/* Nav items */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                currentPage === id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {currentPage === id && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-indigo-600/40 rounded-lg border border-indigo-500/30"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon size={12} className="relative z-10" />
              <span className="relative z-10 hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Testnet badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Testnet
          </div>

          {/* N1 App link */}
          <a
            href="https://app.n1.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white text-xs transition-colors"
          >
            N1 App
            <ExternalLink size={10} />
          </a>

          <WalletConnect wallet={wallet} />
        </div>
      </div>
    </motion.nav>
  );
}
