import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  FileText, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Check,
  Sparkles
} from 'lucide-react';
import { dbService } from '../services/db';

export default function AlertsFindings() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAlertId, setExpandedAlertId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    async function loadAlerts() {
      setLoading(true);
      try {
        const list = await dbService.getAlerts({
          severity: severityFilter,
          status: statusFilter,
          search: searchQuery
        });
        setAlerts(list || []);
      } catch (err) {
        console.error("Failed to load alerts:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, [severityFilter, statusFilter, searchQuery]);

  const handleUpdateStatus = async (alertId, newStatus) => {
    await dbService.updateAlertStatus(alertId, newStatus);
    const updatedList = await dbService.getAlerts({
      severity: severityFilter,
      status: statusFilter,
      search: searchQuery
    });
    setAlerts(updatedList);
    setFeedbackMessage(`Alert ${alertId} status changed to ${newStatus}`);
    setTimeout(() => setFeedbackMessage(''), 2500);
  };

  const findingsFeed = [
    { id: 'F1', title: 'Phone Call Location Match', target: 'Farhan Merchant', status: 'confirmed', confidence: 94, time: '12m ago', tech: 'CDR Intersection' },
    { id: 'F2', title: 'Tool Cut Mark Match on Safe', target: 'CR/2026/1045', status: 'confirmed', confidence: 89, time: '45m ago', tech: 'Safe Metallurgy Shear Match' },
    { id: 'F3', title: 'Internet Call Route Traced', target: 'Apex Zenith LLP', status: 'pending', confidence: 73, time: '2h ago', tech: 'VoIP Gateway Hop' },
    { id: 'F4', title: 'Suspicious Money Mule Account', target: 'ACC-404', status: 'rejected', confidence: 42, time: '5h ago', tech: 'Mule Account Flag' },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. TOP TITLE BANNER */}
      <div className="glass-card p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <span>Important Alerts & Clues</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/80 text-rose-300 border border-rose-800">
              ACTION QUEUE
            </span>
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Live notifications when AI discovers suspect meeting places, matching crime methods, or suspicious bank activity.
          </p>
        </div>
        {feedbackMessage && (
          <div className="px-3 py-1.5 bg-emerald-950/90 border border-emerald-700 text-emerald-300 text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* 2. SEVERITY TABS & MULTI-FILTER BAR */}
      <div className="glass-card p-4 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'All', label: 'All Severity' },
              { id: 'High', label: 'High Priority (Red)', color: 'text-rose-400' },
              { id: 'Medium', label: 'Medium (Amber)', color: 'text-amber-400' },
              { id: 'Low', label: 'Low (Navy/Slate)', color: 'text-cyan-400' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSeverityFilter(tab.id)}
                className={`py-1.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  severityFilter === tab.id
                    ? 'border-[#D4A017] text-[#D4A017]'
                    : 'border-transparent text-slate-400 hover:text-white'
                } ${tab.color || ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-slate-300 uppercase font-mono">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white/[0.08] border border-white/15 rounded text-white font-semibold focus:outline-none focus:border-[#D4A017]"
            >
              <option value="All" className="bg-[#0A192F]">All Statuses</option>
              <option value="New" className="bg-[#0A192F]">New / Action Required</option>
              <option value="Reviewed" className="bg-[#0A192F]">Reviewed</option>
              <option value="Dismissed" className="bg-[#0A192F]">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter alerts by title, description, or target entity ID..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/[0.08] border border-white/15 rounded focus:outline-none focus:border-[#D4A017] text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* 3. MAIN GRID (LEFT ALERTS + RIGHT FINDINGS FEED) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Alerts List (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400 glass-card rounded-lg">
              Loading intelligence alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 glass-card rounded-lg">
              No alerts match the selected filters.
            </div>
          ) : (
            alerts.map((alert) => {
              const isExpanded = expandedAlertId === alert.id;
              const severityBorder =
                alert.severity === 'High'
                  ? 'border-l-4 border-l-[#E4232D]'
                  : alert.severity === 'Medium'
                  ? 'border-l-4 border-l-[#F59E0B]'
                  : 'border-l-4 border-l-[#38BDF8]';

              const statusPill =
                alert.status === 'New'
                  ? 'bg-red-950/80 text-rose-300 border-rose-800'
                  : alert.status === 'Reviewed'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : 'bg-white/10 text-slate-300 border-white/15';

              return (
                <div
                  key={alert.id}
                  className={`glass-card rounded-lg ${severityBorder} transition-all overflow-hidden`}
                >
                  <div className="p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${statusPill}`}>
                            {alert.status}
                          </span>
                          <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                            {alert.confidence}% Conf
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-white mt-1">
                          {alert.title}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {alert.description}
                        </p>
                      </div>

                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand Details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap text-[10.5px]">
                        <span className="font-mono bg-white/[0.08] px-2 py-0.5 rounded text-slate-200 border border-white/15">
                          {alert.target_type}: {alert.target_id}
                        </span>
                        <span className="text-slate-300 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-[#D4A017]" />
                          {alert.evidence_refs?.length || 0} Evidence Docs
                        </span>
                      </div>

                      {/* Working Status Buttons */}
                      <div className="flex items-center gap-1.5">
                        {alert.status !== 'Reviewed' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'Reviewed')}
                            className="px-2.5 py-1 bg-white/[0.12] hover:bg-white/[0.20] text-white font-medium text-[10.5px] rounded transition-colors flex items-center gap-1 border border-white/20 shadow-xs"
                          >
                            <Check className="w-3 h-3 text-[#D4A017]" />
                            <span>Mark Reviewed</span>
                          </button>
                        )}
                        {alert.status !== 'Dismissed' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'Dismissed')}
                            className="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white font-medium text-[10.5px] rounded border border-white/15 transition-colors"
                          >
                            <span>Dismiss</span>
                          </button>
                        )}
                        {alert.status !== 'New' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'New')}
                            className="px-2 py-1 text-slate-400 hover:text-white font-bold text-[10px] flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Re-open</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="bg-white/[0.05] px-4 py-3 border-t border-white/10 text-xs space-y-2.5">
                      <div>
                        <span className="font-bold text-slate-300 uppercase tracking-wider text-[9.5px] block mb-1">
                          Evidence Artifact Documentation:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {alert.evidence_refs?.map((ref, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-white/[0.08] rounded border border-white/15 text-[10.5px] font-mono text-slate-200 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-[#D4A017]" />
                              {ref}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px] text-slate-400">
                        <span>Model Signature: <strong className="text-slate-200 font-mono">CIU-Correlation-v2.4</strong></span>
                        <button
                          onClick={() => {
                            if (alert.target_type === 'Case') navigate(`/cases?id=${alert.target_id}`);
                            else if (alert.target_type === 'Person') navigate(`/entities?id=${alert.target_id}`);
                            else navigate('/graph');
                          }}
                          className="text-[#D4A017] hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>Go to Target Dossier</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Live Findings Feed (4 Cols) */}
        <div className="lg:col-span-4 glass-card rounded-lg overflow-hidden flex flex-col h-fit">
          <div className="bg-white/[0.08] px-4 py-3 text-white flex items-center justify-between border-b border-white/15">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4A017]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white">
                Latest AI Clues & Activity
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-[#D4A017]">REAL-TIME</span>
          </div>

          <div className="p-3.5 space-y-2.5">
            {findingsFeed.map((item) => (
              <div key={item.id} className="p-3 bg-white/[0.07] backdrop-blur-sm rounded-md border border-white/15 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {item.status === 'confirmed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : item.status === 'pending' ? (
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-[#E4232D]" />
                    )}
                    <span className="font-semibold text-white">{item.title}</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 font-mono">{item.time}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Analysis: {item.tech}
                </div>
                <div className="text-[10.5px] text-slate-300 mt-1">
                  Target: <strong className="text-white">{item.target}</strong>
                </div>
                <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-white/10 text-[9.5px]">
                  <span className="font-mono font-bold text-[#D4A017]">{item.confidence}% Match Certainty</span>
                  <span className="text-slate-400 uppercase font-mono">{item.status === 'confirmed' ? 'Verified Fact' : item.status === 'pending' ? 'Needs Review' : 'Dismissed'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
