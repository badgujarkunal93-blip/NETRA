import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Key, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginDirectAccess } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDirectAccess = () => {
    loginDirectAccess();
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (email && password) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        setError('Please provide email and password');
      }
    } catch (err) {
      let message = "Sign-in failed — please try again";
      const errMsg = err.message || '';
      
      if (errMsg.includes('Invalid login credentials')) {
        message = "Invalid email or password";
      } else if (errMsg.includes('Account not authorized')) {
        message = "Account not authorized — contact CIU admin.";
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A192F] flex flex-col justify-between text-white select-none">
      {/* Top Government Portal Header */}
      <header className="px-6 py-3.5 border-b border-[#132B4C] flex items-center justify-between bg-[#061121]">
        <div className="flex items-center gap-3">
          <img 
            src="/app_logo.png" 
            alt="Mumbai Police CIU Emblem" 
            className="w-9 h-9 rounded object-contain bg-[#0E223D] p-0.5 border border-[#B45309]/70 shadow-sm"
          />
          <div>
            <div className="font-semibold text-xs text-white tracking-wider uppercase">
              MUMBAI POLICE — CRIMINAL INTELLIGENCE UNIT
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">
              Government of Maharashtra — Law Enforcement Portal
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 text-[11px]">Emergency CIU Desk:</span>
          <span className="font-mono text-[#D4A017] font-semibold text-xs">022-2262 2262</span>
          <span className="px-2 py-0.5 rounded bg-[#0E223D] text-slate-300 border border-[#1C3B64] text-[10px] font-mono">
            TERMINAL: SECURE
          </span>
        </div>
      </header>

      {/* Center Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-md shadow-md border border-[#E2E8F0] p-6 text-[#0F172A]">
          {/* Card Header */}
          <div className="text-center mb-5 pb-4 border-b border-slate-100">
            <img 
              src="/app_logo.png" 
              alt="CIU Crest" 
              className="w-12 h-12 rounded mx-auto mb-2 object-contain bg-[#0A192F] p-1 border border-[#132B4C] shadow-sm"
            />
            <h1 className="text-base font-bold text-[#0A192F] uppercase tracking-wide">
              Investigator Login
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Authorized access only. All actions are logged and audited under CCTNS protocols.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-[#FEE2E2] border-l-3 border-[#B91C1C] text-xs text-[#B91C1C] flex items-center gap-2 rounded-r">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Official Police Email / Service ID
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mumbaipolice.gov.in"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0A192F] focus:ring-1 focus:ring-[#0A192F] text-[#0F172A] font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0A192F] focus:ring-1 focus:ring-[#0A192F] text-[#0F172A] font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-3 bg-[#0A192F] hover:bg-[#132B4C] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 border border-[#132B4C] cursor-pointer shadow-sm"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Access Command Center</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D4A017]" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Helper & Direct Access Box */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 bg-[#F8FAFC] -mx-6 -mb-6 p-4 rounded-b-md space-y-3">
            <div>
              <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-500 mb-1.5">
                <span className="font-bold uppercase text-slate-600">Investigator Credentials:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('v.kadam@mumbaipolice.gov.in');
                    setPassword('ciu@mumbai2026');
                  }}
                  className="text-[#B45309] hover:underline font-bold cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
              <div className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded border border-slate-200 space-y-0.5">
                <div><span className="text-slate-400">Email:</span> <strong className="text-[#0A192F]">v.kadam@mumbaipolice.gov.in</strong></div>
                <div><span className="text-slate-400">Pass:</span> <strong className="text-[#0A192F]">ciu@mumbai2026</strong></div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDirectAccess}
              className="w-full py-2 px-3 bg-[#0A192F] hover:bg-[#132B4C] text-white font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 border border-[#254F85] shadow-sm"
            >
              <span className="text-[#D4A017]">⚡</span>
              <span>Direct Access Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-[#132B4C] flex items-center justify-between text-[11px] text-slate-400 bg-[#061121]">
        <div>
          © 2026 Criminal Intelligence Unit, Mumbai Police (SIH 26189)
        </div>
        <div className="font-mono text-[10px] text-slate-500">
          CCTNS-CIU SECURE CORE v2.4
        </div>
      </footer>
    </div>
  );
}
