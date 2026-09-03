import { colors, fonts, radii, spacing } from '@/constants/yeskaro-theme';
import { useApp } from '@/context/app-context';
import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const icons = {
  home: require('../../assets/figma/home.svg'),
  homeDefault: require('../../assets/figma/home-default.svg'),
  escrows: require('../../assets/figma/escrows-active.svg'),
  escrowsDefault: require('../../assets/figma/escrows.svg'),
  create: require('../../assets/figma/create.svg'),
  wallet: require('../../assets/figma/wallet-active.svg'),
  walletDefault: require('../../assets/figma/wallet.svg'),
  notification: require('../../assets/figma/notification.svg'),
  avatar: require('../../assets/figma/avatar-ring.svg'),
};

export function AppHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { user } = useApp();
  const initials = user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? 'YK';
  return <View style={styles.header}><View style={styles.heading}><Text style={styles.headerTitle}>{title}</Text><Text style={styles.headerSubtitle}>{subtitle}</Text></View><View style={styles.headerActions}><Pressable accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} style={styles.action}><Image source={icons.notification} style={styles.notification} contentFit="contain" /></Pressable><Pressable accessibilityLabel="Profile" onPress={() => router.push('/profile')} style={styles.action}><Image source={icons.avatar} style={styles.avatarRing} contentFit="contain" /><Text style={styles.initials}>{initials}</Text></Pressable></View></View>;
}

export function MobileDock() {
  const path = usePathname();
  const items = [
    { path: '/dashboard', active: icons.home, inactive: icons.homeDefault, label: 'Home' },
    { path: '/escrows', active: icons.escrows, inactive: icons.escrowsDefault, label: 'Escrows' },
    { path: '/new-project', active: icons.create, inactive: icons.create, label: 'Create' },
    { path: '/wallet', active: icons.wallet, inactive: icons.walletDefault, label: 'Wallet' },
  ];
  return <View style={styles.dockOuter}><View style={styles.dock}>{items.map((item) => <Pressable key={item.path} accessibilityLabel={item.label} onPress={() => router.push(item.path as never)} style={styles.dockItem}><Image source={path === item.path ? item.active : item.inactive} style={styles.dockIcon} contentFit="contain" /></Pressable>)}</View></View>;
}

const styles = StyleSheet.create({
  header: { height: 62, flexDirection: 'row', alignItems: 'center', width: '100%' }, heading: { flex: 1, gap: 2 }, headerTitle: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 19 }, headerSubtitle: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10.5 }, headerActions: { flexDirection: 'row', gap: 8 }, action: { width: 40, height: 40, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }, notification: { width: 21, height: 21 }, avatarRing: { position: 'absolute', width: 35, height: 35 }, initials: { color: '#514A4F', fontFamily: fonts.medium, fontSize: 10 },
  dockOuter: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, paddingHorizontal: 17, paddingTop: 4, paddingBottom: 4, backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.border }, dock: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: colors.navSurface, borderRadius: 29 }, dockItem: { flex: 1, height: 65, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, outlineStyle: 'none' } as never, dockIcon: { width: 24, height: 24 },
});
