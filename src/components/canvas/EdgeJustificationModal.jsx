import React, { useState } from 'react';
import { GitCommit, X, Check, FileText, Sparkles } from 'lucide-react';

const PRESET_LABELS = [
  'seen with',
  'phone contact',
  'financial link',
  'same MO pattern',
  'conduit / mule',
  'family / associate',
  'getaway vehicle',
  'tower co-location'
];

export default function EdgeJustificationModal({ isOpen, onClose, onConfirm, sourceNode, targetNode }) {
  const [label, setLabel] = useState('phone contact');
  const [justification, setJustification] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      label: label.trim() || 'connected to',
      justification: justification.trim() || 'Investigator hypothesis link.'
    });
    setLabel('phone contact');
    setJustification('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#0A192F] rounded-lg shadow-2xl border border-[#132B4C] w-full max-w-md overflow-hidden text-white">
        {/* Header */}
        <div className="bg-[#071120] px-4 py-3 border-b border-[#132B4C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#132B4C] border border-[#254F85] flex items-center justify-center text-[#D4A017]">
              <GitCommit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Create Investigative Relationship
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Manual Hypothesis Link Definition
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs font-sans">
          {/* Node Link Direction */}
          <div className="p-2.5 rounded bg-[#0E223D] border border-[#1C3B64] flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-300 truncate max-w-[130px] font-bold">
              {sourceNode?.data?.label || 'Source Card'}
            </span>
            <span className="text-[#D4A017] px-2 font-bold">───▶</span>
            <span className="text-slate-300 truncate max-w-[130px] font-bold">
              {targetNode?.data?.label || 'Target Card'}
            </span>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
              Select Preset Relationship:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LABELS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setLabel(preset)}
                  className={`px-2 py-1 rounded text-[10.5px] font-mono transition-colors ${
                    label.toLowerCase() === preset.toLowerCase()
                      ? 'bg-[#D4A017] text-[#0A192F] font-bold'
                      : 'bg-[#0E223D] text-slate-300 border border-[#1C3B64] hover:border-[#D4A017]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Label Input */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
              Relationship Label (Displayed on Edge):
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. transfer of ₹25L, saw at godown..."
              className="w-full px-2.5 py-1.5 bg-[#071120] border border-[#1C3B64] rounded text-white text-xs focus:outline-none focus:border-[#D4A017]"
              required
            />
          </div>

          {/* Justification Textarea */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1 flex items-center justify-between">
              <span>Investigator Justification & Evidence Basis:</span>
              <span className="text-[9px] text-[#D4A017] font-sans">Used for AI Scoring</span>
            </label>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State why you believe this link exists: informant tip, common toll plaza time, mutual CDR duration, financial trail..."
              className="w-full p-2 bg-[#071120] border border-[#1C3B64] rounded text-slate-200 text-[11px] font-sans focus:outline-none focus:border-[#D4A017]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#132B4C]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-[#132B4C] text-slate-300 text-xs font-semibold hover:bg-[#1C3B64]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#D4A017] text-[#0A192F] font-bold text-xs hover:bg-[#F59E0B] flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Create Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
