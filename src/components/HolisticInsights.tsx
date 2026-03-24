/**
 * @file src/components/HolisticInsights.tsx
 * @description Renders dynamic cross-referenced insights from the HolisticHealthEngine.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateHolisticInsights, type HolisticInsight, type HolisticMetrics } from '../engine/holisticEngine';
import { Card } from './ui/Card';
import { ProgressRing } from './ui/ProgressRing';
import { X } from 'lucide-react';
import { Flame, Zap, Activity, AlertTriangle, Droplets, Leaf, ChevronRight, ChevronLeft, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

const ICON_MAP: Record<string, React.ReactNode> = {
  flame: <Flame className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  activity: <Activity className="w-5 h-5" />,
  'alert-triangle': <AlertTriangle className="w-5 h-5" />,
  droplets: <Droplets className="w-5 h-5" />,
  leaf: <Leaf className="w-5 h-5" />
};

const SEVERITY_COLOR_MAP: Record<string, string> = {
  info: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  warning: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  critical: 'text-destructive bg-destructive/10 border-destructive/20'
};

// --- Guest Preview Modal ---
const GuestNeuroModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useLanguage();
  return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 30 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-sm bg-background border border-border rounded-[2.5rem] overflow-hidden shadow-2xl relative"
    >
      {/* Ambient header glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="p-6 space-y-6 relative">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-foreground">{t('neuro_report')}</h2>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">{t('bio_data_preview')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </header>

        {/* Blurred preview rings */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-4 blur-sm opacity-60 pointer-events-none select-none">
            {[
              { label: t('avg_protein'), value: '128g', progress: 85, color: 'text-orange-500' },
              { label: t('avg_carbs'), value: '210g', progress: 68, color: 'text-blue-500' },
              { label: t('avg_sleep'), value: '7.2h', progress: 90, color: 'text-purple-500' },
              { label: t('soreness'), value: '4.1', progress: 41, color: 'text-red-500' },
            ].map((ring) => (
              <div key={ring.label} className="flex flex-col items-center p-4 rounded-3xl bg-muted/50 border border-border">
                <span className={`text-[10px] font-black uppercase ${ring.color} mb-2`}>{ring.label}</span>
                <ProgressRing progress={ring.progress} size={80} strokeWidth={8} color={ring.color} backgroundColor={`${ring.color}/10`}>
                  <span className="text-lg font-black text-foreground">{ring.value}</span>
                </ProgressRing>
              </div>
            ))}
          </div>
          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-full bg-background/90 border border-border shadow-xl">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-black text-foreground text-center" dangerouslySetInnerHTML={{ __html: t('unlock_bio_data') }} />
          </div>
        </div>

        {/* CTA */}
        <a
          href="/login"
          className="block w-full text-center py-3.5 rounded-2xl bg-primary text-primary-foreground font-black tracking-tight hover:opacity-90 transition-opacity"
        >
          {t('get_neuro_report')}
        </a>
        <p className="text-center text-xs text-muted-foreground font-medium">
          {t('free_account_desc')}
        </p>
      </div>
    </motion.div>
  </motion.div>
  );
};

// --- Authenticated Neuro Modal ---
const AuthNeuroModal = ({ metrics, onClose }: { metrics: HolisticMetrics; onClose: () => void }) => {
  const { t } = useLanguage();
  return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-sm bg-background border border-border rounded-[2.5rem] overflow-hidden shadow-2xl relative"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="p-6 md:p-8 space-y-6 relative">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-foreground">{t('neuro_report')}</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">{t('aggregated_bio_data')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: t('avg_protein'), value: `${Math.round(metrics.avgProtein)}g`, progress: Math.min((metrics.avgProtein / 150) * 100, 100), color: 'text-orange-500' },
            { label: t('avg_carbs'), value: `${Math.round(metrics.avgCarbs)}g`, progress: Math.min((metrics.avgCarbs / 250) * 100, 100), color: 'text-blue-500' },
            { label: t('avg_sleep'), value: metrics.avgSleep > 0 ? `${metrics.avgSleep.toFixed(1)}h` : '--', progress: Math.min((metrics.avgSleep / 8) * 100, 100), color: 'text-purple-500' },
            { label: t('avg_soreness'), value: metrics.avgSoreness > 0 ? metrics.avgSoreness.toFixed(1) : '--', progress: (metrics.avgSoreness / 10) * 100, color: 'text-red-500' },
          ].map((ring) => (
            <div key={ring.label} className="flex flex-col items-center justify-center p-4 rounded-3xl bg-muted/50 border border-border">
              <span className={`text-[10px] font-black uppercase ${ring.color} mb-2`}>{ring.label}</span>
              <ProgressRing progress={ring.progress} size={80} strokeWidth={8} color={ring.color} backgroundColor={`${ring.color}/10`}>
                <span className="text-lg font-black text-foreground">{ring.value}</span>
              </ProgressRing>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
          <span className="block text-[10px] font-black uppercase text-primary mb-1 tracking-widest">{t('volume_7day')}</span>
          <span className="text-2xl font-black text-foreground">
            {metrics.workoutVolume} <span className="text-sm font-bold text-muted-foreground">{t('sessions')}</span>
          </span>
        </div>
      </div>
    </motion.div>
  </motion.div>
  );
};

export const HolisticInsights = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [insights, setInsights] = useState<HolisticInsight[]>([]);
  const [metrics, setMetrics] = useState<HolisticMetrics | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isGuest = !user?.id;

  useEffect(() => {
    async function loadInsights() {
      if (!user?.id) {
          setLoading(false);
          return;
      }
      setLoading(true);
      const data = await generateHolisticInsights(user.id);
      setInsights(data.insights);
      setMetrics(data.metrics);
      setLoading(false);
    }
    loadInsights();
  }, [user]);

  if (loading) {
    return (
      <Card className="glass border-white/10 dark:border-white/5 rounded-3xl p-6 min-h-[140px] flex items-center justify-center animate-pulse relative overflow-hidden">
         <div className="absolute inset-0 bg-primary/5 shimmer" />
         <span className="text-sm font-bold text-muted-foreground z-10">{t('generating_insights')}</span>
      </Card>
    );
  }

  // Guest state: show a teaser card that opens the lock modal
  if (isGuest) {
    return (
      <>
        <div onClick={() => setIsModalOpen(true)} className="cursor-pointer group">
          <Card className="glass border-white/10 dark:border-white/5 rounded-3xl overflow-hidden relative transition-transform hover:scale-[1.02]">
            <div className="p-5 sm:p-6 flex flex-col min-h-[160px] justify-between z-10 relative">
              <header className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg text-primary bg-primary/10 border border-primary/20">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-[11px] uppercase tracking-widest font-black text-muted-foreground">
                  {t('smart_coach')} • {t('neuro_report')}
                </h3>
              </header>
              <div className="space-y-1.5">
                <h4 className="text-lg font-black tracking-tight text-foreground leading-tight">{t('insight_5_title')}</h4>
                <p className="text-sm font-medium text-muted-foreground/90 leading-relaxed">
                  {t('insight_5_desc')}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-primary">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black uppercase tracking-widest">{t('tap_preview_neuro')}</span>
              </div>
            </div>
          </Card>
        </div>

        <AnimatePresence>
          {isModalOpen && <GuestNeuroModal onClose={() => setIsModalOpen(false)} />}
        </AnimatePresence>
      </>
    );
  }

  if (insights.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % insights.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  const currentInsight = insights[currentIndex];
  const colorClasses = SEVERITY_COLOR_MAP[currentInsight.severity] || SEVERITY_COLOR_MAP.info;

  return (
    <>
    <div onClick={() => setIsModalOpen(true)} className="cursor-pointer group">
      <Card className="glass border-white/10 dark:border-white/5 rounded-3xl overflow-hidden relative transition-transform hover:scale-[1.02]">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          {ICON_MAP[currentInsight.icon]}
      </div>
      <div className="p-5 sm:p-6 flex flex-col min-h-[160px] justify-between z-10 relative">
        <header className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${colorClasses}`}>
                    {ICON_MAP[currentInsight.icon]}
                </div>
                <h3 className="text-[11px] uppercase tracking-widest font-black text-muted-foreground">
                    {t('smart_coach')} • {t(currentInsight.type as any).replace('_', ' ')}
                </h3>
            </div>
            {insights.length > 1 && (
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <span className="text-[10px] font-bold text-muted-foreground mx-1">
                        {currentIndex + 1} / {insights.length}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            )}
        </header>

        <AnimatePresence mode="wait">
            <motion.div
                key={currentInsight.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5"
            >
                <h4 className="text-lg font-black tracking-tight text-foreground leading-tight">
                    {t(currentInsight.title as any)}
                </h4>
                <p className="text-sm font-medium text-muted-foreground/90 leading-relaxed">
                    {t(currentInsight.description as any, currentInsight.variables as any)}
                </p>
            </motion.div>
        </AnimatePresence>
      </div>
      </Card>
    </div>

    <AnimatePresence>
      {isModalOpen && metrics && <AuthNeuroModal metrics={metrics} onClose={() => setIsModalOpen(false)} />}
    </AnimatePresence>
    </>
  );
};

