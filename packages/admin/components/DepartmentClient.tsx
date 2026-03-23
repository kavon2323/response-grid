'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Users,
  Truck,
  Star,
  Save,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { AddStationModal } from './modals/AddStationModal';
import { EditStationModal } from './modals/EditStationModal';

interface Department {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  timezone: string;
}

interface Station {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  is_primary: boolean;
}

interface StationStats {
  members: number;
  apparatus: number;
}

interface DepartmentClientProps {
  department: Department;
  stations: Station[];
  stationStats: Record<string, StationStats>;
}

export function DepartmentClient({ department, stations, stationStats }: DepartmentClientProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deptForm, setDeptForm] = useState({
    name: department.name,
    code: department.code,
    address: department.address || '',
    city: department.city || '',
    state: department.state || '',
    zip: department.zip || '',
    timezone: department.timezone,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  function handleInputChange(field: string, value: string) {
    setDeptForm(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }

  async function saveDepartment() {
    setIsSaving(true);
    const { error } = await supabase
      .from('departments')
      .update({
        name: deptForm.name,
        code: deptForm.code,
        address: deptForm.address || null,
        city: deptForm.city || null,
        state: deptForm.state || null,
        zip: deptForm.zip || null,
        timezone: deptForm.timezone,
      })
      .eq('id', department.id);

    if (!error) {
      setHasChanges(false);
      router.refresh();
    }
    setIsSaving(false);
  }

  async function deleteStation(stationId: string) {
    if (!confirm('Are you sure you want to delete this station? Members and apparatus assigned to this station will be unassigned.')) {
      return;
    }

    const { error } = await supabase
      .from('stations')
      .delete()
      .eq('id', stationId);

    if (!error) {
      router.refresh();
    }
  }

  async function setPrimaryStation(stationId: string) {
    // First, unset all primary flags
    await supabase
      .from('stations')
      .update({ is_primary: false })
      .eq('department_id', department.id);

    // Then set the new primary
    const { error } = await supabase
      .from('stations')
      .update({ is_primary: true })
      .eq('id', stationId);

    if (!error) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600">Manage your department settings and stations</p>
        </div>
        {hasChanges && (
          <button
            onClick={saveDepartment}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Department Info Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex items-center gap-3">
          <Building2 className="h-5 w-5 text-fire-600" />
          <h2 className="text-lg font-semibold">Department Information</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
              <input
                type="text"
                value={deptForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
              <input
                type="text"
                value={deptForm.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={deptForm.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={deptForm.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={deptForm.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                type="text"
                value={deptForm.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={deptForm.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Anchorage">Alaska Time (AKT)</option>
              <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stations Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-fire-600" />
            <h2 className="text-lg font-semibold">Stations</h2>
            <span className="text-sm text-gray-500">({stations.length})</span>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700"
          >
            <Plus className="h-4 w-4" />
            Add Station
          </button>
        </div>

        {stations.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Stations</h3>
            <p className="text-gray-500 mb-4">Add your first station to start organizing your department.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700"
            >
              Add Station
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {stations.map((station) => {
              const stats = stationStats[station.id] || { members: 0, apparatus: 0 };
              return (
                <div key={station.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-fire-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-fire-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{station.name}</h3>
                        {station.is_primary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                            <Star className="h-3 w-3" />
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {station.code}
                        {station.address && ` • ${station.address}`}
                        {station.city && `, ${station.city}`}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {stats.members} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {stats.apparatus} apparatus
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!station.is_primary && (
                      <button
                        onClick={() => setPrimaryStation(station.id)}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Set as primary"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingStation(station)}
                      className="p-2 text-gray-400 hover:text-fire-600 hover:bg-fire-50 rounded-lg"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteStation(station.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddStationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          router.refresh();
        }}
        departmentId={department.id}
      />

      {editingStation && (
        <EditStationModal
          isOpen={true}
          onClose={() => setEditingStation(null)}
          onSuccess={() => {
            setEditingStation(null);
            router.refresh();
          }}
          station={editingStation}
        />
      )}
    </div>
  );
}
