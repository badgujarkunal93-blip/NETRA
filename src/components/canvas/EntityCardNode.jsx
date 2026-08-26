import React, { useState, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Phone, 
  Car, 
  CreditCard, 
  MapPin, 
  Building, 
  FileText, 
  ShieldCheck, 
  HelpCircle, 
  Trash2, 
  Edit3, 
  Check, 
  Link as LinkIcon 
} from 'lucide-react';

function getEntityIcon(type) {
  switch (type?.toLowerCase()) {
    case 'phone': return Phone;
    case 'vehicle': return Car;
    case 'account': return CreditCard;
    case 'location': return MapPin;
    case 'organization': return Building;
    case 'case': return FileText;
    default: return FileText;
  }
}

function getEntityColor(type) {
  switch (type?.toLowerCase()) {
    case 'phone': return 'text-sky-400 bg-sky-950/60 border-sky-800';
    case 'vehicle': return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
    case 'account': return 'text-amber-400 bg-amber-950/60 border-amber-800';
    case 'location': return 'text-rose-400 bg-rose-950/60 border-rose-800';
    case 'organization': return 'text-indigo-400 bg-indigo-950/60 border-indigo-800';
    case 'case': return 'text-[#D4A017] bg-[#0A192F] border-[#132B4C]';
    default: return 'text-slate-300 bg-slate-800 border-slate-700';
  }
}

function EntityCardNode({ id, data, isConnectable }) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || 'Entity Item');
  const [nodeType, setNodeType] = useState(data.nodeType || 'Phone');
  const [description, setDescription] = useState(data.description || '');
  const [status, setStatus] = useState(data.status || 'hypothesis');

  const Icon = getEntityIcon(nodeType);
  const colorClass = getEntityColor(nodeType);

  const handleSave = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    data.label = label;
    data.nodeType = nodeType;
    data.description = description;
    data.status = status;
    if (data.onChange) data.onChange(id, { label, nodeType, description, status });
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
          : 'border-slate-400/80 border-dashed shadow-slate-950/40'
      }`}
    >
      {/* 4 Connection Handles */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-[#D4A017] !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-[#D4A017] !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable} className="!bg-[#D4A017] !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} className="!bg-[#D4A017] !w-3 !h-3" />

      {/* Header */}
      <div className="bg-[#071120] px-3 py-2 rounded-t-md border-b border-[#1C3B64] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded flex items-center justify-center border ${colorClass} flex-shrink-0`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-300 truncate">
            {nodeType} ASSET
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleStatus}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-colors ${
              isConfirmed
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
            }`}
          >
            {isConfirmed ? <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> : <HelpCircle className="w-2.5 h-2.5 text-slate-400" />}
            <span>{isConfirmed ? 'VERIFIED' : 'HYPOTHESIS'}</span>
          </button>

          <button
            onClick={handleDelete}
            title="Delete Card"
            className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2 text-xs">
        {isEditing ? (
          <div className="space-y-2 font-sans" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9.5px] font-mono text-slate-400 uppercase">Entity Type</label>
                <select
                  value={nodeType}
                  onChange={(e) => setNodeType(e.target.value)}
                  className="w-full px-2 py-1 bg-[#071120] border border-[#254F85] rounded text-white text-xs focus:outline-none focus:border-[#D4A017]"
                >
                  <option value="Phone">Phone</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Account">Bank Account</option>
                  <option value="Location">Location</option>
                  <option value="Organization">Organization</option>
                  <option value="Case">Case FIR</option>
                </select>
              </div>
              <div>
                <label className="text-[9.5px] font-mono text-slate-400 uppercase">Label / Number</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-2 py-1 bg-[#071120] border border-[#254F85] rounded text-white text-xs font-semibold focus:outline-none focus:border-[#D4A017]"
                />
              </div>
            </div>
            <div>
              <label className="text-[9.5px] font-mono text-slate-400 uppercase">Forensic Context & Notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Registration plate, IMEI, bank branch, tower coordinates..."
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
                  <span className="font-mono">{label}</span>
                  {data.linkedId && (
                    <span title="Linked to database record" className="text-[#D4A017]">
                      <LinkIcon className="w-3 h-3 inline" />
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] font-mono text-slate-400 uppercase">{nodeType} Record</div>
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
              {description || <span className="text-slate-500 italic">Click to record asset telemetry or leads...</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(EntityCardNode);
