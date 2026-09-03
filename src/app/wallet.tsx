import { AppHeader } from '@/components/app-chrome';
import { Button, Money, Page, type } from '@/components/ui-kit';
import { colors, fonts, radii, spacing } from '@/constants/yeskaro-theme';
import { useApp } from '@/context/app-context';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Wallet() {
  const { projects } = useApp(); const protectedAmount = projects.reduce((sum, p) => sum + p.totalAmount, 0);
  return <Page><AppHeader title="Wallet" subtitle="Available money and payout accounts" /><View style={styles.balance}><Text style={styles.label}>Available balance</Text><Money amount={27450} large /><Text style={styles.helper}>Settled funds you can withdraw</Text><View style={styles.actions}><View style={{ flex: 1 }}><Button label="Add Money" compact /></View><View style={{ flex: 1 }}><Button label="Withdraw" variant="secondary" compact /></View></View></View>
    <View style={styles.sectionHead}><Text style={type.h3}>Linked accounts</Text><Text style={styles.link}>Manage</Text></View><View style={styles.account}><View style={styles.bankIcon} /><View style={{ flex: 1 }}><Text style={styles.rowTitle}>HBL •••• 4821</Text><Text style={styles.helper}>Primary • Deposits & withdrawals</Text></View><Text style={styles.chevron}>›</Text></View>
    <View style={styles.sectionHead}><Text style={type.h3}>Recent movement</Text><Text style={styles.link}>View all</Text></View><View style={styles.movement}><Text style={styles.moveTitle}>Milestone released</Text><Text style={styles.income}>+ PKR 20,000</Text></View><View style={styles.movement}><Text style={styles.moveTitle}>Escrow funded</Text><Text style={styles.expense}>− PKR 18,500</Text></View>
    <Pressable style={styles.protected} onPress={() => router.push('/escrows')}><View style={styles.sectionHead}><Text style={styles.protectedTitle}>Protected in escrows</Text><Text style={styles.link}>View escrows →</Text></View><Text style={styles.helper}>In  PKR {Math.round(protectedAmount * .7).toLocaleString()}   •   Out  PKR {Math.round(protectedAmount * .3).toLocaleString()}</Text></Pressable>
  </Page>;
}
const styles = StyleSheet.create({
  balance: { backgroundColor: colors.brandSoft, borderRadius: 17, padding: 16, gap: 7 }, label: { color: colors.muted, fontFamily: fonts.medium, fontSize: 11 }, helper: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10, lineHeight: 16 }, actions: { flexDirection: 'row', gap: 10 }, sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, link: { color: colors.brand, fontFamily: fonts.medium, fontSize: 10 }, account: { minHeight: 68, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, bankIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.brandSoft }, rowTitle: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 11 }, chevron: { color: colors.tertiary, fontFamily: fonts.regular, fontSize: 18 }, movement: { flexDirection: 'row', justifyContent: 'space-between' }, moveTitle: { color: colors.ink, fontFamily: fonts.medium, fontSize: 11 }, income: { color: colors.success, fontFamily: fonts.semibold, fontSize: 10.5 }, expense: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 10.5 }, protected: { backgroundColor: colors.brandSoft, borderRadius: 14, padding: 13, gap: 8 }, protectedTitle: { color: colors.brand, fontFamily: fonts.semibold, fontSize: 11 },
});
