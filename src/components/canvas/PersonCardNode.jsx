import React, { useState, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { User, ShieldCheck, HelpCircle, Link as LinkIcon, Trash2, Edit3, Check, Sparkles } from 'lucide-react';

function PersonCardNode({ id, data, isConnectable }) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || 'Unknown Suspect');
  const [role, setRole] = useState(data.role || 'Accused');
  const [description, setDescription] = useState(data.description || '');
  const [status, setStatus] = useState(data.status || 'hypothesis'); // 'confirmed' | 'hypothesis'

  const handleSave = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    data.label = label;
    data.role = role;
    data.description = description;
    data.status = status;
    if (data.onChange) data.onChange(id, { label, role, description, status });
  };

  const toggleStatus = (e) => {
    e.stopPropagation();
    const nextStatus = status === 'confirmed' ? 'hypothesis' : 'confirmed';
    setStatus(nextStatus);
    data.status = nextStatus;
    if (data.onChange) data.onChange(id, { ...data, status: nextStatus });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (data.onDelete) data.onDelete(id);
  };

  const isConfirmed = status === 'confirmed';

  return (
    <div
      className={`w-72 rounded-lg bg-[#0E223D] shadow-xl transition-all select-none border-2 ${
        isConfirmed
          ? 'border-emerald-500/80 shadow-emerald-950/40'
          : 'border-amber-500/80 border-dashed shadow-amber-950/40'
      }`}
    >
      {/* 4 Connection Handles */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-[#D4A017] !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-[#D4A017] !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable} className="!bg-[#D4A017] !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} className="!bg-[#D4A017] !w-3 !h-3" />

      {/* Card Header */}
      <div className="bg-[#071120] px-3 py-2 rounded-t-md border-b border-[#1C3B64] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded bg-[#132B4C] border border-[#254F85] flex items-center justify-center text-[#D4A017] flex-shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-300 truncate">
              PERSON OF INTEREST
            </span>
            {data.priority_score != null && (
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  title={data.priorityReasoning ? `Score: ${data.priority_score} — ${data.priorityReasoning}` : 'Live Suspect Priority Score (XGBoost)'}
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold flex items-center gap-1 border shadow-xs ${
                    data.priority_score >= 70
                      ? 'bg-rose-500/25 text-rose-300 border-rose-500/60 animate-pulse'
                      : data.priority_score >= 40
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/60'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>PRIORITY: {data.priority_score}</span>
                </span>
              </div>
            )}
            {data.priorityError && (
              <span className="text-[8.5px] font-mono text-rose-400" title={data.priorityError}>
                Analysis Unavailable
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Status Toggle Button */}
          <button
            onClick={toggleStatus}
            title={isConfirmed ? 'Status: Confirmed Verified Fact' : 'Status: Working Hypothesis'}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-colors ${
              isConfirmed
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            {isConfirmed ? <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> : <HelpCircle className="w-2.5 h-2.5 text-amber-400" />}
            <span>{isConfirmed ? 'CONFIRMED' : 'HYPOTHESIS'}</span>
          </button>

          {/* Delete Node */}
          <button
            onClick={handleDelete}
            title="Delete Card"
            className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-3 space-y-2 text-xs">
        {isEditing ? (
          <div className="space-y-2 font-sans" onClick={(e) => e.stopPropagation()}>
            <div>
              <label className="text-[9.5px] font-mono text-slate-400 uppercase">Full Name / Alias</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-2 py-1 bg-[#071120] border border-[#254F85] rounded text-white text-xs font-semibold focus:outline-none focus:border-[#D4A017]"
              />
            </div>
            <div>
              <label className="text-[9.5px] font-mono text-slate-400 uppercase">Role / Classification</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Accused, Conduit, Lookout, Co-conspirator..."
                className="w-full px-2 py-1 bg-[#071120] border border-[#254F85] rounded text-slate-200 text-xs focus:outline-none focus:border-[#D4A017]"
              />
            </div>
            <div>
              <label className="text-[9.5px] font-mono text-slate-400 uppercase">Investigator Notes & Lead Details</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter working theory, observed behaviors, known ties..."
                className="w-full p-2 bg-[#071120] border border-[#254F85] rounded text-slate-200 text-[11px] font-sans focus:outline-none focus:border-[#D4A017]"
              />
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 rounded bg-[#132B4C] text-slate-300 text-[10px] hover:bg-[#1C3B64]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-2.5 py-1 rounded bg-[#D4A017] text-[#0A192F] font-bold text-[10px] hover:bg-[#F59E0B] flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5" onClick={() => setIsEditing(true)}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="font-bold text-white text-sm tracking-tight truncate flex items-center gap-1.5">
                  <span>{label}</span>
                  {data.linkedId && (
                    <span title="Linked to database record" className="text-[#D4A017]">
                      <LinkIcon className="w-3 h-3 inline" />
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] font-mono text-[#D4A017] uppercase">{role}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#132B4C] transition-colors"
                title="Edit Card"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

            <p className="text-[11px] text-slate-300 font-sans leading-relaxed bg-[#071120]/70 p-2 rounded border border-[#1C3B64]">
              {description || <span className="text-slate-500 italic">Click to add investigator theory or details...</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(PersonCardNode);
