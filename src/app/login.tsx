import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Button, Platform, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Login failed', error.message);
    setLoading(false);
  }
  async function signInWithGoogle() {
  setGoogleLoading(true);
  if (Platform.OS === 'web') {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  return;
}
  try {
    const redirectTo = Linking.createURL('/');
    console.log('Redirect URL:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) {
      Alert.alert('Error', error?.message ?? 'No URL');
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    console.log('RESULT:', result);
    if (result.type !== 'success') return;

    const code = new URL(result.url).searchParams.get('code');
    if (code) {
      const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
      if (codeError) Alert.alert('Login failed', codeError.message);
      return;
    }

    const params = new URLSearchParams(result.url.split('#')[1]);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  } finally {
    setGoogleLoading(false);
  }
}

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Savings Circle</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address"
        style={{ borderWidth: 1, borderRadius: 8, padding: 12 }} />
      <TextInput placeholder="Password" value={password}
        onChangeText={setPassword} secureTextEntry
        style={{ borderWidth: 1, borderRadius: 8, padding: 12 }} />
      <Button title={loading ? 'Please wait...' : 'Log in'} onPress={signIn} disabled={loading} />
      <Link href="/signup">No account? Sign up</Link>
      <Link href="/forgot-password">Forgot password?</Link>
      <Button
        title={googleLoading ? 'Connecting...' : 'Continue with Google'}
        onPress={signInWithGoogle}
        disabled={googleLoading || loading}
      />
    </View>
  );
}