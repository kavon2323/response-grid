import { createClient } from '@/lib/supabase/server';
import { MembersClient } from '@/components/MembersClient';

export default async function MembersPage() {
  const supabase = createClient();

  const { data: members } = await supabase
    .from('users')
    .select(`
      *,
      primary_station:stations(id, name, code)
    `)
    .order('last_name', { ascending: true });

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
    <MembersClient
      members={members || []}
      stations={stations || []}
      departmentId={dept?.id || ''}
    />
  );
}
