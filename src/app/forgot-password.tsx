import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  async function sendCode() {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) Alert.alert('Error', error.message);
    else setStep('reset');
  }

  async function resetPassword() {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email, token: code, type: 'recovery',
    });
    if (verifyError) return Alert.alert('Wrong or expired code', verifyError.message);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Done', 'Password updated.');
  }

  const box = { borderWidth: 1, borderRadius: 8, padding: 12 };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Reset password</Text>
      {step === 'email' ? (
        <>
          <TextInput placeholder="Email" value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address" style={box} />
          <Button title="Send code" onPress={sendCode} />
        </>
      ) : (
        <>
          <TextInput placeholder="Code from email" value={code} onChangeText={setCode}
            keyboardType="number-pad" style={box} />
          <TextInput placeholder="New password" value={newPassword}
            onChangeText={setNewPassword} secureTextEntry style={box} />
          <Button title="Update password" onPress={resetPassword} />
        </>
      )}
      <Button title="Back to login" onPress={() => router.replace('/login')} />
    </View>
  );
}