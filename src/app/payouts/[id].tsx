import { useCallback, useState } from 'react';
import { Alert, Button, FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

type Member = { id: number; name: string; payout_position: number };
type Circle = { monthly_amount: number; total_months: number };
type Payout = { month_number: number; member_id: number; is_paid_out: boolean };

export default function Payouts() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const circleId = Number(id);
  const router = useRouter();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  const load = useCallback(async () => {
    const [c, m, p] = await Promise.all([
      supabase.from('circles').select('monthly_amount,total_months').eq('id', circleId).single(),
      supabase.from('members').select('id,name,payout_position').eq('circle_id', circleId).order('payout_position'),
      supabase.from('payouts').select('month_number,member_id,is_paid_out').eq('circle_id', circleId),
    ]);
    if (c.error || m.error || p.error) {
      return Alert.alert('Could not load', (c.error || m.error || p.error)!.message);
    }
    setCircle(c.data);
    setMembers(m.data ?? []);
    setPayouts(p.data ?? []);
  }, [circleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!circle) return <Text style={{ padding: 60 }}>Loading...</Text>;

  const months = Array.from({ length: circle.total_months }, (_, i) => i + 1);
  const payoutOf = (month: number) => payouts.find((p) => p.month_number === month);
  const received = new Set(payouts.map((p) => p.member_id));
  const eligible = members.filter((m) => !received.has(m.id));
  const nextMonth = months.find((m) => !payoutOf(m));
  const nameOf = (memberId: number) => members.find((m) => m.id === memberId)?.name ?? '?';

  function confirmDraw(month: number) {
    Alert.alert(
      month === 1 ? 'Assign month 1?' : `Draw month ${month}?`,
      month === 1
        ? 'Month 1 goes to the first member (the organizer).'
        : `${eligible.length} member(s) are still eligible. This cannot be undone here.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Go', onPress: () => draw(month) }]
    );
  }

  async function draw(month: number) {
    const pick =
      month === 1
        ? members.find((m) => m.payout_position === 1)
        : eligible[Math.floor(Math.random() * eligible.length)];
    if (!pick) return Alert.alert('No one available', 'Add members first.');

    const { error } = await supabase.from('payouts').insert({
      circle_id: circleId,
      member_id: pick.id,
      month_number: month,
      is_paid_out: false,
    });
    if (error) return Alert.alert('Could not save', error.message);
    Alert.alert(`Month ${month}`, `${pick.name} receives this month's pot.`);
    load();
  }

  async function toggleGiven(p: Payout) {
    const next = !p.is_paid_out;
    setPayouts((old) => old.map((x) => (x.month_number === p.month_number ? { ...x, is_paid_out: next } : x)));
    const { error } = await supabase
      .from('payouts')
      .update({ is_paid_out: next, paid_out_on: next ? new Date().toISOString().slice(0, 10) : null })
      .eq('circle_id', circleId)
      .eq('month_number', p.month_number);
    if (error) {
      Alert.alert('Could not save', error.message);
      load();
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 60, gap: 12 }}>
      <Button title="← Back" onPress={() => router.back()} />
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Payout schedule</Text>
      <Text>Pot each month: Rs {circle.monthly_amount * members.length}</Text>
      <Text>Still waiting: {eligible.length ? eligible.map((m) => m.name).join(', ') : 'nobody'}</Text>

      <FlatList
        data={months}
        keyExtractor={(m) => String(m)}
        renderItem={({ item: month }) => {
          const p = payoutOf(month);
          return (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 }}>
              <Text style={{ fontSize: 16 }}>
                Month {month} · {p ? nameOf(p.member_id) : 'not drawn yet'}
              </Text>
              {p ? (
                <Pressable onPress={() => toggleGiven(p)}>
                  <Text style={{ fontSize: 16 }}>{p.is_paid_out ? '✅ Given' : '⬜ Pending'}</Text>
                </Pressable>
              ) : month === nextMonth ? (
                <Button title={month === 1 ? 'Assign' : 'Draw'} onPress={() => confirmDraw(month)} />
              ) : (
                <Text style={{ color: '#888' }}>Waiting</Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}