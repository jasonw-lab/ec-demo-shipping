import Main from '@/components/dashboard/main';
// TODO: Re-enable authentication after testing
// import { redirect } from 'next/navigation';
// import { getUserDetails, getUser } from '@/utils/supabase/queries';
// import { createClient } from '@/utils/supabase/server';

// TODO: Re-enable authentication after testing - mock user for development
const mockUser = {
  id: 'mock-user-id',
  email: 'dev@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
} as any;

const mockUserDetails = {
  full_name: 'Dev User',
  avatar_url: null
};

export default async function Account() {
  // TODO: Re-enable authentication after testing
  // const supabase = await createClient();
  // const [user, userDetails] = await Promise.all([
  //   getUser(supabase),
  //   getUserDetails(supabase)
  // ]);
  // if (!user) {
  //   return redirect('/dashboard/signin');
  // }
  // return <Main user={user} userDetails={userDetails} />;

  return <Main user={mockUser} userDetails={mockUserDetails} />;
}
