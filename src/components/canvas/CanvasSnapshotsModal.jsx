import React, { useState } from 'react';
import { History, X, Plus, RotateCcw, Clock, Layers, Sparkles, Check } from 'lucide-react';

export default function CanvasSnapshotsModal({ isOpen, onClose, snapshots, onSaveSnapshot, onRestoreSnapshot }) {
  const [newLabel, setNewLabel] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (newLabel.trim()) {
      onSaveSnapshot(newLabel.trim());
      setNewLabel('');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#0A192F] rounded-lg shadow-2xl border border-[#132B4C] w-full max-w-lg overflow-hidden text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#071120] px-4 py-3 border-b border-[#132B4C] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#132B4C] border border-[#254F85] flex items-center justify-center text-[#D4A017]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Canvas Version History & Snapshots
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Compare and Restore Past Working Hypotheses
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

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {/* Create New Snapshot Button */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2 px-3 bg-[#0E223D] hover:bg-[#132B4C] border border-dashed border-[#254F85] rounded text-xs font-bold text-[#D4A017] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Capture Current Canvas Snapshot</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="p-3 bg-[#0E223D] rounded border border-[#254F85] space-y-2">
              <label className="text-[10px] font-mono uppercase text-slate-300 font-bold block">
                Snapshot Label / Milestone Name:
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Day 3 Post-Interrogation Hypothesis, Pre-Raid Map..."
                className="w-full px-2.5 py-1.5 bg-[#071120] border border-[#1C3B64] rounded text-white text-xs focus:outline-none focus:border-[#D4A017]"
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-2.5 py-1 rounded bg-[#132B4C] text-slate-300 text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-[#D4A017] text-[#0A192F] font-bold text-[10px] flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Save Snapshot</span>
                </button>
              </div>
            </form>
          )}

          {/* Snapshots List */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Saved Snapshots ({snapshots.length}):
            </span>

            {snapshots.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-[#071120] rounded border border-[#132B4C]">
                No snapshots captured yet for this case canvas.
              </div>
            ) : (
              snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="p-3 rounded bg-[#0E223D] border border-[#1C3B64] flex items-center justify-between hover:border-[#254F85] transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-bold text-xs text-white truncate">{snap.label}</div>
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(snap.createdAt).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>{snap.nodesCount} Cards</span>
                      <span>•</span>
                      <span>{snap.edgesCount} Links</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onRestoreSnapshot(snap);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 bg-[#132B4C] hover:bg-[#D4A017] hover:text-[#0A192F] text-[#D4A017] text-xs font-bold rounded border border-[#254F85] transition-colors flex items-center gap-1"
                    title="Restore this snapshot onto canvas"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
