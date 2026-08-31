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
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/db';
import IndiaMapBackground from './IndiaMapBackground';

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  // Sidebar Open/Collapsed State with Session/Local Persistence
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('netra_sidebar_open');
      if (saved !== null) {
        return saved === 'true';
      }
      // On mobile / small screens, default to closed
      return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
    } catch {
      return true;
    }
  });

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync sidebar state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('netra_sidebar_open', String(isSidebarOpen));
    } catch {
      // Ignore storage errors
    }
  }, [isSidebarOpen]);

  // Handle ESC key to close sidebar on mobile
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isSidebarOpen]);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

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
    <div className="flex h-screen bg-[#FFFFFF] text-[#071A33] overflow-hidden select-none relative">
      {/* Mobile Backdrop Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity duration-200 motion-reduce:transition-none"
          aria-hidden="true"
        />
      )}

      {/* 1. COLLAPSIBLE STRICT WHITE INSTITUTIONAL SIDEBAR */}
      <aside 
        className={`
          bg-[#FFFFFF] text-[#071A33] flex flex-col justify-between border-r border-[#0B2341]/15 z-50 flex-shrink-0 relative
          transition-[width,transform,opacity] duration-250 ease-in-out motion-reduce:transition-none overflow-hidden
          ${isMobile 
            ? `fixed inset-y-0 left-0 w-64 shadow-2xl ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`
            : isSidebarOpen 
              ? 'w-60 opacity-100' 
              : 'w-0 border-r-0 opacity-0 pointer-events-none'
          }
        `}
        aria-hidden={!isSidebarOpen && !isMobile}
      >
        {/* Inner Fixed-Width Wrapper to prevent text wrapping during animation */}
        <div className="w-60 flex flex-col h-full justify-between flex-shrink-0">
          <div className="flex flex-col">
            {/* Institution Brand Header */}
            <div className="px-4 py-3.5 border-b border-[#0B2341] flex items-center justify-between bg-[#071A33] text-white">
              <div className="flex items-center gap-3 min-w-0">
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
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#F5B800] text-[#071A33] font-bold rounded">
                      CIU
                    </span>
                  </div>
                  <span className="text-[9.5px] tracking-tight text-slate-300 font-medium block">
                    Criminal Intelligence Unit
                  </span>
                </div>
              </div>
              {/* Close Button on Mobile */}
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-[#0E2A4D] transition-colors"
                  aria-label="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Institutional Jurisdiction Sub-banner */}
            <div className="px-4 py-1.5 bg-[#0B2341] border-b border-[#0E2A4D] flex items-center justify-between text-[10px] font-mono text-slate-200 font-semibold">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-[#F5B800]" />
                <span>ZONE 1 • CRIME BRANCH</span>
              </div>
              <span className="text-emerald-400 font-bold">SECURE</span>
            </div>

            {/* Navigation Groups */}
            <nav className="p-3 space-y-4 overflow-y-auto">
              {navGroups.map((grp) => (
                <div key={grp.group} className="space-y-1">
                  <div className="text-[9.5px] font-mono uppercase tracking-wider text-[#071A33]/50 px-2 font-bold mb-1">
                    {grp.group}
                  </div>
                  {grp.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                          active
                            ? 'bg-[#FFFBEB] text-[#071A33] border-l-4 border-[#F5B800] font-bold shadow-xs'
                            : 'text-[#071A33]/85 hover:bg-[#F4F7FB] hover:text-[#071A33]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#F5B800]' : 'text-[#071A33]'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#DC2626] text-white">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Gateway of India Decorative Monochrome Navy Watermark */}
            <div className="absolute bottom-16 left-0 w-60 pointer-events-none flex justify-center overflow-hidden">
              <img 
                src="/gateway_bg.png" 
                alt="Gateway of India Watermark"
                className="w-[85%] object-contain opacity-35 filter contrast-150 brightness-75 mix-blend-multiply transition-opacity duration-300"
              />
            </div>
          </div>

          {/* User Session Footer */}
          <div className="p-2.5 border-t border-[#0B2341]/10 bg-[#FFFFFF] relative z-10">
            <div className="flex items-center justify-between p-2 rounded bg-[#F4F7FB] border border-[#0B2341]/10">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded bg-[#071A33] text-[#F5B800] font-mono font-bold text-xs flex items-center justify-center border border-[#0B2341] flex-shrink-0">
                  VK
                </div>
                <div className="min-w-0 text-left">
                  <div className="font-bold text-xs text-[#071A33] truncate">
                    {user?.badge_number || 'Insp. Kadam'}
                  </div>
                  <div className="text-[10px] text-[#071A33]/65 font-mono truncate">
                    {user?.role || 'Lead Analyst'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-[#071A33]/60 hover:text-[#DC2626] p-1 rounded hover:bg-[#071A33]/5 transition-colors cursor-pointer"
                title="End Secure Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA (Dynamically Fills 100% Available Space) */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden bg-[#FFFFFF] transition-all duration-250 ease-in-out">
        {/* Global Dark Navy Institutional Top Bar */}
        <header className="h-12 bg-[#071A33] border-b border-[#0B2341] flex items-center justify-between px-4 z-20 flex-shrink-0 shadow-sm">
          {/* Left Side: Sidebar Toggle Button + Global Search */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Sidebar Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={isSidebarOpen}
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-[#0E2A4D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F5B800] flex-shrink-0 cursor-pointer"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeftOpen className="w-5 h-5 text-[#F5B800]" />
              )}
            </button>

            {/* When collapsed, show small branding anchor for quick visual context */}
            {!isSidebarOpen && !isMobile && (
              <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-[#133560] flex-shrink-0">
                <img 
                  src="/app_logo.png" 
                  alt="NETRA Emblem" 
                  className="w-5 h-5 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="font-mono font-bold text-xs text-white tracking-wider">NETRA</span>
                <span className="text-[8px] font-mono px-1 py-0.2 bg-[#F5B800] text-[#071A33] font-bold rounded">CIU</span>
              </div>
            )}

            {/* Global Case / Entity Typeahead */}
            <div className="relative w-64 sm:w-80">
              <div className="flex items-center gap-2 bg-[#0E2A4D] border border-[#1C457A] rounded px-2.5 py-1 text-xs text-white focus-within:border-[#F5B800]">
                <Search className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
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
                <div className="absolute top-full left-0 w-96 mt-1 bg-[#FFFFFF] border border-[#0B2341]/20 rounded-md shadow-2xl py-1 z-50 divide-y divide-[#0B2341]/10">
                  {searchResults.map((res) => (
                    <button
                      key={`${res.type}-${res.id}`}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setGlobalSearch('');
                        navigate(res.path);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#F4F7FB] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-[#071A33] flex items-center gap-1.5">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#FFFBEB] border border-[#F5B800]/50 rounded text-[#071A33] font-bold">
                            {res.type}
                          </span>
                          <span>{res.title}</span>
                        </div>
                        <div className="text-[10px] text-[#071A33]/70 truncate mt-0.5">{res.subtitle}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#071A33]/50" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Operational Status Indicators */}
          <div className="flex items-center gap-3">
            {/* Live Database Sync Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0E2A4D] border border-[#1C457A] text-[10px] font-mono text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <Database className="w-3 h-3 text-[#F5B800]" />
              <span className="hidden sm:inline">CCTNS LIVE CLOUD SYNC</span>
            </div>

            {/* Secure Clearance Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0E2A4D] border border-[#1C457A] text-slate-200 text-xs">
              <Shield className="w-3.5 h-3.5 text-[#F5B800]" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#F5B800]">
                CLEARANCE LEVEL 4
              </span>
            </div>

            {/* Quick Officer Identity */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#133560]">
              <div className="w-6 h-6 rounded-full bg-[#0E2A4D] border border-[#F5B800]/60 flex items-center justify-center font-mono font-bold text-[10px] text-[#F5B800]">
                VK
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-white leading-tight">Insp. Vikram Kadam</div>
                <div className="text-[9.5px] text-slate-300 font-mono">Senior Intelligence Officer</div>
              </div>
            </div>
          </div>
        </header>

        {/* 3. MAIN WORKSPACE VIEWPORT */}
        <main className="flex-1 overflow-y-auto bg-[#FFFFFF] p-5 relative w-full">
          <IndiaMapBackground />
          <div className="relative z-10 dashboard-content w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
