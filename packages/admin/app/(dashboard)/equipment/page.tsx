import { createClient } from '@/lib/supabase/server';
import { EquipmentClient } from '@/components/EquipmentClient';

export default async function EquipmentPage() {
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

  const { data: equipment } = await supabase
    .from('equipment')
    .select(`
      *,
      category:equipment_categories(id, name),
      station:stations(id, name),
      apparatus:apparatus(id, name, unit_number)
    `)
    .eq('department_id', departmentId)
    .order('name', { ascending: true });

  const { data: categories } = await supabase
    .from('equipment_categories')
    .select('id, name')
    .eq('department_id', departmentId)
    .order('name');

  const { data: stations } = await supabase
    .from('stations')
    .select('id, name')
    .eq('department_id', departmentId)
    .order('name');

  const { data: apparatus } = await supabase
    .from('apparatus')
    .select('id, name, unit_number')
    .eq('department_id', departmentId)
    .eq('is_active', true)
    .order('unit_number');

  return (
    <EquipmentClient
      equipment={equipment || []}
      categories={categories || []}
      stations={stations || []}
      apparatus={apparatus || []}
      departmentId={departmentId}
    />
  );
}
