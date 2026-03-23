import { createClient } from '@/lib/supabase/server';
import { ApparatusClient } from '@/components/ApparatusClient';

export default async function ApparatusPage() {
  const supabase = createClient();

  const { data: apparatus } = await supabase
    .from('apparatus')
    .select(`
      *,
      station:stations(id, name, code),
      current_incident:incidents(id, incident_type, address)
    `)
    .eq('is_active', true)
    .order('unit_number', { ascending: true });

  const { data: stations } = await supabase
    .from('stations')
    .select('id, name')
    .order('name');

  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .limit(1)
    .single();

  return (
    <ApparatusClient
      apparatus={apparatus || []}
      stations={stations || []}
      departmentId={dept?.id || ''}
    />
  );
}
