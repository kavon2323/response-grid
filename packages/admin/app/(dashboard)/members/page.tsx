import { createClient } from '@/lib/supabase/server';
import { MembersClient } from '@/components/MembersClient';

export default async function MembersPage() {
  const supabase = createClient();

  // Get department first
  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .limit(1)
    .single();

  const departmentId = dept?.id;

  // Fetch members and stations filtered by department
  const { data: members } = await supabase
    .from('users')
    .select(`
      *,
      primary_station:stations(id, name, code)
    `)
    .eq('department_id', departmentId)
    .order('last_name', { ascending: true });

  const { data: stations } = await supabase
    .from('stations')
    .select('id, name')
    .eq('department_id', departmentId)
    .order('name');

  if (!departmentId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No department found. Please run the seed function first.</p>
        <code className="mt-2 block text-sm bg-gray-100 p-2 rounded">SELECT seed_demo_department();</code>
      </div>
    );
  }

  return (
    <MembersClient
      members={members || []}
      stations={stations || []}
      departmentId={departmentId}
    />
  );
}
