import { useCallback, useState } from 'react';
import { Alert, Button, FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

type Member = { id: number; name: string; payout_position: number };
type Circle = { monthly_amount: number; total_months: number };

export default function Payments() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const circleId = Number(id);
  const router = useRouter();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [paid, setPaid] = useState<Record<number, boolean>>({});
  const [receiverId, setReceiverId] = useState<number | null>(null);
  const [month, setMonth] = useState(1);

  const load = useCallback(async () => {
    const [c, m, p, r] = await Promise.all([
      supabase.from('circles').select('monthly_amount,total_months').eq('id', circleId).single(),
      supabase.from('members').select('id,name,payout_position').eq('circle_id', circleId).order('payout_position'),
      supabase.from('payments').select('member_id,is_paid').eq('circle_id', circleId).eq('month_number', month),
      supabase.from('payouts').select('member_id').eq('circle_id', circleId).eq('month_number', month).maybeSingle(),
    ]);
    if (c.error || m.error || p.error || r.error) {
      return Alert.alert('Could not load', (c.error || m.error || p.error || r.error)!.message);
    }
    setCircle(c.data);
    setMembers(m.data ?? []);
    const map: Record<number, boolean> = {};
    (p.data ?? []).forEach((row) => { map[row.member_id] = row.is_paid; });
    setPaid(map);
    setReceiverId(r.data?.member_id ?? null);
  }, [circleId, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggle(memberId: number) {
    if (!circle) return;
    const next = !paid[memberId];
    setPaid((old) => ({ ...old, [memberId]: next }));

    const { error } = await supabase.from('payments').upsert(
      {
        circle_id: circleId,
        member_id: memberId,
        month_number: month,
        amount: circle.monthly_amount,
        is_paid: next,
        paid_on: next ? new Date().toISOString().slice(0, 10) : null,
      },
      { onConflict: 'member_id,month_number' }
    );
    if (error) {
      Alert.alert('Could not save', error.message);
      load();
    }
  }

  if (!circle) return <Text style={{ padding: 60 }}>Loading...</Text>;

  const receiver = members.find((m) => m.id === receiverId);
  const paidCount = members.filter((m) => paid[m.id]).length;

  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 60, gap: 12 }}>
      <Button title="← Back" onPress={() => router.back()} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button title="‹" onPress={() => setMonth((m) => Math.max(1, m - 1))} />
        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>
          Month {month} of {circle.total_months}
        </Text>
        <Button title="›" onPress={() => setMonth((m) => Math.min(circle.total_months, m + 1))} />
      </View>

      <Text>Receives the pot: {receiver ? receiver.name : 'not drawn yet'}</Text>
      <Text>
        Collected: Rs {paidCount * circle.monthly_amount} of Rs {members.length * circle.monthly_amount}
      </Text>

      <FlatList
        data={members}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => toggle(item.id)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 }}>
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
              <Text style={{ fontSize: 16 }}>{paid[item.id] ? '✅ Paid' : '⬜ Not paid'}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}