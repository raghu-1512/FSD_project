import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Recall, RecallReason } from '../types';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../utils/expiry';
import {
  ShieldAlert,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter,
} from 'lucide-react';

const RECALL_REASONS: RecallReason[] = [
  'Quality Issue',
  'Manufacturing Defect',
  'Contamination',
  'Packaging Issue',
  'Safety Concern',
  'Other',
];

export const Recalls: React.FC = () => {
  const { recalls, batches, createRecall, updateRecallStatus, user } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [viewingRecall, setViewingRecall] = useState<Recall | null>(null);
  const [closingRecallId, setClosingRecallId] = useState<string | null>(null);
  const [closureNotes, setClosureNotes] = useState('');

  // Form state for creating recall
  const [formData, setFormData] = useState({
    batchId: batches[0]?.id || '',
    reason: 'Quality Issue' as RecallReason,
    recallDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Filter recalls
  const filteredRecalls = useMemo(() => {
    return recalls.filter((rec) => {
      const matchesSearch =
        rec.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recalls, searchTerm, statusFilter]);

  const handleOpenRegister = () => {
    if (batches.length === 0) {
      setFormError('No batches available in system to recall.');
      return;
    }
    setFormData({
      batchId: batches[0]?.id || '',
      reason: 'Quality Issue',
      recallDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setFormError(null);
    setIsRegisterOpen(true);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.notes.trim()) {
      setFormError('Please enter clinical/regulatory investigation notes for the recall order.');
      return;
    }

    const res = createRecall(formData);
    if (!res.success) {
      setFormError(res.error || 'Failed to issue recall.');
      return;
    }

    setIsRegisterOpen(false);
  };

  const handleCloseRecall = (recallId: string) => {
    setClosingRecallId(recallId);
    setClosureNotes('');
  };

  const submitCloseRecall = () => {
    if (!closingRecallId) return;
    updateRecallStatus(closingRecallId, 'closed', closureNotes || 'Regulatory investigation completed and inventory neutralized.');
    setClosingRecallId(null);
  };

  return (
    <div className="space-y-6">
      {/* Information Header Banner */}
      <div className="bg-purple-900 text-white rounded-xl p-5 shadow-xs border border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-800 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-purple-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white uppercase">
              Pharmaceutical Safety Recall Protocol
            </h3>
            <p className="text-xs text-purple-200 mt-1 leading-relaxed">
              Registering a recall will automatically isolate the entire batch lot, instantly mark all physical stock as unavailable for dispensing, broadcast notifications, and archive compliance records.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenRegister}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New Safety Recall</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by batch number, medicine name, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:border-purple-500"
            >
              <option value="all">All Recalls ({recalls.length})</option>
              <option value="active">Active Recalls ({recalls.filter((r) => r.status === 'active').length})</option>
              <option value="closed">Closed / Resolved ({recalls.filter((r) => r.status === 'closed').length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recalls Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Recall ID</th>
                <th className="px-5 py-3.5">Medicine Name</th>
                <th className="px-5 py-3.5">Batch Number</th>
                <th className="px-5 py-3.5">Recall Reason</th>
                <th className="px-5 py-3.5">Issued Date</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRecalls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="font-medium text-slate-600">No safety recalls recorded</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Batch safety recalls will appear here when registered.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecalls.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-purple-900">
                      {rec.id}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {rec.medicineName}
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-slate-800 text-xs">
                      {rec.batchNumber}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-xs font-medium">
                        {rec.reason}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {formatDate(rec.recallDate)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={rec.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingRecall(rec)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                        {rec.status === 'active' && (
                          <button
                            onClick={() => handleCloseRecall(rec.id)}
                            className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            Resolve / Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Recall Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Pharmaceutical Safety Recall"
        subtitle="Quarantines batch lot and blocks sale immediately"
        maxWidth="lg"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Batch to Recall *
            </label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-purple-500"
              required
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} - {b.medicineName} ({b.quantity} units, Exp: {b.expiryDate})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recall Reason *
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value as RecallReason })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-purple-500"
              >
                {RECALL_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Recall Order Date *
              </label>
              <input
                type="date"
                value={formData.recallDate}
                onChange={(e) => setFormData({ ...formData, recallDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-purple-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical, Laboratory or Packaging Defect Description *
            </label>
            <textarea
              rows={4}
              placeholder="State regulatory findings, batch failure reports, defect analysis or recall directives..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-purple-500"
              required
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Issue Safety Recall
            </button>
          </div>
        </form>
      </Modal>

      {/* View Recall Details Modal */}
      {viewingRecall && (
        <Modal
          isOpen={true}
          onClose={() => setViewingRecall(null)}
          title={`Safety Recall Order: ${viewingRecall.id}`}
          subtitle={`Batch: ${viewingRecall.batchNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-purple-200">
                <span className="text-purple-900 font-medium">Status:</span>
                <StatusBadge status={viewingRecall.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Medicine:</span>
                <span className="font-bold text-slate-900">{viewingRecall.medicineName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Batch Number:</span>
                <span className="font-mono font-bold text-slate-900">{viewingRecall.batchNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Recall Classification:</span>
                <span className="font-semibold text-rose-700">{viewingRecall.reason}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Order Date:</span>
                <span className="font-mono text-slate-800">{formatDate(viewingRecall.recallDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Authorized Investigator:</span>
                <span className="text-slate-800 font-medium">{viewingRecall.reportedBy}</span>
              </div>
              {viewingRecall.closedAt && (
                <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                  <span className="text-slate-500">Resolved Date:</span>
                  <span className="font-mono text-emerald-800 font-medium">{formatDate(viewingRecall.closedAt)}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Investigation / Regulatory Notice
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {viewingRecall.notes}
              </p>
            </div>

            {viewingRecall.closedReason && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Resolution Protocol
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  {viewingRecall.closedReason}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingRecall(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Close Recall Dialog */}
      {closingRecallId && (
        <Modal
          isOpen={true}
          onClose={() => setClosingRecallId(null)}
          title="Resolve Safety Recall Order"
          subtitle="Closes the active recall case and records resolution"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Provide documentation on regulatory clearance, disposal certificate, or manufacturer resolution. The recall record will be archived for compliance inspection.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution Notes / Disposal Reference *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Returned to manufacturer for destruction / Replaced under batch warranty..."
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setClosingRecallId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCloseRecall}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer shadow-xs"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
