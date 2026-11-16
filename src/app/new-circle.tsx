import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function NewCircle() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [totalMonths, setTotalMonths] = useState('');
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function createCircle() {
    if (!name.trim() || !monthlyAmount || !totalMonths || !startDate) {
      Alert.alert('Missing details', 'Please fill in all fields.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('circles').insert({
      name: name.trim(),
      monthly_amount: Number(monthlyAmount),
      total_months: Number(totalMonths),
      start_date: startDate,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Could not create circle', error.message);
      return;
    }

    Alert.alert('Success', 'Circle created successfully.');
    router.replace('/');
  }

  const box = { borderWidth: 1, borderRadius: 8, padding: 12 };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Create circle</Text>
      <TextInput placeholder="Circle name" value={name} onChangeText={setName} style={box} />
      <TextInput
        placeholder="Monthly amount"
        value={monthlyAmount}
        onChangeText={setMonthlyAmount}
        keyboardType="numeric"
        style={box}
      />
      <TextInput
        placeholder="Total months"
        value={totalMonths}
        onChangeText={setTotalMonths}
        keyboardType="numeric"
        style={box}
      />
      <TextInput placeholder="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} style={box} />
      <Button title={loading ? 'Creating...' : 'Create circle'} onPress={createCircle} disabled={loading} />
      <Button title="Cancel" onPress={() => router.back()} />
    </View>
  );
}
