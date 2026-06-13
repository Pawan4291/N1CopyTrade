import { useRef, useEffect, useState } from 'react';
import { useMarketsInfo, useMarketsLive } from '../hooks/useN1Api';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MarketTicker() {
  const marketsInfo = useMarketsInfo();
  const marketsLive = useMarketsLive();
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const tickerRef = useRef<HTMLDivElement>(null);

  const markets = marketsInfo.data?.markets ?? [];
  const live = marketsLive.data ?? {};

  // Track price changes
  useEffect(() => {
    if (!marketsLive.data) return;
    const newPrices: Record<string, number> = {};
    Object.entries(marketsLive.data).forEach(([sym, data]) => {
      newPrices[sym] = (data as { indexPrice?: number }).indexPrice ?? 0;
    });
    setPrevPrices(prev => {
      // only update if changed
      const changed = Object.entries(newPrices).some(([k, v]) => prev[k] !== v);
      return changed ? newPrices : prev;
    });
  }, [marketsLive.data]);

  const items = markets.slice(0, 10).map(market => {
    const data = live[market.symbol] as { indexPrice?: number; fundingRate?: number } | undefined;
    const price = data?.indexPrice;
    const prev = prevPrices[market.symbol];
    const isUp = price && prev ? price >= prev : true;

    return { symbol: market.symbol, price, isUp, fundingRate: data?.fundingRate };
  }).filter(i => i.price !== undefined);

  if (items.length === 0) return null;

  // Duplicate for infinite scroll
  const doubled = [...items, ...items];

  return (
    <div className="border-b border-white/[0.04] bg-[#080b12]/40 overflow-hidden">
      <div className="relative">
        <div
          ref={tickerRef}
          className="flex animate-ticker whitespace-nowrap py-2"
          style={{
            animationDuration: `${items.length * 4}s`,
          }}
        >
          {doubled.map((item, i) => (
            <div key={i} className="inline-flex items-center gap-2 px-6 border-r border-white/[0.04] last:border-r-0">
              <span className="text-gray-400 text-xs font-medium">{item.symbol}</span>
              <span className={`text-xs font-mono font-semibold ${item.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                ${item.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
              </span>
              {item.isUp ? (
                <TrendingUp size={9} className="text-emerald-400" />
              ) : (
                <TrendingDown size={9} className="text-red-400" />
              )}
              {item.fundingRate !== undefined && (
                <span className={`text-[10px] ${item.fundingRate >= 0 ? 'text-indigo-400' : 'text-orange-400'}`}>
                  {(item.fundingRate * 100).toFixed(4)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
