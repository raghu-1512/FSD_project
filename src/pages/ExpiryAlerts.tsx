import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import { evaluateBatchStatus, formatDate } from '../utils/expiry';
import { downloadCsv } from '../utils/exportCsv';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Search,
  Download,
  ShieldAlert,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ExpiryAlerts: React.FC = () => {
  const { batches, systemDate, stats } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'expired' | 'expiring_soon' | 'expiring_later' | 'safe'>('all');
  const [sortBy, setSortBy] = useState<'days' | 'name' | 'qty'>('days');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Compute evaluations for all batches
  const evaluatedList = useMemo(() => {
    return batches.map((b) => ({
      ...b,
      eval: evaluateBatchStatus(b, systemDate),
    }));
  }, [batches, systemDate]);

  // Filtered and sorted
  const filteredBatches = useMemo(() => {
    return evaluatedList
      .filter((item) => {
        const matchesSearch =
          item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesTab = true;
        if (activeTab === 'expired') matchesTab = item.eval.isExpired;
        else if (activeTab === 'expiring_soon') matchesTab = !item.eval.isExpired && item.eval.expiryStatus === 'expiring_soon';
        else if (activeTab === 'expiring_later') matchesTab = item.eval.expiryStatus === 'expiring_later';
        else if (activeTab === 'safe') matchesTab = item.eval.expiryStatus === 'safe';

        return matchesSearch && matchesTab;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'days') comp = a.eval.daysRemaining - b.eval.daysRemaining;
        else if (sortBy === 'name') comp = a.medicineName.localeCompare(b.medicineName);
        else if (sortBy === 'qty') comp = a.quantity - b.quantity;
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [evaluatedList, searchTerm, activeTab, sortBy, sortOrder]);

  const handleExportCsv = () => {
    const headers = [
      'Batch Number',
      'Medicine Name',
      'Supplier',
      'Mfg Date',
      'Expiry Date',
      'Days Remaining',
      'Expiry Status',
      'Stock Quantity',
      'Available for Dispensing',
    ];
    const rows = filteredBatches.map((b) => [
      b.batchNumber,
      b.medicineName,
      b.supplierName,
      b.manufacturingDate,
      b.expiryDate,
      b.eval.daysRemaining,
      b.eval.statusLabel,
      b.quantity,
      b.eval.isAvailableForSale ? 'YES' : 'NO (Quarantined)',
    ]);
    downloadCsv('expiry_risk_alert_report', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Risk Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('expired')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'expired'
              ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Expired Batches</span>
            <AlertOctagon className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-900 mt-2 tabular-nums">{stats.expiredCount}</p>
          <p className="text-xs text-rose-600 mt-1">&le; 0 days remaining · Quarantined</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expiring_soon')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'expiring_soon'
              ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Expiring Soon</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2 tabular-nums">{stats.expiringSoonCount}</p>
          <p className="text-xs text-amber-700 mt-1">1 to 30 days remaining · High Priority</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expiring_later')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'expiring_later'
              ? 'bg-sky-50/90 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider">Expiring Later</span>
            <Clock className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-sky-900 mt-2 tabular-nums">{stats.expiringLaterCount}</p>
          <p className="text-xs text-sky-600 mt-1">31 to 90 days remaining</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('safe')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'safe'
              ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Safe Shelf-Life</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-2 tabular-nums">{stats.safeCount}</p>
          <p className="text-xs text-emerald-600 mt-1">&gt; 90 days remaining</p>
        </button>
      </div>

      {/* Control bar: Tabs + Search + Export */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Batches ({batches.length})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'expired' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expired ({stats.expiredCount})
          </button>
          <button
            onClick={() => setActiveTab('expiring_soon')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'expiring_soon' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expiring Soon ({stats.expiringSoonCount})
          </button>
          <button
            onClick={() => setActiveTab('expiring_later')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'expiring_later' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expiring Later ({stats.expiringLaterCount})
          </button>
          <button
            onClick={() => setActiveTab('safe')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'safe' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Safe ({stats.safeCount})
          </button>
        </div>

        {/* Search & Export */}
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search batch or medicine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Medicine Name</th>
                <th className="px-5 py-3.5">Batch Number</th>
                <th className="px-5 py-3.5">Expiry Date</th>
                <th className="px-5 py-3.5 text-center">
                  <button
                    onClick={() => {
                      if (sortBy === 'days') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else {
                        setSortBy('days');
                        setSortOrder('asc');
                      }
                    }}
                    className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <span>Remaining Days</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-5 py-3.5 text-center">Calculated Status</th>
                <th className="px-5 py-3.5 text-right">In-Stock Quantity</th>
                <th className="px-5 py-3.5 text-center">Dispensing Status</th>
                <th className="px-5 py-3.5 text-right">Action Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="font-medium text-slate-600">No batches in this risk category</p>
                    <p className="text-xs text-slate-400 mt-1">All batches are monitored according to shelf-life rules.</p>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.eval.isExpired
                        ? 'bg-rose-50/30 hover:bg-rose-50/50'
                        : item.eval.expiryStatus === 'expiring_soon'
                        ? 'bg-amber-50/20 hover:bg-amber-50/40'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{item.medicineName}</p>
                      <p className="text-xs text-slate-400">{item.supplierName}</p>
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-slate-800 text-xs">
                      {item.batchNumber}
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-slate-700">
                      {formatDate(item.expiryDate)}
                    </td>

                    <td className="px-5 py-4 text-center font-mono font-bold text-xs">
                      {item.eval.isExpired ? (
                        <span className="text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                          Expired {Math.abs(item.eval.daysRemaining)}d ago
                        </span>
                      ) : item.eval.daysRemaining <= 30 ? (
                        <span className="text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                          {item.eval.daysRemaining} days left
                        </span>
                      ) : (
                        <span className="text-slate-700">{item.eval.daysRemaining} days left</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StatusBadge
                        status={item.eval.isRecalled ? 'recalled' : item.eval.expiryStatus}
                        label={item.eval.statusLabel}
                      />
                    </td>

                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {item.quantity.toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {item.eval.isAvailableForSale ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Available
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3 text-rose-600" />
                          Unavailable (Locked)
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {item.eval.isRecalled ? (
                        <button
                          onClick={() => navigate('/recalls')}
                          className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          View Recall
                        </button>
                      ) : item.eval.isExpired ? (
                        <button
                          onClick={() => navigate('/inventory')}
                          className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Disposal Audit
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/recalls')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Flag Batch
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
