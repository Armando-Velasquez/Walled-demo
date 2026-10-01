import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, type PropsWithChildren, type ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
      {scroll ? <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
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
  screenContent: { flex: 1, paddingHorizontal: 22, paddingBottom: 18 },
  scroll: { flexGrow: 1 },
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
});
