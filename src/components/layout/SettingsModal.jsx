import React from 'react';
import { 
  X, 
  Sparkles, 
  Play, 
  RotateCcw, 
  LogOut, 
  AlertTriangle, 
  Database, 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight,
  Compass
} from 'lucide-react';
import { useDemoMode } from '../../context/DemoModeContext';
import { DEMO_STEPS } from '../../services/demoScenario';
import { isSupabaseConfigured } from '../../services/supabaseClient';

export default function SettingsModal({ isOpen, onClose }) {
  const { 
    isDemoActive, 
    currentStep, 
    totalSteps, 
    startDemo, 
    exitDemo, 
    resetDemo, 
    goToStep 
  } = useDemoMode();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div 
        className="bg-[#FFFFFF] border-2 border-[#0B2341]/20 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden text-[#071A33] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#071A33] px-5 py-4 flex items-center justify-between text-white border-b border-[#0B2341]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5B800] text-[#071A33] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">SYSTEM SETTINGS & DEMO CONTROLLER</h2>
              <p className="text-[10px] text-slate-300 font-mono">NETRA Command Center Environment Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#0E2A4D] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* 1. DEMO MODE SECTION */}
          <div className="border border-[#F5B800]/60 rounded-xl p-4.5 bg-[#FFFBEB]/40 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-[#F5B800] text-[#071A33]">
                    HACKATHON DEMO MODE
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isDemoActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isDemoActive ? 'ACTIVE (ISOLATED)' : 'INACTIVE (LIVE DB)'}
                  </span>
                </div>
                <p className="text-xs text-[#071A33]/80 leading-relaxed pt-1">
                  Runs a scripted, 9-step criminal investigation storyline (Case X: Colaba Vault Heist). 
                  Demonstrates progressive entity discovery, cross-case linking, MO similarity, and suspect ranking.
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (isDemoActive) {
                      exitDemo();
                    } else {
                      startDemo();
                      onClose();
                    }
                  }}
                  className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer flex items-center ${
                    isDemoActive ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>
            </div>

            {/* Hard Requirement Isolation Warning */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-[11.5px] leading-relaxed">
                <strong>Data Isolation Notice:</strong> Demo Mode uses fully synthetic data (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-bold">DEMO-*</code> IDs) and <strong>does not read or write to the live Supabase database</strong>. Progress is preserved in <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">sessionStorage</code>.
              </div>
            </div>

            {/* Demo Controls when Active */}
            {isDemoActive && (
              <div className="space-y-3 pt-2 border-t border-[#0B2341]/10">
                <div className="flex items-center justify-between text-xs font-bold text-[#071A33]">
                  <span>Storyline Steps (Jump to Step):</span>
                  <span className="font-mono text-[#D97706]">Current: Step {currentStep} of {totalSteps}</span>
                </div>

                {/* Step Pills */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {DEMO_STEPS.map((s) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        goToStep(s.step);
                        onClose();
                      }}
                      className={`px-2 py-1.5 rounded text-[11px] font-mono font-bold transition-all text-left flex flex-col cursor-pointer ${
                        s.step === currentStep
                          ? 'bg-[#F5B800] text-[#071A33] ring-2 ring-[#071A33] shadow-xs'
                          : s.step < currentStep
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>Step {s.step}</span>
                      <span className="text-[9px] font-normal truncate">{s.title.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetDemo();
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 bg-[#071A33] hover:bg-[#0B2341] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#F5B800]" />
                    <span>Restart Storyline (Step 1)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exitDemo();
                      onClose();
                    }}
                    className="py-2 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit Demo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. ENVIRONMENT & SERVICE CONNECTIVITY STATUS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono text-[#071A33] uppercase tracking-wider">
              System Health & Diagnostics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-[#F4F7FB] border border-[#0B2341]/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#071A33]" />
                  <div>
                    <div className="text-xs font-bold">Supabase PostgreSQL</div>
                    <div className="text-[10px] text-[#071A33]/70 font-mono">
                      {isSupabaseConfigured ? 'Connected (Live Data Ready)' : 'Local Fallback Engine'}
                    </div>
                  </div>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              </div>

              <div className="p-3 rounded-lg bg-[#F4F7FB] border border-[#0B2341]/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#071A33]" />
                  <div>
                    <div className="text-xs font-bold">Priority Model Service</div>
                    <div className="text-[10px] text-[#071A33]/70 font-mono">FastAPI + TreeSHAP Engine</div>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F4F7FB] px-5 py-3 border-t border-[#0B2341]/10 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#071A33] hover:bg-[#0B2341] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
