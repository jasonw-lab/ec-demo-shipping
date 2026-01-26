// TODO: Re-enable authentication after testing
// import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
// import { createClient } from '@/utils/supabase/server';

export default async function Dashboard() {
  // TODO: Re-enable authentication after testing
  // const supabase = await createClient();
  // const [user] = await Promise.all([getUser(supabase)]);
  // if (!user) {
  //   return redirect('/dashboard/signin');
  // }
  redirect('/dashboard/main');
}
