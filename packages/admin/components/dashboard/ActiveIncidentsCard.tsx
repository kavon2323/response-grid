import { createClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

const priorityColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-200 text-red-800',
};

export async function ActiveIncidentsCard() {
  const supabase = createClient();

  const { data: incidents } = await supabase
    .from('incidents')
    .select(`
      *,
      incident_responses(count)
    `)
    .not('status', 'in', '("cleared","cancelled")')
    .order('dispatched_at', { ascending: false })
    .limit(5);

  if (!incidents || incidents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Incidents
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <AlertCircle className="h-12 w-12 mb-4 text-green-500" />
          <p className="text-lg font-medium text-green-700">All Clear</p>
          <p className="text-sm">No active incidents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Active Incidents
          </h2>
          <Link
            href="/incidents"
            className="text-sm text-fire-600 hover:text-fire-700 font-medium"
          >
            View All
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {incidents.map((incident) => (
          <Link
            key={incident.id}
            href={`/incidents/${incident.id}`}
            className="block p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      priorityColors[incident.priority as keyof typeof priorityColors]
                    }`}
                  >
                    {incident.priority.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {incident.incident_type}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span>{incident.address}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    {formatDistanceToNow(new Date(incident.dispatched_at), {
                      addSuffix: true,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {/* @ts-ignore - count aggregation */}
                    {incident.incident_responses?.[0]?.count || 0} responding
                  </span>
                </div>
              </div>

              <div className="ml-4">
                <span
                  className={`
                    inline-flex items-center px-2 py-1 rounded text-xs font-medium
                    ${
                      incident.status === 'dispatched'
                        ? 'bg-red-100 text-red-700'
                        : incident.status === 'on_scene'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }
                  `}
                >
                  {incident.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
