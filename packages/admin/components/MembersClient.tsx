'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Mail, Phone, Shield, UserCheck, UserX } from 'lucide-react';
import { AddMemberModal } from './modals/AddMemberModal';

const roleColors = {
  volunteer: 'bg-gray-100 text-gray-700',
  lieutenant: 'bg-blue-100 text-blue-700',
  captain: 'bg-purple-100 text-purple-700',
  chief: 'bg-red-100 text-red-700',
  admin: 'bg-yellow-100 text-yellow-700',
};

interface MembersClientProps {
  members: any[];
  stations: { id: string; name: string }[];
  departmentId: string;
}

export function MembersClient({ members, stations, departmentId }: MembersClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const router = useRouter();

  const activeCount = members?.filter((m) => m.is_active).length || 0;
  const inactiveCount = members?.filter((m) => !m.is_active).length || 0;

  // Apply filters
  const filteredMembers = members?.filter((member) => {
    const matchesSearch = searchQuery === '' ||
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.badge_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === '' || member.role === roleFilter;

    const matchesStation = stationFilter === '' ||
      (stationFilter === 'unassigned' && !member.primary_station_id) ||
      member.primary_station_id === stationFilter;

    return matchesSearch && matchesRole && matchesStation;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600">Manage department personnel and their roles</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{members?.length || 0}</p>
              <p className="text-sm text-gray-500">Total Members</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <UserX className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inactiveCount}</p>
              <p className="text-sm text-gray-500">Inactive</p>
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
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            <option value="">All Stations</option>
            <option value="unassigned">Unassigned</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            <option value="">All Roles</option>
            <option value="volunteer">Volunteer</option>
            <option value="lieutenant">Lieutenant</option>
            <option value="captain">Captain</option>
            <option value="chief">Chief</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {(searchQuery || roleFilter || stationFilter) && (
          <div className="mt-3 text-sm text-gray-500">
            Showing {filteredMembers.length} of {members?.length || 0} members
          </div>
        )}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {members?.length === 0 ? 'No members found' : 'No members match your filters'}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-fire-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-fire-700 font-semibold text-lg">
                    {member.first_name?.[0]}{member.last_name?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{member.first_name} {member.last_name}</h3>
                    {!member.is_active && <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">Inactive</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${roleColors[member.role as keyof typeof roleColors]}`}>
                      {member.role}
                    </span>
                    {member.badge_number && <span className="text-xs text-gray-500">#{member.badge_number}</span>}
                  </div>
                  {member.primary_station && <p className="text-xs text-gray-500 mt-1">{member.primary_station.name}</p>}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4">
                {member.email && (
                  <a href={`mailto:${member.email}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-fire-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate max-w-[120px]">{member.email}</span>
                  </a>
                )}
                {member.phone && (
                  <a href={`tel:${member.phone}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-fire-600">
                    <Phone className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <AddMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
        stations={stations}
        departmentId={departmentId}
      />
    </div>
  );
}
