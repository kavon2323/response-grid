'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apparatusId: string;
  departmentId: string;
}

export function ReportIssueModal({
  isOpen,
  onClose,
  onSuccess,
  apparatusId,
  departmentId,
}: ReportIssueModalProps) {
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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to report an issue');
      setIsLoading(false);
      return;
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userProfile) {
      setError('User profile not found');
      setIsLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('apparatus_issues').insert({
      apparatus_id: apparatusId,
      department_id: departmentId,
      reported_by_user_id: userProfile.id,
      title: formData.get('title'),
      description: formData.get('description') || null,
      severity: formData.get('severity'),
      status: 'open',
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    // If critical, update apparatus status to out_of_service
    const severity = formData.get('severity');
    if (severity === 'critical') {
      await supabase
        .from('apparatus')
        .update({ status: 'out_of_service' })
        .eq('id', apparatusId);
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
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-fire-600" />
              <h2 className="text-xl font-semibold">Report Issue</h2>
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Title *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="Brief description of the issue"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity *
              </label>
              <select
                name="severity"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              >
                <option value="low">Low - Minor issue, can wait</option>
                <option value="medium">Medium - Should be addressed soon</option>
                <option value="high">High - Needs prompt attention</option>
                <option value="critical">Critical - Apparatus should NOT be used</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Critical issues will automatically mark the apparatus as Out of Service
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={4}
                placeholder="Provide details about the issue, when it was noticed, any relevant context..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Safety First</p>
                  <p className="mt-1">
                    If this issue poses an immediate safety concern, please notify your
                    supervisor directly in addition to filing this report.
                  </p>
                </div>
              </div>
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
                {isLoading ? 'Submitting...' : 'Report Issue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
