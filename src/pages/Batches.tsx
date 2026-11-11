import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Batch } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { StatusBadge } from '../components/StatusBadge';
import { evaluateBatchStatus, formatDate } from '../utils/expiry';
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export const Batches: React.FC = () => {
  const { batches, medicines, addBatch, updateBatch, deleteBatch, systemDate } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedicineFilter, setSelectedMedicineFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    medicineId: medicines[0]?.id || '',
    batchNumber: '',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    quantity: 100,
    purchasePrice: 2.5,
    supplierName: '',
  });

  // Filter batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const statusInfo = evaluateBatchStatus(b, systemDate);

      // Search match
      const matchesSearch =
        b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.id.toLowerCase().includes(searchTerm.toLowerCase());

      // Medicine filter
      const matchesMedicine =
        selectedMedicineFilter === 'all' || b.medicineId === selectedMedicineFilter;

      // Status filter
      let matchesStatus = true;
      if (selectedStatusFilter === 'safe') {
        matchesStatus = !b.isRecalled && statusInfo.expiryStatus === 'safe';
      } else if (selectedStatusFilter === 'expiring_later') {
        matchesStatus = !b.isRecalled && statusInfo.expiryStatus === 'expiring_later';
      } else if (selectedStatusFilter === 'expiring_soon') {
        matchesStatus = !b.isRecalled && statusInfo.expiryStatus === 'expiring_soon';
      } else if (selectedStatusFilter === 'expired') {
        matchesStatus = !b.isRecalled && statusInfo.isExpired;
      } else if (selectedStatusFilter === 'recalled') {
        matchesStatus = Boolean(b.isRecalled);
      }

      return matchesSearch && matchesMedicine && matchesStatus;
    });
  }, [batches, searchTerm, selectedMedicineFilter, selectedStatusFilter, systemDate]);

  const handleOpenAdd = () => {
    if (medicines.length === 0) {
      setErrorMessage('Please register at least one medicine before adding batches.');
      return;
    }
    setEditingBatch(null);
    // Default expiry 180 days in future
    const defExp = new Date();
    defExp.setDate(defExp.getDate() + 180);

    setFormData({
      medicineId: medicines[0]?.id || '',
      batchNumber: `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: defExp.toISOString().split('T')[0],
      quantity: 100,
      purchasePrice: 3.5,
      supplierName: 'Global MedDistributors',
    });
    setErrorMessage(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      medicineId: batch.medicineId,
      batchNumber: batch.batchNumber,
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity,
      purchasePrice: batch.purchasePrice,
      supplierName: batch.supplierName,
    });
    setErrorMessage(null);
    setIsAddEditOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const med = medicines.find((m) => m.id === formData.medicineId);
    if (!med) {
      setErrorMessage('Selected medicine does not exist.');
      return;
    }

    if (!formData.batchNumber.trim()) {
      setErrorMessage('Batch number is required.');
      return;
    }

    if (new Date(formData.expiryDate) <= new Date(formData.manufacturingDate)) {
      setErrorMessage('Expiry date must be later than manufacturing date.');
      return;
    }

    if (formData.quantity < 0) {
      setErrorMessage('Quantity cannot be negative.');
      return;
    }

    if (editingBatch) {
      const res = await updateBatch(editingBatch.id, {
        ...formData,
        medicineName: med.name,
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update batch.');
        return;
      }
    } else {
      const res = await addBatch({
        ...formData,
        medicineName: med.name,
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to register batch.');
        return;
      }
    }

    setIsAddEditOpen(false);
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmId) return;
    const res = await deleteBatch(deleteConfirmId);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to delete batch.');
    } else {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search batch #, medicine, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Filter by Medicine */}
          <select
            value={selectedMedicineFilter}
            onChange={(e) => setSelectedMedicineFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Medicines ({batches.length} batches)</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Filter by Expiry Status */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="safe">Safe (&gt;90 days)</option>
            <option value="expiring_later">Expiring Later (31-90 days)</option>
            <option value="expiring_soon">Expiring Soon (1-30 days)</option>
            <option value="expired">Expired (&le;0 days)</option>
            <option value="recalled">Recalled Batches</option>
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Batch</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Action Notice</p>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Batches Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Batch Number</th>
                <th className="px-5 py-3.5">Medicine Name</th>
                <th className="px-5 py-3.5">Mfg Date</th>
                <th className="px-5 py-3.5">Expiry Date</th>
                <th className="px-5 py-3.5 text-center">Remaining</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Stock Qty</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No batches match criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or register a new batch.</p>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const statusInfo = evaluateBatchStatus(batch, systemDate);

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {batch.batchNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{batch.id}</span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{batch.medicineName}</p>
                        <p className="text-xs text-slate-500">{batch.supplierName}</p>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600 font-mono">
                        {formatDate(batch.manufacturingDate)}
                      </td>

                      <td className="px-5 py-4 text-xs font-mono font-medium text-slate-800">
                        {formatDate(batch.expiryDate)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`font-mono text-xs font-bold tabular-nums ${
                            statusInfo.isExpired
                              ? 'text-rose-600'
                              : statusInfo.daysRemaining <= 30
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {statusInfo.isExpired
                            ? `${Math.abs(statusInfo.daysRemaining)}d ago`
                            : `${statusInfo.daysRemaining} days`}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <StatusBadge
                          status={statusInfo.isRecalled ? 'recalled' : statusInfo.expiryStatus}
                          label={statusInfo.statusLabel}
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {batch.quantity.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 block font-sans">
                          ${(batch.purchasePrice || 0).toFixed(2)}/unit
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingBatch(batch)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="View batch details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(batch)}
                            className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit batch"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setErrorMessage(null);
                              setDeleteConfirmId(batch.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Batch Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingBatch ? 'Edit Batch Details' : 'Register New Medicine Batch'}
        subtitle="Enforces production and expiration date chronological validation"
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Formulary Medicine *
            </label>
            <select
              value={formData.medicineId}
              onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              required
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch Lot Number * (Unique)
              </label>
              <input
                type="text"
                placeholder="e.g. PARA-2025-C1"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Supplier Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Global MedDistributors"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturing Date *
              </label>
              <input
                type="date"
                value={formData.manufacturingDate}
                onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiry Date * (Must be after Mfg Date)
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Received Quantity * (Units)
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Price per Unit ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {editingBatch ? 'Update Batch Record' : 'Register Batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Batch Details Modal */}
      {viewingBatch && (
        <Modal
          isOpen={true}
          onClose={() => setViewingBatch(null)}
          title={`Batch Details: ${viewingBatch.batchNumber}`}
          subtitle={`Tracking ID: ${viewingBatch.id}`}
          maxWidth="md"
        >
          {(() => {
            const statusInfo = evaluateBatchStatus(viewingBatch, systemDate);
            return (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Current Status:</span>
                    <StatusBadge
                      status={statusInfo.isRecalled ? 'recalled' : statusInfo.expiryStatus}
                      label={statusInfo.statusLabel}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Medicine:</span>
                    <span className="font-bold text-slate-900">{viewingBatch.medicineName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Manufacturing Date:</span>
                    <span className="font-mono text-slate-800">{formatDate(viewingBatch.manufacturingDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Expiration Date:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatDate(viewingBatch.expiryDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Remaining Shelf Life:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {statusInfo.daysRemaining > 0 ? `${statusInfo.daysRemaining} days` : `Expired ${Math.abs(statusInfo.daysRemaining)} days ago`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Current Stock Quantity:</span>
                    <span className="font-mono font-bold text-slate-900">{viewingBatch.quantity} units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Authorized Supplier:</span>
                    <span className="text-slate-800 font-medium">{viewingBatch.supplierName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Purchase Price / Unit:</span>
                    <span className="font-mono text-slate-800">${(viewingBatch.purchasePrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Dispensing Availability:</span>
                    <span className={`font-semibold ${statusInfo.isAvailableForSale ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {statusInfo.isAvailableForSale ? 'Available for dispensing' : 'Quarantined / Locked'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setViewingBatch(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleExecuteDelete}
        title="Delete Batch Record"
        message="Are you sure you want to delete this batch? If this batch has active recall records, deletion will be blocked to maintain compliance logs."
        confirmLabel="Delete Batch"
        variant="danger"
      />
    </div>
  );
};
