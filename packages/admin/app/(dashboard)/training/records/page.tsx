import { createClient } from '@/lib/supabase/server';
import { TrainingRecordsClient } from '@/components/TrainingRecordsClient';

export default async function TrainingRecordsPage() {
  const supabase = createClient();

  // Fetch all training records with related data
  const { data: records } = await supabase
    .from('training_records')
    .select(`
      *,
      user:users(id, first_name, last_name),
      course:training_courses(id, name)
    `)
    .order('training_date', { ascending: false });

  // Fetch members for filtering
  const { data: members } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .eq('is_active', true)
    .order('last_name');

  // Fetch training courses
  const { data: courses } = await supabase
    .from('training_courses')
    .select('id, name')
    .order('name');

  // Fetch department
  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .limit(1)
    .single();

  return (
    <TrainingRecordsClient
      records={records || []}
      members={members || []}
      courses={courses || []}
      departmentId={dept?.id || ''}
    />
  );
}
