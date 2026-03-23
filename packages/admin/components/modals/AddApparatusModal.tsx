'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface AddApparatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stations: { id: string; name: string }[];
  departmentId: string;
}

export function AddApparatusModal({ isOpen, onClose, onSuccess, stations, departmentId }: AddApparatusModalProps) {
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

    const { error: insertError } = await supabase.from('apparatus').insert({
      name: formData.get('name'),
      unit_number: formData.get('unit_number'),
      apparatus_type: formData.get('apparatus_type'),
      station_id: formData.get('station_id'),
      seat_capacity: parseInt(formData.get('seat_capacity') as string) || 4,
      year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
      make: formData.get('make') || null,
      model: formData.get('model') || null,
      vin: formData.get('vin') || null,
      license_plate: formData.get('license_plate') || null,
      status: 'available',
      is_active: true,
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
            <h2 className="text-xl font-semibold">Add New Apparatus</h2>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" name="name" required placeholder="Engine 1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                <input type="text" name="unit_number" required placeholder="E1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select name="apparatus_type" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500">
                  <option value="engine">Engine</option>
                  <option value="ladder">Ladder</option>
                  <option value="rescue">Rescue</option>
                  <option value="tanker">Tanker</option>
                  <option value="ambulance">Ambulance</option>
                  <option value="brush">Brush</option>
                  <option value="utility">Utility</option>
                  <option value="command">Command</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Station *</label>
                <select name="station_id" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500">
                  {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input type="number" name="year" placeholder="2020" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                <input type="text" name="make" placeholder="Pierce" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input type="text" name="model" placeholder="Enforcer" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                <input type="number" name="seat_capacity" defaultValue={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                <input type="text" name="vin" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plate</label>
                <input type="text" name="license_plate" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 disabled:opacity-50">
                {isLoading ? 'Adding...' : 'Add Apparatus'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
