import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Batch } from '../types';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { evaluateBatchStatus, formatDate } from '../utils/expiry';
import {
  ClipboardList,
  Search,
  Sliders,
  History,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const { batches, updateStock, inventoryLogs, systemDate, stats } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'quarantined'>('all');
  const [showLogsModal, setShowLogsModal] = useState(false);

  // Stock adjustment modal state
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<
    'Sale' | 'Restock' | 'Damage / Disposal' | 'Audit Adjustment'
  >('Sale');
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  // Evaluated batch list with stock states
  const inventoryItems = useMemo(() => {
    return batches.map((b) => {
      const evalStatus = evaluateBatchStatus(b, systemDate);

      let stockTag: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (b.quantity === 0) stockTag = 'out_of_stock';
      else if (b.quantity < 25) stockTag = 'low_stock';

      return {
        ...b,
        evalStatus,
        stockTag,
      };
    });
  }, [batches, systemDate]);

  // Filtered list
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch =
        item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (statusFilter === 'in_stock') {
        matchesFilter = item.evalStatus.isAvailableForSale && item.quantity > 0;
      } else if (statusFilter === 'low_stock') {
        matchesFilter = item.evalStatus.isAvailableForSale && item.quantity < 25;
      } else if (statusFilter === 'quarantined') {
        matchesFilter = !item.evalStatus.isAvailableForSale;
      }

      return matchesSearch && matchesFilter;
    });
  }, [inventoryItems, searchTerm, statusFilter]);

  // Open adjustment modal
  const handleOpenAdjust = (batch: Batch) => {
    setSelectedBatch(batch);
    setNewQuantity(batch.quantity);
    setAdjustmentReason('Sale');
    setAdjustmentError(null);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    if (newQuantity < 0) {
      setAdjustmentError('Quantity cannot be negative.');
      return;
    }

    const res = updateStock(selectedBatch.id, newQuantity, adjustmentReason);
    if (!res.success) {
      setAdjustmentError(res.error || 'Failed to update stock quantity.');
      return;
    }

    setSelectedBatch(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Logs Trigger */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search inventory by medicine or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Filter & View Audit Logs */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Inventory ({batches.length})</option>
            <option value="in_stock">Available for Sale</option>
            <option value="low_stock">Low Stock (&lt;25 units)</option>
            <option value="quarantined">Quarantined (Expired or Recalled)</option>
          </select>

          <button
            onClick={() => setShowLogsModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0 border border-slate-200 cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>Audit Trail ({inventoryLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Medicine Name</th>
                <th className="px-5 py-3.5">Batch Number</th>
                <th className="px-5 py-3.5">Expiry Date</th>
                <th className="px-5 py-3.5 text-center">Shelf Life</th>
                <th className="px-5 py-3.5 text-right">Physical Quantity</th>
                <th className="px-5 py-3.5 text-center">Dispensing Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No matching inventory records</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      !item.evalStatus.isAvailableForSale
                        ? 'bg-rose-50/20 hover:bg-rose-50/40'
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

                    <td className="px-5 py-4 text-center">
                      <StatusBadge
                        status={item.evalStatus.isRecalled ? 'recalled' : item.evalStatus.expiryStatus}
                        label={item.evalStatus.statusLabel}
                      />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="font-mono font-bold text-slate-900 tabular-nums text-base">
                        {item.quantity.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 block">units</span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      {item.evalStatus.isAvailableForSale ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dispense Ready</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                          <span>Locked / Quarantined</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleOpenAdjust(item)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 cursor-pointer"
                      >
                        Adjust Count
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Quantity Modal */}
      {selectedBatch && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBatch(null)}
          title={`Adjust Inventory: ${selectedBatch.medicineName}`}
          subtitle={`Batch Lot: ${selectedBatch.batchNumber} (Current: ${selectedBatch.quantity} units)`}
          maxWidth="md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            {adjustmentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg">
                {adjustmentError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Physical Count (Units) *
              </label>
              <input
                type="number"
                min="0"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Stock Modification *
              </label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Sale">Dispensed / Prescription Sale (-)</option>
                <option value="Restock">Shipment Received / Restocked (+)</option>
                <option value="Damage / Disposal">Expired Disposal or Damaged Stock (-)</option>
                <option value="Audit Adjustment">Physical Inventory Audit Adjustment (+/-)</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Quantity Net Difference:</span>
              <span className={`font-mono font-bold ${newQuantity - selectedBatch.quantity >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {newQuantity - selectedBatch.quantity >= 0 ? `+${newQuantity - selectedBatch.quantity}` : newQuantity - selectedBatch.quantity} units
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedBatch(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Confirm Inventory Update
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Historical Audit Logs Modal */}
      {showLogsModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowLogsModal(false)}
          title="Stock Audit & Adjustment Logs"
          subtitle="Detailed chronological audit trail for inventory compliance"
          maxWidth="lg"
        >
          <div className="space-y-3">
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {inventoryLogs.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No inventory logs recorded yet.</p>
              ) : (
                inventoryLogs.map((log) => (
                  <div key={log.id} className="py-3 px-2 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{log.medicineName}</p>
                      <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-700">{log.batchNumber}</span>
                        <span>·</span>
                        <span>{log.reason}</span>
                        <span>·</span>
                        <span>By {log.performedBy}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold ${
                          log.change >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {log.change >= 0 ? `+${log.change}` : log.change} units
                      </span>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{log.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
