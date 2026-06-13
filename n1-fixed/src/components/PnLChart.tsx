import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { useAccountPnlHistory, useAccountPnlSummary } from '../hooks/useN1Api';

interface PnLChartProps {
  accountId: number;
  title?: string;
  compact?: boolean;
}

interface ChartPoint {
  time: string;
  pnl: number;
  cumulative: number;
  label: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const val: number = payload[0]?.value ?? 0;
  return (
    <div className="bg-[#0e1117] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className={`font-bold font-mono text-sm ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {val >= 0 ? '+' : ''}${val.toFixed(2)}
      </p>
    </div>
  );
};

export default function PnLChart({ accountId, title = 'PnL History', compact = false }: PnLChartProps) {
  const historyQuery = useAccountPnlHistory(accountId);
  const summaryQuery = useAccountPnlSummary(accountId);

  const chartData: ChartPoint[] = useMemo(() => {
    const items = historyQuery.data?.items ?? [];
    let cumulative = 0;
    return items
      .slice()
      .reverse()
      .map(item => {
        cumulative += item.realizedPnl;
        return {
          time: item.time,
          pnl: item.realizedPnl,
          cumulative,
          label: new Date(item.time).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      });
  }, [historyQuery.data]);

  const totalPnl = summaryQuery.data
    ? (summaryQuery.data.realizedPnl ?? 0) + (summaryQuery.data.unrealizedPnl ?? 0)
    : 0;
  const isPositive = totalPnl >= 0;
  const chartColor = isPositive ? '#10b981' : '#ef4444';

  const loading = historyQuery.isLoading || summaryQuery.isLoading;
  const error = historyQuery.error || summaryQuery.error;

  if (loading) {
    return (
      <div className={`${compact ? 'h-32' : 'h-64'} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-xs">Loading PnL data from N1...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'h-32' : 'h-64'} flex items-center justify-center`}>
        <div className="text-center">
          <BarChart2 size={24} className="text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-xs">No PnL data available</p>
          <p className="text-gray-600 text-xs mt-0.5">Account may have no trade history</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={`${compact ? 'h-32' : 'h-64'} flex items-center justify-center`}>
        <div className="text-center">
          <BarChart2 size={24} className="text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-xs">No trade history yet</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp size={14} className="text-emerald-400" />
            ) : (
              <TrendingDown size={14} className="text-red-400" />
            )}
            <span className={`text-sm font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}${totalPnl.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={compact ? 80 : 200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`pnl-grad-${accountId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {!compact && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.03)"
              vertical={false}
            />
          )}

          {!compact && (
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
          )}

          {!compact && (
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${v >= 0 ? '+' : ''}${v.toFixed(0)}`}
              width={60}
            />
          )}

          {!compact && <Tooltip content={<CustomTooltip />} />}

          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={chartColor}
            strokeWidth={compact ? 1.5 : 2}
            fill={`url(#pnl-grad-${accountId})`}
            dot={false}
            isAnimationActive={!compact}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>

      {!compact && summaryQuery.data && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1">Realized PnL</p>
            <p className={`font-mono font-bold text-sm ${(summaryQuery.data.realizedPnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {(summaryQuery.data.realizedPnl ?? 0) >= 0 ? '+' : ''}${(summaryQuery.data.realizedPnl ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1">Unrealized PnL</p>
            <p className={`font-mono font-bold text-sm ${(summaryQuery.data.unrealizedPnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {(summaryQuery.data.unrealizedPnl ?? 0) >= 0 ? '+' : ''}${(summaryQuery.data.unrealizedPnl ?? 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
