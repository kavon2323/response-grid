import { createClient } from '@/lib/supabase/server';
import { CertificationsClient } from '@/components/CertificationsClient';

export default async function CertificationsPage() {
  const supabase = createClient();

  const now = new Date();

  // Fetch all certifications with related data
  const { data: certifications } = await supabase
    .from('certifications')
    .select(`
      *,
      user:users(id, first_name, last_name)
    `)
    .order('expiration_date', { ascending: true });

  // Fetch members for filtering and adding
  const { data: members } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .eq('is_active', true)
    .order('last_name');

  // Fetch department
  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .limit(1)
    .single();

  // Count expiring certifications (next 90 days)
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const expiringCount = certifications?.filter((c) => {
    if (!c.expiration_date) return false;
    const expDate = new Date(c.expiration_date);
    return expDate >= now && expDate <= ninetyDaysFromNow;
  }).length || 0;

  // Count expired certifications
  const expiredCount = certifications?.filter((c) => {
    if (!c.expiration_date) return false;
    return new Date(c.expiration_date) < now;
  }).length || 0;

  return (
    <CertificationsClient
      certifications={certifications || []}
      members={members || []}
      departmentId={dept?.id || ''}
      expiringCount={expiringCount}
      expiredCount={expiredCount}
    />
  );
}
