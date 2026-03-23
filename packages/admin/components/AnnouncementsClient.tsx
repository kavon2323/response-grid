'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Megaphone,
  Plus,
  Pin,
  AlertTriangle,
  Info,
  Bell,
  Filter,
  Clock,
  User,
} from 'lucide-react';
import { AddAnnouncementModal } from './modals/AddAnnouncementModal';

const priorityConfig: Record<string, { icon: typeof AlertTriangle; color: string; label: string }> = {
  urgent: {
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700 border-red-200',
    label: 'Urgent',
  },
  high: {
    icon: Bell,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    label: 'High',
  },
  normal: {
    icon: Info,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'Normal',
  },
  low: {
    icon: Info,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    label: 'Low',
  },
};

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  created_at: string;
  expires_at?: string;
  author?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface AnnouncementsClientProps {
  announcements: Announcement[];
  departmentId: string;
}

export function AnnouncementsClient({ announcements, departmentId }: AnnouncementsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const router = useRouter();

  const filteredAnnouncements = useMemo(() => {
    if (!filterPriority) return announcements;
    return announcements.filter((a) => a.priority === filterPriority);
  }, [announcements, filterPriority]);

  const pinnedCount = announcements.filter((a) => a.is_pinned).length;
  const urgentCount = announcements.filter((a) => a.priority === 'urgent').length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">Department-wide communications and briefings</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fire-100 rounded-lg">
              <Megaphone className="h-6 w-6 text-fire-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{announcements.length}</p>
              <p className="text-sm text-gray-500">Total Announcements</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Pin className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pinnedCount}</p>
              <p className="text-sm text-gray-500">Pinned</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{urgentCount}</p>
              <p className="text-sm text-gray-500">Urgent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No announcements found</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const priority = priorityConfig[announcement.priority] || priorityConfig.normal;
            const PriorityIcon = priority.icon;

            return (
              <div
                key={announcement.id}
                className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow ${
                  announcement.is_pinned ? 'border-l-4 border-fire-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {announcement.is_pinned && (
                        <Pin className="h-4 w-4 text-fire-600" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {announcement.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${priority.color}`}
                      >
                        <PriorityIcon className="h-3 w-3" />
                        {priority.label}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-600 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(announcement.created_at)}</span>
                      </div>
                      {announcement.author && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>
                            {announcement.author.first_name} {announcement.author.last_name}
                          </span>
                        </div>
                      )}
                      {announcement.expires_at && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          <span>Expires: {formatDate(announcement.expires_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
        departmentId={departmentId}
      />
    </div>
  );
}
