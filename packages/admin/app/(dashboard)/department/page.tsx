import { createClient } from '@/lib/supabase/server';
import { DepartmentClient } from '@/components/DepartmentClient';

export default async function DepartmentPage() {
  const supabase = createClient();

  // Get department
  const { data: department } = await supabase
    .from('departments')
    .select('*')
    .limit(1)
    .single();

  if (!department) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No department found. Please run the seed function first.</p>
        <code className="mt-2 block text-sm bg-gray-100 p-2 rounded">SELECT seed_demo_department();</code>
      </div>
    );
  }

  // Get stations for this department
  const { data: stations } = await supabase
    .from('stations')
    .select('*')
    .eq('department_id', department.id)
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true });

  // Get counts for each station
  const { data: memberCounts } = await supabase
    .from('users')
    .select('primary_station_id')
    .eq('department_id', department.id);

  const { data: apparatusCounts } = await supabase
    .from('apparatus')
    .select('station_id')
    .eq('department_id', department.id)
    .eq('is_active', true);

  // Calculate counts per station
  const stationStats: Record<string, { members: number; apparatus: number }> = {};

  stations?.forEach(station => {
    stationStats[station.id] = {
      members: memberCounts?.filter(m => m.primary_station_id === station.id).length || 0,
      apparatus: apparatusCounts?.filter(a => a.station_id === station.id).length || 0,
    };
  });

  return (
    <DepartmentClient
      department={department}
      stations={stations || []}
      stationStats={stationStats}
    />
  );
}
