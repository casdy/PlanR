import React, { useState, useEffect } from 'react';
import { Zap, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { PopoverTooltip } from './ui/Tooltip';

interface QuotaData {
  limit: number;
  used: number;
  remaining: number;
  tokensUsed: number;
  tpmLimit: number;
  sparks: number;
}

const LOCAL_QUOTA_KEY = 'planr_local_quota';
const DEFAULT_MAX = 1500;

function getLocalFallback(): QuotaData {
  const raw = localStorage.getItem(LOCAL_QUOTA_KEY);
  const remaining = raw !== null ? parseInt(raw, 10) : DEFAULT_MAX;
  return { limit: DEFAULT_MAX, used: DEFAULT_MAX - remaining, remaining, tokensUsed: 0, tpmLimit: 1000000, sparks: remaining };
}

export const QuotaTracker: React.FC<{ className?: string }> = ({ className }) => {
  const [data, setData] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/quota');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Backend returned an error — use local fallback silently
        setData(getLocalFallback());
      }
    } catch {
      // Network error (ECONNREFUSED, 500, etc.) — use local fallback silently
      setData(getLocalFallback());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
    const interval = setInterval(fetchQuota, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) return null;

  const sparkPercentage = (data.sparks / data.limit) * 100;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center gap-3 px-2 py-1.5", className)}
    >
      <div className="flex items-center gap-1.5">
        <Zap className={cn(
          "w-3 h-3",
          data.sparks < 100 ? "text-orange-400 animate-pulse" : "text-amber-400"
        )} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          AI Sparks: <span className="text-white">{data.sparks}</span>
        </span>
      </div>

      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden max-w-[60px]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${sparkPercentage}%` }}
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            sparkPercentage > 50 ? "bg-amber-500" : sparkPercentage > 20 ? "bg-orange-500" : "bg-red-500"
          )}
        />
      </div>

      <PopoverTooltip 
        title="Intelligence Quota"
        icon={Info}
      >
        <div className="space-y-2 text-xs">
          <p>Your "Sparks" represent total daily AI requests on the Gemini 1.5 Free Tier.</p>
          <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
            <div>
              <span className="text-slate-400 block">Daily Limit</span>
              <span className="font-bold">{data.limit}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Used Today</span>
              <span className="font-bold">{data.used}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Tokens Used</span>
              <span className="font-bold">{data.tokensUsed.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block">TPM Limit</span>
              <span className="font-bold">1M</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic border-t border-white/5 pt-1">
            Refreshes every 24 hours.
          </p>
        </div>
      </PopoverTooltip>
    </motion.div>
  );
};
