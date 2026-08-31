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
      <div className="glass-card p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#0B2341]/12 bg-white">
        <div>
          <h1 className="text-base font-bold text-[#071A33] uppercase tracking-wide flex items-center gap-2">
            <span>Important Alerts & Clues</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-50 text-[#DC2626] border border-red-200 font-bold">
              ACTION QUEUE
            </span>
          </h1>
          <p className="text-xs text-[#071A33]/70 mt-0.5">
            Live notifications when AI discovers suspect meeting places, matching crime methods, or suspicious bank activity.
          </p>
        </div>
        {feedbackMessage && (
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* 2. SEVERITY TABS & MULTI-FILTER BAR */}
      <div className="glass-card p-4 rounded-lg space-y-3 border border-[#0B2341]/12 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#0B2341]/10 pb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'All', label: 'All Severity' },
              { id: 'High', label: 'High Priority (Red)', color: 'text-[#DC2626]' },
              { id: 'Medium', label: 'Medium (Amber)', color: 'text-[#D97706]' },
              { id: 'Low', label: 'Low (Navy)', color: 'text-[#071A33]' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSeverityFilter(tab.id)}
                className={`py-1.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  severityFilter === tab.id
                    ? 'border-[#F5B800] text-[#071A33] bg-[#FFFBEB] rounded-t'
                    : 'border-transparent text-[#071A33]/60 hover:text-[#071A33]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-[#071A33]/70 uppercase font-mono">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-[#0B2341]/20 rounded text-[#071A33] font-semibold focus:outline-none focus:border-[#F5B800]"
            >
              <option value="All">All Statuses</option>
              <option value="New">New / Action Required</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#071A33]/45 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter alerts by title, description, or target entity ID..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#0B2341]/20 rounded focus:outline-none focus:border-[#F5B800] text-[#071A33] placeholder-[#071A33]/45"
          />
        </div>
      </div>

      {/* 3. MAIN GRID (LEFT ALERTS + RIGHT FINDINGS FEED) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Alerts List (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          {loading ? (
            <div className="p-6 text-center text-xs text-[#071A33]/60 glass-card rounded-lg border border-[#0B2341]/12 bg-white">
              Loading intelligence alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#071A33]/60 glass-card rounded-lg border border-[#0B2341]/12 bg-white">
              No alerts match the selected filters.
            </div>
          ) : (
            alerts.map((alert) => {
              const isExpanded = expandedAlertId === alert.id;
              const severityBorder =
                alert.severity === 'High'
                  ? 'border-l-4 border-l-[#DC2626]'
                  : alert.severity === 'Medium'
                  ? 'border-l-4 border-l-[#F5B800]'
                  : 'border-l-4 border-l-[#0B2341]';

              const statusPill =
                alert.status === 'New'
                  ? 'bg-red-50 text-[#DC2626] border-red-200'
                  : alert.status === 'Reviewed'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-[#071A33]/70 border-slate-200';

              return (
                <div
                  key={alert.id}
                  className={`glass-card rounded-lg ${severityBorder} border border-[#0B2341]/12 bg-white transition-all overflow-hidden`}
                >
                  <div className="p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${statusPill}`}>
                            {alert.status}
                          </span>
                          <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200">
                            {alert.confidence}% Conf
                          </span>
                          <span className="text-[10px] text-[#071A33]/55 font-mono">
                            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-[#071A33] mt-1">
                          {alert.title}
                        </h3>
                        <p className="text-xs text-[#071A33]/80 mt-1 leading-relaxed">
                          {alert.description}
                        </p>
                      </div>

                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                        className="p-1 text-[#071A33]/60 hover:text-[#071A33] rounded hover:bg-[#F4F7FB] transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand Details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="mt-3 pt-2.5 border-t border-[#0B2341]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap text-[10.5px]">
                        <span className="font-mono bg-[#F4F7FB] px-2 py-0.5 rounded text-[#071A33] border border-[#0B2341]/10 font-bold">
                          {alert.target_type}: {alert.target_id}
                        </span>
                        <span className="text-[#071A33]/70 flex items-center gap-1 font-medium">
                          <FileText className="w-3 h-3 text-[#F5B800]" />
                          {alert.evidence_refs?.length || 0} Evidence Docs
                        </span>
                      </div>

                      {/* Working Status Buttons */}
                      <div className="flex items-center gap-1.5">
                        {alert.status !== 'Reviewed' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'Reviewed')}
                            className="px-2.5 py-1 bg-[#071A33] hover:bg-[#0B2341] text-white font-medium text-[10.5px] rounded transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3 h-3 text-[#F5B800]" />
                            <span>Mark Reviewed</span>
                          </button>
                        )}
                        {alert.status !== 'Dismissed' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'Dismissed')}
                            className="px-2.5 py-1 bg-white hover:bg-[#F4F7FB] text-[#071A33] font-medium text-[10.5px] rounded border border-[#0B2341]/20 transition-colors"
                          >
                            <span>Dismiss</span>
                          </button>
                        )}
                        {alert.status !== 'New' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'New')}
                            className="px-2 py-1 text-[#071A33]/70 hover:text-[#071A33] font-bold text-[10px] flex items-center gap-1"
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
                    <div className="bg-[#F4F7FB] px-4 py-3 border-t border-[#0B2341]/10 text-xs space-y-2.5">
                      <div>
                        <span className="font-bold text-[#071A33]/80 uppercase tracking-wider text-[9.5px] block mb-1">
                          Evidence Artifact Documentation:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {alert.evidence_refs?.map((ref, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-white rounded border border-[#0B2341]/15 text-[10.5px] font-mono text-[#071A33] font-semibold flex items-center gap-1 shadow-xs">
                              <FileText className="w-3 h-3 text-[#F5B800]" />
                              {ref}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#0B2341]/10 flex items-center justify-between text-[10.5px] text-[#071A33]/70">
                        <span>Model Signature: <strong className="text-[#071A33] font-mono">CIU-Correlation-v2.4</strong></span>
                        <button
                          onClick={() => {
                            if (alert.target_type === 'Case') navigate(`/cases?id=${alert.target_id}`);
                            else if (alert.target_type === 'Person') navigate(`/entities?id=${alert.target_id}`);
                            else navigate('/graph');
                          }}
                          className="text-[#071A33] hover:text-[#D97706] font-bold flex items-center gap-1"
                        >
                          <span>Go to Target Dossier</span>
                          <ExternalLink className="w-3 h-3 text-[#F5B800]" />
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
        <div className="lg:col-span-4 glass-card rounded-lg overflow-hidden flex flex-col h-fit border border-[#0B2341]/12 bg-white">
          <div className="bg-[#F4F7FB] px-4 py-3 text-[#071A33] flex items-center justify-between border-b border-[#0B2341]/10">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#F5B800]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#071A33]">
                Latest AI Clues & Activity
              </span>
            </div>
            <span className="text-[9.5px] font-mono font-bold text-[#D97706]">REAL-TIME</span>
          </div>

          <div className="p-3.5 space-y-2.5">
            {findingsFeed.map((item) => (
              <div key={item.id} className="p-3 bg-[#F4F7FB] rounded-md border border-[#0B2341]/10 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {item.status === 'confirmed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : item.status === 'pending' ? (
                      <Clock className="w-3.5 h-3.5 text-[#F5B800]" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                    )}
                    <span className="font-bold text-[#071A33]">{item.title}</span>
                  </div>
                  <span className="text-[9.5px] text-[#071A33]/55 font-mono">{item.time}</span>
                </div>
                <div className="text-[10px] text-[#071A33]/60 font-mono">
                  Analysis: {item.tech}
                </div>
                <div className="text-[10.5px] text-[#071A33]/85 mt-1">
                  Target: <strong className="text-[#071A33]">{item.target}</strong>
                </div>
                <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-[#0B2341]/10 text-[9.5px]">
                  <span className="font-mono font-bold text-[#D97706]">{item.confidence}% Match Certainty</span>
                  <span className="text-[#071A33]/60 uppercase font-mono font-semibold">{item.status === 'confirmed' ? 'Verified Fact' : item.status === 'pending' ? 'Needs Review' : 'Dismissed'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
