import { createClient } from '@/lib/supabase/server';
import { AnnouncementsClient } from '@/components/AnnouncementsClient';

export default async function AnnouncementsPage() {
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

  const { data: announcements } = await supabase
    .from('announcements')
    .select(`
      *,
      author:users!posted_by_user_id(id, first_name, last_name)
    `)
    .eq('department_id', departmentId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  // Get first user for creating announcements (MVP without auth)
  const { data: firstUser } = await supabase
    .from('users')
    .select('id')
    .eq('department_id', departmentId)
    .limit(1)
    .single();

  return (
    <AnnouncementsClient
      announcements={announcements || []}
      departmentId={departmentId}
      defaultUserId={firstUser?.id || ''}
    />
  );
}
