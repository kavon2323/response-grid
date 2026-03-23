import { createClient } from '@/lib/supabase/server';
import { AnnouncementsClient } from '@/components/AnnouncementsClient';

export default async function AnnouncementsPage() {
  const supabase = createClient();

  const { data: announcements } = await supabase
    .from('announcements')
    .select(`
      *,
      author:users(id, first_name, last_name)
    `)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .limit(1)
    .single();

  return (
    <AnnouncementsClient
      announcements={announcements || []}
      departmentId={dept?.id || ''}
    />
  );
}
