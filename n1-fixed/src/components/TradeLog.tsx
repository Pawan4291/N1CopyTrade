import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { createN1WebSocket } from '../lib/n1Client';
import { useMarketsInfo } from '../hooks/useN1Api';

interface TradeEvent {
  id: string;
  marketSymbol: string;
  side: 'bid' | 'ask';
  price: number;
  size: number;
  time: string;
  isCopy?: boolean;
}

interface TradeLogProps {
  expertAccountId?: number;
  marketSymbol?: string;
  showHeader?: boolean;
  maxItems?: number;
}

export default function TradeLog({
  expertAccountId,
  marketSymbol = 'BTCUSDC',
  showHeader = true,
  maxItems = 12,
}: TradeLogProps) {
  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const [connected, setConnected] = useState(false);
  // FIX: changed wsRef type to match new createN1WebSocket return signature { close: () => void }
  const wsRef = useRef<{ close: () => void } | null>(null);
  const marketsQuery = useMarketsInfo();

  const marketSymbolsRef = useRef<Record<number, string>>({});
  useEffect(() => {
    marketSymbolsRef.current = Object.fromEntries(
      (marketsQuery.data?.markets ?? []).map(m => [m.id, m.symbol])
    );
  }, [marketsQuery.data]);

  useEffect(() => {
    const streamKey = `trades@${marketSymbol}` as const;

    const handle = createN1WebSocket(
      [streamKey],
      (data: unknown) => {
        setConnected(true);
        const d = data as {
          trades?: {
            trades: Array<{
              action_id: number;
              physical_time: string;
              trade_id: number;
              side: 'bid' | 'ask';
              price: number;
              size: number;
            }>;
            market_symbol: string;
          };
        };

        if (d?.trades?.trades) {
          const newTrades: TradeEvent[] = d.trades.trades.map(t => ({
            id: `${t.trade_id}-${Date.now()}`,
            marketSymbol: d.trades!.market_symbol,
            side: t.side,
            price: t.price,
            size: t.size,
            time: t.physical_time,
            isCopy: false,
          }));

          setTrades(prev => [...newTrades, ...prev].slice(0, maxItems));
        }
      },
      () => setConnected(false),
      () => setConnected(false),
    );

    wsRef.current = handle;

    return () => {
      handle.close();
      setConnected(false);
    };
  }, [marketSymbol, maxItems]);

  // Watch expert account stream for copy-trade events
  useEffect(() => {
    if (!expertAccountId) return;

    const handle = createN1WebSocket(
      [`account@${expertAccountId}`],
      (data: unknown) => {
        const d = data as {
          account?: {
            fills: Record<string, {
              physical_time: string;
              side: 'bid' | 'ask';
              price: number;
              quantity: number;
              market_id: number;
            }>;
          };
        };

        if (d?.account?.fills) {
          const newTrades: TradeEvent[] = Object.values(d.account.fills).map((fill, i) => ({
            id: `copy-${Date.now()}-${i}`,
            marketSymbol: marketSymbolsRef.current[fill.market_id] ?? `MKT-${fill.market_id}`,
            side: fill.side,
            price: fill.price,
            size: fill.quantity,
            time: fill.physical_time,
            isCopy: true,
          }));

          setTrades(prev => [...newTrades, ...prev].slice(0, maxItems));
        }
      }
    );

    return () => handle.close();
  }, [expertAccountId, maxItems]);

  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-gray-300">Live Trade Feed</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {connected ? `${marketSymbol}` : 'Connecting...'}
            </span>
          </div>
        </div>
      )}

      {trades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-600">
          <Activity size={20} className="mb-2" />
          <p className="text-xs">Waiting for trades...</p>
          {!connected && (
            <p className="text-xs text-gray-700 mt-0.5">Connecting to N1 WebSocket</p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence initial={false} mode="popLayout">
            {trades.map(trade => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                  trade.isCopy
                    ? 'bg-indigo-500/10 border border-indigo-500/20'
                    : 'bg-white/[0.02] border border-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {trade.isCopy && <Zap size={10} className="text-indigo-400" />}
                  <div className={`flex items-center gap-1 font-medium ${trade.side === 'bid' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trade.side === 'bid' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {trade.side === 'bid' ? 'BUY' : 'SELL'}
                  </div>
                  <span className="text-gray-400">{trade.marketSymbol}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-white">${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-gray-500 font-mono">{trade.size.toFixed(4)}</span>
                  <span className="text-gray-600 text-[10px]">
                    {new Date(trade.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
