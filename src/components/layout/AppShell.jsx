import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  FolderSearch, 
  Users, 
  Share2, 
  Bell, 
  Fingerprint, 
  LogOut, 
  Search, 
  ChevronRight,
  Database,
  CheckCircle2,
  Lock,
  Radio,
  FileText,
  FileUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import FIRUploadModal from '../ingestion/FIRUploadModal';

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    async function loadAlertCount() {
      const alerts = await dbService.getAlerts({ status: 'New' });
      setActiveAlertCount(alerts.length);
    }
    loadAlertCount();
  }, [location.pathname]);

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setGlobalSearch(val);
    if (val.trim().length >= 2) {
      const cases = await dbService.getCases({ search: val });
      const persons = await dbService.getPersons({ search: val });
      const combined = [
        ...cases.slice(0, 3).map(c => ({ 
          type: 'CASE', 
          id: c.id, 
          title: c.crime_no, 
          subtitle: `${c.police_station} • ${c.crime_major_head}`, 
          path: `/cases?id=${c.id}` 
        })),
        ...persons.slice(0, 3).map(p => ({ 
          type: 'PERSON', 
          id: p.id, 
          title: p.canonical_name, 
          subtitle: `Status: ${p.status_tag} • ${p.confidence_score}% Conf`, 
          path: `/entities?id=${p.id}` 
        }))
      ];
      setSearchResults(combined);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  const navGroups = [
    {
      group: 'OPERATIONAL REGISTRY',
      items: [
        { label: 'Command Center', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Case & FIR Search', path: '/cases', icon: FolderSearch },
        { label: 'Entity Profiles', path: '/entities', icon: Users },
      ]
    },
    {
      group: 'INTELLIGENCE & ANALYSIS',
      items: [
        { label: 'Knowledge Graph', path: '/graph', icon: Share2 },
        { label: 'Alerts & Findings', path: '/alerts', icon: Bell, badge: activeAlertCount > 0 ? activeAlertCount : null },
        { label: 'MO Similarity Matrix', path: '/mo-similarity', icon: Fingerprint },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden select-none">
      {/* 1. DEEP NAVY INSTITUTIONAL SIDEBAR */}
      <aside className="w-60 bg-[#0A192F] text-slate-300 flex flex-col justify-between border-r border-[#132B4C] z-30 flex-shrink-0">
        <div className="flex flex-col">
          {/* Institution Brand Header */}
          <div className="px-4 py-3.5 border-b border-[#132B4C] flex items-center gap-3 bg-[#071120]">
            <div className="w-8 h-8 rounded bg-[#0E223D] border border-[#B45309]/80 flex items-center justify-center text-[#D4A017] shadow-sm">
              <Shield className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-white tracking-wider uppercase truncate">
                MUMBAI POLICE CIU
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">
                Command Console v2.4
              </div>
            </div>
          </div>

          {/* System Terminal State Banner */}
          <div className="mx-3 my-2.5 px-2.5 py-1.5 bg-[#0E223D]/90 rounded border border-[#1C3B64] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300 font-mono text-[10px] uppercase font-medium">JURISDICTION: MUMBAI</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[#B45309]/20 text-[#D4A017] border border-[#B45309]/40">
              RESTRICTED
            </span>
          </div>

          {/* Navigation Groups */}
          <nav className="px-2 space-y-4 mt-1">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                  {group.group}
                </div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#132B4C] text-white border-l-3 border-[#D4A017] font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-[#0E223D] hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5">
                          <item.icon
                            className={`w-3.5 h-3.5 transition-colors ${
                              isActive ? 'text-[#D4A017]' : 'text-slate-400'
                            }`}
                          />
                          <span className="tracking-tight">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-[#B91C1C] text-white">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Investigator Officer Status & Logout */}
        <div className="p-2.5 border-t border-[#132B4C] bg-[#061121]">
          <div className="flex items-center justify-between p-2 rounded bg-[#0A192F] border border-[#132B4C]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded bg-[#132B4C] text-[#D4A017] font-mono font-bold text-xs flex items-center justify-center border border-[#1C3B64] flex-shrink-0">
                VK
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate leading-tight">
                  Insp. V. Kadam
                </div>
                <div className="text-[9.5px] text-slate-400 font-mono truncate">
                  MH-CIU-4029 • Unit-I
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Logout Secure Session"
              className="p-1 text-slate-400 hover:text-[#B91C1C] hover:bg-[#0E223D] rounded transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* COMPACT INSTITUTIONAL TOP BAR */}
        <header className="h-14 bg-white border-b border-[#E2E8F0] px-5 flex items-center justify-between z-20 flex-shrink-0">
          {/* Breadcrumb Hierarchy */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">CIU Operations</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#0A192F] font-bold uppercase tracking-wider text-[11px]">
              {navGroups.flatMap(g => g.items).find(n => location.pathname.startsWith(n.path))?.label || 'Overview'}
            </span>
          </div>

          {/* Central System-Wide Search Input */}
          <div className="relative w-96 max-w-md">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search case no, person of interest, phone, vehicle..."
                value={globalSearch}
                onChange={handleSearchChange}
                onFocus={() => globalSearch.trim().length >= 2 && setIsSearchOpen(true)}
                className="w-full pl-8 pr-12 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0A192F] focus:ring-1 focus:ring-[#0A192F] text-[#0F172A] placeholder-slate-400 font-sans"
              />
              <span className="absolute right-2 text-[9px] font-mono text-slate-400 border border-slate-200 px-1 py-0.5 rounded bg-white">
                Ctrl+K
              </span>
            </div>

            {/* Quick Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#CBD5E1] rounded shadow-lg py-1.5 z-50">
                <div className="px-3 py-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Search Results
                </div>
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setGlobalSearch('');
                      navigate(item.path);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#F1F5F9] flex items-center justify-between text-xs transition-colors border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <div className="font-semibold text-[#0A192F] flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.type}
                        </span>
                        {item.title}
                      </div>
                      <div className="text-[10.5px] text-slate-500 mt-0.5">{item.subtitle}</div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Status & Intelligence Health Indicators */}
          <div className="flex items-center gap-3">
            {/* Sync Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[10.5px] font-mono text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>SYNCED: NCORD • CCTNS</span>
            </div>

            {/* Upload & Ingest FIR Button */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 bg-[#0A192F] hover:bg-[#132B4C] text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5 border border-[#132B4C] shadow-sm"
              title="Upload & Ingest CCTNS FIR Document"
            >
              <FileUp className="w-3.5 h-3.5 text-[#D4A017]" />
              <span className="hidden md:inline">Ingest FIR</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => navigate('/alerts')}
              className="relative p-1.5 text-slate-600 hover:bg-[#F1F5F9] hover:text-[#0A192F] rounded transition-colors"
              title="Intelligence Alerts Queue"
            >
              <Bell className="w-4 h-4" />
              {activeAlertCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#B91C1C] ring-2 ring-white"></span>
              )}
            </button>

            {/* Officer Badge Identifier */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded bg-[#0A192F] text-[#D4A017] flex items-center justify-center font-mono font-bold text-xs border border-[#132B4C]">
                VK
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-[#0A192F] leading-tight">Insp. Vikram Kadam</div>
                <div className="text-[9.5px] text-slate-500 font-mono">Senior Intelligence Officer</div>
              </div>
            </div>
          </div>
        </header>

        {/* 3. MAIN WORKSPACE VIEWPORT */}
        <main className="flex-1 overflow-y-auto bg-[#F1F5F9] p-5">
          <Outlet />
        </main>
      </div>

      {/* Global In-App FIR Document Extraction Modal */}
      <FIRUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
