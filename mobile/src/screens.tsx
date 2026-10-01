import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import {
  BottomNav,
  Card,
  CoinIcon,
  GradientButton,
  Header,
  LogoMark,
  OutlineButton,
  Screen,
  commonStyles,
  useWalletDialog,
} from './components';
import { colors, radii, shadow } from './theme';
import type { AdminUser, AppScreen, Asset, Bootstrap, Dapp, PaymentCard, Transaction } from './types';

const money = (value: number, decimals = 2) => `$${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
const amountText = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 6 });

type Navigate = (screen: AppScreen, asset?: Asset) => void;

function AbstractBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#10164C', '#050710', '#0D1428']} style={StyleSheet.absoluteFill} />
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />
      <View style={styles.diagonalOne} />
      <View style={styles.diagonalTwo} />
    </View>
  );
}

export function SplashScreen({ next }: { next: () => void }) {
  const reveal = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(reveal, { toValue: 1, damping: 12, stiffness: 75, useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.timing(orbit, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [orbit, reveal]);
  return (
    <Screen style={styles.splash}>
      <AbstractBackdrop />
      <Animated.View style={[styles.techRing, { transform: [{ rotate: orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}><View style={styles.techRingDot} /></Animated.View>
      <Animated.View style={[styles.splashCenter, { opacity: reveal, transform: [{ scale: reveal }, { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
        <View style={styles.logoHalo}><LogoMark size={106} /></View>
        <Text style={styles.brand}>Wallet</Text>
        <Text style={styles.tagline}>Tu mundo cripto,{`\n`}en una sola app.</Text>
        <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>Protección inteligente activa</Text></View>
      </Animated.View>
      <Pressable onPress={next} style={styles.startButton}>
        <Text style={styles.startText}>Comenzar</Text>
        <Ionicons name="arrow-forward" size={21} color={colors.text} />
      </Pressable>
    </Screen>
  );
}

const onboarding = [
  {
    title: 'Control total\nde tus criptoactivos',
    body: 'Envía, recibe, intercambia y explora nuevas oportunidades, todo en un solo lugar.',
    icon: 'logo-bitcoin' as const,
    accent: '#477CFF',
  },
  {
    title: 'Seguridad\nen tus manos',
    body: 'Tus claves, tus activos. Con cifrado de nivel avanzado y control total de tu billetera.',
    icon: 'shield-checkmark' as const,
    accent: '#785CFF',
  },
  {
    title: 'Más que una billetera',
    body: 'Conecta con DeFi, explora dApps y aprovecha todo el ecosistema Web3.',
    icon: 'layers' as const,
    accent: '#C657F7',
  },
];

export function OnboardingScreen({ index, next }: { index: number; next: () => void }) {
  const { width } = useWindowDimensions();
  const pageWidth = width - 44;
  const scrollRef = useRef<ScrollView>(null);
  const [active, setActive] = useState(index);
  const orbitMotion = useRef(new Animated.Value(0)).current;
  const floatMotion = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const orbitAnimation = Animated.loop(Animated.timing(orbitMotion, { toValue: 1, duration: 8200, easing: Easing.linear, useNativeDriver: true }));
    const floatAnimation = Animated.loop(Animated.sequence([
      Animated.timing(floatMotion, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatMotion, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    orbitAnimation.start();
    floatAnimation.start();
    const timer = setInterval(() => {
      setActive((current) => {
        const target = (current + 1) % onboarding.length;
        scrollRef.current?.scrollTo({ x: target * pageWidth, animated: true });
        return target;
      });
    }, 4200);
    return () => {
      clearInterval(timer);
      orbitAnimation.stop();
      floatAnimation.stop();
    };
  }, [floatMotion, orbitMotion, pageWidth]);
  const orbitRotation = orbitMotion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const reverseOrbitRotation = orbitMotion.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const floatingCoin = {
    transform: [
      { translateY: floatMotion.interpolate({ inputRange: [0, 1], outputRange: [5, -8] }) },
      { scale: floatMotion.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.04] }) },
    ],
  };
  const finishScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => setActive(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  return (
    <Screen>
      <ScrollView ref={scrollRef} style={styles.onboardingPager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={finishScroll} scrollEventThrottle={16}>
        {onboarding.map((item, page) => <View key={item.title} style={{ width: pageWidth }}>
          <View style={styles.onboardingArt}>
            <Animated.View style={[styles.orbit, { borderColor: `${item.accent}55`, transform: [{ rotate: orbitRotation }] }]}>
              <View style={[styles.orbitNode, { backgroundColor: item.accent }]} />
              <Animated.View style={[styles.miniCoin, styles.bitcoinOrbiter, { backgroundColor: '#F7931A', transform: [{ rotate: reverseOrbitRotation }] }]}><Text style={styles.miniCoinText}>₿</Text></Animated.View>
            </Animated.View>
            <Animated.View style={[styles.innerOrbit, { borderColor: `${item.accent}35`, transform: [{ rotate: reverseOrbitRotation }] }]}>
              <Animated.View style={[styles.miniCoin, styles.ethereumOrbiter, { backgroundColor: '#627EEA', transform: [{ rotate: orbitRotation }] }]}><Text style={styles.miniCoinText}>◆</Text></Animated.View>
            </Animated.View>
            <Animated.View style={[styles.animatedArtCoin, floatingCoin]}>
              <LinearGradient colors={[item.accent, '#121936']} style={[styles.artCoin, page === active && styles.artCoinActive]}>
                <Ionicons name={item.icon} size={74} color="#E9EBFF" />
              </LinearGradient>
            </Animated.View>
          </View>
          <View style={styles.onboardingCopy}><Text style={commonStyles.title}>{item.title}</Text><Text style={[commonStyles.subtitle, { marginTop: 14 }]}>{item.body}</Text></View>
        </View>)}
      </ScrollView>
      <View style={styles.onboardingBottom}>
        <View style={styles.dots}>{onboarding.map((_, dot) => <Pressable key={dot} onPress={() => { setActive(dot); scrollRef.current?.scrollTo({ x: dot * pageWidth, animated: true }); }} style={[styles.dot, dot === active && styles.dotActive]} />)}</View>
        <Pressable onPress={() => { if (active < onboarding.length - 1) { const target = active + 1; setActive(target); scrollRef.current?.scrollTo({ x: target * pageWidth, animated: true }); } else next(); }} style={styles.nextSquare}><Ionicons name={active === onboarding.length - 1 ? 'checkmark' : 'arrow-forward'} size={27} color="#FFF" /></Pressable>
      </View>
    </Screen>
  );
}

export function WelcomeScreen({ navigate }: { navigate: Navigate }) {
  const { showDialog, dialog } = useWalletDialog();
  return (
    <Screen style={styles.welcome}>
      <AbstractBackdrop />
      <View style={styles.welcomeTop}>
        <View style={styles.welcomeOrb}><View style={styles.welcomeOrbInner}><LogoMark size={96} /></View></View>
        <Text style={[commonStyles.title, { textAlign: 'center', marginTop: 28 }]}>Bienvenido a Wallet</Text>
        <Text style={[commonStyles.subtitle, { textAlign: 'center', marginTop: 10 }]}>Crea una cuenta para guardar tu billetera o inicia sesión para continuar.</Text>
      </View>
      <View style={styles.welcomeActions}>
        <GradientButton label="Crear cuenta" onPress={() => navigate('register')} />
        <OutlineButton label="Iniciar sesión" onPress={() => navigate('login')} />
        <OutlineButton label="Importar billetera" onPress={() => showDialog({ title: 'Importación protegida', message: 'Esta función se habilitará cuando se conecte el módulo seguro de claves.', tone: 'info' })} />
      </View>
      {dialog}
    </Screen>
  );
}

export function AuthScreen({
  mode,
  navigate,
  submit,
}: {
  mode: 'login' | 'register';
  navigate: Navigate;
  submit: (values: { displayName: string; email: string; password: string; pin: string }) => Promise<'authenticated' | 'verification'>;
}) {
  const isLogin = mode === 'login';
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(isLogin && __DEV__ ? 'demo@wallet.local' : '');
  const [password, setPassword] = useState(isLogin && __DEV__ ? 'Demo1234!' : '');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const { showDialog, dialog } = useWalletDialog();
  const passwordChecks = [
    { label: '8 caracteres', ok: password.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /\d/.test(password) },
    { label: 'Un símbolo', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const run = async () => {
    try {
      setBusy(true);
      await submit({ displayName, email, password, pin });
    } catch (error) {
      showDialog({ title: isLogin ? 'No se pudo iniciar sesión' : 'No se pudo crear la cuenta', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' });
    } finally { setBusy(false); }
  };
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordStrong = passwordChecks.every((check) => check.ok);
  const disabled = busy || !emailValid || !password || (!isLogin && (!displayName.trim() || !passwordStrong || !/^\d{6}$/.test(pin)));
  return (
    <Screen scroll>
      <Header title="" onBack={() => navigate('welcome')} />
      <View style={styles.authLogo}><LogoMark size={72} /></View>
      <Text style={[commonStyles.title, { textAlign: 'center' }]}>{isLogin ? 'Iniciar sesión' : 'Crear tu cuenta'}</Text>
      <Text style={[commonStyles.subtitle, styles.authSubtitle]}>{isLogin ? 'Accede de forma segura a tu portafolio.' : 'Crea tu perfil y protege el acceso a tu wallet.'}</Text>
      <View style={styles.authForm}>
        {!isLogin ? <><Text style={commonStyles.label}>Nombre</Text><TextInput value={displayName} onChangeText={setDisplayName} style={commonStyles.input} placeholder="Tu nombre" placeholderTextColor={colors.muted} /></> : null}
        <Text style={commonStyles.label}>Correo</Text>
        <TextInput value={email} onChangeText={setEmail} style={commonStyles.input} placeholder="correo@ejemplo.com" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" />
        <Text style={commonStyles.label}>Contraseña</Text>
        <View style={styles.passwordField}><TextInput value={password} onChangeText={setPassword} style={styles.passwordInput} placeholder="Mínimo 8 caracteres" placeholderTextColor={colors.muted} secureTextEntry={!passwordVisible} autoCapitalize="none" /><Pressable onPress={() => setPasswordVisible((value) => !value)} hitSlop={12}><Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={23} color="#9892FF" /></Pressable></View>
        {!isLogin && password.length ? <View style={styles.passwordChecks}>{passwordChecks.map((check) => <View key={check.label} style={styles.passwordCheck}><Ionicons name={check.ok ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={check.ok ? colors.success : colors.muted} /><Text style={[styles.passwordCheckText, check.ok && { color: colors.success }]}>{check.label}</Text></View>)}</View> : null}
        {!isLogin ? <><Text style={commonStyles.label}>PIN de 6 dígitos</Text><TextInput value={pin} onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, 6))} style={commonStyles.input} placeholder="••••••" placeholderTextColor={colors.muted} secureTextEntry keyboardType="number-pad" /></> : null}
        <GradientButton label={busy ? (isLogin ? 'Verificando...' : 'Creando wallet...') : (isLogin ? 'Entrar' : 'Registrarme')} disabled={disabled} onPress={() => void run()} />
      </View>
      {isLogin && __DEV__ ? <Text style={styles.demoCredentials}>Credenciales locales cargadas en modo desarrollo</Text> : null}
      <Pressable onPress={() => navigate(isLogin ? 'register' : 'login')}><Text style={styles.link}>{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</Text></Pressable>
      {dialog}
    </Screen>
  );
}

export function VerifyEmailScreen({
  email,
  navigate,
  submit,
  resend,
}: {
  email: string;
  navigate: Navigate;
  submit: (code: string) => Promise<void>;
  resend: () => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const { showDialog, dialog } = useWalletDialog();
  const verify = async () => {
    try {
      setBusy(true);
      await submit(code);
    } catch (error) {
      showDialog({ title: 'No se pudo verificar', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' });
    } finally { setBusy(false); }
  };
  const resendCode = async () => {
    try {
      setResending(true);
      await resend();
      showDialog({ title: 'Código enviado', message: 'Revisa tu bandeja de entrada y la carpeta de spam.', tone: 'success' });
    } catch (error) {
      showDialog({ title: 'No se pudo reenviar', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' });
    } finally { setResending(false); }
  };
  return (
    <Screen scroll>
      <Header title="" onBack={() => navigate('login')} />
      <View style={styles.authLogo}><LogoMark size={72} /></View>
      <Text style={[commonStyles.title, { textAlign: 'center' }]}>Confirma tu correo</Text>
      <Text style={[commonStyles.subtitle, styles.authSubtitle]}>Enviamos un código de 6 dígitos a {email}.</Text>
      <View style={styles.authForm}>
        <Text style={commonStyles.label}>Código de verificación</Text>
        <TextInput
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          style={[commonStyles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
          placeholder="000000"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          autoFocus
        />
        <GradientButton label={busy ? 'Verificando...' : 'Confirmar correo'} disabled={busy || code.length !== 6} onPress={() => void verify()} />
        <OutlineButton label={resending ? 'Enviando...' : 'Reenviar código'} onPress={() => { if (!resending) void resendCode(); }} />
      </View>
      {dialog}
    </Screen>
  );
}

export function CreateWalletScreen({ navigate }: { navigate: Navigate }) {
  const items = [
    { icon: 'qr-code-outline' as const, title: 'Generar nueva frase', body: 'Crea una nueva frase de protección de 12 palabras.', color: '#626CFF' },
    { icon: 'lock-closed-outline' as const, title: 'Configurar seguridad', body: 'Establece un PIN, biometría y opciones de seguridad.', color: '#695CFF' },
    { icon: 'checkmark' as const, title: '¡Listo!', body: 'Comienza a usar tu billetera.', color: '#25D99A' },
  ];
  return (
    <Screen>
      <Header title="" onBack={() => navigate('welcome')} />
      <Text style={commonStyles.title}>Crear nueva billetera</Text>
      <Text style={[commonStyles.subtitle, { marginTop: 8, marginBottom: 22 }]}>Configura tu billetera en pocos pasos.</Text>
      <View style={styles.setupList}>
        {items.map((item) => (
          <Card key={item.title} style={styles.setupCard}>
            <View style={[styles.setupIcon, { backgroundColor: item.color }]}><Ionicons name={item.icon} size={25} color="#FFF" /></View>
            <View style={styles.flex}><Text style={styles.setupTitle}>{item.title}</Text><Text style={styles.setupBody}>{item.body}</Text></View>
          </Card>
        ))}
      </View>
      <View style={styles.bottomAction}><GradientButton label="Continuar" onPress={() => navigate('recovery')} /></View>
    </Screen>
  );
}

const recoveryWords = ['apple', 'river', 'mountain', 'glass', 'yellow', 'planet', 'note', 'summer', 'bridge', 'forest', 'table', 'random'];

export function RecoveryScreen({ navigate }: { navigate: Navigate }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <Screen>
      <Header title="" onBack={() => navigate('create')} />
      <Text style={commonStyles.title}>Tu frase de recuperación</Text>
      <Text style={[commonStyles.subtitle, { marginTop: 7 }]}>Guarda estas 12 palabras en un lugar seguro. Te permitirán recuperar tu billetera.</Text>
      <View style={styles.wordGrid}>
        {recoveryWords.map((word, index) => <View key={word} style={styles.word}><Text style={styles.wordNumber}>{index + 1}</Text><Text style={styles.wordText}>{word}</Text></View>)}
      </View>
      <Pressable onPress={() => setConfirmed((value) => !value)} style={styles.confirmRow}>
        <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>{confirmed ? <Ionicons name="checkmark" color="#08101A" size={16} /> : null}</View>
        <Text style={styles.confirmText}>He guardado mi frase en un lugar seguro</Text>
      </Pressable>
      <View style={styles.bottomAction}><GradientButton label="Continuar" disabled={!confirmed} onPress={() => navigate('pin')} /></View>
    </Screen>
  );
}

export function PinScreen({ complete, navigate }: { complete: () => void; navigate: Navigate }) {
  const [pin, setPin] = useState('');
  const tap = (number: string) => {
    const next = `${pin}${number}`.slice(0, 6);
    setPin(next);
    if (next.length === 6) setTimeout(complete, 180);
  };
  return (
    <Screen>
      <Header title="" onBack={() => navigate('recovery')} />
      <Text style={[commonStyles.title, { textAlign: 'center', marginTop: 22 }]}>Configura tu PIN</Text>
      <Text style={[commonStyles.subtitle, { textAlign: 'center', marginTop: 10 }]}>Este PIN se usará para desbloquear{`\n`}tu billetera.</Text>
      <View style={styles.pinDots}>{Array.from({ length: 6 }, (_, index) => <View key={index} style={[styles.pinDot, index < pin.length && styles.pinDotFilled]} />)}</View>
      <View style={styles.keypad}>
        {['1','2','3','4','5','6','7','8','9','', '0','back'].map((key, index) => key === '' ? <View key={`blank-${index}`} style={styles.key} /> : (
          <Pressable key={key} onPress={() => key === 'back' ? setPin((value) => value.slice(0, -1)) : tap(key)} style={({ pressed }) => [styles.key, pressed && { backgroundColor: '#202839' }]}>
            {key === 'back' ? <Ionicons name="backspace-outline" size={27} color={colors.text} /> : <Text style={styles.keyText}>{key}</Text>}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

function ActionButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.quickAction}>
      <View style={styles.quickIcon}><Ionicons name={icon} size={22} color="#72AAFF" /></View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function AssetRow({ asset, onPress }: { asset: Asset; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.assetRow}>
      <CoinIcon asset={asset} />
      <View style={styles.assetName}><Text style={styles.assetTitle}>{asset.name}</Text><Text style={styles.assetSymbol}>{amountText(asset.balance)} {asset.symbol}</Text></View>
      <View style={styles.assetValue}><Text style={styles.assetTitle}>{money(asset.valueUsd)}</Text><Text style={[styles.assetChange, { color: asset.change24h >= 0 ? colors.success : colors.danger }]}>{asset.change24h >= 0 ? '↗ +' : '↘ '}{asset.change24h.toFixed(2)}%</Text></View>
    </Pressable>
  );
}

function PortfolioChart() {
  const [width, setWidth] = useState(0);
  const values = [48, 43, 46, 38, 42, 37, 31, 35, 28, 32, 25, 21, 24, 18, 20, 14, 17, 10];
  const height = 92;
  const points = width ? values.map((value, index) => ({ x: (index / (values.length - 1)) * width, y: value })) : [];
  return (
    <View style={[styles.portfolioChart, { height }]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {[0, 1, 2].map((line) => <View key={line} style={[styles.chartGridLine, { top: 14 + line * 28 }]} />)}
      {points.slice(0, -1).map((point, index) => {
        const next = points[index + 1]!;
        const segmentWidth = Math.hypot(next.x - point.x, next.y - point.y);
        const angle = Math.atan2(next.y - point.y, next.x - point.x);
        return <View key={index} style={[styles.lineSegment, { width: segmentWidth, left: point.x, top: point.y, transform: [{ rotateZ: `${angle}rad` }] }]} />;
      })}
      {points.length ? <View style={[styles.chartLastDot, { left: points[points.length - 1]!.x - 5, top: points[points.length - 1]!.y - 4 }]} /> : null}
    </View>
  );
}

function AllocationBar({ assets }: { assets: Asset[] }) {
  const total = assets.reduce((sum, asset) => sum + asset.valueUsd, 0) || 1;
  return (
    <View>
      <View style={styles.allocationBar}>{assets.filter((asset) => asset.valueUsd > 0).map((asset) => <View key={asset.symbol} style={{ flex: asset.valueUsd / total, backgroundColor: asset.color }} />)}</View>
      <View style={styles.allocationLegend}>{assets.slice(0, 3).map((asset) => <View key={asset.symbol} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: asset.color }]} /><Text style={styles.legendText}>{asset.symbol} {Math.round((asset.valueUsd / total) * 100)}%</Text></View>)}</View>
    </View>
  );
}

export function HomeScreen({ data, navigate, offline }: { data: Bootstrap; navigate: Navigate; offline: boolean }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  return (
    <View style={styles.mainShell}>
      <Screen scroll style={styles.homeScreen}>
        <View style={styles.homeHeader}>
          <View style={styles.accountHeader}><LogoMark size={38} /><View><Text style={styles.greeting}>Hola, {data.user.displayName.split(' ')[0]}</Text><Text style={styles.walletName}>{data.wallet.name}</Text></View></View>
          <View style={styles.headerIcons}><Pressable style={styles.headerCircle}><Ionicons name="scan-outline" size={20} color={colors.text} /></Pressable><Pressable style={styles.headerCircle} onPress={() => navigate('activity')}><Ionicons name="notifications-outline" size={20} color={colors.text} /></Pressable></View>
        </View>
        {offline ? <View style={styles.offline}><Ionicons name="cloud-offline-outline" size={15} color={colors.warning} /><Text style={styles.offlineText}>Modo local: inicia la API para guardar cambios</Text></View> : null}
        <LinearGradient colors={['#14233A', '#0E1827', '#0B131F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.portfolioCard}>
          <View style={styles.balanceTop}><View><Text style={styles.balanceLabel}>BALANCE TOTAL</Text><Text style={styles.balance}>{balanceVisible ? money(data.wallet.totalUsd) : '••••••'}</Text></View><Pressable style={styles.eyeButton} onPress={() => setBalanceVisible((visible) => !visible)}><Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.muted} /></Pressable></View>
          <View style={styles.performanceRow}><View style={styles.performancePill}><Ionicons name={data.wallet.change24h >= 0 ? 'trending-up' : 'trending-down'} size={15} color={data.wallet.change24h >= 0 ? colors.success : colors.danger} /><Text style={[styles.gain, { color: data.wallet.change24h >= 0 ? colors.success : colors.danger }]}>{data.wallet.change24h >= 0 ? '+' : ''}{data.wallet.change24h.toFixed(2)}%</Text></View><Text style={styles.periodText}>últimas 24 horas</Text></View>
          <PortfolioChart />
          <View style={styles.chartFooter}><Text style={styles.chartPeriodActive}>1D</Text><Text style={styles.chartPeriod}>1S</Text><Text style={styles.chartPeriod}>1M</Text><Text style={styles.chartPeriod}>1A</Text><Text style={styles.chartPeriod}>Todo</Text></View>
        </LinearGradient>
        <View style={styles.quickRow}>
          <ActionButton icon="arrow-up" label="Enviar" onPress={() => navigate('send')} />
          <ActionButton icon="arrow-down" label="Recibir" onPress={() => navigate('receive')} />
          <ActionButton icon="swap-horizontal" label="Swap" onPress={() => navigate('swap')} />
          <ActionButton icon="card-outline" label="Comprar" onPress={() => navigate('buy')} />
        </View>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Distribución</Text><Text style={styles.sectionAction}>Portafolio</Text></View>
        <Card style={styles.allocationCard}><AllocationBar assets={data.assets} /></Card>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Tus activos</Text><Pressable onPress={() => navigate('explore')}><Text style={styles.sectionAction}>Ver mercado</Text></Pressable></View>
        <Card style={styles.assetsCard}>{data.assets.map((asset) => <AssetRow key={asset.symbol} asset={asset} onPress={() => navigate('asset', asset)} />)}</Card>
      </Screen>
      <BottomNav active="home" navigate={navigate} />
    </View>
  );
}

function FakeChart() {
  const bars = [24, 36, 26, 48, 42, 63, 52, 70, 46, 38, 59, 44, 68, 61, 76, 70, 88, 73, 66];
  return <View style={styles.chart}>{bars.map((height, index) => <View key={index} style={[styles.chartBar, { height }]} />)}</View>;
}

export function AssetScreen({ asset, navigate }: { asset: Asset; navigate: Navigate }) {
  return (
    <Screen>
      <Header title="" onBack={() => navigate('home')} right={<Ionicons name="expand-outline" size={22} color={colors.text} />} />
      <View style={styles.assetHero}><CoinIcon asset={asset} size={52} /><Text style={styles.assetHeroName}>{asset.name}</Text><Text style={styles.assetSymbol}>{asset.symbol}</Text><Text style={styles.assetPrice}>{money(asset.priceUsd)}</Text><Text style={styles.gain}>▲ +{asset.change24h.toFixed(2)}% (24h)</Text></View>
      <FakeChart />
      <View style={styles.ranges}>{['1D','1S','1M','3M','1A','TODO'].map((label, i) => <View key={label} style={i === 0 ? styles.rangeActive : undefined}><Text style={[styles.range, i === 0 && { color: '#FFF' }]}>{label}</Text></View>)}</View>
      <View style={styles.twoButtons}><View style={styles.flex}><GradientButton label="Enviar" icon="arrow-up" onPress={() => navigate('send', asset)} /></View><View style={styles.flex}><OutlineButton label="Recibir" onPress={() => navigate('receive', asset)} /></View></View>
      <Text style={[commonStyles.sectionTitle, { marginTop: 22, marginBottom: 10 }]}>Información</Text>
      <Card>{[
        ['Tu balance', `${amountText(asset.balance)} ${asset.symbol}`],
        ['Valor en USD', money(asset.valueUsd)],
        ['Precio actual', money(asset.priceUsd)],
        ['Cambio (24h)', `${asset.change24h >= 0 ? '+' : ''}${asset.change24h.toFixed(2)}%`],
      ].map(([label, value]) => <View key={label} style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>)}</Card>
    </Screen>
  );
}

export function SendScreen({ asset, navigate, submit }: { asset: Asset; navigate: Navigate; submit: (amount: number, recipient: string) => Promise<void> }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [busy, setBusy] = useState(false);
  const { showDialog, dialog } = useWalletDialog();
  const value = Number(amount || 0);
  const send = async () => {
    try { setBusy(true); await submit(value, recipient); showDialog({ title: 'Transferencia completada', message: 'El saldo ya está disponible en la cuenta de destino.', tone: 'success', confirmLabel: 'Ver actividad', onConfirm: () => navigate('activity') }); }
    catch (error) { showDialog({ title: 'No se pudo enviar', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); }
    finally { setBusy(false); }
  };
  return (
    <Screen scroll>
      <Header title={`Enviar ${asset.symbol}`} onBack={() => navigate('home')} />
      <Text style={commonStyles.label}>Destinatario</Text>
      <View style={styles.inputRow}><TextInput value={recipient} onChangeText={setRecipient} style={[commonStyles.input, styles.flex]} placeholder="Correo o dirección Wallet" autoCapitalize="none" placeholderTextColor={colors.muted} /><Ionicons name="person-outline" size={23} color="#8885FF" style={styles.inputIcon} /></View>
      <Text style={[commonStyles.label, { marginTop: 20 }]}>Red</Text>
      <Card style={styles.networkRow}><CoinIcon asset={asset} size={38} /><Text style={styles.assetTitle}>{asset.name} ({asset.symbol})</Text><Ionicons name="chevron-forward" size={22} color={colors.muted} /></Card>
      <Text style={[commonStyles.label, { marginTop: 20 }]}>Cantidad</Text>
      <Card><View style={commonStyles.row}><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.amountInput} /><Pressable onPress={() => setAmount(String(Math.max(0, asset.balance - 0.00001)))} style={styles.max}><Text style={styles.maxText}>Máx</Text></Pressable></View><Text style={styles.amountUsd}>≈ {money(value * asset.priceUsd)}</Text></Card>
      <View style={styles.feeBox}><Text style={styles.infoLabel}>Transferencia interna</Text><Text style={styles.feeText}>Sin comisión</Text></View>
      <View style={styles.bottomAction}><GradientButton label={busy ? 'Procesando transferencia...' : 'Transferir'} disabled={busy || !value || recipient.length < 5} onPress={send} /></View>
      {dialog}
    </Screen>
  );
}

function QrPattern() {
  const cells = Array.from({ length: 169 }, (_, index) => ((index * 17 + Math.floor(index / 13) * 11) % 7) < 3);
  return <View style={styles.qr}>{cells.map((dark, index) => <View key={index} style={[styles.qrCell, dark && styles.qrDark]} />)}</View>;
}

export function ReceiveScreen({ asset, walletAddress, navigate }: { asset: Asset; walletAddress: string; navigate: Navigate }) {
  const { showDialog, dialog } = useWalletDialog();
  return (
    <Screen>
      <Header title={`Recibir ${asset.symbol}`} onBack={() => navigate('home')} />
      <Card style={styles.receiveCard}>
        <QrPattern />
        <View style={styles.addressBox}><Text numberOfLines={1} style={styles.addressText}>{walletAddress}</Text><Ionicons name="copy-outline" size={22} color="#9290FF" /></View>
        <OutlineButton label="Mostrar dirección" onPress={() => showDialog({ title: 'Dirección Wallet', message: walletAddress, tone: 'success' })} />
      </Card>
      <Text style={[commonStyles.subtitle, { textAlign: 'center', marginTop: 24 }]}>Comparte tu correo o esta dirección para recibir una transferencia de otra cuenta Wallet.</Text>
      {dialog}
    </Screen>
  );
}

export function SwapScreen({ assets, navigate, submit }: { assets: Asset[]; navigate: Navigate; submit: (from: Asset, to: Asset, amount: number) => Promise<number> }) {
  const [fromIndex, setFromIndex] = useState(1);
  const [toIndex, setToIndex] = useState(3);
  const [amount, setAmount] = useState('0.5');
  const [busy, setBusy] = useState(false);
  const { showDialog, dialog } = useWalletDialog();
  const from = assets[fromIndex] ?? assets[0]!;
  const to = assets[toIndex] ?? assets[1]!;
  const numeric = Number(amount || 0);
  const received = ((numeric * from.priceUsd) * 0.9985) / to.priceUsd;
  const cycle = (current: number, avoid: number) => {
    let next = (current + 1) % assets.length;
    if (next === avoid) next = (next + 1) % assets.length;
    return next;
  };
  return (
    <View style={styles.mainShell}>
      <Screen scroll>
        <Header title="Intercambiar" onBack={() => navigate('home')} right={<Ionicons name="receipt-outline" size={22} color={colors.text} />} />
        <Card style={styles.swapCard}>
          <Text style={commonStyles.label}>Desde</Text>
          <Pressable onPress={() => setFromIndex(cycle(fromIndex, toIndex))} style={styles.swapAsset}><CoinIcon asset={from} /><View style={styles.flex}><Text style={styles.assetTitle}>{from.symbol}</Text><Text style={styles.assetSymbol}>{from.name}</Text></View><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.swapAmount} /></Pressable>
          <Text style={styles.swapUsd}>≈ {money(numeric * from.priceUsd)}</Text>
        </Card>
        <Pressable onPress={() => { setFromIndex(toIndex); setToIndex(fromIndex); }} style={styles.swapSwitch}><Ionicons name="swap-vertical" size={24} color="#FFF" /></Pressable>
        <Card style={styles.swapCard}>
          <Text style={commonStyles.label}>A</Text>
          <Pressable onPress={() => setToIndex(cycle(toIndex, fromIndex))} style={styles.swapAsset}><CoinIcon asset={to} /><View style={styles.flex}><Text style={styles.assetTitle}>{to.symbol}</Text><Text style={styles.assetSymbol}>{to.name}</Text></View><Text style={styles.swapAmount}>{amountText(received)}</Text></Pressable>
          <Text style={styles.swapUsd}>≈ {money(received * to.priceUsd)}</Text>
        </Card>
        <Text style={styles.rate}>1 {from.symbol} ≈ {amountText(from.priceUsd / to.priceUsd)} {to.symbol}</Text>
        <View style={styles.feeLine}><Text style={styles.infoLabel}>Comisión estimada</Text><Text style={styles.infoValue}>{money(numeric * from.priceUsd * 0.0015)}</Text></View>
        <View style={styles.bottomAction}><GradientButton label={busy ? 'Intercambiando...' : 'Intercambiar'} disabled={busy || !numeric} onPress={async () => { try { setBusy(true); const result = await submit(from, to, numeric); showDialog({ title: 'Intercambio completado', message: `Recibiste ${amountText(result)} ${to.symbol}`, tone: 'success', onConfirm: () => navigate('home') }); } catch (error) { showDialog({ title: 'No se pudo intercambiar', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); } finally { setBusy(false); } }} /></View>
        {dialog}
      </Screen>
      <BottomNav active="swap" navigate={navigate} />
    </View>
  );
}

const dappIcons: Record<string, keyof typeof Ionicons.glyphMap> = { Uniswap: 'swap-horizontal', Aave: 'water', Lido: 'layers', OpenSea: 'images', PancakeSwap: 'git-compare' };
const dappMetrics: Record<string, string> = { Uniswap: '$4.8B TVL', Aave: '3.9% APY', Lido: '3.1% APR', OpenSea: '12.4K activos', PancakeSwap: '$1.6B TVL' };
const dappImages: Record<string, number> = {
  Uniswap: require('../assets/dapps/uniswap.png'),
  Aave: require('../assets/dapps/aave.png'),
  Lido: require('../assets/dapps/lido.jpg'),
  OpenSea: require('../assets/dapps/opensea.png'),
  PancakeSwap: require('../assets/dapps/pancakeswap.png'),
};

function DappRow({ dapp, onPress }: { dapp: Dapp; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.dappRow, pressed && styles.rowPressed]}><LinearGradient colors={['#FFFFFF', '#E9ECF6']} style={styles.dappIcon}>{dappImages[dapp.name] ? <Image source={dappImages[dapp.name]} style={styles.dappImage} resizeMode="contain" /> : <Ionicons name={dappIcons[dapp.name] || 'apps'} size={25} color={dapp.color} />}</LinearGradient><View style={styles.flex}><Text style={styles.assetTitle}>{dapp.name}</Text><Text style={styles.dappDescription}>{dapp.description}</Text><Text style={styles.dappCategory}>{dapp.category} · {dappMetrics[dapp.name] || 'Mercado activo'}</Text></View><Ionicons name="chevron-forward" size={22} color={colors.muted} /></Pressable>;
}

export function ExploreScreen({ assets, dapps, navigate }: { assets: Asset[]; dapps: Dapp[]; navigate: Navigate }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todo');
  const { showDialog, dialog } = useWalletDialog();
  const filtered = dapps.filter((dapp) => (category === 'Todo' || dapp.category === category) && `${dapp.name} ${dapp.description}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <View style={styles.mainShell}>
      <Screen scroll>
        <View style={styles.pageTitleRow}><Text style={commonStyles.title}>Explorar</Text><Ionicons name="ellipsis-horizontal" size={25} color={colors.text} /></View>
        <View style={styles.search}><Ionicons name="search" color={colors.muted} size={20} /><TextInput value={query} onChangeText={setQuery} style={styles.searchInput} placeholder="Buscar protocolos y mercados..." placeholderTextColor={colors.muted} /></View>
        <LinearGradient colors={['#173764', '#11243E', '#0D1827']} style={styles.marketHero}><View><Text style={styles.marketEyebrow}>MERCADOS DIGITALES</Text><Text style={styles.marketTitle}>Descubre oportunidades</Text><Text style={styles.marketCopy}>Sigue activos, tendencias y protocolos desde un solo lugar.</Text></View><View style={styles.marketOrb}><Ionicons name="analytics" size={31} color="#75AEFF" /></View></LinearGradient>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Mercado</Text><Text style={styles.marketStatus}>● EN VIVO</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.marketCards}>{assets.slice(0, 4).map((asset) => <Pressable key={asset.symbol} onPress={() => navigate('asset', asset)}><Card style={styles.marketCard}><View style={styles.marketCardTop}><CoinIcon asset={asset} size={34} /><Text style={[styles.assetChange, { color: asset.change24h >= 0 ? colors.success : colors.danger }]}>{asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%</Text></View><Text style={styles.marketCardSymbol}>{asset.symbol}</Text><Text style={styles.marketCardPrice}>{money(asset.priceUsd)}</Text></Card></Pressable>)}</ScrollView>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Protocolos Web3</Text><Text style={styles.sectionAction}>{filtered.length} disponibles</Text></View>
        <ScrollView horizontal style={styles.chipScroller} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{['Todo', 'DeFi', 'NFT', 'Gaming', 'Bridge'].map((chip) => <Pressable key={chip} onPress={() => setCategory(chip)} style={[styles.chip, chip === category && styles.chipActive]}><Text style={[styles.chipText, chip === category && { color: '#FFF' }]}>{chip}</Text></Pressable>)}</ScrollView>
        <View>{filtered.length ? filtered.map((dapp) => <DappRow key={dapp.id} dapp={dapp} onPress={() => showDialog({ title: dapp.name, message: `${dapp.description}. La integración de este protocolo estará disponible próximamente.`, tone: 'info' })} />) : <View style={styles.emptyCompact}><Ionicons name="search-outline" size={30} color="#7772FF" /><Text style={styles.emptyTitle}>Sin resultados</Text><Text style={styles.emptyBody}>Prueba otra búsqueda o categoría.</Text></View>}</View>
        {dialog}
      </Screen>
      <BottomNav active="explore" navigate={navigate} />
    </View>
  );
}

export function ActivityScreen({ transactions, navigate }: { transactions: Transaction[]; navigate: Navigate }) {
  const labels = { send: 'Enviado', receive: 'Recibido', swap: 'Intercambio', buy: 'Compra' };
  const icons = { send: 'arrow-up' as const, receive: 'arrow-down' as const, swap: 'swap-horizontal' as const, buy: 'card-outline' as const };
  return (
    <View style={styles.mainShell}>
      <Screen>
        <Text style={[commonStyles.title, { marginTop: 20, marginBottom: 18 }]}>Actividad</Text>
        <ScrollView contentContainerStyle={!transactions.length ? styles.emptyActivityScroll : undefined}>{transactions.length ? transactions.map((transaction) => { const incoming = transaction.type === 'receive' || transaction.type === 'buy'; return <Card key={transaction.id} style={styles.transaction}><View style={[styles.transactionIcon, { backgroundColor: `${transaction.color}30` }]}><Ionicons name={icons[transaction.type]} color={transaction.color} size={23} /></View><View style={styles.flex}><Text style={styles.assetTitle}>{labels[transaction.type]} · {transaction.symbol}</Text><Text style={styles.assetSymbol}>{new Date(transaction.createdAt).toLocaleDateString('es-EC')} · {transaction.status === 'completed' ? 'Completada' : transaction.status}</Text></View><View style={styles.assetValue}><Text style={[styles.assetTitle, { color: incoming ? colors.success : colors.text }]}>{incoming ? '+' : '-'}{amountText(transaction.amount)}</Text><Text style={styles.assetSymbol}>{money(transaction.amountUsd)}</Text></View></Card>; }) : <View style={styles.emptyState}><LinearGradient colors={['#242864', '#171D35']} style={styles.emptyIcon}><Ionicons name="pulse-outline" size={38} color="#8D8AFF" /></LinearGradient><Text style={styles.emptyTitle}>Aún no hay movimientos</Text><Text style={styles.emptyBody}>Tus envíos, compras e intercambios aparecerán aquí cuando realices tu primera operación.</Text><GradientButton label="Explorar la wallet" onPress={() => navigate('home')} /></View>}</ScrollView>
      </Screen>
      <BottomNav active="activity" navigate={navigate} />
    </View>
  );
}

export function ProfileScreen({ data, navigate, logout }: { data: Bootstrap; navigate: Navigate; logout: () => Promise<void> }) {
  const { showDialog, dialog } = useWalletDialog();
  const groups = [
    [{ icon: 'card-outline' as const, title: 'Tarjetas virtuales', sub: `${data.cards.length} agregada${data.cards.length === 1 ? '' : 's'}`, screen: 'cards' as AppScreen }, { icon: 'shield-checkmark-outline' as const, title: 'Seguridad' }, { icon: 'cloud-upload-outline' as const, title: 'Backups' }, { icon: 'globe-outline' as const, title: 'Redes', sub: 'Ethereum, Solana, BSC...' }, { icon: 'settings-outline' as const, title: 'Preferencias', sub: 'Fiat, tema, idioma...' }],
    [{ icon: 'help-circle-outline' as const, title: 'Ayuda y soporte' }, { icon: 'information-circle-outline' as const, title: 'Acerca de' }],
  ];
  return (
    <View style={styles.mainShell}>
      <Screen scroll>
        <View style={styles.profileHero}><View style={styles.avatar}><Ionicons name="person-outline" size={40} color="#FFF" /></View><View style={styles.flex}><Text style={styles.profileName}>{data.user.displayName}</Text><Text style={styles.profileAddress}>{data.user.email}</Text><Text style={styles.profileAddress}>{data.wallet.address.slice(0, 8)}...{data.wallet.address.slice(-4)}</Text></View><Ionicons name="copy-outline" size={21} color={colors.muted} /><Ionicons name="wallet-outline" size={23} color={colors.text} /></View>
        {data.user.role === 'admin' ? <Pressable onPress={() => navigate('admin')}><Card style={styles.adminEntry}><View style={styles.adminIcon}><Ionicons name="people" size={25} color="#FFF" /></View><View style={styles.flex}><Text style={styles.settingTitle}>Administrar cuentas</Text><Text style={styles.settingSub}>Consultar usuarios y acreditar saldos</Text></View><Ionicons name="chevron-forward" size={23} color={colors.muted} /></Card></Pressable> : null}
        {groups.map((group, groupIndex) => <Card key={groupIndex} style={styles.profileGroup}>{group.map((item, index) => <Pressable key={item.title} onPress={() => 'screen' in item && item.screen ? navigate(item.screen) : showDialog({ title: item.title, message: 'Esta sección está preparada para una siguiente integración.', tone: 'info' })} style={[styles.settingRow, index < group.length - 1 && styles.settingBorder]}><Ionicons name={item.icon} size={26} color={colors.text} /><View style={styles.flex}><Text style={styles.settingTitle}>{item.title}</Text>{'sub' in item && item.sub ? <Text style={styles.settingSub}>{item.sub}</Text> : null}</View><Ionicons name="chevron-forward" size={23} color={colors.muted} /></Pressable>)}</Card>)}
        <OutlineButton label="Cerrar sesión" onPress={() => void logout()} />
        {dialog}
      </Screen>
      <BottomNav active="profile" navigate={navigate} />
    </View>
  );
}

export function AdminScreen({
  assets,
  navigate,
  loadUsers,
  submit,
}: {
  assets: Asset[];
  navigate: Navigate;
  loadUsers: () => Promise<AdminUser[]>;
  submit: (userId: number, symbol: string, amount: number) => Promise<string>;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(0);
  const [amount, setAmount] = useState('100');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showDialog, dialog } = useWalletDialog();
  const targets = users.filter((user) => user.role !== 'admin');
  const target = targets[selectedUser] ?? targets[0];
  const asset = assets[selectedAsset] ?? assets[0]!;
  const reload = async () => {
    try { setUsers(await loadUsers()); } catch (error) { showDialog({ title: 'No se pudieron cargar las cuentas', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);
  return (
    <Screen scroll>
      <Header title="Administración" onBack={() => navigate('profile')} right={<Ionicons name="shield-checkmark" size={23} color="#8F83FF" />} />
      <Text style={commonStyles.title}>Acreditar saldo</Text>
      <Text style={[commonStyles.subtitle, { marginTop: 8, marginBottom: 20 }]}>Selecciona una cuenta, el activo y el monto que deseas agregar.</Text>
      {loading ? <Text style={styles.adminEmpty}>Cargando cuentas...</Text> : targets.length === 0 ? <Card><Text style={styles.adminEmpty}>Todavía no hay usuarios registrados.</Text></Card> : (
        <>
          <Text style={commonStyles.label}>Cuenta de destino</Text>
          <Pressable onPress={() => setSelectedUser((selectedUser + 1) % targets.length)}>
            <Card style={styles.adminTarget}>
              <View style={styles.adminIcon}><Ionicons name="person" size={22} color="#FFF" /></View>
              <View style={styles.flex}><Text style={styles.assetTitle}>{target?.displayName}</Text><Text style={styles.assetSymbol}>{target?.email}</Text><Text style={styles.settingSub}>Balance total: {money(target?.totalUsd || 0)}</Text></View>
              <Ionicons name="swap-vertical" size={22} color="#958BFF" />
            </Card>
          </Pressable>
          <Text style={[commonStyles.label, { marginTop: 20 }]}>Activo</Text>
          <Pressable onPress={() => setSelectedAsset((selectedAsset + 1) % assets.length)}>
            <Card style={styles.adminTarget}><CoinIcon asset={asset} /><View style={styles.flex}><Text style={styles.assetTitle}>{asset.name}</Text><Text style={styles.assetSymbol}>{asset.symbol}</Text></View><Ionicons name="swap-vertical" size={22} color="#958BFF" /></Card>
          </Pressable>
          <Text style={[commonStyles.label, { marginTop: 20 }]}>Cantidad de {asset.symbol}</Text>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={commonStyles.input} placeholder="0.00" placeholderTextColor={colors.muted} />
          <View style={styles.adminPreview}><Text style={styles.infoLabel}>Valor estimado</Text><Text style={styles.infoValue}>{money(Number(amount || 0) * asset.priceUsd)}</Text></View>
          <View style={styles.bottomAction}><GradientButton label={busy ? 'Acreditando saldo...' : 'Acreditar saldo'} disabled={busy || !target || Number(amount) <= 0} onPress={async () => { if (!target) return; try { setBusy(true); const name = await submit(target.id, asset.symbol, Number(amount)); showDialog({ title: 'Saldo acreditado', message: `${name} recibió ${amountText(Number(amount))} ${asset.symbol}.`, tone: 'success' }); await reload(); } catch (error) { showDialog({ title: 'No se pudo acreditar', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); } finally { setBusy(false); } }} /></View>
        </>
      )}
      {dialog}
    </Screen>
  );
}

function VirtualCard({ card, compact = false }: { card: PaymentCard; compact?: boolean }) {
  return <LinearGradient colors={[card.color, '#25285E', '#11172A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.virtualCard, compact && styles.virtualCardCompact]}>
    <View style={commonStyles.row}><Text style={styles.cardBrand}>{card.brand}</Text>{card.isDefault ? <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>PRINCIPAL</Text></View> : null}</View>
    <Ionicons name="radio-outline" size={28} color="rgba(255,255,255,.75)" />
    <Text style={styles.cardNumber}>••••  ••••  ••••  {card.lastFour}</Text>
    <View style={styles.cardBottom}><View><Text style={styles.cardMeta}>TITULAR</Text><Text style={styles.cardValue}>{card.holderName.toUpperCase()}</Text></View><View><Text style={styles.cardMeta}>VENCE</Text><Text style={styles.cardValue}>{String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}</Text></View></View>
  </LinearGradient>;
}

export function CardsScreen({ data, navigate, addCard, setDefault }: { data: Bootstrap; navigate: Navigate; addCard: (card: Omit<PaymentCard, 'id' | 'isDefault'>) => Promise<void>; setDefault: (cardId: number) => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nickname, setNickname] = useState('Personal');
  const [holderName, setHolderName] = useState(data.user.displayName);
  const [brand, setBrand] = useState<PaymentCard['brand']>('Visa');
  const [cardNumber, setCardNumber] = useState('');
  const [month, setMonth] = useState('12');
  const [year, setYear] = useState(String(new Date().getFullYear() + 4));
  const { showDialog, dialog } = useWalletDialog();
  const colorsByBrand = { Visa: '#4659E8', Mastercard: '#D75A32', Amex: '#1487A8' };
  const cardDigits = cardNumber.replace(/\D/g, '');
  const expectedDigits = brand === 'Amex' ? 15 : 16;
  const formattedCardNumber = brand === 'Amex'
    ? [cardDigits.slice(0, 4), cardDigits.slice(4, 10), cardDigits.slice(10, 15)].filter(Boolean).join(' ')
    : cardDigits.replace(/(.{4})/g, '$1 ').trim();
  const updateCardNumber = (value: string) => setCardNumber(value.replace(/\D/g, '').slice(0, expectedDigits));
  const save = async () => {
    try {
      setBusy(true);
      await addCard({ nickname, holderName, brand, lastFour: cardDigits.slice(-4), expiryMonth: Number(month), expiryYear: Number(year), color: colorsByBrand[brand] });
      setAdding(false);
      setCardNumber('');
      showDialog({ title: 'Tarjeta virtual agregada', message: 'Ya puedes seleccionarla como método en tus compras simuladas.', tone: 'success' });
    } catch (error) { showDialog({ title: 'No se pudo agregar', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); }
    finally { setBusy(false); }
  };
  return <Screen scroll>
    <Header title="Tarjetas virtuales" onBack={() => navigate('profile')} right={<Ionicons name="shield-checkmark" size={22} color="#8D8AFF" />} />
    <Text style={commonStyles.title}>Métodos de pago</Text>
    <Text style={[commonStyles.subtitle, { marginTop: 7, marginBottom: 18 }]}>Tarjetas ficticias para probar compras y movimientos sin realizar cargos reales.</Text>
    {data.cards.map((card) => <Pressable key={card.id} onPress={async () => { if (!card.isDefault) { try { await setDefault(card.id); showDialog({ title: 'Tarjeta principal actualizada', message: `${card.brand} terminada en ${card.lastFour} se usará por defecto.`, tone: 'success' }); } catch (error) { showDialog({ title: 'No se pudo actualizar', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); } } }} style={styles.cardStack}><VirtualCard card={card} /></Pressable>)}
    {!data.cards.length ? <View style={[styles.emptyCompact, styles.cardsEmpty]}><Ionicons name="card-outline" size={34} color="#8883FF" /><Text style={styles.emptyTitle}>No tienes tarjetas virtuales</Text><Text style={styles.emptyBody}>Agrega una para habilitar las compras simuladas.</Text></View> : null}
    {adding ? <Card style={styles.cardForm}>
      <Text style={commonStyles.sectionTitle}>Nueva tarjeta ficticia</Text>
      <Text style={commonStyles.label}>Marca</Text><View style={styles.brandRow}>{(['Visa', 'Mastercard', 'Amex'] as const).map((item) => <Pressable key={item} onPress={() => { setBrand(item); setCardNumber((current) => current.slice(0, item === 'Amex' ? 15 : 16)); }} style={[styles.brandChip, brand === item && styles.brandChipActive]}><Text style={styles.brandChipText}>{item}</Text></Pressable>)}</View>
      <Text style={commonStyles.label}>Alias</Text><TextInput value={nickname} onChangeText={setNickname} style={commonStyles.input} placeholder="Personal" placeholderTextColor={colors.muted} />
      <Text style={commonStyles.label}>Titular</Text><TextInput value={holderName} onChangeText={setHolderName} style={commonStyles.input} placeholder="Nombre" placeholderTextColor={colors.muted} />
      <Text style={commonStyles.label}>Número de tarjeta ficticia</Text><TextInput value={formattedCardNumber} onChangeText={updateCardNumber} style={commonStyles.input} keyboardType="number-pad" placeholder={brand === 'Amex' ? '3782 822463 10005' : '4242 4242 4242 4242'} placeholderTextColor={colors.muted} maxLength={expectedDigits + 3} />
      <View style={styles.cardPrivacy}><Ionicons name="shield-checkmark-outline" size={16} color="#7DEBFF" /><Text style={styles.cardPrivacyText}>Se usa para simular el ingreso; únicamente se conservan los últimos 4 dígitos.</Text></View>
      <View style={styles.expiryRow}><View style={styles.flex}><Text style={commonStyles.label}>Mes</Text><TextInput value={month} onChangeText={(value) => setMonth(value.replace(/\D/g, '').slice(0, 2))} style={commonStyles.input} keyboardType="number-pad" /></View><View style={styles.flex}><Text style={commonStyles.label}>Año</Text><TextInput value={year} onChangeText={(value) => setYear(value.replace(/\D/g, '').slice(0, 4))} style={commonStyles.input} keyboardType="number-pad" /></View></View>
      <GradientButton label={busy ? 'Guardando...' : 'Agregar tarjeta'} disabled={busy || nickname.length < 2 || holderName.length < 2 || cardDigits.length !== expectedDigits} onPress={() => void save()} />
      <OutlineButton label="Cancelar" onPress={() => setAdding(false)} />
    </Card> : <GradientButton label="Agregar tarjeta virtual" icon="add" onPress={() => setAdding(true)} />}
    {dialog}
  </Screen>;
}

export function BuyScreen({ assets, cards, navigate, submit }: { assets: Asset[]; cards: PaymentCard[]; navigate: Navigate; submit: (asset: Asset, usdAmount: number, cardId: number) => Promise<number> }) {
  const [amount, setAmount] = useState('250');
  const [busy, setBusy] = useState(false);
  const [cardIndex, setCardIndex] = useState(Math.max(0, cards.findIndex((card) => card.isDefault)));
  const { showDialog, dialog } = useWalletDialog();
  const asset = assets[0]!;
  const card = cards[cardIndex] ?? cards[0];
  const crypto = Number(amount || 0) / asset.priceUsd;
  return (
    <Screen scroll>
      <Header title="Comprar cripto" onBack={() => navigate('home')} />
      <Text style={[commonStyles.subtitle, { marginBottom: 22 }]}>Selecciona el monto que deseas acreditar a tu portafolio.</Text>
      <Card><Text style={commonStyles.label}>Pagas</Text><View style={commonStyles.row}><Text style={styles.buyCurrency}>USD</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.buyAmount} /></View></Card>
      <View style={styles.buyArrow}><Ionicons name="arrow-down" color="#FFF" size={24} /></View>
      <Card><Text style={commonStyles.label}>Recibes</Text><View style={commonStyles.row}><CoinIcon asset={asset} /><Text style={styles.buyCurrency}>{asset.symbol}</Text><Text style={styles.buyAmount}>{amountText(crypto)}</Text></View></Card>
      <Text style={[commonStyles.label, { marginTop: 20 }]}>Método virtual</Text>
      {card ? <Pressable onPress={() => setCardIndex((cardIndex + 1) % cards.length)}><VirtualCard card={card} compact /></Pressable> : <Pressable onPress={() => navigate('cards')}><Card style={styles.noCard}><Ionicons name="add-circle-outline" size={28} color="#918AFF" /><View style={styles.flex}><Text style={styles.assetTitle}>Agregar tarjeta virtual</Text><Text style={styles.assetSymbol}>Necesaria para continuar</Text></View><Ionicons name="chevron-forward" size={22} color={colors.muted} /></Card></Pressable>}
      <Card style={styles.buyNotice}><Ionicons name="shield-checkmark" size={24} color="#9E91FF" /><Text style={styles.buyNoticeText}>Revisa el monto antes de confirmar la operación.</Text></Card>
      <View style={styles.bottomAction}><GradientButton label={busy ? 'Procesando compra...' : 'Confirmar compra'} disabled={busy || Number(amount) <= 0 || !card} onPress={async () => { if (!card) return; try { setBusy(true); const received = await submit(asset, Number(amount), card.id); showDialog({ title: 'Compra completada', message: `Recibiste ${amountText(received)} ${asset.symbol}.`, tone: 'success', confirmLabel: 'Ver actividad', onConfirm: () => navigate('activity') }); } catch (error) { showDialog({ title: 'No se pudo comprar', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); } finally { setBusy(false); } }} /></View>
      {dialog}
    </Screen>
  );
}

export const firstAsset = (data: Bootstrap, preferred?: Asset | null) => preferred ?? data.assets[0]!;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  splash: { alignItems: 'center', justifyContent: 'space-between', paddingTop: 96, paddingBottom: 48, overflow: 'hidden' },
  splashCenter: { alignItems: 'center', zIndex: 2, marginTop: 70 },
  techRing: { position: 'absolute', top: 142, width: 245, height: 245, borderRadius: 123, borderWidth: 1, borderColor: 'rgba(106,119,255,.4)' },
  techRingDot: { position: 'absolute', top: -5, left: 112, width: 10, height: 10, borderRadius: 5, backgroundColor: '#72E5FF', shadowColor: '#72E5FF', shadowOpacity: 1, shadowRadius: 12 },
  logoHalo: { padding: 22, borderRadius: 52, backgroundColor: 'rgba(96,89,255,.08)', borderWidth: 1, borderColor: 'rgba(119,111,255,.18)' },
  brand: { color: '#FFF', fontSize: 48, fontWeight: '900', letterSpacing: -1.7, marginTop: 22 },
  tagline: { color: '#E2E4EE', fontSize: 19, lineHeight: 28, textAlign: 'center', marginTop: 24 },
  startButton: { zIndex: 2, minWidth: 210, minHeight: 64, borderRadius: 32, borderWidth: 1, borderColor: '#7D74FF', backgroundColor: '#16162E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, ...shadow },
  startText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(13,22,38,.75)', borderWidth: 1, borderColor: '#28334A' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  liveText: { color: '#AAB4C8', fontSize: 12, fontWeight: '600' },
  glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, opacity: 0.33, backgroundColor: '#703DFF' },
  glowTop: { left: -130, top: 40 },
  glowBottom: { right: -100, bottom: -20, backgroundColor: '#5235FF' },
  diagonalOne: { position: 'absolute', width: 520, height: 90, backgroundColor: '#111737', transform: [{ rotate: '38deg' }], left: -180, top: 230, opacity: 0.8 },
  diagonalTwo: { position: 'absolute', width: 520, height: 100, backgroundColor: '#151344', transform: [{ rotate: '38deg' }], left: -80, bottom: 80, opacity: 0.75 },
  onboardingPager: { flex: 1 },
  onboardingArt: { flex: 1.1, minHeight: 360, alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', width: 270, height: 270, borderRadius: 135, borderWidth: 1 },
  orbitNode: { position: 'absolute', width: 12, height: 12, borderRadius: 6, top: 18, right: 38, shadowColor: '#7A70FF', shadowOpacity: 1, shadowRadius: 12 },
  innerOrbit: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1 },
  animatedArtCoin: { zIndex: 2 },
  artCoin: { width: 175, height: 175, borderRadius: 88, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }], ...shadow },
  artCoinActive: { borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  miniCoin: { position: 'absolute', width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  bitcoinOrbiter: { left: -25, top: 100 },
  ethereumOrbiter: { right: -25, top: 34 },
  miniCoinText: { color: '#FFF', fontSize: 30, fontWeight: '900' },
  onboardingCopy: { minHeight: 190, justifyContent: 'center' },
  onboardingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 },
  dots: { flexDirection: 'row', gap: 10 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#2B3244' },
  dotActive: { backgroundColor: '#766DFF', width: 11, height: 11 },
  nextSquare: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6179FF', ...shadow },
  welcome: { justifyContent: 'space-between', paddingTop: 100, paddingBottom: 55 },
  welcomeTop: { alignItems: 'center', zIndex: 2 },
  welcomeOrb: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(117,107,255,.32)', backgroundColor: 'rgba(71,67,177,.08)' },
  welcomeOrbInner: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(79,207,255,.18)' },
  welcomeActions: { gap: 16, zIndex: 2 },
  authLogo: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  authSubtitle: { textAlign: 'center', marginTop: 10, marginBottom: 26 },
  authForm: { gap: 12 },
  passwordField: { minHeight: 62, borderRadius: radii.medium, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  passwordInput: { flex: 1, color: colors.text, fontSize: 17, paddingRight: 12 },
  passwordChecks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  passwordCheck: { flexDirection: 'row', alignItems: 'center', gap: 5, width: '47%' },
  passwordCheckText: { color: colors.muted, fontSize: 12 },
  demoCredentials: { color: colors.success, textAlign: 'center', fontSize: 12, marginTop: 18 },
  link: { color: '#A99AFF', textAlign: 'center', fontSize: 16, textDecorationLine: 'underline', marginTop: 8 },
  setupList: { gap: 12 },
  setupCard: { minHeight: 105, flexDirection: 'row', alignItems: 'center', gap: 16 },
  setupIcon: { width: 51, height: 51, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  setupTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  setupBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  bottomAction: { marginTop: 'auto', paddingTop: 22 },
  wordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 24 },
  word: { width: '48.5%', height: 54, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 12 },
  wordNumber: { color: colors.muted, width: 20 },
  wordText: { color: colors.text, fontSize: 16 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 25 },
  checkbox: { width: 23, height: 23, borderRadius: 6, borderWidth: 1, borderColor: '#D06DFF', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#E575FF' },
  confirmText: { color: colors.text, flex: 1, fontSize: 14 },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 40 },
  pinDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#40485A' },
  pinDotFilled: { backgroundColor: '#6276FF', borderColor: '#6276FF' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 5 },
  key: { width: '28%', aspectRatio: 1.55, maxHeight: 68, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  keyText: { color: colors.text, fontSize: 24, fontWeight: '600' },
  homeHeader: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  homeScreen: { paddingBottom: 12 },
  accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  greeting: { color: colors.text, fontSize: 16, fontWeight: '800' },
  walletName: { color: colors.muted, fontSize: 11.5, marginTop: 3 },
  headerIcons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  headerCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  offline: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: '#2A2214', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  offlineText: { color: colors.warning, fontSize: 11 },
  portfolioCard: { borderRadius: 26, borderWidth: 1, borderColor: '#263952', padding: 18, overflow: 'hidden', ...shadow },
  balanceTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  balanceLabel: { color: '#718198', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.15 },
  balance: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -1.1, marginTop: 7 },
  eyeButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  performanceRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8 },
  performancePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(33,206,153,.10)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  gain: { color: colors.success, fontSize: 12, fontWeight: '800' },
  periodText: { color: colors.muted, fontSize: 11.5 },
  portfolioChart: { marginTop: 8, overflow: 'hidden' },
  chartGridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(129,154,188,.09)' },
  lineSegment: { position: 'absolute', height: 2, borderRadius: 2, backgroundColor: '#4A96FF', transformOrigin: 'left center' },
  chartLastDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#70B2FF', borderWidth: 3, borderColor: '#173E70' },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  chartPeriod: { color: colors.muted, fontSize: 10.5, fontWeight: '700', paddingHorizontal: 7, paddingVertical: 5 },
  chartPeriodActive: { color: '#9DC5FF', fontSize: 10.5, fontWeight: '800', backgroundColor: 'rgba(56,124,255,.17)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17, marginBottom: 8 },
  quickAction: { width: '23%', alignItems: 'center', gap: 7 },
  quickIcon: { width: 52, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111D2D', borderWidth: 1, borderColor: '#26364A' },
  quickLabel: { color: '#C9D1DE', fontSize: 11.5, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  sectionAction: { color: '#6BA7FF', fontSize: 12, fontWeight: '700' },
  allocationCard: { paddingVertical: 15 },
  allocationBar: { height: 8, flexDirection: 'row', borderRadius: 5, overflow: 'hidden', gap: 2, backgroundColor: colors.surfaceRaised },
  allocationLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 13 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: colors.muted, fontSize: 10.5, fontWeight: '600' },
  assetsCard: { paddingTop: 0, paddingBottom: 0, paddingHorizontal: 14 },
  assetTabs: { height: 38, flexDirection: 'row', gap: 34, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  assetTab: { color: colors.muted, fontSize: 15 },
  assetTabActive: { color: colors.text, fontSize: 15, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: '#7A6FFF', height: 38, textAlignVertical: 'center' },
  assetList: { flex: 1 },
  assetRow: { minHeight: 70, borderBottomWidth: 1, borderBottomColor: '#1B2736', flexDirection: 'row', alignItems: 'center', gap: 12 },
  assetName: { flex: 1 },
  assetValue: { alignItems: 'flex-end' },
  assetTitle: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  assetSymbol: { color: colors.muted, fontSize: 13, marginTop: 4 },
  assetChange: { fontSize: 12.5, fontWeight: '700', marginTop: 4 },
  assetHero: { alignItems: 'center', gap: 4 },
  assetHeroName: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: 5 },
  assetPrice: { color: colors.text, fontSize: 34, fontWeight: '800', marginTop: 7 },
  chart: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 22, paddingHorizontal: 3 },
  chartBar: { width: 5, borderRadius: 3, backgroundColor: '#36CDBD', transform: [{ rotate: '20deg' }] },
  ranges: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  range: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  rangeActive: { backgroundColor: '#5F6FFF', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 11 },
  twoButtons: { flexDirection: 'row', gap: 12, marginTop: 18 },
  infoRow: { minHeight: 45, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#252C38' },
  infoLabel: { color: colors.muted, fontSize: 14 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputIcon: { marginLeft: -42, marginRight: 18 },
  networkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amountInput: { color: colors.text, fontSize: 28, fontWeight: '700', flex: 1, padding: 0 },
  max: { borderWidth: 1, borderColor: '#685FFF', borderRadius: 15, paddingHorizontal: 13, paddingVertical: 7 },
  maxText: { color: '#9E95FF', fontWeight: '700' },
  amountUsd: { color: colors.muted, marginTop: 5 },
  feeBox: { marginTop: 24, gap: 7 },
  feeText: { color: colors.text, fontWeight: '600' },
  receiveCard: { flex: 1, maxHeight: 530, alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 12 },
  qr: { width: 190, height: 190, backgroundColor: '#FFF', padding: 14, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 12 },
  qrCell: { width: '7.69%', height: '7.69%', backgroundColor: '#FFF' },
  qrDark: { backgroundColor: '#050505' },
  addressBox: { width: '100%', minHeight: 62, borderRadius: 15, backgroundColor: colors.surfaceRaised, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, gap: 12 },
  addressText: { color: colors.text, fontSize: 15, flex: 1 },
  mainShell: { flex: 1, backgroundColor: colors.background },
  swapCard: { padding: 14 },
  swapAsset: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swapAmount: { color: colors.text, fontSize: 26, fontWeight: '700', textAlign: 'right', minWidth: 100 },
  swapUsd: { color: colors.muted, textAlign: 'right', marginTop: 5 },
  swapSwitch: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: 10, zIndex: 2 },
  rate: { color: colors.text, textAlign: 'center', marginTop: 20, fontSize: 14 },
  feeLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 45 },
  pageTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  search: { height: 52, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, marginTop: 18 },
  searchText: { color: colors.muted, fontSize: 15 },
  searchInput: { color: colors.text, fontSize: 15, flex: 1, paddingVertical: 0 },
  marketHero: { minHeight: 132, borderRadius: 24, marginTop: 16, padding: 19, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  marketEyebrow: { color: '#7DEBFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  marketTitle: { color: '#FFF', fontSize: 21, fontWeight: '800', marginTop: 7 },
  marketCopy: { color: '#BBC5D8', fontSize: 12.5, lineHeight: 18, width: 225, marginTop: 5 },
  marketOrb: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(75,214,255,.12)', borderWidth: 1, borderColor: 'rgba(102,225,255,.3)', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  marketStatus: { color: colors.success, fontSize: 9.5, fontWeight: '900', letterSpacing: 1 },
  marketCards: { gap: 10, paddingRight: 4 },
  marketCard: { width: 145, minHeight: 112, padding: 13 },
  marketCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marketCardSymbol: { color: colors.muted, fontSize: 11, fontWeight: '800', marginTop: 10 },
  marketCardPrice: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 3 },
  chipScroller: { flexGrow: 0, height: 62 },
  chips: { gap: 9, paddingVertical: 10, alignItems: 'center' },
  chip: { height: 42, minWidth: 64, paddingHorizontal: 18, borderRadius: 21, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: '#3278F1', borderColor: '#3278F1' },
  chipText: { color: colors.muted, fontWeight: '600', lineHeight: 18, includeFontPadding: false },
  dappRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowPressed: { opacity: 0.65, transform: [{ scale: 0.99 }] },
  dappIcon: { width: 51, height: 51, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dappImage: { width: 36, height: 36, borderRadius: 8 },
  dappLetter: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  dappDescription: { color: colors.muted, fontSize: 13, marginTop: 3 },
  dappCategory: { color: '#6BA7FF', fontSize: 12, marginTop: 2 },
  transaction: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  transactionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyActivityScroll: { flexGrow: 1, justifyContent: 'center', paddingBottom: 30 },
  emptyState: { alignItems: 'center', paddingHorizontal: 12 },
  emptyIcon: { width: 82, height: 82, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { color: colors.text, fontSize: 19, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  emptyBody: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7, marginBottom: 20 },
  emptyCompact: { alignItems: 'center', justifyContent: 'center', padding: 28, borderRadius: 22, borderWidth: 1, borderStyle: 'dashed', borderColor: '#343B50', backgroundColor: 'rgba(18,24,36,.55)' },
  profileHero: { minHeight: 118, flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: '#4B5364', backgroundColor: '#202838', alignItems: 'center', justifyContent: 'center' },
  profileName: { color: colors.text, fontSize: 21, fontWeight: '800' },
  profileAddress: { color: colors.muted, marginTop: 6 },
  profileGroup: { paddingVertical: 0, marginBottom: 18 },
  adminEntry: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18, borderColor: '#655DFF' },
  adminIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#625EFF', alignItems: 'center', justifyContent: 'center' },
  adminTarget: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  adminEmpty: { color: colors.muted, textAlign: 'center', paddingVertical: 24 },
  adminPreview: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  settingRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 15 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: '#252C38' },
  settingTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  settingSub: { color: colors.muted, fontSize: 13, marginTop: 4 },
  buyCurrency: { color: colors.text, fontSize: 20, fontWeight: '800', marginLeft: 12 },
  buyAmount: { color: colors.text, fontSize: 27, fontWeight: '800', textAlign: 'right', flex: 1 },
  buyArrow: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#5F6FFF', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 14 },
  buyNotice: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 22 },
  buyNoticeText: { color: colors.muted, flex: 1, lineHeight: 20 },
  virtualCard: { minHeight: 205, borderRadius: 26, padding: 21, justifyContent: 'space-between', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', ...shadow },
  virtualCardCompact: { minHeight: 165, padding: 17 },
  cardBrand: { color: '#FFF', fontSize: 21, fontWeight: '900', fontStyle: 'italic' },
  defaultBadge: { marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,.17)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  defaultBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  cardNumber: { color: '#FFF', fontSize: 19, fontWeight: '700', letterSpacing: 1.8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta: { color: 'rgba(255,255,255,.62)', fontSize: 8, fontWeight: '700', letterSpacing: 1.2 },
  cardValue: { color: '#FFF', fontSize: 12, fontWeight: '700', marginTop: 4 },
  cardStack: { marginBottom: 16 },
  cardForm: { gap: 11, marginVertical: 18 },
  cardsEmpty: { marginBottom: 20 },
  cardPrivacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 3 },
  cardPrivacyText: { color: colors.muted, fontSize: 11.5, lineHeight: 17, flex: 1 },
  brandRow: { flexDirection: 'row', gap: 8 },
  brandChip: { flex: 1, minHeight: 43, borderRadius: 14, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  brandChipActive: { borderColor: '#7D74FF', backgroundColor: '#272653' },
  brandChipText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  expiryRow: { flexDirection: 'row', gap: 12 },
  noCard: { flexDirection: 'row', alignItems: 'center', gap: 13 },
});
