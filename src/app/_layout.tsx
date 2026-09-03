import '@/global.css';
import { AppProvider, useApp } from '@/context/app-context';
import { colors } from '@/constants/yeskaro-theme';
import { Link, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_800ExtraBold, useFonts } from '@expo-google-fonts/poppins';
import { MobileDock } from '@/components/app-chrome';
import { fonts } from '@/constants/yeskaro-theme';

function AppShell() {
  const { user } = useApp();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const desktop = width >= 1024;
  useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_800ExtraBold });
  const hasDock = Boolean(user && !desktop && ['/dashboard', '/escrows', '/wallet'].includes(pathname));
  const nav = user?.role === 'admin'
    ? [['Overview', '/admin'], ['Notifications', '/notifications'], ['Profile', '/profile']]
    : [['Home', '/dashboard'], ['Escrows', '/escrows'], ['Create escrow', '/new-project'], ['Wallet', '/wallet'], ['Notifications', '/notifications'], ['Profile', '/profile']];

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <StatusBar style="dark" />
    <View style={styles.shell}>
      {desktop && user && <View style={styles.sidebar}>
        <Link href="/dashboard" asChild><Pressable><Text style={styles.logo}>yes<Text style={styles.logoAccent}>Karo</Text></Text></Pressable></Link>
        <View style={styles.nav}>{nav.map(([label, href]) => <Link href={href as never} asChild key={href}>
          <Pressable style={StyleSheet.flatten([styles.navItem, pathname === href && styles.navItemActive])}><Text style={[styles.navText, pathname === href && styles.navTextActive]}>{label}</Text></Pressable>
        </Link>)}</View>
        <View style={styles.identity}><View style={styles.avatar}><Text style={styles.avatarText}>{user.name[0]}</Text></View><View><Text style={styles.identityName}>{user.name}</Text><Text style={styles.identityRole}>{user.role}</Text></View></View>
      </View>}
      <View style={[styles.content, hasDock && styles.contentDock]}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ title: 'Projects' }} />
        <Stack.Screen name="escrows" options={{ title: 'Escrows' }} />
        <Stack.Screen name="wallet" options={{ title: 'Wallet' }} />
        <Stack.Screen name="new-project" options={{ title: 'New agreement' }} />
        <Stack.Screen name="project/[id]" options={{ title: 'Project' }} />
        <Stack.Screen name="milestone/[id]" options={{ title: 'Milestone' }} />
        <Stack.Screen name="dispute/[id]" options={{ title: 'Dispute' }} />
        <Stack.Screen name="admin" options={{ title: 'Operations' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      </Stack>{hasDock && <MobileDock />}</View>
    </View>
  </SafeAreaView>;
}

export default function RootLayout() { return <SafeAreaProvider><AppProvider><AppShell /></AppProvider></SafeAreaProvider>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas }, shell: { flex: 1, flexDirection: 'row' }, content: { flex: 1 }, contentDock: { paddingBottom: 70 },
  sidebar: { width: 248, backgroundColor: colors.surface, borderRightWidth: 1, borderRightColor: colors.border, paddingHorizontal: 20, paddingVertical: 28 },
  logo: { color: colors.brand, fontSize: 26, fontFamily: fonts.medium, letterSpacing: -1 }, logoAccent: { color: colors.brand, fontFamily: fonts.extraBold }, nav: { marginTop: 42, gap: 5, flex: 1 },
  navItem: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 }, navItemActive: { backgroundColor: colors.brandSoft }, navText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13 }, navTextActive: { color: colors.brand },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 18 }, avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.white, fontFamily: fonts.semibold }, identityName: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 13 }, identityRole: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textTransform: 'capitalize' },
});
