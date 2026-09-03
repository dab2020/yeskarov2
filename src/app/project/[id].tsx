import { BackButton, Button, Card, Field, Money, Page, ProgressBar, StatusPill, type } from '@/components/ui-kit';
import { colors, radii, spacing } from '@/constants/yeskaro-theme';
import { useApp } from '@/context/app-context';
import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, user } = useApp(); const { width } = useWindowDimensions();
  const project = projects.find((item) => item.id === id);
  const [selectedId, setSelectedId] = useState(project?.milestones[0]?.id);
  const [bankSaved, setBankSaved] = useState(false);
  if (!project || !user) return <Page><Text style={type.h2}>Project not found</Text></Page>;
  const selected = project.milestones.find((item) => item.id === selectedId) ?? project.milestones[0];
  const released = project.milestones.filter((m) => m.status === 'paid').reduce((sum, m) => sum + m.amount, 0);
  const tablet = width >= 600;
  return <Page><BackButton /><View style={styles.header}><View style={{ flex: 1 }}><StatusPill value={project.status} /><Text style={type.h1}>{project.title}</Text><Text style={type.body}>{project.description}</Text></View><Money amount={project.totalAmount} currency={project.currency} large /></View>
    <View style={[styles.ledger, tablet && styles.row]}><Card style={styles.ledgerCard}><Text style={type.small}>Escrowed</Text><Money amount={project.totalAmount} /></Card><Card style={styles.ledgerCard}><Text style={type.small}>Released</Text><Money amount={released} /></Card><Card style={styles.ledgerCard}><Text style={type.small}>Remaining</Text><Money amount={project.totalAmount - released} /></Card></View><ProgressBar value={project.totalAmount ? released / project.totalAmount * 100 : 0} />
    {user.role === 'seller' && !bankSaved && <Card style={styles.bankCard}><View style={{ flex: 1 }}><Text style={type.h3}>Add payout details</Text><Text style={type.small}>Required before accepting this milestone plan. Demo fields only—no bank connection.</Text></View><Field label="Bank" placeholder="Meezan Bank" /><Field label="Account title" placeholder="Faraz" /><Field label="IBAN / account number" placeholder="PK00 BANK …" /><Button label="Save & accept plan" onPress={() => setBankSaved(true)} /></Card>}
    <View style={[styles.panes, tablet && styles.row]}><View style={[styles.list, tablet && styles.listPane]}><Text style={type.h2}>Milestones</Text>{project.milestones.map((milestone) => <Pressable key={milestone.id} onPress={() => setSelectedId(milestone.id)} style={[styles.milestone, selected?.id === milestone.id && styles.milestoneActive]}><View style={styles.order}><Text style={styles.orderText}>{milestone.order + 1}</Text></View><View style={{ flex: 1 }}><Text style={styles.milestoneTitle}>{milestone.title}</Text><Text style={type.small}>Due {milestone.dueDate || 'to be agreed'}</Text></View><View style={styles.right}><Money amount={milestone.amount} /><StatusPill value={milestone.status} /></View></Pressable>)}</View>
      {selected && <Card style={[styles.detail, tablet && styles.detailPane]}><StatusPill value={selected.status} /><Text style={type.h2}>{selected.title}</Text><Text style={type.body}>{selected.description}</Text><View style={styles.rule} /><Text style={type.eyebrow}>Deliverable</Text><Text style={type.body}>{selected.submission || 'No submission yet.'}</Text><Money amount={selected.amount} large /><Link href={`/milestone/${selected.id}`} asChild><Pressable><Text style={styles.open}>Open milestone actions →</Text></Pressable></Link></Card>}
    </View>
    <Card><Text style={type.h3}>Agreement terms</Text><Text style={type.body}>{project.scope}</Text><View style={styles.termGrid}><View style={{ flex: 1 }}><Text style={type.eyebrow}>Deliverables</Text>{project.deliverables.map((item) => <Text key={item} style={styles.term}>✓ {item}</Text>)}</View><View style={{ flex: 1 }}><Text style={type.eyebrow}>Not included</Text>{project.exclusions.map((item) => <Text key={item} style={styles.term}>— {item}</Text>)}</View></View></Card>
  </Page>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.lg }, ledger: { gap: spacing.md }, row: { flexDirection: 'row' }, ledgerCard: { flex: 1, minWidth: 150 }, panes: { gap: spacing.lg, alignItems: 'flex-start' }, list: { gap: spacing.md, flex: 1 }, listPane: { flex: 1.2 }, detail: { width: '100%' }, detailPane: { flex: 0.8, position: 'sticky' as never, top: spacing.lg }, milestone: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, milestoneActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft }, order: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, orderText: { color: colors.brand, fontWeight: '900' }, milestoneTitle: { color: colors.ink, fontWeight: '800', fontSize: 16 }, right: { alignItems: 'flex-end', gap: spacing.xs }, rule: { height: 1, backgroundColor: colors.border }, open: { color: colors.brand, fontWeight: '800' }, termGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl }, term: { color: colors.ink, lineHeight: 26 }, bankCard: { backgroundColor: colors.warningSoft },
});
