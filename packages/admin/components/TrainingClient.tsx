'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Clock,
  Calendar,
  AlertTriangle,
  Plus,
  BookOpen,
  Award,
  ChevronRight,
  User,
} from 'lucide-react';
import { AddTrainingRecordModal } from './modals/AddTrainingRecordModal';
import { AddCertificationModal } from './modals/AddCertificationModal';

interface TrainingClientProps {
  totalHoursThisMonth: number;
  upcomingEventsCount: number;
  expiringCertificationsCount: number;
  upcomingEvents: any[];
  expiringCertifications: any[];
  recentRecords: any[];
  members: { id: string; first_name: string; last_name: string }[];
  courses: { id: string; name: string }[];
  departmentId: string;
}

export function TrainingClient({
  totalHoursThisMonth,
  upcomingEventsCount,
  expiringCertificationsCount,
  upcomingEvents,
  expiringCertifications,
  recentRecords,
  members,
  courses,
  departmentId,
}: TrainingClientProps) {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
          <p className="text-gray-600">Track training records, certifications, and upcoming events</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCertModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-fire-600 text-fire-600 rounded-lg hover:bg-fire-50 transition-colors"
          >
            <Award className="h-4 w-4" />
            Add Certification
          </button>
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Log Training
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fire-100 rounded-lg">
              <Clock className="h-6 w-6 text-fire-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalHoursThisMonth}</p>
              <p className="text-sm text-gray-500">Training Hours This Month</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingEventsCount}</p>
              <p className="text-sm text-gray-500">Upcoming Events</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${expiringCertificationsCount > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
              <AlertTriangle className={`h-6 w-6 ${expiringCertificationsCount > 0 ? 'text-amber-600' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiringCertificationsCount}</p>
              <p className="text-sm text-gray-500">Expiring Certifications (90 days)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/training/records"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-fire-100 transition-colors">
              <BookOpen className="h-5 w-5 text-gray-600 group-hover:text-fire-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Training Records</p>
              <p className="text-sm text-gray-500">View all training history</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-fire-600" />
        </Link>
        <Link
          href="/training/certifications"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-fire-100 transition-colors">
              <Award className="h-5 w-5 text-gray-600 group-hover:text-fire-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Certifications</p>
              <p className="text-sm text-gray-500">Track certification status</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-fire-600" />
        </Link>
        <Link
          href="/training/calendar"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-fire-100 transition-colors">
              <Calendar className="h-5 w-5 text-gray-600 group-hover:text-fire-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Training Calendar</p>
              <p className="text-sm text-gray-500">Schedule and events</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-fire-600" />
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Training Records */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Training Records</h2>
            <Link href="/training/records" className="text-sm text-fire-600 hover:text-fire-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentRecords.length === 0 ? (
              <div className="p-8 text-center">
                <GraduationCap className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No training records yet</p>
              </div>
            ) : (
              recentRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-fire-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-fire-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {record.user?.first_name} {record.user?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {record.course?.name || record.topic || 'Training'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{record.hours}h</p>
                      <p className="text-xs text-gray-500">{formatDate(record.training_date)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events & Expiring Certs */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Upcoming Training Events</h2>
              <Link href="/training/calendar" className="text-sm text-fire-600 hover:text-fire-700">
                View calendar
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingEvents.length === 0 ? (
                <div className="p-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No upcoming events</p>
                </div>
              ) : (
                upcomingEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {event.instructor?.first_name} {event.instructor?.last_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">
                          {getDaysUntil(event.event_date)} days
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(event.event_date)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expiring Certifications */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Expiring Certifications</h2>
              <Link href="/training/certifications" className="text-sm text-fire-600 hover:text-fire-700">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {expiringCertifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Award className="h-8 w-8 mx-auto text-green-300 mb-2" />
                  <p className="text-gray-500 text-sm">No certifications expiring soon</p>
                </div>
              ) : (
                expiringCertifications.slice(0, 4).map((cert) => {
                  const daysUntil = getDaysUntil(cert.expiration_date);
                  const isUrgent = daysUntil <= 30;
                  return (
                    <div key={cert.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{cert.certification_name}</p>
                          <p className="text-sm text-gray-500">
                            {cert.user?.first_name} {cert.user?.last_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                            {daysUntil} days
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(cert.expiration_date)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTrainingRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={() => router.refresh()}
        members={members}
        courses={courses}
        departmentId={departmentId}
      />
      <AddCertificationModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        onSuccess={() => router.refresh()}
        members={members}
        departmentId={departmentId}
      />
    </div>
  );
}
