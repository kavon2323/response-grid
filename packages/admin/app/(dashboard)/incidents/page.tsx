import { createClient } from '@/lib/supabase/server';
import { formatDistanceToNow, format } from 'date-fns';
import { AlertCircle, MapPin, Search, Filter, Plus } from 'lucide-react';
import Link from 'next/link';

const priorityColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-200 text-red-800',
};

const statusColors = {
  dispatched: 'bg-red-100 text-red-700',
  acknowledged: 'bg-orange-100 text-orange-700',
  units_enroute: 'bg-yellow-100 text-yellow-700',
  on_scene: 'bg-blue-100 text-blue-700',
  under_control: 'bg-green-100 text-green-700',
  cleared: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default async function IncidentsPage() {
  const supabase = createClient();

  const { data: incidents } = await supabase
    .from('incidents')
    .select(`
      *,
      incident_responses(count)
    `)
    .order('dispatched_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-600">
            View and manage all incidents
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors">
          <Plus className="h-4 w-4" />
          New Incident
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search incidents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500 focus:border-transparent"
              />
            </div>
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500">
            <option value="">All Statuses</option>
            <option value="dispatched">Dispatched</option>
            <option value="on_scene">On Scene</option>
            <option value="cleared">Cleared</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500">
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Incident
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Responders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dispatched
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(!incidents || incidents.length === 0) ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No incidents found</p>
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/incidents/${incident.id}`}
                      className="text-fire-600 hover:text-fire-700 font-medium"
                    >
                      {incident.incident_type}
                    </Link>
                    {incident.cad_incident_id && (
                      <p className="text-xs text-gray-500">
                        CAD #{incident.cad_incident_id}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{incident.address}</span>
                    </div>
                    {incident.city && (
                      <p className="text-xs text-gray-500">{incident.city}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        statusColors[incident.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {incident.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        priorityColors[incident.priority as keyof typeof priorityColors]
                      }`}
                    >
                      {incident.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {/* @ts-ignore */}
                    {incident.incident_responses?.[0]?.count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{format(new Date(incident.dispatched_at), 'MMM d, yyyy')}</div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(incident.dispatched_at), { addSuffix: true })}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
