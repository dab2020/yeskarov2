import { Button, Field, Page, type } from '@/components/ui-kit';
import { colors, fonts, radii, spacing } from '@/constants/yeskaro-theme';
import { useApp } from '@/context/app-context';
import { Role } from '@/types/domain';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const { loginAs, loginWithPassword, signUp } = useApp(); const [mode, setMode] = useState<'login' | 'signup'>('login'); const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const enter = (nextRole: Role) => { loginAs(nextRole); router.replace(nextRole === 'admin' ? '/admin' : '/dashboard'); };
  const submit = async () => { setBusy(true); setError(''); try { if (mode === 'signup') await signUp(name, email, password, role); else await loginWithPassword(email, password); router.replace('/dashboard'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not continue.'); } finally { setBusy(false); } };
  return (
    <Page>
      <View style={styles.screen}>
        <Pressable onPress={() => setMode('login')} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.logo}>
          yes<Text style={styles.logoBold}>Karo.</Text>
        </Text>
        <Text style={type.h1}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={type.body}>
          {mode === 'login' ? 'Sign in with your yesKaro username and password.' : 'Start protecting project payments and milestones.'}
        </Text>
        {mode === 'signup' ? (
          <>
            <View style={styles.roles}>
              {(['buyer', 'seller'] as const).map((item) => (
                <Pressable key={item} onPress={() => setRole(item)} style={[styles.role, role === item && styles.roleActive]}>
                  <Text style={[styles.roleText, role === item && styles.roleTextActive]}>{item === 'buyer' ? 'I’m hiring' : 'I’m working'}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Full name" value={name} onChangeText={setName} placeholder="Your legal name" />
          </>
        ) : null}
        <Field label={mode === 'login' ? 'Username or email' : 'Email'} value={email} onChangeText={setEmail} placeholder={mode === 'login' ? '@username' : 'you@example.com'} autoCapitalize="none" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
        {mode === 'login' ? (
          <Pressable>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.demo}>
          <Text style={styles.demoLabel}>Preview as</Text>
          {(['buyer', 'seller', 'admin'] as Role[]).map((item) => (
            <Pressable key={item} onPress={() => enter(item)}>
              <Text style={styles.demoLink}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.spacer} />
        <Button label={busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} disabled={busy || !email || !password || (mode === 'signup' && !name)} onPress={submit} />
        <Button label={mode === 'login' ? 'Create account' : 'Back to sign in'} variant="secondary" onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} />
      </View>
    </Page>
  );
}
const styles = StyleSheet.create({
  screen: { width: '100%', maxWidth: 420, minHeight: 756, alignSelf: 'center', gap: spacing.lg }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginLeft: -13 }, backText: { color: colors.ink, fontFamily: fonts.regular, fontSize: 27 }, logo: { color: colors.brand, fontFamily: fonts.medium, fontSize: 21 }, logoBold: { fontFamily: fonts.extraBold }, forgot: { color: colors.brand, fontFamily: fonts.medium, fontSize: 11.5 }, error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 11 }, roles: { flexDirection: 'row', gap: 8 }, role: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 10, alignItems: 'center' }, roleActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand }, roleText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 11 }, roleTextActive: { color: colors.brand }, demo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, backgroundColor: colors.surfaceSubtle, borderRadius: 12 }, demoLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10 }, demoLink: { color: colors.brand, fontFamily: fonts.semibold, fontSize: 10, textTransform: 'capitalize' }, spacer: { flex: 1, minHeight: 28 },
});
