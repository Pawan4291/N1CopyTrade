import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from './hooks/useWallet';
import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';
import MarketTicker from './components/MarketTicker';
import NetworkStatus from './components/NetworkStatus';
import Leaderboard from './pages/Leaderboard';
import ExpertDashboard from './pages/ExpertDashboard';
import FollowerDashboard from './pages/FollowerDashboard';
import GlitchText from './components/GlitchText';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5_000,
    },
  },
});

type Page = 'leaderboard' | 'expert' | 'follower';

function AppInner() {
  const wallet = useWallet();
  const [page, setPage] = useState<Page>('leaderboard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen hero-bg relative overflow-x-hidden">
      {/* Animated particle background */}
      <AnimatedBackground />

      {/* Scan line effect */}
      <div className="scan-line" />

      {/* Large background glow orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.02) 0%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite',
          }}
        />
      </div>

      {/* Main content above background */}
      <div className="relative z-10">
        {/* Navbar */}
        <Navbar wallet={wallet} currentPage={page} onNavigate={setPage} />

        {/* Market ticker */}
        <MarketTicker />

        {/* Splash / hero on first load */}
        <AnimatePresence>
          {mounted && page === 'leaderboard' && (
            <motion.div
              key="hero-banner"
              initial={false}
              className="relative"
            />
          )}
        </AnimatePresence>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {page === 'leaderboard' && <Leaderboard wallet={wallet} />}
            {page === 'expert' && <ExpertDashboard wallet={wallet} />}
            {page === 'follower' && <FollowerDashboard wallet={wallet} />}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] py-8 px-4 mt-16">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">N1</span>
              </div>
              <span className="text-gray-600 text-xs">
                N1 CopyTrade · Built on{' '}
                <a href="https://n1.xyz" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-400 transition-colors">
                  N1 Chain
                </a>
                {' '}Testnet
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-600">
              {[
                { label: 'N1 App', href: 'https://app.n1.xyz' },
                { label: 'Docs', href: 'https://docs.n1.xyz' },
                { label: 'Twitter', href: 'https://x.com/N1Chain' },
                { label: 'Discord', href: 'https://discord.gg/N1Chain' },
                { label: 'Telegram', href: 'https://t.me/N1_Chain' },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-400 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="text-xs text-gray-700 font-mono">
              <GlitchText text="TESTNET · NO REAL FUNDS" glitchIntensity="low" />
            </div>
          </div>
        </footer>
      </div>

      {/* Network status indicator */}
      <NetworkStatus />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
