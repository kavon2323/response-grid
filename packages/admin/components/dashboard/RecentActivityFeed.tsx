import { createClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';
import { Activity, AlertCircle, User, Truck, MapPin } from 'lucide-react';

type ActivityItem = {
  id: string;
  type: 'incident' | 'response' | 'apparatus';
  title: string;
  description: string;
  timestamp: string;
};

export async function RecentActivityFeed() {
  const supabase = createClient();

  // Fetch recent incidents
  const { data: recentIncidents } = await supabase
    .from('incidents')
    .select('id, incident_type, address, status, dispatched_at')
    .order('dispatched_at', { ascending: false })
    .limit(5);

  // Fetch recent status changes
  const { data: recentResponses } = await supabase
    .from('response_status_log')
    .select(`
      id,
      new_status,
      changed_at,
      user:users(first_name, last_name),
      incident:incidents(incident_type)
    `)
    .order('changed_at', { ascending: false })
    .limit(10);

  // Combine and sort activities
  const activities: ActivityItem[] = [];

  recentIncidents?.forEach((incident) => {
    activities.push({
      id: `incident-${incident.id}`,
      type: 'incident',
      title: incident.incident_type,
      description: `New call at ${incident.address}`,
      timestamp: incident.dispatched_at,
    });
  });

  recentResponses?.forEach((response) => {
    activities.push({
      id: `response-${response.id}`,
      type: 'response',
      // @ts-ignore
      title: `${response.user?.first_name} ${response.user?.last_name}`,
      description: `${response.new_status.replace(/_/g, ' ')} - ${
        // @ts-ignore
        response.incident?.incident_type
      }`,
      timestamp: response.changed_at,
    });
  });

  // Sort by timestamp
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'incident':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'response':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'apparatus':
        return <Truck className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
        </div>
      </div>

      <div className="p-6">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 15).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-1">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
