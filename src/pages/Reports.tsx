import React from 'react';
import { useApp } from '../context/AppContext';
import { evaluateBatchStatus, formatDate } from '../utils/expiry';
import { downloadCsv } from '../utils/exportCsv';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Boxes,
  Pill,
  DollarSign,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const Reports: React.FC = () => {
  const { medicines, batches, recalls, stats, systemDate, inventoryLogs } = useApp();

  // Evaluate all batches
  const evaluatedBatches = batches.map((b) => ({
    ...b,
    eval: evaluateBatchStatus(b, systemDate),
  }));

  // Group stock units by Medicine Category
  const categoryStockData = React.useMemo(() => {
    const map: Record<string, number> = {};
    medicines.forEach((m) => {
      map[m.category] = 0;
    });

    batches.forEach((b) => {
      const med = medicines.find((m) => m.id === b.medicineId);
      if (med) {
        map[med.category] = (map[med.category] || 0) + b.quantity;
      }
    });

    return Object.entries(map).map(([category, units]) => ({
      name: category,
      units,
    }));
  }, [medicines, batches]);

  // Expiry status data for chart
  const expiryBreakdown = [
    { name: 'Safe (>90d)', count: stats.safeCount, color: '#10b981' },
    { name: 'Expiring Later (31-90d)', count: stats.expiringLaterCount, color: '#0ea5e9' },
    { name: 'Expiring Soon (1-30d)', count: stats.expiringSoonCount, color: '#f59e0b' },
    { name: 'Expired (Past Date)', count: stats.expiredCount, color: '#ef4444' },
    { name: 'Recalled (Safety Hold)', count: stats.recalledCount, color: '#8b5cf6' },
  ];

  // Stock status pie data
  const stockSafetyData = [
    { name: 'Available for Sale', value: stats.availableStock, color: '#059669' },
    { name: 'Quarantined / Expired', value: stats.expiredCount > 0 ? evaluatedBatches.filter(b => b.eval.isExpired).reduce((a, b) => a + b.quantity, 0) : 0, color: '#dc2626' },
    { name: 'Recalled Quarantine', value: stats.recalledCount > 0 ? evaluatedBatches.filter(b => b.eval.isRecalled).reduce((a, b) => a + b.quantity, 0) : 0, color: '#7c3aed' },
  ].filter(item => item.value > 0);

  // CSV Exporters
  const exportMedicinesCsv = () => {
    const headers = ['Medicine ID', 'Name', 'Category', 'Manufacturer', 'Dispensing Unit', 'Min Stock', 'Created Date'];
    const rows = medicines.map((m) => [m.id, m.name, m.category, m.manufacturer, m.unit, m.minStockLevel, m.createdAt]);
    downloadCsv('pharmacy_medicines_catalog', headers, rows);
  };

  const exportBatchesCsv = () => {
    const headers = [
      'Batch ID',
      'Batch Number',
      'Medicine Name',
      'Supplier',
      'Mfg Date',
      'Expiry Date',
      'Quantity',
      'Purchase Price',
      'Total Value',
      'Is Recalled',
    ];
    const rows = batches.map((b) => [
      b.id,
      b.batchNumber,
      b.medicineName,
      b.supplierName,
      b.manufacturingDate,
      b.expiryDate,
      b.quantity,
      b.purchasePrice,
      (b.quantity * (b.purchasePrice || 0)).toFixed(2),
      b.isRecalled ? 'YES' : 'NO',
    ]);
    downloadCsv('pharmacy_batch_inventory', headers, rows);
  };

  const exportExpiryReportCsv = () => {
    const headers = [
      'Batch Number',
      'Medicine Name',
      'Expiry Date',
      'Remaining Days',
      'Calculated Status',
      'Current Quantity',
      'Dispense Ready',
    ];
    const rows = evaluatedBatches.map((b) => [
      b.batchNumber,
      b.medicineName,
      b.expiryDate,
      b.eval.daysRemaining,
      b.eval.statusLabel,
      b.quantity,
      b.eval.isAvailableForSale ? 'Available' : 'Blocked',
    ]);
    downloadCsv('pharmacy_expiry_status_audit', headers, rows);
  };

  const exportRecallsCsv = () => {
    const headers = [
      'Recall ID',
      'Batch Number',
      'Medicine Name',
      'Reason',
      'Order Date',
      'Status',
      'Reported By',
      'Investigation Notes',
      'Resolved Date',
      'Resolution Notes',
    ];
    const rows = recalls.map((r) => [
      r.id,
      r.batchNumber,
      r.medicineName,
      r.reason,
      r.recallDate,
      r.status,
      r.reportedBy,
      r.notes,
      r.closedAt || 'N/A',
      r.closedReason || 'N/A',
    ]);
    downloadCsv('pharmacy_safety_recalls_archive', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Export Suite Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">Audit Reports & Compliance CSV Export</h3>
          <p className="text-xs text-slate-500 mt-1">
            Export comprehensive regulatory audits, stock valuations and expiry safety records using live application data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/Medicine_Expiry_Recall_System_Documentation.pdf"
            download="Medicine_Expiry_Recall_System_Documentation.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Project PDF</span>
          </a>
          <button
            onClick={exportMedicinesCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Medicines CSV</span>
          </button>
          <button
            onClick={exportBatchesCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Batches CSV</span>
          </button>
          <button
            onClick={exportExpiryReportCsv}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-amber-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Expiry Risk CSV</span>
          </button>
          <button
            onClick={exportRecallsCsv}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-purple-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Recalls CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Formulary Items</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">{stats.totalMedicines}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">Active Batches</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">{stats.totalBatches}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase block">Expiring &lt;30d</span>
          <span className="text-xl font-bold text-amber-700 font-mono mt-1 block">{stats.expiringSoonCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-700 uppercase block">Expired Lots</span>
          <span className="text-xl font-bold text-rose-700 font-mono mt-1 block">{stats.expiredCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-purple-700 uppercase block">Recalled Lots</span>
          <span className="text-xl font-bold text-purple-700 font-mono mt-1 block">{stats.recalledCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Available Stock</span>
          <span className="text-xl font-bold text-emerald-800 font-mono mt-1 block">{stats.availableStock.toLocaleString()}</span>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Stock Distribution Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Physical Stock Units by Category</h3>
          <p className="text-xs text-slate-500 mb-4">Quantity distribution across pharmaceutical classifications</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStockData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#475569' }} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="units" fill="#047857" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expiry Risk Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Batch Expiry Risk Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Audit counts of batches by expiry status</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {expiryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Financial Valuation Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">Total Formulary Inventory Valuation</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block">Total Book Inventory Value:</span>
            <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
              ${stats.inventoryTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Dispense-Eligible Inventory:</span>
            <span className="text-lg font-bold text-emerald-800 font-mono mt-0.5 block">
              {stats.availableStock.toLocaleString()} units
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Total Registered Lots:</span>
            <span className="text-lg font-bold text-slate-800 font-mono mt-0.5 block">
              {stats.totalBatches} batch lots
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
