import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Clock,
  AlertCircle,
  Truck,
  Users,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

const priorityColors = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-red-100 text-red-700 border-red-200',
  critical: 'bg-red-200 text-red-800 border-red-300',
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

export default async function IncidentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: incident } = await supabase
    .from('incidents')
    .select(`
      *,
      incident_responses(
        *,
        user:users(id, first_name, last_name, role, badge_number)
      ),
      apparatus_assignments(
        *,
        apparatus:apparatus(id, name, unit_number, apparatus_type)
      )
    `)
    .eq('id', params.id)
    .single();

  if (!incident) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/incidents"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Incidents
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {incident.incident_type}
            </h1>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full border ${
                priorityColors[incident.priority as keyof typeof priorityColors]
              }`}
            >
              {incident.priority.toUpperCase()}
            </span>
            <span
              className={`px-3 py-1 text-sm font-medium rounded ${
                statusColors[incident.status as keyof typeof statusColors]
              }`}
            >
              {incident.status.replace(/_/g, ' ')}
            </span>
          </div>
          {incident.cad_incident_id && (
            <p className="text-sm text-gray-500 mt-1">
              CAD #{incident.cad_incident_id}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Edit
          </button>
          <button className="px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700">
            Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Location Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-fire-600" />
              Location
            </h2>
            <div className="space-y-2">
              <p className="text-lg font-medium">{incident.address}</p>
              {incident.address_line2 && (
                <p className="text-gray-600">{incident.address_line2}</p>
              )}
              <p className="text-gray-600">
                {[incident.city, incident.state, incident.zip].filter(Boolean).join(', ')}
              </p>
              {incident.cross_street && (
                <p className="text-sm text-gray-500">
                  Cross street: {incident.cross_street}
                </p>
              )}
              {incident.location_notes && (
                <p className="text-sm text-gray-500 mt-2">
                  Notes: {incident.location_notes}
                </p>
              )}
            </div>

            {/* Map placeholder */}
            <div className="mt-4 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Map view</span>
            </div>
          </div>

          {/* Description */}
          {incident.description && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-fire-600" />
                Description
              </h2>
              <p className="text-gray-700">{incident.description}</p>
              {incident.dispatch_notes && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium text-yellow-800">Dispatch Notes</p>
                  <p className="text-sm text-yellow-700">{incident.dispatch_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Responders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-fire-600" />
              Responders ({incident.incident_responses?.length || 0})
            </h2>
            {!incident.incident_responses || incident.incident_responses.length === 0 ? (
              <p className="text-gray-500">No responders yet</p>
            ) : (
              <div className="divide-y">
                {incident.incident_responses.map((response: any) => (
                  <div key={response.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-fire-100 flex items-center justify-center">
                        <span className="text-fire-700 font-medium">
                          {response.user?.first_name?.[0]}{response.user?.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {response.user?.first_name} {response.user?.last_name}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {response.user?.role} {response.user?.badge_number && `#${response.user.badge_number}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                        {response.status.replace(/_/g, ' ')}
                      </span>
                      {response.current_eta_minutes && (
                        <p className="text-xs text-gray-500 mt-1">
                          ETA: {response.current_eta_minutes} min
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Apparatus */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-fire-600" />
              Apparatus ({incident.apparatus_assignments?.length || 0})
            </h2>
            {!incident.apparatus_assignments || incident.apparatus_assignments.length === 0 ? (
              <p className="text-gray-500">No apparatus assigned</p>
            ) : (
              <div className="divide-y">
                {incident.apparatus_assignments.map((assignment: any) => (
                  <div key={assignment.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{assignment.apparatus?.name}</p>
                      <p className="text-sm text-gray-500">
                        Unit #{assignment.apparatus?.unit_number} • {assignment.apparatus?.apparatus_type}
                      </p>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                      {assignment.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Caller Info */}
          {(incident.caller_name || incident.caller_phone) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Caller Info</h2>
              {incident.caller_name && (
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{incident.caller_name}</span>
                </div>
              )}
              {incident.caller_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${incident.caller_phone}`} className="text-fire-600 hover:underline">
                    {incident.caller_phone}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-fire-600" />
              Timeline
            </h2>
            <div className="space-y-4">
              <TimelineItem
                label="Dispatched"
                time={incident.dispatched_at}
                active
              />
              <TimelineItem
                label="Acknowledged"
                time={incident.acknowledged_at}
              />
              <TimelineItem
                label="First Unit En Route"
                time={incident.first_unit_enroute_at}
              />
              <TimelineItem
                label="First Unit Arrived"
                time={incident.first_unit_arrived_at}
              />
              <TimelineItem
                label="Under Control"
                time={incident.under_control_at}
              />
              <TimelineItem
                label="Cleared"
                time={incident.cleared_at}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  time,
  active = false,
}: {
  label: string;
  time: string | null;
  active?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-3 h-3 rounded-full mt-1.5 ${
          time ? 'bg-green-500' : active ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'
        }`}
      />
      <div className="flex-1">
        <p className={`text-sm font-medium ${time ? 'text-gray-900' : 'text-gray-400'}`}>
          {label}
        </p>
        {time && (
          <p className="text-xs text-gray-500">
            {format(new Date(time), 'MMM d, yyyy h:mm a')}
          </p>
        )}
      </div>
    </div>
  );
}
