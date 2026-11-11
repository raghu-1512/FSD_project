import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Medicine, MedicineCategory } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  Pill,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Filter,
  CheckCircle2,
  Boxes,
} from 'lucide-react';

const CATEGORIES: MedicineCategory[] = [
  'Analgesics',
  'Antibiotics',
  'Antihistamines',
  'Vitamins & Supplements',
  'Cardiovascular',
  'Gastrointestinal',
  'Respiratory',
  'Antidiabetic',
  'Other',
];

export const Medicines: React.FC = () => {
  const { medicines, batches, addMedicine, updateMedicine, deleteMedicine, user } = useApp();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [viewingMedicine, setViewingMedicine] = useState<Medicine | null>(null);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'Analgesics' as MedicineCategory,
    manufacturer: '',
    description: '',
    unit: 'tablets',
    minStockLevel: 50,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const matchesSearch =
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || med.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, searchTerm, selectedCategory]);

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      category: 'Analgesics',
      manufacturer: '',
      description: '',
      unit: 'tablets',
      minStockLevel: 50,
    });
    setFormError(null);
    setIsAddEditOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (med: Medicine) => {
    setEditingMedicine(med);
    setFormData({
      name: med.name,
      category: med.category,
      manufacturer: med.manufacturer,
      description: med.description,
      unit: med.unit || 'tablets',
      minStockLevel: med.minStockLevel || 50,
    });
    setFormError(null);
    setIsAddEditOpen(true);
  };

  // Submit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Medicine name is required.');
      return;
    }
    if (!formData.manufacturer.trim()) {
      setFormError('Manufacturer name is required.');
      return;
    }

    if (editingMedicine) {
      await updateMedicine(editingMedicine.id, formData);
    } else {
      await addMedicine(formData);
    }

    setIsAddEditOpen(false);
  };

  // Confirm deletion
  const handleDeleteAttempt = (id: string) => {
    setDeleteError(null);
    setDeleteConfirmId(id);
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmId) return;
    const result = await deleteMedicine(deleteConfirmId);
    if (!result.success) {
      setDeleteError(result.error || 'Failed to delete medicine.');
    } else {
      setDeleteConfirmId(null);
      setDeleteError(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Header & Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search input */}
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by medicine name, category, manufacturer, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Categories ({medicines.length})</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Medicine Button */}
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medicine</span>
        </button>
      </div>

      {/* Delete error alert if deletion blocked by associated batches */}
      {deleteError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Deletion Safety Restriction</p>
            <p className="mt-0.5 leading-relaxed">{deleteError}</p>
          </div>
        </div>
      )}

      {/* Medicine Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Medicine ID</th>
                <th className="px-5 py-3.5">Name & Formulation</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Manufacturer</th>
                <th className="px-5 py-3.5 text-center">Active Batches</th>
                <th className="px-5 py-3.5 text-right">Available Stock</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Pill className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No medicines found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or register a new medicine.</p>
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med) => {
                  const medBatches = batches.filter((b) => b.medicineId === med.id);
                  const totalStock = medBatches.reduce((acc, b) => acc + (b.isRecalled ? 0 : b.quantity), 0);

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-emerald-800">
                        {med.id}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{med.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{med.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          {med.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                        {med.manufacturer}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          <Boxes className="w-3 h-3 text-slate-400" />
                          {medBatches.length}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {totalStock.toLocaleString()}
                        </span>{' '}
                        <span className="text-xs text-slate-500">{med.unit}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingMedicine(med)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="View medicine details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(med)}
                            className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit medicine"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttempt(med.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete medicine"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingMedicine ? 'Edit Medicine Formulary' : 'Register New Medicine'}
        subtitle={editingMedicine ? `ID: ${editingMedicine.id}` : 'Generates a unique pharmaceutical ID automatically'}
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Medicine Name & Strength *
            </label>
            <input
              type="text"
              placeholder="e.g. Paracetamol 500 mg, Amoxicillin 250 mg"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as MedicineCategory })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispensing Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              >
                <option value="tablets">Tablets</option>
                <option value="capsules">Capsules</option>
                <option value="bottles">Bottles</option>
                <option value="strips">Strips</option>
                <option value="vials">Vials</option>
                <option value="tubes">Tubes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturer Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Pharma Ltd, BioCure"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Min Stock Level (Alert Threshold)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Description & Indication
            </label>
            <textarea
              rows={3}
              placeholder="Indication, therapeutic use, dosage notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
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
              {editingMedicine ? 'Save Changes' : 'Register Medicine'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Medicine Details Modal */}
      {viewingMedicine && (
        <Modal
          isOpen={true}
          onClose={() => setViewingMedicine(null)}
          title={viewingMedicine.name}
          subtitle={`Formulary ID: ${viewingMedicine.id}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Category</span>
                <span className="font-semibold text-slate-900">{viewingMedicine.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Manufacturer</span>
                <span className="font-semibold text-slate-900">{viewingMedicine.manufacturer}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Unit Type</span>
                <span className="font-semibold text-slate-900 capitalize">{viewingMedicine.unit}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Minimum Stock Threshold</span>
                <span className="font-semibold text-slate-900">{viewingMedicine.minStockLevel} {viewingMedicine.unit}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Clinical Description</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {viewingMedicine.description || 'No description provided.'}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Registered Batches ({batches.filter((b) => b.medicineId === viewingMedicine.id).length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {batches.filter((b) => b.medicineId === viewingMedicine.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No batches registered yet for this medicine.</p>
                ) : (
                  batches
                    .filter((b) => b.medicineId === viewingMedicine.id)
                    .map((b) => (
                      <div
                        key={b.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-800">{b.batchNumber}</span>
                          <span className="text-slate-500 ml-2">Exp: {b.expiryDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-900">{b.quantity} units</span>
                          {b.isRecalled && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                              Recalled
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingMedicine(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal with associated batch guard */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => {
          setDeleteConfirmId(null);
          setDeleteError(null);
        }}
        onConfirm={handleExecuteDelete}
        title="Confirm Medicine Deletion"
        message="Are you sure you want to delete this medicine? If this medicine has existing registered batches, deletion will be blocked by system safety rules."
        confirmLabel="Delete Medicine"
        variant="danger"
      />
    </div>
  );
};
