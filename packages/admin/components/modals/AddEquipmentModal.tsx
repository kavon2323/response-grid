'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: { id: string; name: string }[];
  stations: { id: string; name: string }[];
  apparatus: { id: string; name: string; unit_number: string }[];
  departmentId: string;
}

export function AddEquipmentModal({ isOpen, onClose, onSuccess, categories, stations, apparatus, departmentId }: AddEquipmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const { error: insertError } = await supabase.from('equipment').insert({
      name: formData.get('name'),
      description: formData.get('description') || null,
      category_id: formData.get('category_id') || null,
      serial_number: formData.get('serial_number') || null,
      asset_tag: formData.get('asset_tag') || null,
      assigned_station_id: formData.get('station_id') || null,
      assigned_apparatus_id: formData.get('apparatus_id') || null,
      purchase_date: formData.get('purchase_date') || null,
      expiration_date: formData.get('expiration_date') || null,
      status: 'available',
      department_id: departmentId,
    });

    if (insertError) {
      setError(insertError.message);
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Add Equipment</h2>
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
              <input type="text" name="name" required placeholder="SCBA Pack #1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select name="category_id" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500">
                  <option value="">Select category...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input type="text" name="serial_number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Tag</label>
                <input type="text" name="asset_tag" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                <select name="station_id" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500">
                  <option value="">Select station...</option>
                  {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned to Apparatus</label>
              <select name="apparatus_id" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500">
                <option value="">None</option>
                {apparatus.map((a) => <option key={a.id} value={a.id}>{a.name} (#{a.unit_number})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input type="date" name="purchase_date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                <input type="date" name="expiration_date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 disabled:opacity-50">
                {isLoading ? 'Adding...' : 'Add Equipment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
