import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Home() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <Text>Logged in as {email}</Text>
      <Button title="Log out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}