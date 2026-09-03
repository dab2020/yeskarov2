import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, useWindowDimensions, View, ViewStyle } from 'react-native';
import { colors, fontSizes, fonts, radii, shadows, spacing } from '@/constants/yeskaro-theme';
import { router } from 'expo-router';

export function ResponsiveContainer({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { width } = useWindowDimensions();
  return <View style={[styles.container, width >= 1024 && styles.containerDesktop, style]}>{children}</View>;
}

export function Page({ children, noScroll = false }: PropsWithChildren<{ noScroll?: boolean }>) {
  const content = <ResponsiveContainer style={styles.page}>{children}</ResponsiveContainer>;
  return noScroll ? <View style={styles.scroll}>{content}</View> : <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>{content}</ScrollView>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) { return <View style={[styles.card, style]}>{children}</View>; }

export function Button({ label, onPress, variant = 'primary', disabled, compact }: { label: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; disabled?: boolean; compact?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, styles[`button_${variant}`], compact && styles.buttonCompact, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, variant !== 'primary' && styles[`buttonText_${variant}`]]}>{label}</Text>
  </Pressable>;
}

export function Field({ label, multiline, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor={colors.muted} multiline={multiline} style={[styles.input, multiline && styles.multiline]} {...props} /></View>;
}

export function StatusPill({ value }: { value: string }) {
  const positive = ['paid', 'funded', 'approved', 'resolved', 'completed'].includes(value);
  const caution = ['pending', 'pending_admin_approval', 'pending_admin_payout', 'submitted', 'awaiting_admin'].includes(value);
  return <View style={[styles.pill, positive ? styles.pillSuccess : caution ? styles.pillWarning : styles.pillNeutral]}><Text style={[styles.pillText, positive ? styles.pillTextSuccess : caution ? styles.pillTextWarning : undefined]}>{value.replaceAll('_', ' ')}</Text></View>;
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) { return <View style={styles.sectionHeader}><Text style={styles.h2}>{title}</Text>{action}</View>; }
export function Money({ amount, currency = 'PKR', large }: { amount: number; currency?: string; large?: boolean }) { return <Text style={large ? styles.moneyLarge : styles.money}>{currency} {amount.toLocaleString()}</Text>; }
export function ProgressBar({ value }: { value: number }) { return <View style={styles.track}><View style={[styles.progress, { width: `${Math.min(100, Math.max(0, value))}%` }]} /></View>; }
export function EmptyState({ title, body }: { title: string; body: string }) { return <Card style={styles.empty}><Text style={styles.h3}>{title}</Text><Text style={styles.body}>{body}</Text></Card>; }
export function BackButton() { return <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>; }

export const type = StyleSheet.create({
  eyebrow: { color: colors.brand, fontSize: fontSizes.xs, fontFamily: fonts.medium },
  hero: { color: colors.ink, fontSize: fontSizes.hero, fontFamily: fonts.semibold, letterSpacing: -0.8, lineHeight: 40 },
  h1: { color: colors.ink, fontSize: fontSizes.xxl, fontFamily: fonts.semibold, letterSpacing: -0.35, lineHeight: 34 },
  h2: { color: colors.ink, fontSize: fontSizes.xl, fontFamily: fonts.semibold, letterSpacing: -0.2, lineHeight: 29 },
  h3: { color: colors.ink, fontSize: fontSizes.lg, fontFamily: fonts.semibold, lineHeight: 24 },
  body: { color: colors.muted, fontSize: fontSizes.md, fontFamily: fonts.regular, lineHeight: 21 },
  small: { color: colors.muted, fontSize: fontSizes.sm, fontFamily: fonts.regular, lineHeight: 18 },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.canvas }, scrollContent: { flexGrow: 1 },
  container: { width: '100%', maxWidth: 1160, alignSelf: 'center' }, containerDesktop: { paddingHorizontal: spacing.xl }, page: { paddingHorizontal: 19, paddingTop: spacing.xxl, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md, ...(shadows ?? {}) },
  button: { minHeight: 48, borderRadius: radii.md, backgroundColor: colors.brand, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  button_primary: { backgroundColor: colors.brand }, button_secondary: { backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: '#D6C5F5' }, button_ghost: { backgroundColor: 'transparent' }, button_danger: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: '#F4C8CF' },
  buttonText: { color: colors.white, fontSize: fontSizes.md, fontFamily: fonts.semibold }, buttonText_secondary: { color: colors.brand }, buttonText_ghost: { color: colors.brand }, buttonText_danger: { color: colors.danger },
  buttonCompact: { minHeight: 38, paddingHorizontal: spacing.md }, pressed: { opacity: 0.78 }, disabled: { opacity: 0.45 },
  field: { gap: 6 }, label: { color: colors.muted, fontFamily: fonts.medium, fontSize: fontSizes.sm }, input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md, color: colors.ink, fontSize: fontSizes.md, fontFamily: fonts.regular }, multiline: { minHeight: 112, paddingTop: spacing.md, textAlignVertical: 'top' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill }, pillNeutral: { backgroundColor: colors.surfaceSubtle }, pillSuccess: { backgroundColor: colors.successSoft }, pillWarning: { backgroundColor: colors.warningSoft }, pillText: { color: colors.brand, fontSize: fontSizes.xs, fontFamily: fonts.medium, textTransform: 'capitalize' }, pillTextSuccess: { color: colors.success }, pillTextWarning: { color: colors.warning },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }, h2: type.h2,
  money: { color: colors.ink, fontSize: fontSizes.md, fontFamily: fonts.semibold }, moneyLarge: { color: colors.ink, fontSize: fontSizes.xxl, fontFamily: fonts.semibold, letterSpacing: -0.4 },
  track: { height: 5, backgroundColor: colors.surfaceSubtle, borderRadius: radii.pill, overflow: 'hidden' }, progress: { height: '100%', backgroundColor: colors.brand, borderRadius: radii.pill },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl }, h3: type.h3, body: { ...type.body, textAlign: 'center' },
  back: { width: 42, height: 42, marginLeft: -13, alignItems: 'center', justifyContent: 'center', borderRadius: 21 }, backText: { color: colors.ink, fontFamily: fonts.regular, fontSize: 27 },
});
