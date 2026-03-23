import { createClient } from '@/lib/supabase/server';
import { EquipmentClient } from '@/components/EquipmentClient';

export default async function EquipmentPage() {
  const supabase = createClient();

  const { data: equipment } = await supabase
    .from('equipment')
    .select(`
      *,
      category:equipment_categories(id, name),
      station:stations(id, name),
      apparatus:apparatus(id, name, unit_number)
    `)
    .order('name', { ascending: true });

  const { data: categories } = await supabase
    .from('equipment_categories')
    .select('id, name')
    .order('name');

  const { data: stations } = await supabase
    .from('stations')
    .select('id, name')
    .order('name');

  const { data: apparatus } = await supabase
    .from('apparatus')
    .select('id, name, unit_number')
    .eq('is_active', true)
    .order('unit_number');

  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .limit(1)
    .single();

  return (
    <EquipmentClient
      equipment={equipment || []}
      categories={categories || []}
      stations={stations || []}
      apparatus={apparatus || []}
      departmentId={dept?.id || ''}
    />
  );
}
