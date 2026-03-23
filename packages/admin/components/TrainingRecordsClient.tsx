'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plus,
  Filter,
  Download,
  ChevronLeft,
  Clock,
  BookOpen,
  User,
  Calendar,
} from 'lucide-react';
import { AddTrainingRecordModal } from './modals/AddTrainingRecordModal';

const trainingTypeLabels: Record<string, string> = {
  classroom: 'Classroom',
  hands_on: 'Hands-On',
  online: 'Online',
  drill: 'Drill',
  exercise: 'Exercise',
  conference: 'Conference',
  other: 'Other',
};

const trainingTypeColors: Record<string, string> = {
  classroom: 'bg-blue-100 text-blue-700',
  hands_on: 'bg-green-100 text-green-700',
  online: 'bg-purple-100 text-purple-700',
  drill: 'bg-orange-100 text-orange-700',
  exercise: 'bg-red-100 text-red-700',
  conference: 'bg-cyan-100 text-cyan-700',
  other: 'bg-gray-100 text-gray-700',
};

interface TrainingRecordsClientProps {
  records: any[];
  members: { id: string; first_name: string; last_name: string }[];
  courses: { id: string; name: string }[];
  departmentId: string;
}

export function TrainingRecordsClient({
  records,
  members,
  courses,
  departmentId,
}: TrainingRecordsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const router = useRouter();

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const memberName = `${record.user?.first_name} ${record.user?.last_name}`.toLowerCase();
        const topic = (record.topic || '').toLowerCase();
        const courseName = (record.course?.name || '').toLowerCase();
        if (!memberName.includes(query) && !topic.includes(query) && !courseName.includes(query)) {
          return false;
        }
      }

      // Member filter
      if (memberFilter && record.user_id !== memberFilter) {
        return false;
      }

      // Type filter
      if (typeFilter && record.training_type !== typeFilter) {
        return false;
      }

      // Date range filter
      if (dateFrom && new Date(record.training_date) < new Date(dateFrom)) {
        return false;
      }
      if (dateTo && new Date(record.training_date) > new Date(dateTo)) {
        return false;
      }

      return true;
    });
  }, [records, searchQuery, memberFilter, typeFilter, dateFrom, dateTo]);

  const totalHours = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.hours || 0), 0);
  }, [filteredRecords]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/training"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training Records</h1>
            <p className="text-gray-600">View and manage all training history</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Training
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fire-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-fire-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredRecords.length}</p>
              <p className="text-sm text-gray-500">Total Records</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
              <p className="text-sm text-gray-500">Total Hours</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(filteredRecords.map((r) => r.user_id)).size}
              </p>
              <p className="text-sm text-gray-500">Members Trained</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by member, topic, or course..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            <option value="">All Members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            <option value="">All Types</option>
            {Object.entries(trainingTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              placeholder="From"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Training
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <BookOpen className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No training records found</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-fire-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-fire-700 text-sm font-medium">
                            {record.user?.first_name?.[0]}
                            {record.user?.last_name?.[0]}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {record.user?.first_name} {record.user?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-gray-900">
                          {record.course?.name || record.topic || 'Training'}
                        </p>
                        {record.course?.name && record.topic && (
                          <p className="text-sm text-gray-500">{record.topic}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          trainingTypeColors[record.training_type] || trainingTypeColors.other
                        }`}
                      >
                        {trainingTypeLabels[record.training_type] || record.training_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(record.training_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{record.hours}h</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {record.instructor_name || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddTrainingRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
        members={members}
        courses={courses}
        departmentId={departmentId}
      />
    </div>
  );
}
