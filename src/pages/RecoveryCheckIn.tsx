import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecovery } from '../hooks/useRecovery';
import { getVolumeImpactInsight } from '../engine/recoveryEngine';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Activity, Moon, Zap, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';

export function RecoveryCheckIn() {
  const navigate = useNavigate();
  const { submitRecoveryLog, loading, error } = useRecovery();
  
  const [sleep, setSleep] = useState(5);
  const [soreness, setSoreness] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [result, setResult] = useState<{ score: number, insight: string } | null>(null);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await submitRecoveryLog(sleep, soreness, stress, energy);
    if (response) {
      const insight = getVolumeImpactInsight(response.score);
      setResult({ score: response.score, insight: insight.message });
    }
  };

  const renderSlider = (label: string, icon: React.ReactNode, value: number, setter: (val: number) => void, minLabel: string, maxLabel: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white flex items-center gap-2">
          {icon}
          {label}
        </label>
        <span className="text-sm font-bold text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => setter(Number(e.target.value))}
        className="w-full accent-accent-cyan h-2 bg-surface-light rounded-lg appearance-none cursor-pointer"
        disabled={loading || !!result}
      />
      <div className="flex justify-between text-xs text-text-muted">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5 pt-safe px-4 py-4 md:px-6">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <button 
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-text-muted hover:text-white transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{t('recovery_checkin')}</h1>
            <p className="text-sm text-text-muted">{t('help_engine_adapt')}</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:px-6 max-w-2xl mx-auto space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="p-5 md:p-6 space-y-8">
              {renderSlider(t('sleep_quality'), <Moon className="w-4 h-4 text-indigo-400" />, sleep, setSleep, t('poor'), t('excellent'))}
              {renderSlider(t('muscle_soreness'), <Activity className="w-4 h-4 text-rose-400" />, soreness, setSoreness, t('extremely_sore'), t('fresh'))}
              {renderSlider(t('stress_levels'), <Zap className="w-4 h-4 text-amber-400" />, stress, setStress, t('high_stress'), t('relaxed'))}
              {renderSlider(t('energy_levels'), <Smile className="w-4 h-4 text-emerald-400" />, energy, setEnergy, t('exhausted'), t('energetic'))}
            </Card>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={loading}
              disabled={loading}
            >
              {t('analyze_recovery')}
            </Button>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-8 text-center space-y-4 border-accent-cyan/20 bg-accent-cyan/5">
              <div className="w-16 h-16 rounded-full bg-accent-cyan/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-accent-cyan">{result.score}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{t('analysis_complete')}</h2>
              <p className="text-text-muted leading-relaxed">
                {result.insight}
              </p>
            </Card>
            
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/')}
            >
              {t('return_to_dashboard')}
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
