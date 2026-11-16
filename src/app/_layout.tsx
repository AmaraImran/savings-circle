import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
   const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
  console.log('AUTH EVENT:', event, newSession?.user?.email);
  setSession(newSession);
});
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (segments[0] === 'forgot-password') return;
    const onAuthScreen = segments[0] === 'login' || segments[0] === 'signup';
    if (!session && !onAuthScreen) router.replace('/login');
    else if (session && onAuthScreen) router.replace('/');
  }, [session, ready, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}