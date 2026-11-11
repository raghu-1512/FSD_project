import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { StorageService } from '../utils/storage';
import {
  Settings as SettingsIcon,
  RotateCcw,
  UserCheck,
  ShieldCheck,
  Calendar,
  Download,
  Upload,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, login, resetDataToSample, dateOverride, setDateOverride, systemDate } = useApp();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState<string>(
    dateOverride || new Date().toISOString().split('T')[0]
  );

  const handleRoleChange = (role: 'admin' | 'staff') => {
    login(role);
    setSuccessMessage(`Switched active demonstration user role to ${role.toUpperCase()}.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleApplyDateOverride = (e: React.FormEvent) => {
    e.preventDefault();
    setDateOverride(customDate);
    setSuccessMessage(`Simulated system date set to ${customDate}. All expiry counters updated!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleResetDateToRealTime = () => {
    setDateOverride(null);
    setCustomDate(new Date().toISOString().split('T')[0]);
    setSuccessMessage('Reset system date back to real-time calendar date.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleFastForward = (days: number) => {
    const d = new Date(systemDate);
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split('T')[0];
    setCustomDate(dateStr);
    setDateOverride(dateStr);
    setSuccessMessage(`Advanced presentation clock by +${days} days (${dateStr})! Check Expiry Alerts now.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleResetDemoData = () => {
    resetDataToSample();
    setSuccessMessage('Successfully reset all medicines, batches, recalls, and logs to sample dataset.');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleExportJson = () => {
    const jsonStr = StorageService.exportAllAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pharma_demo_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importFromJson(content);
      if (success) {
        resetDataToSample(); // re-sync state
        setSuccessMessage('Imported backup JSON file successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Presentation Feature: Date Simulation Simulator */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-base text-slate-900">
                Presentation Simulator: System Clock Override
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Designed specifically for academic project evaluations. Advance or change the system date to demonstrate live transition of batches from <em>Safe</em> to <em>Expiring Soon</em> to <em>Expired</em> in real time!
            </p>
          </div>
          {dateOverride && (
            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-bold shrink-0">
              Active Simulation
            </span>
          )}
        </div>

        <form onSubmit={handleApplyDateOverride} className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-700">Simulate Date:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Apply Date
          </button>

          {/* Quick fast-forwards */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-slate-400 hidden sm:inline">Fast Forward:</span>
            <button
              type="button"
              onClick={() => handleFastForward(15)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-md text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
            >
              +15 Days
            </button>
            <button
              type="button"
              onClick={() => handleFastForward(45)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-md text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
            >
              +45 Days
            </button>
            <button
              type="button"
              onClick={() => handleFastForward(100)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-md text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
            >
              +100 Days
            </button>
            {dateOverride && (
              <button
                type="button"
                onClick={handleResetDateToRealTime}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-xs font-semibold transition-colors border border-rose-200 cursor-pointer"
              >
                Reset to Today
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Demo User Roles */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-1">Demonstration User Roles</h3>
        <p className="text-xs text-slate-500 mb-4">
          Switch active user context to test permission flows and role-specific action handling.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Admin Role */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              user?.role === 'admin'
                ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <div>
                  <span className="font-bold text-sm text-slate-900 block">Raghu</span>
                  <span className="text-[11px] text-slate-500 font-mono">raghumullu044@gmail.com</span>
                </div>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Role: Chief Pharmacy Administrator. Unrestricted formulary management, recall issuance, batch creation and data reset.
            </p>
            {user?.role !== 'admin' ? (
              <button
                onClick={() => handleRoleChange('admin')}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Switch to Admin Account
              </button>
            ) : (
              <span className="text-xs text-emerald-700 font-bold block text-center py-1">
                Currently Active Session
              </span>
            )}
          </div>

          {/* Pharmacy Staff Role */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              user?.role === 'staff'
                ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-700" />
                <span className="font-bold text-sm text-slate-900">Alex Rivera, CPhT</span>
              </div>
              <span className="text-xs bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-full uppercase">
                Staff
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Role: Pharmacy Inventory Specialist. Physical stock adjustments, lot verification, alert notifications and dispensing audits.
            </p>
            {user?.role !== 'staff' ? (
              <button
                onClick={() => handleRoleChange('staff')}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Switch to Staff Account
              </button>
            ) : (
              <span className="text-xs text-emerald-700 font-bold block text-center py-1">
                Currently Active Session
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Data Management & Reset Demo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-1">LocalStorage Data Management</h3>
        <p className="text-xs text-slate-500 mb-4">
          Export full backups, import test scenarios, or reset all records to the original sample demonstration state.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 border border-rose-200 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Reset Demo Data to Sample State</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-200 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export JSON State Backup</span>
          </button>

          <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-200 cursor-pointer">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Import JSON Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* System Information Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-sm text-slate-900">Application Architecture & Academic Metadata</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-600 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-slate-400 block font-medium">Application Name:</span>
            <span className="font-bold text-slate-900">Medicine Expiry & Recall Alert System</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Project Complexity:</span>
            <span className="font-bold text-emerald-800">FSD Academic Capstone (Easy)</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Persistence Engine:</span>
            <span className="font-mono font-bold text-slate-900">Browser HTML5 LocalStorage</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Calculation Algorithm:</span>
            <span className="font-mono font-bold text-slate-900">4-Tier Epoch Day Diff</span>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDemoData}
        title="Reset Demonstration Data?"
        message="This will restore all medicines, batches, safety recalls, and notifications back to the initial sample state. Any custom medicines or batches you registered during testing will be replaced by the default sample data."
        confirmLabel="Reset Everything"
        variant="warning"
      />
    </div>
  );
};
