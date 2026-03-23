import { createClient } from '@/lib/supabase/server';
import { CalendarClient } from '@/components/CalendarClient';

export default async function CalendarPage() {
  const supabase = createClient();

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
      </div>
    );
  }

  const { data: events } = await supabase
    .from('department_events')
    .select('*')
    .eq('department_id', departmentId)
    .order('start_time', { ascending: true });

  // Get first user for creating events (MVP without auth)
  const { data: firstUser } = await supabase
    .from('users')
    .select('id')
    .eq('department_id', departmentId)
    .limit(1)
    .single();

  return (
    <CalendarClient
      events={events || []}
      departmentId={departmentId}
      defaultUserId={firstUser?.id || ''}
    />
  );
}
