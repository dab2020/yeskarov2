import { BackButton, Button, Card, Field, Money, Page, ProgressBar, type } from '@/components/ui-kit';
import { colors, radii, spacing } from '@/constants/yeskaro-theme';
import { useApp } from '@/context/app-context';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { structureTerms, transcribeAudio } from '@/lib/api';
import { Milestone, Project } from '@/types/domain';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

const steps = ['Project', 'Terms', 'Milestones', 'Funding'];
const sampleTranscript = 'I need a bilingual ecommerce website with product catalogue, checkout and responsive design by 30 October. Budget is 200,000 rupees. Hosting and product photography are not included.';

export default function NewProject() {
  const { addProject, user } = useApp();
  const { width } = useWindowDimensions();
  const recorder = useVoiceRecorder();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [sellerEmail, setSellerEmail] = useState('');
  const [language, setLanguage] = useState<'ur' | 'en'>('ur'); const [transcript, setTranscript] = useState('');
  const [scope, setScope] = useState(''); const [deliverables, setDeliverables] = useState(''); const [exclusions, setExclusions] = useState(''); const [deadline, setDeadline] = useState(''); const [total, setTotal] = useState('');
  const [milestones, setMilestones] = useState<Array<{ title: string; percent: number }>>([]); const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState<'transcribing' | 'structuring' | null>(null); const [error, setError] = useState('');
  const totalNumber = Number(total.replaceAll(',', '')) || 0;
  const percentTotal = milestones.reduce((sum, item) => sum + item.percent, 0);

  const recordAction = async () => {
    setError('');
    if (!recorder.isRecording) { await recorder.start().catch(() => undefined); return; }
    const audio = await recorder.stop();
    if (!audio) return;
    setBusy('transcribing');
    try { const result = await transcribeAudio(audio, language); setTranscript(result.transcript); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Transcription failed. You can type or paste the terms below.'); }
    finally { setBusy(null); }
  };

  const structure = async () => {
    if (!transcript.trim()) { setError('Add a transcript or written terms first.'); return; }
    setBusy('structuring'); setError('');
    try {
      const result = await structureTerms(transcript);
      setScope(result.scope); setDeliverables(result.deliverables.join('\n')); setExclusions(result.exclusions.join('\n')); setDeadline(result.deadline ?? ''); setTotal(String(result.totalAmount ?? ''));
    } catch {
      setScope(transcript); setDeliverables('Responsive application\nSource files and handover'); setExclusions('Third-party fees'); setDeadline('2026-10-30'); setTotal('200000');
      setError('Worker is offline, so editable demo suggestions were loaded. Start `pnpm worker:dev` for live AI structuring.');
    } finally { setBusy(null); }
  };

  const suggestMilestones = () => setMilestones([
    { title: 'Discovery & direction', percent: 20 }, { title: 'Core implementation', percent: 50 }, { title: 'QA & handover', percent: 30 },
  ]);
  const pickFunding = async () => { const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true }); if (!result.canceled) setFileName(result.assets[0].name); };
  const canContinue = step === 0 ? Boolean(title && sellerEmail) : step === 1 ? Boolean(scope && totalNumber) : step === 2 ? Boolean(milestones.length && percentTotal === 100) : Boolean(fileName);
  const create = () => {
    if (!user) return;
    const id = `prj_${Date.now()}`;
    const projectMilestones: Milestone[] = milestones.map((item, index) => ({ id: `ms_${Date.now()}_${index}`, projectId: id, title: item.title, description: item.title, amount: Math.round(totalNumber * item.percent / 100), dueDate: deadline, status: 'pending', order: index }));
    const project: Project = { id, buyerId: user.id, sellerEmail, title, description, totalAmount: totalNumber, currency: 'PKR', status: 'pending_admin_approval', scope, deliverables: deliverables.split('\n').filter(Boolean), exclusions: exclusions.split('\n').filter(Boolean), deadline, milestones: projectMilestones };
    addProject(project); router.replace(`/project/${id}`);
  };

  const content = useMemo(() => {
    if (step === 0) return <Card><Text style={type.h2}>Start with the basics</Text><Text style={type.body}>Tell us who you’re working with. The seller adds payout details after accepting.</Text><Field label="Project name" value={title} onChangeText={setTitle} placeholder="e.g. Ecommerce website" /><Field label="Short description" value={description} onChangeText={setDescription} multiline placeholder="What are you building?" /><Field label="Seller email" value={sellerEmail} onChangeText={setSellerEmail} keyboardType="email-address" autoCapitalize="none" placeholder="seller@example.com" /></Card>;
    if (step === 1) return <View style={styles.stack}><Card><Text style={type.h2}>Describe the agreement</Text><Text style={type.body}>Speak in Urdu or English, or type instead. Your recording goes only to the yesKaro Worker, which privately transcribes it through Groq.</Text><View style={styles.languageRow}>{(['ur', 'en'] as const).map((value) => <Pressable key={value} onPress={() => setLanguage(value)} style={[styles.language, language === value && styles.languageActive]}><Text style={language === value ? styles.languageTextActive : styles.languageText}>{value === 'ur' ? 'Urdu' : 'English'}</Text></Pressable>)}</View>
        <View style={[styles.recorder, recorder.isRecording && styles.recorderActive]}><View style={[styles.pulse, recorder.isRecording && styles.pulseActive]} /><View style={{ flex: 1 }}><Text style={styles.recorderTitle}>{recorder.isRecording ? 'Recording project terms…' : busy === 'transcribing' ? 'Transcribing…' : 'Voice terms'}</Text><Text style={type.small}>{recorder.isRecording ? `${formatTime(recorder.seconds)} / 02:00` : 'Maximum 2 minutes • tap when ready'}</Text></View><Button label={recorder.isRecording ? 'Stop' : 'Record'} variant={recorder.isRecording ? 'danger' : 'secondary'} compact onPress={recordAction} disabled={Boolean(busy)} /></View>
        <ProgressBar value={recorder.seconds / recorder.maxSeconds * 100} /><Button label="Load sample transcript" variant="ghost" compact onPress={() => setTranscript(sampleTranscript)} />
        <Field label="Transcript or written terms" value={transcript} onChangeText={setTranscript} multiline placeholder="Your transcript will appear here. Review and edit it before continuing." /><Button label={busy === 'structuring' ? 'Structuring terms…' : 'Structure with AI'} onPress={structure} disabled={Boolean(busy)} />{(error || recorder.error) && <Text style={styles.error}>{error || recorder.error}</Text>}</Card>
      <Card><Text style={type.h3}>Review structured terms</Text><Field label="Scope" value={scope} onChangeText={setScope} multiline /><Field label="Deliverables (one per line)" value={deliverables} onChangeText={setDeliverables} multiline /><Field label="Exclusions (one per line)" value={exclusions} onChangeText={setExclusions} multiline /><View style={[styles.split, width >= 650 && styles.splitWide]}><View style={{ flex: 1 }}><DeadlinePicker value={deadline} onChange={setDeadline} /></View><View style={{ flex: 1 }}><Field label="Total amount (PKR)" value={total} onChangeText={setTotal} keyboardType="numeric" /></View></View></Card></View>;
    if (step === 2) return <Card><Text style={type.h2}>Plan the milestones</Text><Text style={type.body}>Amounts must add up to the total escrow amount.</Text><View style={styles.total}><Text style={type.small}>Agreement total</Text><Money amount={totalNumber} large /></View><Button label="✨ Suggest milestones" variant="secondary" onPress={suggestMilestones} />{milestones.map((item, index) => <View style={styles.milestone} key={`${item.title}_${index}`}><Text style={styles.order}>{index + 1}</Text><View style={{ flex: 1 }}><Field label="Milestone" value={item.title} onChangeText={(value) => setMilestones((current) => current.map((m, i) => i === index ? { ...m, title: value } : m))} /></View><View style={styles.percent}><Field label="Percent" value={String(item.percent)} keyboardType="numeric" onChangeText={(value) => setMilestones((current) => current.map((m, i) => i === index ? { ...m, percent: Number(value) || 0 } : m))} /></View></View>)}<View style={styles.sum}><Text style={type.h3}>Allocated</Text><Text style={[type.h3, percentTotal !== 100 && { color: colors.danger }]}>{percentTotal}%</Text></View>{percentTotal !== 100 && <Text style={styles.error}>Milestone percentages must total exactly 100%.</Text>}</Card>;
    return <Card><Text style={type.h2}>Fund the escrow</Text><Text style={type.body}>Transfer the agreement total to the demo escrow account, then upload your receipt. An admin will verify it manually.</Text><View style={styles.bank}><Text style={type.eyebrow}>Demo escrow account</Text><Text style={type.h3}>yesKaro Technologies</Text><Text style={styles.iban}>PK12 YESK 0000 1234 5678 9012</Text><Money amount={totalNumber} large /></View><Pressable style={styles.upload} onPress={pickFunding}><Text style={styles.uploadIcon}>{fileName ? '✓' : '↑'}</Text><Text style={type.h3}>{fileName || 'Upload transfer receipt'}</Text><Text style={type.small}>PNG, JPG or PDF • demo only</Text></Pressable><View style={styles.notice}><Text style={styles.noticeText}>This demo does not move real money. Funding is simulated after manual admin approval.</Text></View></Card>;
  }, [step, title, description, sellerEmail, language, transcript, scope, deliverables, exclusions, deadline, total, milestones, fileName, recorder.isRecording, recorder.seconds, recorder.error, busy, error, width, totalNumber, percentTotal]);

  return <Page><BackButton /><View><Text style={type.eyebrow}>Step {step + 1} of 4</Text><Text style={type.h1}>Create escrow agreement</Text></View><View style={styles.steps}>{steps.map((item, index) => <View key={item} style={styles.stepWrap}><View style={[styles.stepDot, index <= step && styles.stepDotActive]}><Text style={[styles.stepNumber, index <= step && styles.stepNumberActive]}>{index + 1}</Text></View><Text style={[type.small, index === step && styles.stepLabelActive]}>{item}</Text></View>)}</View>{content}<View style={styles.actions}>{step > 0 && <Button label="Back" variant="secondary" onPress={() => setStep((value) => value - 1)} />}<Button label={step === 3 ? 'Submit for approval' : 'Continue'} disabled={!canContinue} onPress={() => step === 3 ? create() : setStep((value) => value + 1)} /></View></Page>;
}

function formatTime(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }

function DeadlinePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = parseDate(value);
  const today = startOfDay(new Date());
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date((selected ?? today).getFullYear(), (selected ?? today).getMonth(), 1));
  const firstOffset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => index - firstOffset + 1);
  const openCalendar = () => {
    const initial = selected ?? today;
    setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
    setOpen(true);
  };

  return <>
    <View style={styles.dateField}>
      <Text style={styles.dateLabel}>Deadline</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Select project deadline" onPress={openCalendar} style={styles.dateInput}>
        <Text style={value ? styles.dateValue : styles.datePlaceholder}>{selected ? selected.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select a date'}</Text>
        <Text style={styles.calendarIcon}>▣</Text>
      </Pressable>
    </View>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
      <Pressable style={styles.calendarOverlay} onPress={() => setOpen(false)}>
        <Pressable style={styles.calendarPanel} onPress={(event) => event.stopPropagation()}>
          <View style={styles.calendarHeader}>
            <Pressable accessibilityLabel="Previous month" onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} style={styles.monthButton}><Text style={styles.monthButtonText}>‹</Text></Pressable>
            <Text style={styles.monthTitle}>{month.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}</Text>
            <Pressable accessibilityLabel="Next month" onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} style={styles.monthButton}><Text style={styles.monthButtonText}>›</Text></Pressable>
          </View>
          <View style={styles.calendarGrid}>
            {weekdays.map((day, index) => <View key={`${day}_${index}`} style={styles.calendarCell}><Text style={styles.weekday}>{day}</Text></View>)}
            {cells.map((day, index) => {
              if (day < 1 || day > daysInMonth) return <View key={`empty_${index}`} style={styles.calendarCell} />;
              const date = new Date(month.getFullYear(), month.getMonth(), day);
              const key = dateKey(date);
              const disabled = date < today;
              const isSelected = key === value;
              const isToday = key === dateKey(today);
              return <View key={key} style={styles.calendarCell}><Pressable disabled={disabled} accessibilityLabel={date.toDateString()} onPress={() => { onChange(key); setOpen(false); }} style={[styles.dayButton, isToday && styles.dayToday, isSelected && styles.daySelected]}><Text style={[styles.dayText, disabled && styles.dayDisabledText, isSelected && styles.daySelectedText]}>{day}</Text></Pressable></View>;
            })}
          </View>
          <Button label="Cancel" variant="secondary" compact onPress={() => setOpen(false)} />
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  stack: { gap: spacing.lg }, steps: { flexDirection: 'row', gap: spacing.sm }, stepWrap: { flex: 1, gap: spacing.xs, alignItems: 'center' }, stepDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }, stepDotActive: { backgroundColor: colors.brand }, stepNumber: { color: colors.muted, fontWeight: '800' }, stepNumberActive: { color: colors.white }, stepLabelActive: { color: colors.brand, fontWeight: '800' }, languageRow: { flexDirection: 'row', gap: spacing.sm }, language: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border }, languageActive: { backgroundColor: colors.brand, borderColor: colors.brand }, languageText: { color: colors.muted, fontWeight: '700' }, languageTextActive: { color: colors.white, fontWeight: '800' }, recorder: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md }, recorderActive: { borderColor: colors.danger, backgroundColor: colors.dangerSoft }, pulse: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.border }, pulseActive: { backgroundColor: colors.danger, transform: [{ scale: 1.12 }] }, recorderTitle: { color: colors.ink, fontWeight: '800' }, split: { gap: spacing.md }, splitWide: { flexDirection: 'row' }, error: { color: colors.danger, fontSize: 13, lineHeight: 19 }, total: { backgroundColor: colors.brandSoft, padding: spacing.lg, borderRadius: radii.md }, milestone: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, order: { color: colors.brand, fontWeight: '900', fontSize: 18 }, percent: { width: 100 }, sum: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }, bank: { backgroundColor: colors.brandSoft, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.sm }, iban: { color: colors.ink, fontSize: 17, letterSpacing: 1.2, fontWeight: '700' }, upload: { minHeight: 170, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.brand, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg }, uploadIcon: { color: colors.brand, fontSize: 30, fontWeight: '800' }, notice: { backgroundColor: colors.warningSoft, borderRadius: radii.md, padding: spacing.md }, noticeText: { color: colors.warning, lineHeight: 20, fontSize: 13, fontWeight: '600' }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  dateField: { gap: 6 }, dateLabel: { color: colors.muted, fontFamily: 'Poppins_500Medium', fontSize: 12 }, dateInput: { minHeight: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, dateValue: { color: colors.ink, fontFamily: 'Poppins_400Regular', fontSize: 13.5 }, datePlaceholder: { color: colors.muted, fontFamily: 'Poppins_400Regular', fontSize: 13.5 }, calendarIcon: { color: colors.brand, fontSize: 16 }, calendarOverlay: { flex: 1, backgroundColor: 'rgba(33,27,31,0.42)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg }, calendarPanel: { width: '100%', maxWidth: 360, borderRadius: radii.lg, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }, calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, monthButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft }, monthButtonText: { color: colors.brand, fontSize: 25, fontFamily: 'Poppins_500Medium' }, monthTitle: { color: colors.ink, fontFamily: 'Poppins_600SemiBold', fontSize: 16 }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, calendarCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }, weekday: { color: colors.muted, fontFamily: 'Poppins_500Medium', fontSize: 11 }, dayButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, dayToday: { borderWidth: 1, borderColor: colors.brand }, daySelected: { backgroundColor: colors.brand, borderColor: colors.brand }, dayText: { color: colors.ink, fontFamily: 'Poppins_400Regular', fontSize: 12 }, dayDisabledText: { color: colors.border }, daySelectedText: { color: colors.white, fontFamily: 'Poppins_600SemiBold' },
});
