import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ActiveIncidentsCard } from '@/components/dashboard/ActiveIncidentsCard';
import { RespondersCard } from '@/components/dashboard/RespondersCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';

export default async function DashboardPage() {
  const supabase = createClient();

  // Fetch active incidents count
  const { count: activeIncidentsCount } = await supabase
    .from('incidents')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '("cleared","cancelled")');

  // Fetch today's incidents count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: todayIncidentsCount } = await supabase
    .from('incidents')
    .select('*', { count: 'exact', head: true })
    .gte('dispatched_at', today.toISOString());

  // Fetch active members count
  const { count: activeMembersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Overview of department activity and current status
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid
        stats={[
          {
            label: 'Active Incidents',
            value: activeIncidentsCount || 0,
            color: activeIncidentsCount && activeIncidentsCount > 0 ? 'red' : 'green',
          },
          {
            label: "Today's Calls",
            value: todayIncidentsCount || 0,
            color: 'blue',
          },
          {
            label: 'Active Members',
            value: activeMembersCount || 0,
            color: 'green',
          },
          {
            label: 'Available Apparatus',
            value: '--',
            color: 'gray',
          },
        ]}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incidents - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Suspense fallback={<CardSkeleton />}>
            <ActiveIncidentsCard />
          </Suspense>
        </div>

        {/* Responders Status */}
        <div>
          <Suspense fallback={<CardSkeleton />}>
            <RespondersCard />
          </Suspense>
        </div>
      </div>

      {/* Recent Activity */}
      <Suspense fallback={<CardSkeleton />}>
        <RecentActivityFeed />
      </Suspense>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}
