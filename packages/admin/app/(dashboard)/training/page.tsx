import { createClient } from '@/lib/supabase/server';
import { TrainingClient } from '@/components/TrainingClient';

export default async function TrainingPage() {
  const supabase = createClient();

  // Get current month start and end
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Fetch training records for this month to calculate hours
  const { data: monthlyRecords } = await supabase
    .from('training_records')
    .select('hours')
    .gte('training_date', monthStart.toISOString())
    .lte('training_date', monthEnd.toISOString());

  const totalHoursThisMonth = monthlyRecords?.reduce((sum, r) => sum + (r.hours || 0), 0) || 0;

  // Fetch upcoming training events
  const { data: upcomingEvents } = await supabase
    .from('training_events')
    .select(`
      *,
      instructor:users(id, first_name, last_name)
    `)
    .gte('event_date', now.toISOString())
    .order('event_date', { ascending: true })
    .limit(5);

  // Fetch certifications expiring in the next 90 days
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const { data: expiringCertifications } = await supabase
    .from('certifications')
    .select(`
      *,
      user:users(id, first_name, last_name)
    `)
    .lte('expiration_date', ninetyDaysFromNow.toISOString())
    .gte('expiration_date', now.toISOString())
    .order('expiration_date', { ascending: true });

  // Fetch recent training records
  const { data: recentRecords } = await supabase
    .from('training_records')
    .select(`
      *,
      user:users(id, first_name, last_name),
      course:training_courses(id, name)
    `)
    .order('training_date', { ascending: false })
    .limit(10);

  // Fetch members for dropdown
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

  // Count upcoming events
  const { count: upcomingEventsCount } = await supabase
    .from('training_events')
    .select('*', { count: 'exact', head: true })
    .gte('event_date', now.toISOString());

  return (
    <TrainingClient
      totalHoursThisMonth={totalHoursThisMonth}
      upcomingEventsCount={upcomingEventsCount || 0}
      expiringCertificationsCount={expiringCertifications?.length || 0}
      upcomingEvents={upcomingEvents || []}
      expiringCertifications={expiringCertifications || []}
      recentRecords={recentRecords || []}
      members={members || []}
      courses={courses || []}
      departmentId={dept?.id || ''}
    />
  );
}
