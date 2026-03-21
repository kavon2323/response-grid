import { createClient } from '@/lib/supabase/server';
import { Search, Plus, Truck, Wrench, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const typeIcons: Record<string, string> = {
  engine: '🚒',
  ladder: '🪜',
  rescue: '🚑',
  tanker: '💧',
  ambulance: '🏥',
  brush: '🌲',
  utility: '🔧',
  command: '📡',
  other: '🚐',
};

const statusColors = {
  available: 'bg-green-100 text-green-700 border-green-200',
  dispatched: 'bg-red-100 text-red-700 border-red-200',
  en_route: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  on_scene: 'bg-blue-100 text-blue-700 border-blue-200',
  returning: 'bg-purple-100 text-purple-700 border-purple-200',
  out_of_service: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default async function ApparatusPage() {
  const supabase = createClient();

  const { data: apparatus } = await supabase
    .from('apparatus')
    .select(`
      *,
      station:stations(id, name, code),
      current_incident:incidents(id, incident_type, address)
    `)
    .eq('is_active', true)
    .order('unit_number', { ascending: true });

  const availableCount = apparatus?.filter((a) => a.status === 'available').length || 0;
  const dispatchedCount = apparatus?.filter((a) => ['dispatched', 'en_route', 'on_scene'].includes(a.status)).length || 0;
  const outOfServiceCount = apparatus?.filter((a) => a.status === 'out_of_service').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apparatus</h1>
          <p className="text-gray-600">
            Manage department vehicles and equipment
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Apparatus
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{apparatus?.length || 0}</p>
              <p className="text-sm text-gray-500">Total Units</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{availableCount}</p>
              <p className="text-sm text-gray-500">Available</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dispatchedCount}</p>
              <p className="text-sm text-gray-500">Dispatched</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Wrench className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{outOfServiceCount}</p>
              <p className="text-sm text-gray-500">Out of Service</p>
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
                placeholder="Search apparatus..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500 focus:border-transparent"
              />
            </div>
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500">
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
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="dispatched">Dispatched</option>
            <option value="out_of_service">Out of Service</option>
          </select>
        </div>
      </div>

      {/* Apparatus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(!apparatus || apparatus.length === 0) ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <Truck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No apparatus found</p>
          </div>
        ) : (
          apparatus.map((unit) => (
            <div
              key={unit.id}
              className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${
                unit.status === 'available'
                  ? 'border-green-500'
                  : unit.status === 'out_of_service'
                  ? 'border-gray-400'
                  : 'border-red-500'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {typeIcons[unit.apparatus_type] || '🚐'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{unit.name}</h3>
                      <p className="text-sm text-gray-500">Unit #{unit.unit_number}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${
                      statusColors[unit.status as keyof typeof statusColors]
                    }`}
                  >
                    {unit.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="capitalize">{unit.apparatus_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Station</span>
                    <span>{(unit.station as any)?.name || '--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seats</span>
                    <span>{unit.seat_capacity}</span>
                  </div>
                  {unit.year && unit.make && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle</span>
                      <span>{unit.year} {unit.make}</span>
                    </div>
                  )}
                </div>

                {unit.current_incident && (
                  <div className="mt-4 p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs font-medium text-red-700">Currently Assigned</p>
                    <p className="text-sm text-red-600 truncate">
                      {(unit.current_incident as any).incident_type} - {(unit.current_incident as any).address}
                    </p>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-gray-50 border-t flex justify-end gap-2">
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                  View
                </button>
                <button className="px-3 py-1 text-sm text-fire-600 hover:text-fire-700">
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
