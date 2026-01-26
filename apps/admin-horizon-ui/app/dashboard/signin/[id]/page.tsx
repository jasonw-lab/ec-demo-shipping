import DefaultAuth from '@/components/auth';
import AuthUI from '@/components/auth/AuthUI';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod
} from '@/utils/auth-helpers/settings';

export default async function SignIn({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ disable_button: boolean }>;
}) {
  const { allowOauth, allowEmail, allowPassword } = getAuthTypes();
  const viewTypes = getViewTypes();
  const redirectMethod = getRedirectMethod();

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Declare 'viewProp' and initialize with the default value
  let viewProp: string;

  // Assign url id to 'viewProp' if it's a valid string and ViewTypes includes it
  if (typeof resolvedParams.id === 'string' && viewTypes.includes(resolvedParams.id)) {
    viewProp = resolvedParams.id;
  } else {
    const cookieStore = await cookies();
    const preferredSignInView =
      cookieStore.get('preferredSignInView')?.value || null;
    viewProp = getDefaultSignInView(preferredSignInView);
    return redirect(`/dashboard/signin/${viewProp}`);
  }

  // Check if the user is already logged in and redirect to the account page if so
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && viewProp !== 'update_password') {
    return redirect('/dashboard/main');
  } else if (!user && viewProp === 'update_password') {
    return redirect('/dashboard/signin');
  }

  return (
    <DefaultAuth viewProp={viewProp}>
      <div>
        <AuthUI
          viewProp={viewProp}
          user={user}
          allowPassword={allowPassword}
          allowEmail={allowEmail}
          redirectMethod={redirectMethod}
          disableButton={resolvedSearchParams.disable_button}
          allowOauth={allowOauth}
        />
      </div>
    </DefaultAuth>
  );
}
