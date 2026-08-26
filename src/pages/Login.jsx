import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Key, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('vikram.kadam@mumbaipolice.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (email && password) {
        login(email, password);
        navigate('/dashboard');
      } else {
        setError('Please provide authorized investigator credentials');
        setLoading(false);
      }
    }, 300);
  };

  const handleDemoFill = () => {
    setEmail('vikram.kadam@mumbaipolice.gov.in');
    setPassword('CIU_SECURE_AUTH_2026');
  };

  return (
    <div className="min-h-screen bg-[#0A192F] flex flex-col justify-between text-white select-none">
      {/* Top Government Portal Header */}
      <header className="px-6 py-4 border-b border-[#132B4C] flex items-center justify-between bg-[#061121]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#0E223D] border border-[#B45309]/80 flex items-center justify-center text-[#D4A017]">
            <Shield className="w-4 h-4 stroke-[2.4]" />
          </div>
          <div>
            <div className="font-semibold text-xs text-white tracking-wider uppercase">
              MUMBAI POLICE — CRIMINAL INTELLIGENCE UNIT
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">
              Government of Maharashtra • Law Enforcement Portal
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
            <div className="inline-flex items-center justify-center w-10 h-10 rounded bg-[#0A192F] text-[#D4A017] mb-2.5 border border-[#132B4C]">
              <Lock className="w-5 h-5" />
            </div>
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
                Security Passkey
              </label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security token"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0A192F] focus:ring-1 focus:ring-[#0A192F] text-[#0F172A] font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-3 bg-[#0A192F] hover:bg-[#132B4C] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 border border-[#132B4C]"
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

          {/* Quick Demo Autofill button */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-mono text-[10px]">
              Insp. Vikram Kadam (#4029)
            </span>
            <button
              type="button"
              onClick={handleDemoFill}
              className="font-bold text-[#B45309] hover:underline transition-colors"
            >
              Demo Auto-Fill
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
