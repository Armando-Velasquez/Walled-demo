import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radii, shadow } from './theme';
import type { AppScreen, Asset } from './types';

export function Screen({ children, scroll = false, style }: PropsWithChildren<{ scroll?: boolean; style?: ViewStyle }>) {
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [entrance]);
  const animatedStyle = {
    opacity: entrance,
    transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };
  const content = <Animated.View style={[styles.screenContent, style, animatedStyle]}>{children}</Animated.View>;
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {scroll ? <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{content}</ScrollView> : content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type DialogTone = 'success' | 'error' | 'info';
type DialogState = { title: string; message: string; tone?: DialogTone; confirmLabel?: string; onConfirm?: () => void } | null;

export function WalletDialog({ state, close }: { state: DialogState; close: () => void }) {
  const scale = useRef(new Animated.Value(0.88)).current;
  useEffect(() => {
    if (state) Animated.spring(scale, { toValue: 1, damping: 16, stiffness: 180, useNativeDriver: true }).start();
    else scale.setValue(0.88);
  }, [scale, state]);
  if (!state) return null;
  const icon = state.tone === 'success' ? 'checkmark-circle' : state.tone === 'error' ? 'alert-circle' : 'sparkles';
  const accent = state.tone === 'success' ? colors.success : state.tone === 'error' ? colors.danger : '#8B82FF';
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={close}>
      <View style={styles.dialogBackdrop}>
        <Animated.View style={[styles.dialogCard, { transform: [{ scale }] }]}>
          <View style={[styles.dialogIcon, { backgroundColor: `${accent}22` }]}><Ionicons name={icon} size={34} color={accent} /></View>
          <Text style={styles.dialogTitle}>{state.title}</Text>
          <Text style={styles.dialogMessage}>{state.message}</Text>
          <GradientButton label={state.confirmLabel || 'Entendido'} onPress={() => { close(); state.onConfirm?.(); }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

export function useWalletDialog() {
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const showDialog = useCallback((state: NonNullable<DialogState>) => setDialogState(state), []);
  const dialog = <WalletDialog state={dialogState} close={() => setDialogState(null)} />;
  return { showDialog, dialog };
}

export function GradientButton({ label, onPress, disabled, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (value: number) => Animated.spring(scale, { toValue: value, speed: 28, bounciness: 5, useNativeDriver: true }).start();
  return (
    <Animated.View style={[styles.buttonWrap, { transform: [{ scale }] }, disabled && { opacity: 0.6 }]}>
      <Pressable onPress={onPress} disabled={disabled} onPressIn={() => animate(0.97)} onPressOut={() => animate(1)}>
        <LinearGradient colors={['#F27BFF', '#7072FF', '#43C8FF']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.gradientButton}>
          <Text style={styles.buttonText}>{label}</Text>
          {icon ? <Ionicons name={icon} size={20} color="#09101B" /> : null}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.outlineButton}><Text style={styles.outlineText}>{label}</Text></Pressable>;
}

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      {onBack ? <Pressable onPress={onBack} hitSlop={14}><Ionicons name="chevron-back" color={colors.text} size={27} /></Pressable> : <View style={styles.headerSide} />}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSide}>{right}</View>
    </View>
  );
}

export function LogoMark({ size = 78 }: { size?: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.035, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);
  return (
    <Animated.View style={{ width: size, height: size, borderRadius: size * 0.28, transform: [{ scale: pulse }] }}>
      <LinearGradient colors={['#52D8FF', '#8B63FF', '#F17BFF']} style={[styles.logoOuter, { flex: 1, borderRadius: size * 0.28 }]}> 
        <View style={[styles.logoInner, { borderRadius: size * 0.25 }]}> 
          <Ionicons name="wallet" size={size * 0.5} color="#B8A2FF" />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export function CoinIcon({ asset, size = 43 }: { asset: Pick<Asset, 'symbol' | 'color'>; size?: number }) {
  return <View style={[styles.coin, { backgroundColor: asset.color, width: size, height: size, borderRadius: size / 2 }]}><Text style={[styles.coinText, { fontSize: size * 0.38 }]}>{asset.symbol.slice(0, 1)}</Text></View>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Loading() {
  return <Screen style={styles.center}><LogoMark /><ActivityIndicator color={colors.primaryBlue} size="large" /><Text style={styles.loadingText}>Preparando tu billetera...</Text></Screen>;
}

const tabs: Array<{ key: AppScreen; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'home', label: 'Inicio', icon: 'home-outline' },
  { key: 'explore', label: 'Explorar', icon: 'search-outline' },
  { key: 'swap', label: 'Wallet', icon: 'wallet-outline' },
  { key: 'activity', label: 'Actividad', icon: 'list-outline' },
  { key: 'profile', label: 'Perfil', icon: 'person-outline' },
];

export function BottomNav({ active, navigate }: { active: AppScreen; navigate: (screen: AppScreen) => void }) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const selected = active === tab.key || (tab.key === 'swap' && ['send', 'receive', 'asset', 'buy'].includes(active));
        return (
          <Pressable key={tab.key} onPress={() => navigate(tab.key)} style={styles.tab}>
            {tab.key === 'swap' ? (
              <LinearGradient colors={['#F27BFF', '#7072FF', '#43C8FF']} style={styles.mainTab}><Ionicons name={tab.icon} size={25} color="#0A0E16" /></LinearGradient>
            ) : <Ionicons name={tab.icon} size={22} color={selected ? '#8582FF' : colors.muted} />}
            <Text style={[styles.tabLabel, selected && { color: '#8582FF' }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const commonStyles = StyleSheet.create({
  title: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 14, marginBottom: 9 },
  input: { minHeight: 62, borderRadius: radii.medium, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 16, fontSize: 17 },
  row: { flexDirection: 'row', alignItems: 'center' },
  spacer: { flex: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  screenContent: { flex: 1, paddingHorizontal: 22, paddingBottom: 18 },
  scroll: { flexGrow: 1, paddingBottom: 150 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 22 },
  buttonWrap: { borderRadius: radii.medium, overflow: 'hidden', ...shadow },
  gradientButton: { minHeight: 58, borderRadius: radii.medium, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 22 },
  buttonText: { color: '#0A0E16', fontSize: 17, fontWeight: '800' },
  outlineButton: { minHeight: 58, borderRadius: radii.medium, borderWidth: 1, borderColor: '#4B5362', alignItems: 'center', justifyContent: 'center' },
  outlineText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  headerSide: { width: 28, alignItems: 'flex-end' },
  logoOuter: { padding: 2, ...shadow },
  logoInner: { flex: 1, backgroundColor: '#0B0E17', alignItems: 'center', justifyContent: 'center' },
  coin: { alignItems: 'center', justifyContent: 'center' },
  coinText: { color: '#FFF', fontWeight: '900' },
  card: { backgroundColor: colors.surface, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, padding: 16 },
  loadingText: { color: colors.muted, fontSize: 16 },
  bottomNav: { height: 74, backgroundColor: '#0A101A', borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6, paddingBottom: 5 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { color: colors.muted, fontSize: 10.5 },
  mainTab: { width: 56, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: -20, ...shadow },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(2,4,10,.78)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialogCard: { width: '100%', maxWidth: 420, borderRadius: 28, backgroundColor: '#111722', borderWidth: 1, borderColor: '#30394A', padding: 24, ...shadow },
  dialogIcon: { width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  dialogTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 9 },
  dialogMessage: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 22 },
});
