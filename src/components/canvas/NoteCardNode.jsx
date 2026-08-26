import React, { useState, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { StickyNote, ShieldCheck, HelpCircle, Trash2, Edit3, Check, Pin } from 'lucide-react';

function NoteCardNode({ id, data, isConnectable }) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || 'Investigator Lead Note');
  const [description, setDescription] = useState(data.description || '');
  const [status, setStatus] = useState(data.status || 'hypothesis');

  const handleSave = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    data.label = label;
    data.description = description;
    data.status = status;
    if (data.onChange) data.onChange(id, { label, description, status });
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
      className={`w-72 rounded-lg bg-[#27271A] shadow-xl transition-all select-none border-2 ${
        isConfirmed
          ? 'border-emerald-500/80 shadow-emerald-950/40'
          : 'border-[#F59E0B] border-dashed shadow-amber-950/40'
      }`}
    >
      {/* 4 Connection Handles */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-[#F59E0B] !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-[#F59E0B] !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable} className="!bg-[#F59E0B] !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} className="!bg-[#F59E0B] !w-3 !h-3" />

      {/* Header */}
      <div className="bg-[#1C1C12] px-3 py-2 rounded-t-md border-b border-[#3D3A1F] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded bg-[#3D3A1F] flex items-center justify-center text-[#F59E0B] flex-shrink-0">
            <Pin className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#FEF3C7] truncate">
            EVIDENCE / WORKING NOTE
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleStatus}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-colors ${
              isConfirmed
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            {isConfirmed ? <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> : <HelpCircle className="w-2.5 h-2.5 text-amber-400" />}
            <span>{isConfirmed ? 'VERIFIED' : 'HYPOTHESIS'}</span>
          </button>

          <button
            onClick={handleDelete}
            title="Delete Card"
            className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2 text-xs">
        {isEditing ? (
          <div className="space-y-2 font-sans" onClick={(e) => e.stopPropagation()}>
            <div>
              <label className="text-[9.5px] font-mono text-[#FDE68A] uppercase">Note Heading / Topic</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-2 py-1 bg-[#1C1C12] border border-[#524E2A] rounded text-[#FEF3C7] text-xs font-semibold focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div>
              <label className="text-[9.5px] font-mono text-[#FDE68A] uppercase">Observation / Evidence Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Burner phone drop, witness quote, CCTV timestamps, getaway route..."
                className="w-full p-2 bg-[#1C1C12] border border-[#524E2A] rounded text-[#FEF3C7] text-[11px] font-sans focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 rounded bg-[#3D3A1F] text-slate-300 text-[10px] hover:bg-[#524E2A]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-2.5 py-1 rounded bg-[#F59E0B] text-[#0A192F] font-bold text-[10px] hover:bg-[#D97706] flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5" onClick={() => setIsEditing(true)}>
            <div className="flex items-start justify-between">
              <div className="font-bold text-[#FEF3C7] text-xs tracking-tight truncate">
                {label}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#3D3A1F] transition-colors"
                title="Edit Note"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

            <p className="text-[11px] text-[#FDE68A] font-sans leading-relaxed bg-[#1C1C12]/80 p-2 rounded border border-[#3D3A1F]">
              {description || <span className="text-slate-400 italic">Click to record investigative observation...</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(NoteCardNode);
