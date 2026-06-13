import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, TrendingUp, Clock } from 'lucide-react';

const STATS = [
  { value: '$3.14B', label: 'Volume Traded', icon: TrendingUp, color: 'text-emerald-400' },
  { value: '4.37B', label: 'Actions', icon: Zap, color: 'text-indigo-400' },
  { value: '23,481', label: 'Traders', icon: Shield, color: 'text-violet-400' },
  { value: '~40ms', label: 'Atomic Speed', icon: Clock, color: 'text-cyan-400' },
];

const WORDS = ['Elite Traders', 'Top Performers', 'Expert Signals', 'Pro Positions'];

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [showWord, setShowWord] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowWord(false);
      setTimeout(() => {
        setWordIndex(i => (i + 1) % WORDS.length);
        setShowWord(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative pt-12 pb-6 px-4 text-center">
      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-indigo-500/10"
            initial={{ width: 200, height: 200, opacity: 0 }}
            animate={{
              width: 200 + i * 200,
              height: 200 + i * 200,
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 1.3,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-5"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        N1 Testnet · Social Copy Trading
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-2 leading-none tracking-tight">
          Copy{' '}
          <span className="relative inline-block">
            <motion.span
              key={wordIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: showWord ? 1 : 0, y: showWord ? 0 : -10 }}
              transition={{ duration: 0.3 }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400"
            >
              {WORDS[wordIndex]}
            </motion.span>
            {/* Underline decoration */}
            <motion.span
              className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            />
          </span>
        </h1>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-none tracking-tight mb-4">
          on N1 Chain
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
      >
        Mirror pro trader positions with atomic execution. All follower wallets execute simultaneously
        in a single bundle — no partial fills, no front-running.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap items-center justify-center gap-3 mb-10"
      >
        <a
          href="https://app.n1.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25"
        >
          <Zap size={14} />
          Open N1 App
        </a>
        <a
          href="https://docs.n1.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-sm transition-all"
        >
          Read Docs
        </a>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
      >
        {STATS.map(({ value, label, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 + i * 0.1 }}
            whileHover={{ scale: 1.03 }}
            className="bg-[#0d1117]/80 border border-white/[0.06] rounded-xl p-4 text-center"
          >
            <Icon size={16} className={`${color} mx-auto mb-2`} />
            <p className={`text-xl font-extrabold font-mono ${color}`}>{value}</p>
            <p className="text-gray-600 text-xs mt-0.5">{label}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
