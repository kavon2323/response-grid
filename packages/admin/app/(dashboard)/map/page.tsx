'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Users, Truck, AlertCircle } from 'lucide-react';

interface Incident {
  id: string;
  incident_type: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  priority: string;
}

interface Responder {
  id: string;
  first_name: string;
  last_name: string;
  latitude?: number;
  longitude?: number;
}

export default function LiveMapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('incidents')
        .select('*')
        .not('status', 'in', '("cleared","cancelled")')
        .order('dispatched_at', { ascending: false });

      setIncidents(data || []);
      setLoading(false);
    }

    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('live-map')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fire-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Map</h1>
        <p className="text-gray-600">
          Real-time view of incidents and responder locations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Placeholder */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow overflow-hidden">
          <div className="h-[600px] bg-gray-200 flex items-center justify-center relative">
            <div className="text-center text-gray-500">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Map Integration</p>
              <p className="text-sm">
                Connect Google Maps or Mapbox API to enable live mapping
              </p>
              <p className="text-xs mt-2 text-gray-400">
                Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to environment variables
              </p>
            </div>

            {/* Active incident markers preview */}
            {incidents.length > 0 && (
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {incidents.length} Active Incident{incidents.length > 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span>Active Incident</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span>Responding Unit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span>Station</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <span>En Route</span>
              </div>
            </div>
          </div>

          {/* Active Incidents List */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Active Incidents</h3>
            {incidents.length === 0 ? (
              <p className="text-sm text-gray-500">No active incidents</p>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="p-2 bg-gray-50 rounded border-l-4 border-red-500"
                  >
                    <p className="text-sm font-medium">{incident.incident_type}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {incident.address}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  Active Incidents
                </span>
                <span className="font-semibold">{incidents.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  Responding
                </span>
                <span className="font-semibold">--</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <Truck className="h-4 w-4" />
                  Units Out
                </span>
                <span className="font-semibold">--</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
