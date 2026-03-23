'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departmentId: string;
}

export function AddCategoryModal({ isOpen, onClose, onSuccess, departmentId }: AddCategoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresInspection, setRequiresInspection] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const { error: insertError } = await supabase.from('equipment_categories').insert({
      name: formData.get('name'),
      description: formData.get('description') || null,
      requires_inspection: requiresInspection,
      inspection_interval_days: requiresInspection ? parseInt(formData.get('inspection_interval') as string) || null : null,
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Add Equipment Category</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
              <input type="text" name="name" required placeholder="SCBA" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={2} placeholder="Self-contained breathing apparatus" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_inspection"
                checked={requiresInspection}
                onChange={(e) => setRequiresInspection(e.target.checked)}
                className="h-4 w-4 text-fire-600 rounded border-gray-300"
              />
              <label htmlFor="requires_inspection" className="text-sm text-gray-700">
                Requires periodic inspection
              </label>
            </div>
            {requiresInspection && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Interval (days)</label>
                <input type="number" name="inspection_interval" placeholder="30" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500" />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 disabled:opacity-50">
                {isLoading ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
