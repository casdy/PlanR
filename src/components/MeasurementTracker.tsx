import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ruler, X, Save, Calculator } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PopoverTooltip } from './ui/Tooltip';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { MEASUREMENT_TOOLTIPS } from '../constants/uiContent';
import { calculateNavyBodyFat } from '../utils/calculations';
import { getUserBiometrics } from '../engine/calorieEngine';

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

interface MeasurementTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MeasurementTracker: React.FC<MeasurementTrackerProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    waist_cm: '',
    chest_cm: '',
    left_bicep_cm: '',
    right_bicep_cm: '',
    body_fat_percentage: '',
  });

  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [neck, setNeck] = useState('');
  const [hip, setHip] = useState('');
  const [calcHeight, setCalcHeight] = useState('');
  const [calcWaist, setCalcWaist] = useState('');
  const [calcSex, setCalcSex] = useState<'male' | 'female'>('male');

  React.useEffect(() => {
    if (user?.id && isUUID(user.id) && isOpen) {
      getUserBiometrics(user.id).then(res => {
        if (res) {
          setCalcSex(res.sex || 'male');
          setCalcHeight(res.height_cm?.toString() || '');
        }
      });
    }
  }, [user?.id, isOpen]);

  const handleCalculate = () => {
    try {
      const h = parseFloat(calcHeight);
      const w = parseFloat(calcWaist || data.waist_cm);
      const n = parseFloat(neck);
      const hi = parseFloat(hip);

      if (isNaN(h) || isNaN(w) || isNaN(n) || (calcSex === 'female' && isNaN(hi))) {
        throw new Error("Invalid numeric input for calculation");
      }

      const result = calculateNavyBodyFat({
        sex: calcSex,
        height: h,
        waist: w,
        neck: n,
        hip: calcSex === 'female' ? hi : undefined
      });
      
      setData({ 
        ...data, 
        body_fat_percentage: isNaN(result) ? '' : result.toString(),
        waist_cm: calcWaist || data.waist_cm 
      });
      setShowCalculator(false);
    } catch (err) {
      console.error("Calculation failed", err);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !isUUID(user.id)) {
      alert("Measurements can only be saved to the cloud for registered users. Guest data is not persisted yet.");
      onClose();
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('body_measurements').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        waist_cm: data.waist_cm ? parseFloat(data.waist_cm) : null,
        chest_cm: data.chest_cm ? parseFloat(data.chest_cm) : null,
        left_bicep_cm: data.left_bicep_cm ? parseFloat(data.left_bicep_cm) : null,
        right_bicep_cm: data.right_bicep_cm ? parseFloat(data.right_bicep_cm) : null,
        body_fat_percentage: data.body_fat_percentage ? parseFloat(data.body_fat_percentage) : null,
      });

      if (error) throw error;
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save measurements:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-2xl">
                <Ruler className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Body Stats</h2>
                <p className="text-zinc-500 dark:text-slate-400 text-sm">Log your measurements for precision tracking</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-zinc-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center">
                <Input 
                  label="Waist (cm)" 
                  type="number"
                  step="0.1"
                  value={data.waist_cm}
                  onChange={e => setData({ ...data, waist_cm: e.target.value })}
                  placeholder="0.0"
                  className="mt-0"
                />
                <PopoverTooltip title={MEASUREMENT_TOOLTIPS.waist.title} className="mt-6">
                  {MEASUREMENT_TOOLTIPS.waist.description}
                </PopoverTooltip>
              </div>
            </div>
            <div className="flex items-center">
              <Input 
                label="Chest (cm)" 
                type="number"
                step="0.1"
                value={data.chest_cm}
                onChange={e => setData({ ...data, chest_cm: e.target.value })}
                placeholder="0.0"
              />
              <PopoverTooltip title={MEASUREMENT_TOOLTIPS.chest.title} className="mt-6">
                {MEASUREMENT_TOOLTIPS.chest.description}
              </PopoverTooltip>
            </div>

            <div className="flex items-center">
              <Input 
                label="Left Bicep (cm)" 
                type="number"
                step="0.1"
                value={data.left_bicep_cm}
                onChange={e => setData({ ...data, left_bicep_cm: e.target.value })}
                placeholder="0.0"
              />
              <PopoverTooltip title={MEASUREMENT_TOOLTIPS.bicep.title} className="mt-6">
                {MEASUREMENT_TOOLTIPS.bicep.description}
              </PopoverTooltip>
            </div>

            <div className="flex items-center">
              <Input 
                label="Right Bicep (cm)" 
                type="number"
                step="0.1"
                value={data.right_bicep_cm}
                onChange={e => setData({ ...data, right_bicep_cm: e.target.value })}
                placeholder="0.0"
              />
              <PopoverTooltip title={MEASUREMENT_TOOLTIPS.bicep.title} className="mt-6">
                {MEASUREMENT_TOOLTIPS.bicep.description}
              </PopoverTooltip>
            </div>

            <div className="col-span-2">
              <div className="flex items-center">
                <Input 
                  label="Body Fat %" 
                  type="number"
                  step="0.1"
                  value={data.body_fat_percentage}
                  onChange={e => setData({ ...data, body_fat_percentage: e.target.value })}
                  placeholder="0.0"
                />
                <PopoverTooltip title={MEASUREMENT_TOOLTIPS.bodyFat.title} className="mt-6">
                  <p className="mb-4">{MEASUREMENT_TOOLTIPS.bodyFat.description}</p>
                  
                  {!showCalculator ? (
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowCalculator(true)}
                      className="w-full text-xs h-10 rounded-xl"
                    >
                      <Calculator className="w-3 h-3 mr-2" /> Calculate for me
                    </Button>
                  ) : (
                    <div className="space-y-3 pt-3 border-t border-slate-700">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-500">Sex</label>
                          <select 
                            value={calcSex} 
                            onChange={e => setCalcSex(e.target.value as any)}
                            className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-1 focus:ring-orange-500 outline-none"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <Input 
                          label="Height (cm)" 
                          type="number" 
                          value={calcHeight} 
                          onChange={e => setCalcHeight(e.target.value)}
                          className="h-10 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          label="Waist (cm)" 
                          type="number" 
                          value={calcWaist || data.waist_cm} 
                          onChange={e => setCalcWaist(e.target.value)}
                          className="h-10 text-xs"
                        />
                        <Input 
                          label="Neck (cm)" 
                          type="number" 
                          value={neck} 
                          onChange={e => setNeck(e.target.value)}
                          className="h-10 text-xs"
                        />
                      </div>
                      {calcSex === 'female' && (
                        <Input 
                          label="Hips (cm)" 
                          type="number" 
                          value={hip} 
                          onChange={e => setHip(e.target.value)}
                          className="h-10 text-xs"
                        />
                      )}
                      <Button 
                        onClick={handleCalculate}
                        className="w-full text-xs font-black uppercase tracking-widest h-10 rounded-xl bg-orange-500 hover:bg-orange-600 border-none mt-2 shadow-lg shadow-orange-500/20"
                        disabled={!neck || !calcHeight || !(calcWaist || data.waist_cm) || (calcSex === 'female' && !hip)}
                      >
                        Calculate
                      </Button>
                    </div>
                  )}
                </PopoverTooltip>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-[2] bg-orange-500 hover:bg-orange-600 border-orange-500" onClick={handleSave} isLoading={loading}>
              Save Measurements <Save className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
