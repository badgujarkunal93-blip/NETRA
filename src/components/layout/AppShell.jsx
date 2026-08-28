import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  ShieldAlert,
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
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import MumbaiMapBackground from './MumbaiMapBackground';

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(0);

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

  const isActive = (path) => location.pathname.startsWith(path);
  const handleLogout = () => { logout(); navigate('/login'); };

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
        { label: 'Case Canvas', path: '/canvas', icon: Layers },
        { label: 'Alerts & Findings', path: '/alerts', icon: Bell, badge: activeAlertCount > 0 ? activeAlertCount : null },
        { label: 'MO Matching', path: '/mo-similarity', icon: Fingerprint },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#061121] text-slate-100 overflow-hidden select-none">
      {/* 1. DEEP NAVY INSTITUTIONAL SIDEBAR */}
      <aside className="w-60 bg-[#0A192F] text-slate-300 flex flex-col justify-between border-r border-[#132B4C] z-30 flex-shrink-0 relative">
        <div className="flex flex-col">
          {/* Institution Brand Header */}
          <div className="px-4 py-3 border-b border-[#132B4C] flex items-center gap-3 bg-[#071120]">
            <img 
              src="/app_logo.png" 
              alt="Mumbai Police CIU Logo" 
              className="w-7 h-7 object-contain flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold tracking-wider text-sm text-white">NETRA</span>
                <span className="text-[9px] font-mono px-1 py-0.2 bg-[#D4A017] text-[#0A192F] font-bold rounded">
                  CIU
                </span>
              </div>
              <span className="text-[9.5px] tracking-tight text-slate-400 font-medium">
                Criminal Intelligence Unit
              </span>
            </div>
          </div>

          {/* Institutional Jurisdiction Sub-banner */}
          <div className="px-4 py-1.5 bg-[#061121] border-b border-[#132B4C] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-[#D4A017]" />
              <span>ZONE 1 • CRIME BRANCH</span>
            </div>
            <span className="text-emerald-400 font-bold">SECURE</span>
          </div>

          {/* Navigation Groups */}
          <nav className="p-3 space-y-4 overflow-y-auto">
            {navGroups.map((grp) => (
              <div key={grp.group} className="space-y-1">
                <div className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400 px-2 font-bold mb-1">
                  {grp.group}
                </div>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#132B4C] text-[#D4A017] border-l-2 border-[#D4A017] font-semibold'
                          : 'text-slate-300 hover:bg-[#0E223D] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#D4A017]' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#E4232D] text-white">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
          {/* Gateway of India Decorative Watermark */}
          <div className="absolute bottom-16 left-0 w-full pointer-events-none flex justify-center overflow-hidden">
            <img 
              src="/gateway_bg.png" 
              alt="Gateway of India Watermark"
              className="w-4/5 object-contain opacity-20 mix-blend-plus-lighter"
            />
          </div>
        </div>

        {/* User Session Footer */}
        <div className="p-2.5 border-t border-[#132B4C] bg-[#061121] relative z-10">
          <div className="flex items-center justify-between p-2 rounded bg-[#0A192F] border border-[#132B4C]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded bg-[#132B4C] text-[#D4A017] font-mono font-bold text-xs flex items-center justify-center border border-[#1C3B64] flex-shrink-0">
                VK
              </div>
              <div className="min-w-0 text-left">
                <div className="font-semibold text-xs text-white truncate">
                  {user?.badge_number || 'Insp. Kadam'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {user?.role || 'Lead Analyst'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-[#E4232D] p-1 rounded hover:bg-white/5 transition-colors"
              title="End Secure Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#061121]">
        {/* Global Institutional Top Bar */}
        <header className="h-12 bg-[#0A192F] border-b border-[#132B4C] flex items-center justify-between px-4 z-20 flex-shrink-0">
          {/* Global Case / Entity Typeahead */}
          <div className="relative w-80">
            <div className="flex items-center gap-2 bg-[#061121] border border-[#1C3B64] rounded px-2.5 py-1 text-xs text-slate-300 focus-within:border-[#D4A017]">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={globalSearch}
                onChange={handleSearchChange}
                placeholder="Global search FIR, Accused, Phone, IMEI..."
                className="bg-transparent text-white placeholder-slate-400 w-full focus:outline-none text-xs font-mono"
              />
            </div>

            {/* Typeahead Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-96 mt-1 bg-[#0A192F] border border-[#254F85] rounded-md shadow-2xl py-1 z-50 divide-y divide-white/5">
                {searchResults.map((res) => (
                  <button
                    key={`${res.type}-${res.id}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setGlobalSearch('');
                      navigate(res.path);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#132B4C] flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-1 py-0.2 bg-[#0E223D] border border-white/10 rounded text-[#D4A017]">
                          {res.type}
                        </span>
                        <span>{res.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{res.subtitle}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Operational Status Indicators */}
          <div className="flex items-center gap-3">
            {/* Live Database Sync Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#061121] border border-[#1C3B64] text-[10px] font-mono text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <Database className="w-3 h-3 text-[#D4A017]" />
              <span className="hidden sm:inline">CCTNS LIVE CLOUD SYNC</span>
            </div>

            {/* Secure Clearance Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0E223D] border border-[#254F85] text-slate-200 text-xs">
              <Shield className="w-3.5 h-3.5 text-[#D4A017]" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#D4A017]">
                CLEARANCE LEVEL 4
              </span>
            </div>

            {/* Quick Officer Identity */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#132B4C]">
              <div className="w-6 h-6 rounded-full bg-[#132B4C] border border-[#254F85] flex items-center justify-center font-mono font-bold text-[10px] text-[#D4A017]">
                VK
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-white leading-tight">Insp. Vikram Kadam</div>
                <div className="text-[9.5px] text-slate-400 font-mono">Senior Intelligence Officer</div>
              </div>
            </div>
          </div>
        </header>

        {/* 3. MAIN WORKSPACE VIEWPORT */}
        <main className="flex-1 overflow-y-auto bg-[#061121] p-5 relative">
          <MumbaiMapBackground />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
