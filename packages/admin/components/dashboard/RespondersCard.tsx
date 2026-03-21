import { createClient } from '@/lib/supabase/server';
import { User, MapPin, Clock } from 'lucide-react';

const statusColors = {
  responding_scene: 'bg-red-500',
  responding_station: 'bg-yellow-500',
  arrived_station: 'bg-yellow-400',
  en_route_scene: 'bg-orange-500',
  arrived_scene: 'bg-green-500',
};

export async function RespondersCard() {
  const supabase = createClient();

  // Get active responders across all active incidents
  const { data: responses } = await supabase
    .from('incident_responses')
    .select(`
      *,
      user:users(id, first_name, last_name, role),
      incident:incidents(id, incident_type, address)
    `)
    .in('status', [
      'responding_scene',
      'responding_station',
      'arrived_station',
      'en_route_scene',
      'arrived_scene',
    ])
    .order('responded_at', { ascending: false })
    .limit(10);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          Active Responders
        </h2>
      </div>

      {!responses || responses.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No active responders</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {responses.map((response) => (
            <div key={response.id} className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    statusColors[response.status as keyof typeof statusColors] ||
                    'bg-gray-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {/* @ts-ignore */}
                    {response.user?.first_name} {response.user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {response.status.replace(/_/g, ' ')}
                  </p>
                </div>
                {response.current_eta_minutes && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{response.current_eta_minutes}m</span>
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 ml-6">
                <MapPin className="h-3 w-3" />
                {/* @ts-ignore */}
                <span className="truncate">{response.incident?.incident_type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
