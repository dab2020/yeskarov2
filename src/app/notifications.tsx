import { BackButton, Page, type } from '@/components/ui-kit';
import { colors, fonts, radii, spacing } from '@/constants/yeskaro-theme';
import { useApp } from '@/context/app-context';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Notifications() {
  const { notifications } = useApp(); const [filter, setFilter] = useState('All');
  const rows = notifications.map((item, index) => ({ title: index === 0 ? 'Review deliverable' : index === 1 ? 'Escrow funded' : 'Dispute update', body: item, time: index === 0 ? '12h 18m remaining' : index === 1 ? '2h ago' : 'Yesterday', urgent: index === 0 }));
  return <Page><BackButton /><Text style={type.h1}>Notifications</Text><View style={styles.filters}>{['All', 'Action Required', 'Updates'].map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</View>{rows.map((item, index) => <View key={index} style={[styles.card, item.urgent && styles.urgent]}><Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.body}</Text><Text style={[styles.time, item.urgent && styles.timeUrgent]}>{item.time}</Text></View>)}</Page>;
}
const styles = StyleSheet.create({
  filters: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.surface }, filter: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill }, filterActive: { backgroundColor: colors.brand }, filterText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 9.5 }, filterTextActive: { color: colors.white }, card: { minHeight: 100, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, gap: 4 }, urgent: { backgroundColor: colors.warningSoft }, title: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 12.5 }, body: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10.5, lineHeight: 17 }, time: { color: colors.tertiary, fontFamily: fonts.medium, fontSize: 9.5 }, timeUrgent: { color: colors.warning },
});
