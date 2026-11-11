import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DEMO_USERS } from '../utils/storage';
import { Cross, ShieldCheck, UserCheck, KeyRound, Mail, ArrowRight, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@pharmashield.demo');
  const [password, setPassword] = useState('demo123');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'staff'>('admin');
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (role: 'admin' | 'staff') => {
    setSelectedRole(role);
    setEmail(DEMO_USERS[role].email);
    setPassword('demo123');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid demonstration email.');
      return;
    }
    // Accept login and set session
    login(selectedRole);
    navigate('/');
  };

  const handleQuickLogin = (role: 'admin' | 'staff') => {
    login(role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="bg-emerald-900 px-6 py-8 text-center text-white relative">
          <div className="w-14 h-14 rounded-2xl bg-emerald-700/70 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-inner mb-3">
            <Cross className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Medicine Expiry & Recall</h1>
          <p className="text-xs text-emerald-200 mt-1">Smart Healthcare Inventory & Safety Alert System</p>
          <span className="inline-block mt-3 px-3 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-[11px] font-semibold text-emerald-200">
            FSD Academic Project Demonstration
          </span>
        </div>

        {/* Academic Demo Disclaimer Banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-5 py-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Demonstration Notice:</strong> This is a frontend academic project using browser LocalStorage for data persistence. Simulated authentication is provided for role demonstration.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {/* Quick 1-Click Role Login Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Demo User Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Admin</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">Full CRUD, recall issuance & audit control</p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('staff')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'staff'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className={`w-4 h-4 ${selectedRole === 'staff' ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Pharmacy Staff</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">Stock logs, alert monitoring & dispensing</p>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password (Demo)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Direct 1-Click Fast-Track for examiners & testers */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-medium text-slate-400 text-center uppercase tracking-wider mb-2.5">
              Instant 1-Click Examiner Access
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
              >
                Log In as Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
              >
                Log In as Staff
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Pharmacy Inventory & Expiry Protocol · Academic Capstone Edition
          </p>
        </div>
      </div>
    </div>
  );
};
