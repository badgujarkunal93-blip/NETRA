import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  LogOut, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  Minimize2,
  Maximize2,
  Compass,
  ArrowRight,
  Layers,
  Share2
} from 'lucide-react';
import { useDemoMode } from '../../context/DemoModeContext';
import { DEMO_STEPS } from '../../services/demoScenario';

export default function DemoModeBanner() {
  const { 
    isDemoActive, 
    currentStep, 
    totalSteps, 
    stepInfo, 
    advanceStep, 
    prevStep, 
    goToStep, 
    resetDemo, 
    exitDemo 
  } = useDemoMode();

  const [isMinimized, setIsMinimized] = useState(false);

  if (!isDemoActive) return null;

  return (
    <aside 
      aria-label="Storyline Demo Mode Controller"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl transition-all duration-300 shadow-2xl font-sans select-none"
    >
      <div className="bg-[#071A33] border-2 border-[#F5B800] rounded-xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-md text-white">
        {/* Top Highlight Banner Bar */}
        <div className="bg-linear-to-r from-[#B45309] via-[#D97706] to-[#F5B800] px-4 py-1.5 flex items-center justify-between text-xs font-bold text-[#071A33]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span className="font-mono tracking-wider font-extrabold uppercase text-[11px]">
              DEMO MODE • SCRIPTED INVESTIGATION STORYLINE
            </span>
            <span className="hidden md:inline text-[9.5px] bg-[#071A33]/20 px-2 py-0.5 rounded font-mono font-bold">
              ISOLATED SYNTHETIC DATA
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMinimized(prev => !prev)}
              className="p-1 hover:bg-[#071A33]/15 rounded transition-colors text-[#071A33] cursor-pointer"
              title={isMinimized ? "Expand Storyline Panel" : "Minimize Panel"}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={exitDemo}
              className="flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 bg-[#071A33] text-white hover:bg-red-700 rounded transition-colors cursor-pointer"
              title="Exit Demo Mode and return to real app"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit Demo</span>
            </button>
          </div>
        </div>

        {/* Main Banner Content */}
        {!isMinimized ? (
          <div className="p-3.5 space-y-3">
            {/* Step Progress Stepper */}
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {DEMO_STEPS.map((s) => {
                const isActive = s.step === currentStep;
                const isPast = s.step < currentStep;
                return (
                  <button
                    type="button"
                    key={s.step}
                    onClick={() => goToStep(s.step)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex-shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#F5B800] text-[#071A33] shadow-md ring-2 ring-[#F5B800]/50 scale-105'
                        : isPast
                        ? 'bg-[#0E2A4D] text-emerald-400 border border-emerald-500/40 hover:bg-[#133560]'
                        : 'bg-[#0E2A4D]/60 text-slate-400 border border-[#1C457A]/40 hover:bg-[#0E2A4D]'
                    }`}
                    title={`Jump to Step ${s.step}: ${s.title}`}
                  >
                    <span>{s.step}</span>
                    <span className="hidden sm:inline text-[10px]">
                      {s.title.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Step Headline & Action Hint */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0B2341] p-3 rounded-lg border border-[#1C457A]/60">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5B800] text-[#071A33]">
                    STEP {currentStep} OF {totalSteps}
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">
                    Location: <strong className="text-[#F5B800]">{stepInfo.pageName}</strong>
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white mt-1 truncate">
                  {stepInfo.headline}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {stepInfo.instructions}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 justify-end">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep <= 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                    currentStep <= 1 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                      : 'bg-[#0E2A4D] text-white hover:bg-[#133560] border border-[#1C457A]'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Back</span>
                </button>

                <button
                  type="button"
                  onClick={advanceStep}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-linear-to-r from-[#F5B800] to-[#D97706] hover:from-[#FBBF24] hover:to-[#B45309] text-[#071A33] font-bold text-xs shadow-md transition-all scale-100 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>{stepInfo.actionLabel || 'Next Step'}</span>
                  <ChevronRight className="w-4 h-4 text-[#071A33]" />
                </button>

                <button
                  type="button"
                  onClick={resetDemo}
                  className="p-1.5 bg-[#0E2A4D] hover:bg-slate-700 rounded text-slate-300 hover:text-white border border-[#1C457A] transition-colors cursor-pointer"
                  title="Restart Storyline at Step 1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Minimized Compact View */
          <div className="px-4 py-2 flex items-center justify-between gap-3 text-xs bg-[#0B2341]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-[#F5B800] text-[#071A33] text-[10px]">
                {currentStep}/{totalSteps}
              </span>
              <span className="font-bold text-white truncate">
                {stepInfo.title} — {stepInfo.pageName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={advanceStep}
                className="px-3 py-1 bg-[#F5B800] text-[#071A33] rounded font-bold text-[11px] flex items-center gap-1 hover:bg-[#FBBF24] cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
