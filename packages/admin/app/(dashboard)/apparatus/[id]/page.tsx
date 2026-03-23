import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Truck,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  MapPin,
  Info,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { ApparatusDetailClient } from '@/components/ApparatusDetailClient';

const statusColors = {
  available: 'bg-green-100 text-green-700 border-green-200',
  dispatched: 'bg-red-100 text-red-700 border-red-200',
  en_route: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  on_scene: 'bg-blue-100 text-blue-700 border-blue-200',
  returning: 'bg-purple-100 text-purple-700 border-purple-200',
  out_of_service: 'bg-gray-100 text-gray-700 border-gray-200',
};

const maintenanceStatusColors = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const checkStatusColors = {
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  needs_attention: 'bg-yellow-100 text-yellow-700',
};

const issueStatusColors = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  deferred: 'bg-gray-100 text-gray-500',
};

const severityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

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

export default async function ApparatusDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Fetch apparatus with related data
  const { data: apparatus } = await supabase
    .from('apparatus')
    .select(`
      *,
      station:stations(id, name, code),
      current_incident:incidents(id, incident_type, address)
    `)
    .eq('id', params.id)
    .single();

  if (!apparatus) {
    notFound();
  }

  // Fetch maintenance history
  const { data: maintenanceRecords } = await supabase
    .from('apparatus_maintenance')
    .select('*')
    .eq('apparatus_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch recent checks
  const { data: recentChecks } = await supabase
    .from('apparatus_checks')
    .select(`
      *,
      performed_by:users(id, first_name, last_name)
    `)
    .eq('apparatus_id', params.id)
    .order('check_date', { ascending: false })
    .limit(10);

  // Fetch open issues
  const { data: openIssues } = await supabase
    .from('apparatus_issues')
    .select(`
      *,
      reported_by:users(id, first_name, last_name)
    `)
    .eq('apparatus_id', params.id)
    .in('status', ['open', 'in_progress'])
    .order('created_at', { ascending: false });

  // Get department id for modals
  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .limit(1)
    .single();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/apparatus"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Apparatus
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{typeIcons[apparatus.apparatus_type] || '🚐'}</span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{apparatus.name}</h1>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded border ${
                    statusColors[apparatus.status as keyof typeof statusColors]
                  }`}
                >
                  {apparatus.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Unit #{apparatus.unit_number} | {apparatus.apparatus_type}
              </p>
            </div>
          </div>
        </div>
        <ApparatusDetailClient
          apparatusId={params.id}
          departmentId={dept?.id || ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Apparatus Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-fire-600" />
              Apparatus Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium capitalize">{apparatus.apparatus_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Station</p>
                <p className="font-medium">{apparatus.station?.name || '--'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Seat Capacity</p>
                <p className="font-medium">{apparatus.seat_capacity}</p>
              </div>
              {apparatus.year && (
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-medium">{apparatus.year}</p>
                </div>
              )}
              {apparatus.make && (
                <div>
                  <p className="text-sm text-gray-500">Make</p>
                  <p className="font-medium">{apparatus.make}</p>
                </div>
              )}
              {apparatus.model && (
                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-medium">{apparatus.model}</p>
                </div>
              )}
              {apparatus.vin && (
                <div>
                  <p className="text-sm text-gray-500">VIN</p>
                  <p className="font-medium font-mono text-sm">{apparatus.vin}</p>
                </div>
              )}
              {apparatus.license_plate && (
                <div>
                  <p className="text-sm text-gray-500">License Plate</p>
                  <p className="font-medium">{apparatus.license_plate}</p>
                </div>
              )}
            </div>

            {apparatus.current_incident && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Currently Assigned To:</p>
                <Link
                  href={`/incidents/${apparatus.current_incident.id}`}
                  className="text-sm text-red-700 hover:underline"
                >
                  {apparatus.current_incident.incident_type} - {apparatus.current_incident.address}
                </Link>
              </div>
            )}
          </div>

          {/* Maintenance History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-fire-600" />
              Maintenance History
            </h2>
            {!maintenanceRecords || maintenanceRecords.length === 0 ? (
              <p className="text-gray-500">No maintenance records found</p>
            ) : (
              <div className="divide-y">
                {maintenanceRecords.map((record: any) => (
                  <div key={record.id} className="py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{record.title}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {record.maintenance_type} | {record.performed_by || 'N/A'}
                        </p>
                        {record.description && (
                          <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            maintenanceStatusColors[record.status as keyof typeof maintenanceStatusColors]
                          }`}
                        >
                          {record.status}
                        </span>
                        {record.completed_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(record.completed_date), 'MMM d, yyyy')}
                          </p>
                        )}
                        {record.cost && (
                          <p className="text-xs text-gray-500">
                            ${record.cost.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Checks */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-fire-600" />
              Recent Checks
            </h2>
            {!recentChecks || recentChecks.length === 0 ? (
              <p className="text-gray-500">No checks recorded</p>
            ) : (
              <div className="divide-y">
                {recentChecks.map((check: any) => (
                  <div key={check.id} className="py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {check.status === 'passed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : check.status === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <p className="font-medium text-gray-900 capitalize">
                            {check.check_type} Check
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          By {check.performed_by?.first_name} {check.performed_by?.last_name}
                        </p>
                        {check.overall_notes && (
                          <p className="text-sm text-gray-600 mt-1">{check.overall_notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            checkStatusColors[check.status as keyof typeof checkStatusColors]
                          }`}
                        >
                          {check.status.replace(/_/g, ' ')}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(check.check_date), 'MMM d, yyyy')}
                        </p>
                        {check.fuel_level !== null && (
                          <p className="text-xs text-gray-500">
                            Fuel: {check.fuel_level}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Open Issues */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-fire-600" />
              Open Issues ({openIssues?.length || 0})
            </h2>
            {!openIssues || openIssues.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-2" />
                <p className="text-gray-500">No open issues</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openIssues.map((issue: any) => (
                  <div
                    key={issue.id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-gray-900 text-sm">{issue.title}</p>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          severityColors[issue.severity as keyof typeof severityColors]
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    {issue.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {issue.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          issueStatusColors[issue.status as keyof typeof issueStatusColors]
                        }`}
                      >
                        {issue.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs text-gray-500">
                        {format(new Date(issue.created_at), 'MMM d')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-fire-600" />
              Quick Stats
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Checks</span>
                <span className="font-medium">{recentChecks?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Maintenance Records</span>
                <span className="font-medium">{maintenanceRecords?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Open Issues</span>
                <span className="font-medium">{openIssues?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
