'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface Equipment {
  id: string;
  name: string;
  serial_number: string | null;
  category_id: string | null;
  station_id: string | null;
  apparatus_id: string | null;
  status: string;
  purchase_date: string | null;
  next_inspection_due: string | null;
  notes: string | null;
}

interface EditEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: Equipment;
  categories: { id: string; name: string }[];
  stations: { id: string; name: string }[];
  apparatus: { id: string; name: string; unit_number: string }[];
}

export function EditEquipmentModal({
  isOpen,
  onClose,
  onSuccess,
  equipment,
  categories,
  stations,
  apparatus,
}: EditEquipmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<'station' | 'apparatus'>(
    equipment.apparatus_id ? 'apparatus' : 'station'
  );

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const { error: updateError } = await supabase
      .from('equipment')
      .update({
        name: formData.get('name'),
        serial_number: formData.get('serial_number') || null,
        category_id: formData.get('category_id') || null,
        station_id: locationType === 'station' ? (formData.get('station_id') || null) : null,
        apparatus_id: locationType === 'apparatus' ? (formData.get('apparatus_id') || null) : null,
        status: formData.get('status'),
        purchase_date: formData.get('purchase_date') || null,
        next_inspection_due: formData.get('next_inspection_due') || null,
        notes: formData.get('notes') || null,
      })
      .eq('id', equipment.id);

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onSuccess();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Edit Equipment</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                required
                defaultValue={equipment.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  name="serial_number"
                  defaultValue={equipment.serial_number || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category_id"
                  defaultValue={equipment.category_id || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                defaultValue={equipment.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              >
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="expired">Expired</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={locationType === 'station'}
                    onChange={() => setLocationType('station')}
                    className="text-fire-600"
                  />
                  <span className="text-sm">Station</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={locationType === 'apparatus'}
                    onChange={() => setLocationType('apparatus')}
                    className="text-fire-600"
                  />
                  <span className="text-sm">Apparatus</span>
                </label>
              </div>
              {locationType === 'station' ? (
                <select
                  name="station_id"
                  defaultValue={equipment.station_id || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                >
                  <option value="">Select station...</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <select
                  name="apparatus_id"
                  defaultValue={equipment.apparatus_id || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                >
                  <option value="">Select apparatus...</option>
                  {apparatus.map((a) => (
                    <option key={a.id} value={a.id}>{a.unit_number} - {a.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  name="purchase_date"
                  defaultValue={equipment.purchase_date || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Inspection</label>
                <input
                  type="date"
                  name="next_inspection_due"
                  defaultValue={equipment.next_inspection_due || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={equipment.notes || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
