'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plus,
  ChevronLeft,
  Award,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
} from 'lucide-react';
import { AddCertificationModal } from './modals/AddCertificationModal';

interface CertificationsClientProps {
  certifications: any[];
  members: { id: string; first_name: string; last_name: string }[];
  departmentId: string;
  expiringCount: number;
  expiredCount: number;
}

export function CertificationsClient({
  certifications,
  members,
  departmentId,
  expiringCount,
  expiredCount,
}: CertificationsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const getCertStatus = (cert: any) => {
    if (!cert.expiration_date) return 'no_expiry';
    const expDate = new Date(cert.expiration_date);
    if (expDate < now) return 'expired';
    if (expDate <= thirtyDaysFromNow) return 'critical';
    if (expDate <= ninetyDaysFromNow) return 'expiring';
    return 'valid';
  };

  const filteredCertifications = useMemo(() => {
    return certifications.filter((cert) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const memberName = `${cert.user?.first_name} ${cert.user?.last_name}`.toLowerCase();
        const certName = (cert.certification_name || '').toLowerCase();
        const authority = (cert.issuing_authority || '').toLowerCase();
        if (!memberName.includes(query) && !certName.includes(query) && !authority.includes(query)) {
          return false;
        }
      }

      // Member filter
      if (memberFilter && cert.user_id !== memberFilter) {
        return false;
      }

      // Status filter
      if (statusFilter) {
        const certStatus = getCertStatus(cert);
        if (statusFilter === 'expiring' && certStatus !== 'expiring' && certStatus !== 'critical') {
          return false;
        }
        if (statusFilter === 'expired' && certStatus !== 'expired') {
          return false;
        }
        if (statusFilter === 'valid' && certStatus !== 'valid' && certStatus !== 'no_expiry') {
          return false;
        }
      }

      return true;
    });
  }, [certifications, searchQuery, memberFilter, statusFilter]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiration';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (cert: any) => {
    const status = getCertStatus(cert);
    const daysUntil = getDaysUntil(cert.expiration_date);

    switch (status) {
      case 'expired':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
            <AlertCircle className="h-3 w-3" />
            Expired
          </span>
        );
      case 'critical':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
            <AlertTriangle className="h-3 w-3" />
            {daysUntil} days
          </span>
        );
      case 'expiring':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
            <AlertTriangle className="h-3 w-3" />
            {daysUntil} days
          </span>
        );
      case 'valid':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
            <CheckCircle className="h-3 w-3" />
            Valid
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
            No Expiry
          </span>
        );
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Certifications</h1>
            <p className="text-gray-600">Track member certifications and expiration dates</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Certification
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fire-100 rounded-lg">
              <Award className="h-6 w-6 text-fire-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certifications.length}</p>
              <p className="text-sm text-gray-500">Total Certifications</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {certifications.length - expiringCount - expiredCount}
              </p>
              <p className="text-sm text-gray-500">Valid</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiringCount}</p>
              <p className="text-sm text-gray-500">Expiring Soon</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiredCount}</p>
              <p className="text-sm text-gray-500">Expired</p>
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
                placeholder="Search by member, certification, or authority..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            <option value="">All Status</option>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Certifications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certification
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issuing Authority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCertifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Award className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No certifications found</p>
                  </td>
                </tr>
              ) : (
                filteredCertifications.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-fire-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-fire-700 text-sm font-medium">
                            {cert.user?.first_name?.[0]}
                            {cert.user?.last_name?.[0]}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {cert.user?.first_name} {cert.user?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-gray-900 font-medium">{cert.certification_name}</p>
                        {cert.certification_number && (
                          <p className="text-sm text-gray-500">#{cert.certification_number}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {cert.issuing_authority || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {cert.issue_date ? formatDate(cert.issue_date) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(cert.expiration_date)}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(cert)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {expiringCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">Certifications Expiring Soon</h3>
              <p className="text-sm text-amber-700 mt-1">
                {expiringCount} certification{expiringCount !== 1 ? 's' : ''} will expire within the
                next 90 days. Review and schedule renewals to ensure compliance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expired Alert */}
      {expiredCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Expired Certifications</h3>
              <p className="text-sm text-red-700 mt-1">
                {expiredCount} certification{expiredCount !== 1 ? 's' : ''} ha
                {expiredCount !== 1 ? 've' : 's'} expired and need immediate attention.
              </p>
            </div>
          </div>
        </div>
      )}

      <AddCertificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
        members={members}
        departmentId={departmentId}
      />
    </div>
  );
}
