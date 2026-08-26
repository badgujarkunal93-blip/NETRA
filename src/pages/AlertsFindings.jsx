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
      const list = await dbService.getAlerts({
        severity: severityFilter,
        status: statusFilter,
        search: searchQuery
      });
      setAlerts(list);
      setLoading(false);
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
    { id: 'F1', title: 'Corroborated CDR Intersection', target: 'Farhan Merchant', status: 'confirmed', confidence: 94, time: '12m ago' },
    { id: 'F2', title: 'Safe Shear Metallurgy Match', target: 'CR/2026/1045', status: 'confirmed', confidence: 89, time: '45m ago' },
    { id: 'F3', title: 'VoIP IP Gateway Hop Trace', target: 'Apex Zenith LLP', status: 'pending', confidence: 73, time: '2h ago' },
    { id: 'F4', title: 'Unverified Mule Account Flag', target: 'ACC-404', status: 'rejected', confidence: 42, time: '5h ago' },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. TOP TITLE BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#CBD5E1]">
        <div>
          <h1 className="text-base font-bold text-[#0A192F] uppercase tracking-wide">
            Automated Intelligence Alerts & Findings Queue
          </h1>
          <p className="text-xs text-slate-500">
            Real-time correlation triggers across modus operandi patterns, co-location traces, and financial anomalies.
          </p>
        </div>
        {feedbackMessage && (
          <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-semibold rounded flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* 2. SEVERITY TABS & MULTI-FILTER BAR */}
      <div className="bg-white p-3.5 rounded-md border border-[#E2E8F0] shadow-sm space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1">
            {[
              { id: 'All', label: 'All Severity' },
              { id: 'High', label: 'High Priority (Red)', color: 'text-[#B91C1C]' },
              { id: 'Medium', label: 'Medium (Amber)', color: 'text-[#92400E]' },
              { id: 'Low', label: 'Low (Navy/Slate)', color: 'text-[#0A192F]' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSeverityFilter(tab.id)}
                className={`py-1.5 px-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  severityFilter === tab.id
                    ? 'border-[#0A192F] text-[#0A192F]'
                    : 'border-transparent text-slate-500 hover:text-[#0A192F]'
                } ${tab.color || ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#0A192F] font-semibold focus:outline-none"
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
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter alerts by title, description, or target entity ID..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0A192F] text-[#0F172A]"
          />
        </div>
      </div>

      {/* 3. MAIN GRID (LEFT ALERTS + RIGHT FINDINGS FEED) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Alerts List (8 Cols) */}
        <div className="lg:col-span-8 space-y-2.5">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-md border border-[#E2E8F0]">
              Loading intelligence alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-md border border-[#E2E8F0]">
              No alerts match the selected filters.
            </div>
          ) : (
            alerts.map((alert) => {
              const isExpanded = expandedAlertId === alert.id;
              const severityBorder =
                alert.severity === 'High'
                  ? 'border-l-3 border-l-[#B91C1C]'
                  : alert.severity === 'Medium'
                  ? 'border-l-3 border-l-[#D4A017]'
                  : 'border-l-3 border-l-[#0A192F]';

              const statusPill =
                alert.status === 'New'
                  ? 'bg-[#FEE2E2] text-[#B91C1C] border-red-200'
                  : alert.status === 'Reviewed'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200';

              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-md border border-[#E2E8F0] shadow-sm ${severityBorder} transition-all overflow-hidden`}
                >
                  <div className="p-3.5 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${statusPill}`}>
                            {alert.status}
                          </span>
                          <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
                            {alert.confidence}% Conf
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-[#0A192F] mt-0.5">
                          {alert.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {alert.description}
                        </p>
                      </div>

                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                        className="p-1 text-slate-400 hover:text-[#0A192F] rounded hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand Details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap text-[10.5px]">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">
                          {alert.target_type}: {alert.target_id}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          {alert.evidence_refs?.length || 0} Evidence Docs
                        </span>
                      </div>

                      {/* Working Status Buttons */}
                      <div className="flex items-center gap-1.5">
                        {alert.status !== 'Reviewed' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'Reviewed')}
                            className="px-2 py-1 bg-[#0A192F] hover:bg-[#132B4C] text-white font-medium text-[10.5px] rounded transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 text-[#D4A017]" />
                            <span>Mark Reviewed</span>
                          </button>
                        )}
                        {alert.status !== 'Dismissed' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'Dismissed')}
                            className="px-2 py-1 bg-[#F1F5F9] hover:bg-slate-200 text-slate-700 font-medium text-[10.5px] rounded transition-colors"
                          >
                            <span>Dismiss</span>
                          </button>
                        )}
                        {alert.status !== 'New' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'New')}
                            className="px-1.5 py-1 text-slate-400 hover:text-[#0A192F] font-bold text-[10px] flex items-center gap-1"
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
                    <div className="bg-[#F8FAFC] px-4 py-3 border-t border-slate-200 text-xs space-y-2.5">
                      <div>
                        <span className="font-bold text-slate-600 uppercase tracking-wider text-[9.5px] block mb-1">
                          Evidence Artifact Documentation:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {alert.evidence_refs?.map((ref, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-white rounded border border-slate-200 text-[10.5px] font-mono text-slate-800 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-[#0A192F]" />
                              {ref}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10.5px] text-slate-500">
                        <span>Model Signature: <strong>CIU-Correlation-v2.4</strong></span>
                        <button
                          onClick={() => {
                            if (alert.target_type === 'Case') navigate(`/cases?id=${alert.target_id}`);
                            else if (alert.target_type === 'Person') navigate(`/entities?id=${alert.target_id}`);
                            else navigate('/graph');
                          }}
                          className="text-[#B45309] hover:underline font-semibold flex items-center gap-1"
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
        <div className="lg:col-span-4 bg-white rounded-md border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="bg-[#0A192F] px-3.5 py-2.5 text-white flex items-center justify-between border-b border-[#132B4C]">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Live Findings Feed
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-slate-400">CHRONOLOGICAL</span>
          </div>

          <div className="p-3.5 space-y-2.5">
            {findingsFeed.map((item) => (
              <div key={item.id} className="p-2.5 bg-[#F8FAFC] rounded border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    {item.status === 'confirmed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : item.status === 'pending' ? (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-[#B91C1C]" />
                    )}
                    <span className="font-semibold text-[#0A192F]">{item.title}</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 font-mono">{item.time}</span>
                </div>
                <div className="text-[10.5px] text-slate-600">
                  Target: <strong className="text-slate-900">{item.target}</strong>
                </div>
                <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-slate-200 text-[9.5px]">
                  <span className="font-mono font-bold text-[#92400E]">{item.confidence}% Correlation</span>
                  <span className="text-slate-400 uppercase font-mono">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
