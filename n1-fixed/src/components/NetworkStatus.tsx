import { useEffect, useState } from 'react';
import { nordApi } from '../lib/n1Client';
import { useLastActionId } from '../hooks/useN1Api';
import { Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [alive, setAlive] = useState<boolean | null>(null);
  const lastActionQuery = useLastActionId();

  useEffect(() => {
    const check = async () => {
      try {
        await nordApi.live();
        setAlive(true);
      } catch {
        setAlive(false);
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  const lastActionId = lastActionQuery.data;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-[#0e1117]/90 border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm text-xs flex items-center gap-2">
        {alive === null ? (
          <span className="text-gray-500">Checking N1...</span>
        ) : alive ? (
          <>
            <Wifi size={12} className="text-emerald-400" />
            <span className="text-emerald-400 font-medium">N1 Testnet Live</span>
            {lastActionId !== undefined && (
              <span className="text-gray-600 font-mono">#{lastActionId}</span>
            )}
          </>
        ) : (
          <>
            <WifiOff size={12} className="text-red-400" />
            {/* FIX: removed misleading "Testnet may be down" — it's more likely a CORS/network issue */}
            <span className="text-red-400 font-medium">N1 Unreachable</span>
          </>
        )}
      </div>
    </div>
  );
}
