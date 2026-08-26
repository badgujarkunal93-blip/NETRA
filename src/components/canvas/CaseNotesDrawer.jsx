import React from 'react';
import { FileText, X, Save, Sparkles } from 'lucide-react';

export default function CaseNotesDrawer({ isOpen, onClose, caseNotes, onChangeNotes, onSave }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-[#0A192F] shadow-2xl border-l border-[#132B4C] flex flex-col animate-slide-left text-white select-none">
      {/* Header */}
      <div className="bg-[#071120] px-4 py-3.5 border-b border-[#132B4C] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#132B4C] border border-[#254F85] flex items-center justify-center text-[#D4A017]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Case Narrative & Working Notes
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Hypothesis Synthesis & Investigation Log
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#132B4C]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col space-y-3 overflow-y-auto">
        <div>
          <label className="text-[10px] font-mono uppercase text-slate-300 font-bold block mb-1">
            Global Case Theory & Operational Brief:
          </label>
          <p className="text-[11px] text-slate-400 font-sans mb-2">
            Record overall syndicate hierarchy assumptions, timeline discrepancies, pending forensic lab results, and raid execution planning notes.
          </p>
          <textarea
            rows={18}
            value={caseNotes}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder="Type comprehensive investigation working theory here..."
            className="w-full p-3 bg-[#071120] border border-[#1C3B64] rounded text-slate-200 text-xs font-sans focus:outline-none focus:border-[#D4A017] leading-relaxed resize-none h-[calc(100vh-220px)]"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-[#071120] border-t border-[#132B4C] flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-mono text-slate-400">
          Autosaved on canvas change
        </span>
        <button
          onClick={() => {
            if (onSave) onSave();
            onClose();
          }}
          className="px-4 py-1.5 rounded bg-[#D4A017] text-[#0A192F] font-bold text-xs hover:bg-[#F59E0B] flex items-center gap-1.5 shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Notes</span>
        </button>
      </div>
    </div>
  );
}
