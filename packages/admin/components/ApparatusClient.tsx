'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Truck, Wrench, CheckCircle, AlertTriangle, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { AddApparatusModal } from './modals/AddApparatusModal';
import { EditApparatusModal } from './modals/EditApparatusModal';

const typeIcons: Record<string, string> = {
  engine: '🚒', ladder: '🪜', rescue: '🚑', tanker: '💧', ambulance: '🏥',
  brush: '🌲', utility: '🔧', command: '📡', other: '🚐',
};

const statusColors = {
  available: 'bg-green-100 text-green-700 border-green-200',
  dispatched: 'bg-red-100 text-red-700 border-red-200',
  en_route: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  on_scene: 'bg-blue-100 text-blue-700 border-blue-200',
  returning: 'bg-purple-100 text-purple-700 border-purple-200',
  out_of_service: 'bg-gray-100 text-gray-700 border-gray-200',
};

interface ApparatusClientProps {
  apparatus: any[];
  stations: { id: string; name: string }[];
  departmentId: string;
}

export function ApparatusClient({ apparatus, stations, departmentId }: ApparatusClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApparatus, setEditingApparatus] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function deleteApparatus(apparatusId: string, apparatusName: string) {
    if (!confirm(`Are you sure you want to delete "${apparatusName}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.from('apparatus').delete().eq('id', apparatusId);

    if (!error) {
      router.refresh();
    }
  }

  const availableCount = apparatus?.filter((a) => a.status === 'available').length || 0;
  const dispatchedCount = apparatus?.filter((a) => ['dispatched', 'en_route', 'on_scene'].includes(a.status)).length || 0;
  const outOfServiceCount = apparatus?.filter((a) => a.status === 'out_of_service').length || 0;

  // Apply filters
  const filteredApparatus = apparatus?.filter((unit) => {
    const matchesSearch = searchQuery === '' ||
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.unit_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStation = stationFilter === '' || unit.station_id === stationFilter;
    const matchesType = typeFilter === '' || unit.apparatus_type === typeFilter;
    const matchesStatus = statusFilter === '' || unit.status === statusFilter;

    return matchesSearch && matchesStation && matchesType && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apparatus</h1>
          <p className="text-gray-600">Manage department vehicles and equipment</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Apparatus
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Truck className="h-6 w-6 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{apparatus?.length || 0}</p><p className="text-sm text-gray-500">Total Units</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{availableCount}</p><p className="text-sm text-gray-500">Available</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
            <div><p className="text-2xl font-bold">{dispatchedCount}</p><p className="text-sm text-gray-500">Dispatched</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg"><Wrench className="h-6 w-6 text-gray-600" /></div>
            <div><p className="text-2xl font-bold">{outOfServiceCount}</p><p className="text-sm text-gray-500">Out of Service</p></div>
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
                placeholder="Search apparatus..."
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
            {stations.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            <option value="">All Types</option>
            <option value="engine">Engine</option>
            <option value="ladder">Ladder</option>
            <option value="rescue">Rescue</option>
            <option value="tanker">Tanker</option>
            <option value="ambulance">Ambulance</option>
            <option value="brush">Brush</option>
            <option value="utility">Utility</option>
            <option value="command">Command</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="dispatched">Dispatched</option>
            <option value="en_route">En Route</option>
            <option value="on_scene">On Scene</option>
            <option value="returning">Returning</option>
            <option value="out_of_service">Out of Service</option>
          </select>
        </div>
        {(searchQuery || stationFilter || typeFilter || statusFilter) && (
          <div className="mt-3 text-sm text-gray-500">
            Showing {filteredApparatus.length} of {apparatus?.length || 0} units
          </div>
        )}
      </div>

      {/* Apparatus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApparatus.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <Truck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{apparatus?.length === 0 ? 'No apparatus found' : 'No apparatus matches your filters'}</p>
          </div>
        ) : (
          filteredApparatus.map((unit) => (
            <div
              key={unit.id}
              className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${unit.status === 'available' ? 'border-green-500' : unit.status === 'out_of_service' ? 'border-gray-400' : 'border-red-500'}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{typeIcons[unit.apparatus_type] || '🚐'}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{unit.name}</h3>
                      <p className="text-sm text-gray-500">Unit #{unit.unit_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${statusColors[unit.status as keyof typeof statusColors]}`}>
                      {unit.status.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => setEditingApparatus(unit)}
                      className="p-1.5 text-gray-400 hover:text-fire-600 hover:bg-fire-50 rounded"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteApparatus(unit.id, unit.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="capitalize">{unit.apparatus_type}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Station</span><span>{unit.station?.name || '--'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Seats</span><span>{unit.seat_capacity}</span></div>
                </div>
                <Link
                  href={`/apparatus/${unit.id}`}
                  className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm text-fire-600 hover:text-fire-700"
                >
                  <span>View Details</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <AddApparatusModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => router.refresh()} stations={stations} departmentId={departmentId} />

      {editingApparatus && (
        <EditApparatusModal
          isOpen={true}
          onClose={() => setEditingApparatus(null)}
          onSuccess={() => {
            setEditingApparatus(null);
            router.refresh();
          }}
          apparatus={editingApparatus}
          stations={stations}
        />
      )}
    </div>
  );
}
