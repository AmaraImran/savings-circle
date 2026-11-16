import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ChangePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function updatePassword() {
    if (!password || !confirmPassword) {
      Alert.alert('Missing details', 'Please enter both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both entries match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Could not update password', error.message);
      return;
    }

    Alert.alert('Success', 'Your password has been updated.');
    router.replace('/');
  }

  const box = { borderWidth: 1, borderRadius: 8, padding: 12 };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Change password</Text>
      <TextInput
        placeholder="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={box}
      />
      <TextInput
        placeholder="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={box}
      />
      <Button title={loading ? 'Updating...' : 'Update password'} onPress={updatePassword} disabled={loading} />
      <Button title="Back" onPress={() => router.back()} />
    </View>
  );
}
