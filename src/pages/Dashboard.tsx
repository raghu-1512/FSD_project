import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { evaluateBatchStatus, formatDate } from '../utils/expiry';
import {
  Pill,
  Boxes,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  Package,
  Calendar,
  Layers,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, stats, medicines, batches, recalls, systemDate } = useApp();
  const navigate = useNavigate();

  // Evaluate batch statuses with system date
  const evaluatedBatches = batches.map((b) => ({
    ...b,
    statusInfo: evaluateBatchStatus(b, systemDate),
  }));

  // Top urgent expiry alerts (Expiring soon or Expired, sorted by days remaining ascending)
  const urgentAlerts = [...evaluatedBatches]
    .filter((b) => b.statusInfo.isExpired || b.statusInfo.expiryStatus === 'expiring_soon')
    .sort((a, b) => a.statusInfo.daysRemaining - b.statusInfo.daysRemaining)
    .slice(0, 5);

  // Recent registered batches
  const recentBatches = [...batches].slice(0, 5);

  // Recent medicines
  const recentMedicines = [...medicines].slice(0, 5);

  // Active recalls
  const activeRecalls = recalls.filter((r) => r.status === 'active');

  // Chart data: Expiry Risk Distribution
  const expiryDistributionData = [
    { name: 'Safe (>90d)', count: stats.safeCount, color: '#10b981' },
    { name: 'Exp. Later (31-90d)', count: stats.expiringLaterCount, color: '#0ea5e9' },
    { name: 'Exp. Soon (1-30d)', count: stats.expiringSoonCount, color: '#f59e0b' },
    { name: 'Expired (<=0d)', count: stats.expiredCount, color: '#ef4444' },
    { name: 'Recalled', count: stats.recalledCount, color: '#8b5cf6' },
  ];

  // Stock status pie data
  const stockBreakdownData = [
    { name: 'Available for Sale', value: stats.availableStock, color: '#059669' },
    {
      name: 'Quarantined / Expired / Recalled',
      value: Math.max(0, stats.totalStockUnits - stats.availableStock),
      color: '#dc2626',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & User Session Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold tracking-wide uppercase text-emerald-200 bg-emerald-800/90 px-2.5 py-0.5 rounded-full border border-emerald-600/50">
              Active Session
            </span>
            <span className="text-xs text-emerald-200/90 font-medium">
              {user?.roleTitle || 'Chief Pharmacy Administrator'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Welcome, {user?.name || 'Raghu'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Logged in as <strong className="text-white font-semibold">{user?.email || 'raghumullu044@gmail.com'}</strong> · Medicine Expiry & Safety Recall Command Center
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="/Medicine_Expiry_Recall_System_Documentation.pdf"
            download="Medicine_Expiry_Recall_System_Documentation.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs border border-emerald-500/50"
            title="Download full project documentation as PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>
          <button
            onClick={() => navigate('/batches')}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-white/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Batch</span>
          </button>
          <button
            onClick={() => navigate('/inventory')}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-white/20"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Manage Stock</span>
          </button>
        </div>
      </div>
      {/* Critical Active Recall Alert Banner (if any active recall) */}
      {activeRecalls.length > 0 && (
        <div className="bg-purple-900 text-white rounded-xl p-4 sm:p-5 shadow-md border border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-purple-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide uppercase text-purple-200">
                  Active Drug Recall In Effect
                </span>
                <span className="text-xs bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
                  {activeRecalls.length} Critical
                </span>
              </div>
              <p className="text-xs text-purple-100 mt-1">
                Batch <strong>{activeRecalls[0].batchNumber}</strong> ({activeRecalls[0].medicineName}) is flagged for{' '}
                <em>{activeRecalls[0].reason}</em>. Quarantined from available stock.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/recalls')}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Inspect Recall Protocol</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 6 Required Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Medicines"
          value={stats.totalMedicines}
          subtitle="Formulary items"
          icon={<Pill className="w-6 h-6 text-emerald-800" />}
          iconBgColor="bg-emerald-50"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          title="Total Batches"
          value={stats.totalBatches}
          subtitle="Active lots"
          icon={<Boxes className="w-6 h-6 text-sky-800" />}
          iconBgColor="bg-sky-50"
          onClick={() => navigate('/batches')}
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringSoonCount}
          subtitle="1 to 30 days"
          icon={<AlertTriangle className="w-6 h-6 text-amber-700" />}
          iconBgColor="bg-amber-50"
          badge={{ text: 'Action Needed', variant: 'warning' }}
          onClick={() => navigate('/expiry-alerts')}
        />
        <StatCard
          title="Expired Batches"
          value={stats.expiredCount}
          subtitle="Past expiry date"
          icon={<AlertOctagon className="w-6 h-6 text-rose-700" />}
          iconBgColor="bg-rose-50"
          badge={{ text: 'Quarantined', variant: 'danger' }}
          onClick={() => navigate('/expiry-alerts')}
        />
        <StatCard
          title="Recalled Batches"
          value={stats.recalledCount}
          subtitle="Regulatory holds"
          icon={<ShieldAlert className="w-6 h-6 text-purple-700" />}
          iconBgColor="bg-purple-50"
          badge={{ text: 'Locked Stock', variant: 'purple' }}
          onClick={() => navigate('/recalls')}
        />
        <StatCard
          title="Available Stock"
          value={stats.availableStock.toLocaleString()}
          subtitle="Dispense-ready units"
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-800" />}
          iconBgColor="bg-emerald-50"
          badge={{ text: 'Verified', variant: 'success' }}
          onClick={() => navigate('/inventory')}
        />
      </div>

      {/* Quick Action Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Pharmacy Actions:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/medicines')}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medicine</span>
          </button>
          <button
            onClick={() => navigate('/batches')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Batch</span>
          </button>
          <button
            onClick={() => navigate('/recalls')}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-200"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Log Safety Recall</span>
          </button>
          <button
            onClick={() => navigate('/inventory')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventory Audit</span>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Audit Reports</span>
          </button>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiry Risk Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Batch Expiry Status Distribution</h3>
              <p className="text-xs text-slate-500">Live breakdown by remaining shelf-life risk tiers</p>
            </div>
            <span className="text-xs font-mono text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {stats.totalBatches} Total Batches
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiryDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {expiryDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
              <span className="text-slate-600">Safe: {stats.safeCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 shrink-0" />
              <span className="text-slate-600">Later: {stats.expiringLaterCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
              <span className="text-slate-600 font-medium">Soon: {stats.expiringSoonCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0" />
              <span className="text-slate-600 font-medium">Expired: {stats.expiredCount}</span>
            </div>
          </div>
        </div>

        {/* Available Stock vs Quarantined Stock Pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Inventory Dispensing Safety</h3>
            <p className="text-xs text-slate-500">Available vs Quarantined stock (units)</p>
          </div>

          <div className="h-52 w-full my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stockBreakdownData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-slate-700">Available for Dispensing</span>
              </div>
              <span className="font-bold text-emerald-800 tabular-nums">
                {stats.availableStock.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span className="text-slate-700">Locked (Expired / Recalled)</span>
              </div>
              <span className="font-bold text-rose-700 tabular-nums">
                {Math.max(0, stats.totalStockUnits - stats.availableStock).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row: Immediate Expiry Alerts & Recent Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Expiry & Recall Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Urgent Expiry & Risk Queue</h3>
            </div>
            <button
              onClick={() => navigate('/expiry-alerts')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {urgentAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                No batches currently nearing expiration or expired.
              </div>
            ) : (
              urgentAlerts.map((b) => (
                <div key={b.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{b.medicineName}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono">{b.batchNumber}</span>
                      <span>·</span>
                      <span>{b.quantity} units</span>
                      <span>·</span>
                      <span className="text-slate-400">Exp: {formatDate(b.expiryDate)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <StatusBadge
                      status={b.statusInfo.isRecalled ? 'recalled' : b.statusInfo.expiryStatus}
                      label={
                        b.statusInfo.isExpired
                          ? `Expired (${Math.abs(b.statusInfo.daysRemaining)}d ago)`
                          : `${b.statusInfo.daysRemaining} days left`
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Batch Registrations */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Recently Registered Batches</h3>
            </div>
            <button
              onClick={() => navigate('/batches')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentBatches.map((b) => {
              const statusInfo = evaluateBatchStatus(b, systemDate);
              return (
                <div key={b.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{b.medicineName}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-700 font-medium">{b.batchNumber}</span>
                      <span>·</span>
                      <span>{b.supplierName}</span>
                      <span>·</span>
                      <span className="tabular-nums font-medium text-slate-900">{b.quantity} in stock</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <StatusBadge
                      status={statusInfo.isRecalled ? 'recalled' : statusInfo.expiryStatus}
                      label={statusInfo.statusLabel}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
