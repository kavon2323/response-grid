'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface AddCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  members: { id: string; first_name: string; last_name: string }[];
  departmentId: string;
}

const certificationTypes = [
  'Firefighter I',
  'Firefighter II',
  'Hazmat Awareness',
  'Hazmat Operations',
  'EMT-Basic',
  'EMT-Paramedic',
  'CPR/AED',
  'First Aid',
  'Fire Officer I',
  'Fire Officer II',
  'Fire Instructor I',
  'Fire Instructor II',
  'Driver/Operator - Pumper',
  'Driver/Operator - Aerial',
  'Technical Rescue - Rope',
  'Technical Rescue - Confined Space',
  'Technical Rescue - Trench',
  'Technical Rescue - Structural Collapse',
  'Wildland Firefighter',
  'SCBA Fit Test',
  'Other',
];

export function AddCertificationModal({
  isOpen,
  onClose,
  onSuccess,
  members,
  departmentId,
}: AddCertificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certType, setCertType] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const certName =
      certType === 'Other' ? formData.get('custom_cert_name') : certType;

    const { error: insertError } = await supabase.from('certifications').insert({
      user_id: formData.get('user_id'),
      certification_name: certName,
      certification_number: formData.get('certification_number') || null,
      issuing_authority: formData.get('issuing_authority') || null,
      issue_date: formData.get('issue_date') || null,
      expiration_date: formData.get('expiration_date') || null,
      status: 'active',
      notes: formData.get('notes') || null,
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
            <h2 className="text-xl font-semibold">Add Certification</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
              <select
                name="user_id"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              >
                <option value="">Select member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certification Type *
              </label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              >
                <option value="">Select certification...</option>
                {certificationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {certType === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Name *
                </label>
                <input
                  type="text"
                  name="custom_cert_name"
                  required
                  placeholder="Enter certification name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Number
                </label>
                <input
                  type="text"
                  name="certification_number"
                  placeholder="e.g., FF-123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuing Authority
                </label>
                <input
                  type="text"
                  name="issuing_authority"
                  placeholder="e.g., State Fire Marshal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  name="issue_date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  name="expiration_date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Additional notes..."
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
                {isLoading ? 'Saving...' : 'Add Certification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
