import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [entrance]);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const animatedStyle = {
    opacity: entrance,
    transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };
  const content = <Animated.View style={[styles.screenContent, style, animatedStyle]}>{children}</Animated.View>;
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {scroll ? <ScrollView contentContainerStyle={[styles.scroll, keyboardVisible && styles.scrollWithKeyboard]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" overScrollMode="never">{content}</ScrollView> : content}
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
        <LinearGradient colors={['#397DFF', '#2866E8']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.gradientButton}>
          <Text style={styles.buttonText}>{label}</Text>
          {icon ? <Ionicons name={icon} size={20} color="#FFFFFF" /> : null}
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
  return (
    <View style={[styles.logoMark, { width: size, height: size, borderRadius: size * 0.28 }]}> 
      <View style={[styles.logoWallet, { width: size * 0.58, height: size * 0.42, borderRadius: size * 0.12 }]}> 
        <View style={[styles.logoFold, { left: size * 0.08, right: size * 0.08, top: size * 0.105, height: Math.max(2, size * 0.035) }]} />
        <View style={[styles.logoPocket, { width: size * 0.25, height: size * 0.18, borderRadius: size * 0.07, right: -size * 0.035, top: size * 0.12 }]}>
          <View style={[styles.logoDot, { width: size * 0.045, height: size * 0.045, borderRadius: size * 0.023 }]} />
        </View>
      </View>
    </View>
  );
}

const coinImages: Record<string, number> = {
  BTC: require('../assets/coins/btc.png'),
  ETH: require('../assets/coins/eth.png'),
  SOL: require('../assets/coins/sol.png'),
  USDT: require('../assets/coins/usdt.png'),
  MATIC: require('../assets/coins/matic.png'),
};

export function CoinIcon({ asset, size = 43 }: { asset: Pick<Asset, 'symbol' | 'color'>; size?: number }) {
  const source = coinImages[asset.symbol.toUpperCase()];
  return (
    <View style={[styles.coin, { backgroundColor: source ? '#111A27' : asset.color, width: size, height: size, borderRadius: size / 2 }]}>
      {source ? <Image source={source} style={{ width: size, height: size }} resizeMode="contain" /> : <Text style={[styles.coinText, { fontSize: size * 0.38 }]}>{asset.symbol.slice(0, 1)}</Text>}
    </View>
  );
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
            <View style={[styles.tabIconBox, selected && styles.tabIconBoxActive]}>
              <Ionicons name={selected ? tab.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap : tab.icon} size={21} color={selected ? '#70AAFF' : colors.muted} />
            </View>
            <Text style={[styles.tabLabel, selected && { color: '#70AAFF' }]}>{tab.label}</Text>
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
  scroll: { flexGrow: 1, paddingBottom: 18 },
  scrollWithKeyboard: { paddingBottom: 170 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 22 },
  buttonWrap: { borderRadius: radii.medium, overflow: 'hidden', ...shadow },
  gradientButton: { minHeight: 58, borderRadius: radii.medium, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 22 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  outlineButton: { minHeight: 58, borderRadius: radii.medium, borderWidth: 1, borderColor: '#4B5362', alignItems: 'center', justifyContent: 'center' },
  outlineText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  headerSide: { width: 28, alignItems: 'flex-end' },
  logoOuter: { padding: 2, ...shadow },
  logoInner: { flex: 1, backgroundColor: '#0B0E17', alignItems: 'center', justifyContent: 'center' },
  logoMark: { backgroundColor: '#0E1B2C', borderWidth: 1, borderColor: '#29466B', alignItems: 'center', justifyContent: 'center' },
  logoWallet: { backgroundColor: '#397DFF', justifyContent: 'center' },
  logoFold: { position: 'absolute', borderRadius: 4, backgroundColor: 'rgba(255,255,255,.72)' },
  logoPocket: { position: 'absolute', backgroundColor: '#0A1524', borderWidth: 1, borderColor: 'rgba(255,255,255,.75)', alignItems: 'center', justifyContent: 'center' },
  logoDot: { backgroundColor: '#FFFFFF' },
  coin: { alignItems: 'center', justifyContent: 'center' },
  coinText: { color: '#FFF', fontWeight: '900' },
  card: { backgroundColor: colors.surface, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, padding: 16 },
  loadingText: { color: colors.muted, fontSize: 16 },
  bottomNav: { height: 72, backgroundColor: '#0A111B', borderTopWidth: 1, borderTopColor: '#1E2A3A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6, paddingBottom: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { color: colors.muted, fontSize: 10.5 },
  tabIconBox: { width: 38, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabIconBoxActive: { backgroundColor: 'rgba(56,124,255,.15)' },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(2,4,10,.78)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialogCard: { width: '100%', maxWidth: 420, borderRadius: 28, backgroundColor: '#111722', borderWidth: 1, borderColor: '#30394A', padding: 24, ...shadow },
  dialogIcon: { width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  dialogTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 9 },
  dialogMessage: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 22 },
});
