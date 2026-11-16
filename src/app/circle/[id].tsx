import { useCallback, useState } from 'react';
import { Alert, Button, FlatList, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

type Member = { id: number; name: string; phone: string | null; payout_position: number };

export default function CircleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const circleId = Number(id);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  async function load() {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('circle_id', circleId)
      .order('payout_position');
    if (error) Alert.alert('Could not load members', error.message);
    else setMembers(data ?? []);
  }

  useFocusEffect(useCallback(() => { load(); }, [circleId]));

  async function addMember() {
    if (!name.trim()) return Alert.alert('Name required');
    const { error } = await supabase.from('members').insert({
      circle_id: circleId,
      name: name.trim(),
      phone: phone.trim() || null,
      payout_position: members.length + 1,
    });
    if (error) return Alert.alert('Could not add', error.message);
    setName('');
    setPhone('');
    load();
  }

  const box = { borderWidth: 1, borderRadius: 8, padding: 12 };

  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 60, gap: 12 }}>
      <Button title="← Back" onPress={() => router.back()} />
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Members</Text>

      <FlatList
        data={members}
        keyExtractor={(m) => String(m.id)}
        ListEmptyComponent={<Text>No members yet. Add the first one below.</Text>}
        renderItem={({ item }) => (
          <Text style={{ paddingVertical: 6 }}>
            {item.payout_position}. {item.name} {item.phone ? `· ${item.phone}` : ''}
          </Text>
        )}
      />

      <TextInput placeholder="Member name" value={name} onChangeText={setName} style={box} />
      <TextInput placeholder="Phone (optional)" value={phone} onChangeText={setPhone}
        keyboardType="phone-pad" style={box} />
      <Button title="Add member" onPress={addMember} />
    </View>
  );
}