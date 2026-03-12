import { NutritionScanner } from '../../components/nutrition/NutritionScanner';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MobileScannerPreview() {
  const navigate = useNavigate();

  const handleScanSuccess = (barcode: string) => {
    alert(`Scanned: ${barcode}\n(Note: API fetch disabled in pure scanner preview)`);
  };

  return (
    <div className="w-full h-screen bg-black text-white relative flex flex-col items-center justify-center">
      {/* Fake Mobile Header */}
      <div className="absolute top-0 w-full p-4 flex items-center justify-between z-10">
        <button 
          onClick={() => navigate('/nutrition-preview')}
           className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-white/10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold tracking-widest text-[10px] uppercase text-slate-500">Mobile Test</span>
        <div className="w-10 h-10" />
      </div>

      <div className="text-center p-8">
        <div className="w-16 h-16 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
          <span className="text-2xl">📱</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-2">Scanner Test</h1>
        <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
          The scanner will overlay this entire screen, simulating the mobile app experience.
        </p>
      </div>

      <NutritionScanner
         isOpen={true}
         onClose={() => navigate('/nutrition-preview')}
         onScanSuccess={handleScanSuccess}
         isProcessing={false}
      />
    </div>
  );
}
