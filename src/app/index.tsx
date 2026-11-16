import { useCallback, useState } from 'react';
import { Alert, Button, FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Circle = {
  id: number;
  name: string;
  monthly_amount: number;
  total_months: number;
  start_date: string;
};

export default function Home() {
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const { data, error } = await supabase
          .from('circles')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) Alert.alert('Could not load circles', error.message);
        else setCircles(data ?? []);
        setLoading(false);
      }
      load();
    }, [])
  );

  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 60, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>My circles</Text>

      <FlatList
        data={circles}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text>{loading ? 'Loading...' : 'No circles yet. Create your first one.'}</Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/circle/${item.id}`)}>
            <View style={{ borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>{item.name}</Text>
              <Text>Rs {item.monthly_amount} / month · {item.total_months} months</Text>
              <Text>Starts {item.start_date}</Text>
            </View>
          </Pressable>
        )}
      />

      <Button title="New circle" onPress={() => router.push('/new-circle')} />
      <Button title="Change password" onPress={() => router.push('/change-password')} />
      <Button title="Log out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}