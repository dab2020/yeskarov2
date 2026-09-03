import { AppHeader } from '@/components/app-chrome';
import { Button, Money, Page, type } from '@/components/ui-kit';
import { colors, fonts, radii, spacing } from '@/constants/yeskaro-theme';
import { useApp } from '@/context/app-context';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

export default function Dashboard() {
  const { user, projects } = useApp(); const { width } = useWindowDimensions();
  if (!user) { router.replace('/'); return null; } if (user.role === 'admin') { router.replace('/admin'); return null; }
  const paid = projects.flatMap((p) => p.milestones).filter((m) => m.status === 'paid').reduce((sum, m) => sum + m.amount, 0);
  const submitted = projects.flatMap((project) => project.milestones.map((milestone) => ({ milestone, project }))).find(({ milestone }) => milestone.status === 'submitted');
  const firstName = user.name.split(' ')[0];
  return <Page><AppHeader title={`Good evening, ${firstName}`} subtitle="Friday, 3 September" />
    <View style={styles.pageHeading}><Text style={type.h2}>Today</Text><Text style={styles.counter}>1 / 3</Text></View>
    <View style={[styles.balance, width >= 720 && styles.balanceWide]}><Text style={styles.label}>Available</Text><Money amount={paid || 27450} large /><Text style={styles.helper}>Settled money you can use or withdraw</Text><View style={styles.balanceActions}><View style={styles.actionFill}><Button label="Add Money" compact onPress={() => router.push('/wallet')} /></View><View style={styles.actionFill}><Button label="Withdraw" variant="ghost" compact onPress={() => router.push('/wallet')} /></View></View></View>
    <Text style={type.h3}>Needs your attention</Text>
    {submitted ? <Pressable onPress={() => router.push(`/milestone/${submitted.milestone.id}`)} style={styles.attention}><Text style={styles.cardTitle}>{submitted.project.title}</Text><Text style={styles.cardStatus}>{submitted.milestone.title} submitted</Text><Text style={styles.helper}>PKR {submitted.milestone.amount.toLocaleString()} • 47h 32m remaining</Text><Text style={styles.review}>Review deliverable  →</Text></Pressable> : <View style={styles.attention}><Text style={styles.cardTitle}>You’re all caught up</Text><Text style={styles.helper}>No agreements need action right now.</Text></View>}
    <Text style={styles.footnote}>Only items that need your action appear here.</Text>
    <View style={styles.spacer} /><View style={styles.markers}><View style={styles.markerActive} /><Pressable onPress={() => router.push('/escrows')} style={styles.marker} /><Pressable onPress={() => router.push('/wallet')} style={styles.marker} /></View>
  </Page>;
}
const styles = StyleSheet.create({
  pageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, counter: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12 }, balance: { backgroundColor: colors.brandSoft, borderRadius: 17, padding: 16, gap: 6 }, balanceWide: { maxWidth: 600 }, label: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12 }, helper: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 18 }, balanceActions: { flexDirection: 'row', gap: 10, marginTop: 2 }, actionFill: { flex: 1 }, attention: { borderWidth: 1, borderColor: colors.border, borderRadius: 17, paddingHorizontal: 17, paddingVertical: 15, gap: 7, maxWidth: 650 }, cardTitle: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 14.5 }, cardStatus: { color: colors.brand, fontFamily: fonts.medium, fontSize: 12.5 }, review: { color: colors.brand, fontFamily: fonts.semibold, fontSize: 11.5, textAlign: 'right' }, footnote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11.5 }, spacer: { flexGrow: 1, minHeight: 70 }, markers: { flexDirection: 'row', justifyContent: 'center', gap: 6 }, marker: { width: 17, height: 3, borderRadius: 2, backgroundColor: '#80647A' }, markerActive: { width: 31, height: 3, borderRadius: 2, backgroundColor: colors.brand },
});
