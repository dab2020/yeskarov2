import { BackButton, Button, Card, Field, Money, Page, StatusPill, type } from '@/components/ui-kit';
import { colors, spacing } from '@/constants/yeskaro-theme';
import { useApp } from '@/context/app-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MilestoneDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { projects, user, updateMilestone } = useApp();
  const [note, setNote] = useState(''); const milestone = projects.flatMap((p) => p.milestones).find((m) => m.id === id); const project = projects.find((p) => p.id === milestone?.projectId);
  if (!milestone || !project || !user) return <Page><Text style={type.h2}>Milestone not found</Text></Page>;
  return <Page><BackButton /><Text style={type.eyebrow}>{project.title}</Text><View style={styles.header}><View><StatusPill value={milestone.status} /><Text style={type.h1}>{milestone.title}</Text></View><Money amount={milestone.amount} large /></View><Card><Text style={type.h3}>What’s expected</Text><Text style={type.body}>{milestone.description}</Text><Text style={type.small}>Due {milestone.dueDate}</Text></Card>
    {milestone.submission && <Card><Text style={type.h3}>Seller submission</Text><Text style={type.body}>{milestone.submission}</Text></Card>}
    <Card><Text style={type.h2}>{user.role === 'seller' ? 'Submit your work' : 'Review this milestone'}</Text><Field label={user.role === 'seller' ? 'Delivery link and notes' : 'Comments'} value={note} onChangeText={setNote} multiline placeholder={user.role === 'seller' ? 'Add a link and explain what is ready…' : 'Add useful review feedback…'} />
      <View style={styles.actions}>{user.role === 'seller' ? <Button label="Submit for review" onPress={() => updateMilestone(id, 'submitted', note)} /> : <><Button label="Request changes" variant="secondary" onPress={() => updateMilestone(id, 'changes_requested', note)} /><Button label="Approve & request payout" onPress={() => updateMilestone(id, 'approved', note)} /></>}<Button label="Raise dispute" variant="danger" onPress={() => router.push(`/dispute/${id}`)} /></View>
      {user.role === 'buyer' && <Text style={styles.notice}>Approval creates a payout request for admin review. No money moves automatically in this demo.</Text>}
    </Card></Page>;
}
const styles = StyleSheet.create({ header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.lg }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, notice: { color: colors.warning, fontSize: 13, lineHeight: 20 } });
