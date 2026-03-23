import { createClient } from '@/lib/supabase/server';
import { ApparatusClient } from '@/components/ApparatusClient';

export default async function ApparatusPage() {
  const supabase = createClient();

  // Get department first
  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .limit(1)
    .single();

  const departmentId = dept?.id;

  if (!departmentId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No department found. Please run the seed function first.</p>
        <code className="mt-2 block text-sm bg-gray-100 p-2 rounded">SELECT seed_demo_department();</code>
      </div>
    );
  }

  const { data: apparatus } = await supabase
    .from('apparatus')
    .select(`
      *,
      station:stations(id, name, code),
      current_incident:incidents(id, incident_type, address)
    `)
    .eq('department_id', departmentId)
    .eq('is_active', true)
    .order('unit_number', { ascending: true });

  const { data: stations } = await supabase
    .from('stations')
    .select('id, name')
    .eq('department_id', departmentId)
    .order('name');

  return (
    <ApparatusClient
      apparatus={apparatus || []}
      stations={stations || []}
      departmentId={departmentId}
    />
  );
}
