'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface AddAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departmentId: string;
  userId: string;
}

export function AddAnnouncementModal({ isOpen, onClose, onSuccess, departmentId, userId }: AddAnnouncementModalProps) {
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

    const expiresDate = formData.get('expires_at') as string;
    const expiresAt = expiresDate ? new Date(expiresDate).toISOString() : null;

    const { error: insertError } = await supabase.from('announcements').insert({
      title: formData.get('title'),
      body: formData.get('content'),
      priority: formData.get('priority'),
      is_pinned: formData.get('is_pinned') === 'on',
      expires_at: expiresAt,
      department_id: departmentId,
      posted_by_user_id: userId,
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
            <h2 className="text-xl font-semibold">New Announcement</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                name="content"
                required
                rows={5}
                placeholder="Write your announcement here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                <select
                  name="priority"
                  required
                  defaultValue="normal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires On</label>
                <input
                  type="date"
                  name="expires_at"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_pinned"
                id="is_pinned"
                className="w-4 h-4 text-fire-600 border-gray-300 rounded focus:ring-fire-500"
              />
              <label htmlFor="is_pinned" className="text-sm font-medium text-gray-700">
                Pin this announcement
              </label>
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
                {isLoading ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
