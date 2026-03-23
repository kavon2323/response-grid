import { createClient } from '@/lib/supabase/server';
import { CalendarClient } from '@/components/CalendarClient';

export default async function CalendarPage() {
  const supabase = createClient();

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('start_time', { ascending: true });

  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .limit(1)
    .single();

  return (
    <CalendarClient
      events={events || []}
      departmentId={dept?.id || ''}
    />
  );
}
