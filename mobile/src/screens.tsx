import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
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
import type { AdminUser, AppScreen, Asset, Bootstrap, Dapp, KycProfile, PaymentCard, Transaction } from './types';

const money = (value: number, decimals = 2) => `$${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
const amountText = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 6 });

type Navigate = (screen: AppScreen, asset?: Asset) => void;

function AbstractBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#0D1828', '#070B12', '#0B1421']} style={StyleSheet.absoluteFill} />
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />
      <View style={styles.diagonalOne} />
      <View style={styles.diagonalTwo} />
    </View>
  );
}

const onboarding = [
  {
    eyebrow: 'TU PORTAFOLIO',
    title: 'Tus activos,\nen un solo lugar',
    body: 'Consulta saldos, movimientos y rendimiento desde una experiencia clara y segura.',
    icon: 'logo-bitcoin' as const,
    accent: '#477CFF',
  },
  {
    eyebrow: 'OPERACIONES SIMPLES',
    title: 'Intercambia\nsin complicaciones',
    body: 'Envía, recibe y convierte activos con confirmaciones claras en cada operación.',
    icon: 'swap-horizontal' as const,
    accent: '#3887FF',
  },
  {
    eyebrow: 'SEGURIDAD PERSONAL',
    title: 'El control está\nen tus manos',
    body: 'Protege tu cuenta y mantén acceso a todas las funciones de tu billetera.',
    icon: 'shield-checkmark' as const,
    accent: '#4368E8',
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
          <View style={styles.onboardingCopy}><Text style={styles.onboardingEyebrow}>{item.eyebrow}</Text><Text style={[commonStyles.title, styles.onboardingTitle]}>{item.title}</Text><Text style={[commonStyles.subtitle, { marginTop: 14 }]}>{item.body}</Text></View>
        </View>)}
      </ScrollView>
      <View style={styles.onboardingBottom}>
        <View style={styles.dots}>{onboarding.map((_, dot) => <Pressable key={dot} onPress={() => { setActive(dot); scrollRef.current?.scrollTo({ x: dot * pageWidth, animated: true }); }} style={[styles.dot, dot === active && styles.dotActive]} />)}</View>
        <Pressable onPress={next} style={styles.onboardingContinue}><Text style={styles.onboardingContinueText}>Continuar</Text><Ionicons name="arrow-forward" size={20} color="#FFF" /></Pressable>
      </View>
    </Screen>
  );
}

function WelcomePortfolioVisual() {
  const floatMotion = useRef(new Animated.Value(0)).current;
  const coinMotion = useRef(new Animated.Value(0)).current;
  const glowMotion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floating = Animated.loop(Animated.sequence([
      Animated.timing(floatMotion, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatMotion, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const coins = Animated.loop(Animated.sequence([
      Animated.timing(coinMotion, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(coinMotion, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const glowing = Animated.loop(Animated.sequence([
      Animated.timing(glowMotion, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowMotion, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    floating.start();
    coins.start();
    glowing.start();
    return () => {
      floating.stop();
      coins.stop();
      glowing.stop();
    };
  }, [coinMotion, floatMotion, glowMotion]);

  return (
    <View style={styles.welcomeVisual} pointerEvents="none">
      <Animated.View style={[styles.welcomeVisualGlow, {
        opacity: glowMotion.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.42] }),
        transform: [{ scale: glowMotion.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
      }]} />
      <Animated.View style={[styles.welcomeBalanceFloat, {
        transform: [
          { translateY: floatMotion.interpolate({ inputRange: [0, 1], outputRange: [5, -8] }) },
          { rotateZ: floatMotion.interpolate({ inputRange: [0, 1], outputRange: ['-2.5deg', '-0.5deg'] }) },
          { scale: floatMotion.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1.015] }) },
        ],
      }]}>
        <LinearGradient colors={['#172943', '#0D1827']} style={styles.welcomeBalanceCard}>
          <View style={styles.welcomeBalanceTop}><Text style={styles.previewLabel}>BALANCE TOTAL</Text><Ionicons name="eye-outline" size={17} color={colors.muted} /></View>
          <Text style={styles.previewBalance}>$12,432.21</Text>
          <View style={styles.previewGain}><Ionicons name="trending-up" size={14} color={colors.success} /><Text style={styles.previewGainText}>+5.32%</Text></View>
          <View style={styles.previewChart}>{[24, 33, 28, 42, 36, 50, 45, 61, 55, 70].map((height, index) => <View key={index} style={[styles.previewBar, { height }]} />)}</View>
        </LinearGradient>
      </Animated.View>
      <Animated.View style={[styles.previewCoin, styles.previewCoinOne, {
        transform: [
          { translateY: coinMotion.interpolate({ inputRange: [0, 1], outputRange: [-4, 7] }) },
          { rotateZ: coinMotion.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '7deg'] }) },
        ],
      }]}><Text style={styles.previewCoinText}>₿</Text></Animated.View>
      <Animated.View style={[styles.previewCoin, styles.previewCoinTwo, {
        transform: [
          { translateY: coinMotion.interpolate({ inputRange: [0, 1], outputRange: [6, -6] }) },
          { rotateZ: coinMotion.interpolate({ inputRange: [0, 1], outputRange: ['8deg', '-6deg'] }) },
        ],
      }]}><Text style={styles.previewCoinText}>◆</Text></Animated.View>
    </View>
  );
}

export function WelcomeScreen({ navigate }: { navigate: Navigate }) {
  const { showDialog, dialog } = useWalletDialog();
  return (
    <Screen scroll style={styles.welcome}>
      <AbstractBackdrop />
      <View style={styles.entryBrand}><LogoMark size={42} /><Text style={styles.entryBrandText}>Wallet</Text></View>
      <View style={styles.welcomeTop}>
        <WelcomePortfolioVisual />
        <Text style={[commonStyles.title, styles.welcomeTitle]}>Tu portafolio digital,{`\n`}simple y seguro</Text>
        <Text style={[commonStyles.subtitle, styles.welcomeSubtitle]}>Administra activos, transferencias y tarjetas desde una experiencia creada para tu teléfono.</Text>
      </View>
      <View style={styles.welcomePanel}>
        <GradientButton label="Crear cuenta" onPress={() => navigate('register')} />
        <OutlineButton label="Iniciar sesión" onPress={() => navigate('login')} />
        <Pressable onPress={() => showDialog({ title: 'Importación protegida', message: 'Esta función se habilitará cuando se conecte el módulo seguro de claves.', tone: 'info' })}><Text style={styles.entryLink}>Importar una billetera existente</Text></Pressable>
      </View>
      {dialog}
    </Screen>
  );
}

function AuthFloatingVisual({ mode }: { mode: 'login' | 'register' }) {
  const floatMotion = useRef(new Animated.Value(0)).current;
  const orbitMotion = useRef(new Animated.Value(0)).current;
  const glowMotion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floating = Animated.loop(Animated.sequence([
      Animated.timing(floatMotion, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatMotion, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const orbiting = Animated.loop(Animated.timing(orbitMotion, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }));
    const glowing = Animated.loop(Animated.sequence([
      Animated.timing(glowMotion, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowMotion, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    floating.start();
    orbiting.start();
    glowing.start();
    return () => {
      floating.stop();
      orbiting.stop();
      glowing.stop();
    };
  }, [floatMotion, glowMotion, orbitMotion]);

  const floatingStyle = {
    transform: [
      { translateY: floatMotion.interpolate({ inputRange: [0, 1], outputRange: [5, -7] }) },
      { rotateZ: floatMotion.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] }) },
      { scale: floatMotion.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] }) },
    ],
  };
  const orbitRotation = orbitMotion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowStyle = {
    opacity: glowMotion.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.62] }),
    transform: [{ scale: glowMotion.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.1] }) }],
  };

  return (
    <View style={styles.authVisual} pointerEvents="none">
      <Animated.View style={[styles.authVisualGlow, glowStyle]} />
      <Animated.View style={[styles.authVisualOrbit, { transform: [{ rotate: orbitRotation }] }]}>
        <View style={styles.authVisualOrbitDot} />
        <View style={styles.authVisualOrbitDotSecondary} />
      </Animated.View>
      <Animated.View style={[styles.authVisualCard, floatingStyle]}>
        <LinearGradient colors={mode === 'login' ? ['#347EFF', '#17254A'] : ['#586DFF', '#172044']} style={styles.authVisualGradient}>
          <LogoMark size={58} />
          <View style={styles.authVisualBadge}><Ionicons name={mode === 'login' ? 'lock-closed' : 'person-add'} size={16} color="#FFF" /></View>
        </LinearGradient>
      </Animated.View>
      <View style={[styles.authVisualChip, styles.authVisualChipLeft]}><Ionicons name="shield-checkmark" size={16} color="#58E5BD" /></View>
      <View style={[styles.authVisualChip, styles.authVisualChipRight]}><Ionicons name="sparkles" size={15} color="#82B8FF" /></View>
    </View>
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
      <AbstractBackdrop />
      <Header title="" onBack={() => navigate('welcome')} />
      <View style={styles.authIntro}>
        <View style={styles.entryBrand}><LogoMark size={40} /><Text style={styles.entryBrandText}>Wallet</Text></View>
        {isLogin ? <AuthFloatingVisual mode={mode} /> : null}
        <Text style={[commonStyles.title, styles.authTitle, !isLogin && styles.authTitleWithoutVisual]}>{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</Text>
        <Text style={[commonStyles.subtitle, styles.authSubtitle]}>{isLogin ? 'Accede a tu portafolio y continúa donde lo dejaste.' : 'Configura tu perfil y empieza a administrar tus activos.'}</Text>
      </View>
      <Card style={styles.authPanel}>
        <View style={styles.authForm}>
          {!isLogin ? <><Text style={commonStyles.label}>Nombre</Text><View style={styles.authField}><Ionicons name="person-outline" size={20} color={colors.muted} /><TextInput value={displayName} onChangeText={setDisplayName} style={styles.authInput} placeholder="Tu nombre" placeholderTextColor={colors.muted} /></View></> : null}
          <Text style={commonStyles.label}>Correo electrónico</Text>
          <View style={styles.authField}><Ionicons name="mail-outline" size={20} color={colors.muted} /><TextInput value={email} onChangeText={setEmail} style={styles.authInput} placeholder="correo@ejemplo.com" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" /></View>
          <Text style={commonStyles.label}>Contraseña</Text>
          <View style={styles.passwordField}><Ionicons name="lock-closed-outline" size={20} color={colors.muted} /><TextInput value={password} onChangeText={setPassword} style={styles.passwordInput} placeholder="Mínimo 8 caracteres" placeholderTextColor={colors.muted} secureTextEntry={!passwordVisible} autoCapitalize="none" /><Pressable onPress={() => setPasswordVisible((value) => !value)} hitSlop={12}><Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6FA8FF" /></Pressable></View>
          {!isLogin && password.length ? <View style={styles.passwordChecks}>{passwordChecks.map((check) => <View key={check.label} style={styles.passwordCheck}><Ionicons name={check.ok ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={check.ok ? colors.success : colors.muted} /><Text style={[styles.passwordCheckText, check.ok && { color: colors.success }]}>{check.label}</Text></View>)}</View> : null}
          {!isLogin ? <><Text style={commonStyles.label}>PIN de 6 dígitos</Text><View style={styles.authField}><Ionicons name="keypad-outline" size={20} color={colors.muted} /><TextInput value={pin} onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, 6))} style={styles.authInput} placeholder="••••••" placeholderTextColor={colors.muted} secureTextEntry keyboardType="number-pad" /></View></> : null}
          {isLogin ? <View style={styles.authOptions}><View style={styles.secureAccess}><Ionicons name="shield-checkmark-outline" size={15} color={colors.success} /><Text style={styles.secureAccessText}>Acceso protegido</Text></View><Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text></View> : null}
          <GradientButton label={busy ? (isLogin ? 'Verificando...' : 'Creando wallet...') : (isLogin ? 'Entrar a Wallet' : 'Crear cuenta')} disabled={disabled} onPress={() => void run()} icon="arrow-forward" />
        </View>
      </Card>
      {isLogin && __DEV__ ? <Text style={styles.demoCredentials}>Credenciales locales cargadas en modo desarrollo</Text> : null}
      <Pressable onPress={() => navigate(isLogin ? 'register' : 'login')}><Text style={styles.link}>{isLogin ? '¿No tienes cuenta? Crear una cuenta' : '¿Ya tienes cuenta? Iniciar sesión'}</Text></Pressable>
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
      <Text style={[commonStyles.subtitle, styles.authSubtitle]}>Ingresa el código de 6 dígitos enviado a {email}. Si llegaste aquí al iniciar sesión y el código venció, solicita uno nuevo.</Text>
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
          <Pressable style={styles.accountHeader} onPress={() => navigate('profile')}><LogoMark size={38} /><View><Text style={styles.greeting}>{data.wallet.name}</Text><Text style={styles.walletName}>{data.wallet.address.slice(0, 7)}...{data.wallet.address.slice(-4)}</Text></View><Ionicons name="chevron-down" size={16} color={colors.muted} /></Pressable>
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
    [{ icon: 'card-outline' as const, title: 'Tarjetas virtuales', sub: `${data.cards.length} agregada${data.cards.length === 1 ? '' : 's'}`, screen: 'cards' as AppScreen }, { icon: 'id-card-outline' as const, title: 'Verificación de identidad', sub: 'Completa o consulta tu KYC', screen: 'kyc' as AppScreen }, { icon: 'shield-checkmark-outline' as const, title: 'Seguridad' }, { icon: 'cloud-upload-outline' as const, title: 'Backups' }, { icon: 'globe-outline' as const, title: 'Redes', sub: 'Ethereum, Solana, BSC...' }, { icon: 'settings-outline' as const, title: 'Preferencias', sub: 'Fiat, tema, idioma...' }],
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

function SelectionModal<T extends { id: number }>({ visible, title, placeholder, items, selectedId, getSearchText, renderItem, onSelect, onClose }: {
  visible: boolean;
  title: string;
  placeholder: string;
  items: T[];
  selectedId?: number | null;
  getSearchText: (item: T) => string;
  renderItem: (item: T, selected: boolean) => ReactNode;
  onSelect: (item: T) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  useEffect(() => { if (!visible) setQuery(''); }, [visible]);
  const normalized = query.trim().toLowerCase();
  const filtered = items.filter((item) => !normalized || getSearchText(item).toLowerCase().includes(normalized));
  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.selectionBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.selectionSheet}>
        <View style={styles.selectionHandle} />
        <View style={styles.selectionHeader}><Text style={styles.selectionTitle}>{title}</Text><Pressable onPress={onClose} hitSlop={12}><Ionicons name="close" size={26} color={colors.text} /></Pressable></View>
        <View style={styles.adminSearch}><Ionicons name="search" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} style={styles.adminSearchInput} placeholder={placeholder} placeholderTextColor={colors.muted} autoCapitalize="none" /></View>
        <ScrollView style={styles.selectionList} contentContainerStyle={styles.selectionListContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {filtered.length ? filtered.map((item) => <Pressable key={item.id} onPress={() => { onSelect(item); onClose(); }} style={[styles.selectionOption, item.id === selectedId && styles.selectionOptionSelected]}>{renderItem(item, item.id === selectedId)}</Pressable>) : <Text style={styles.adminEmpty}>No se encontraron resultados.</Text>}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function UserSelectionModal({ visible, users, selectedId, onSelect, onClose }: { visible: boolean; users: AdminUser[]; selectedId?: number | null; onSelect: (user: AdminUser) => void; onClose: () => void }) {
  return <SelectionModal visible={visible} title="Seleccionar usuario" placeholder="Buscar nombre, correo o dirección" items={users} selectedId={selectedId} getSearchText={(user) => `${user.displayName} ${user.email} ${user.address}`} onSelect={onSelect} onClose={onClose} renderItem={(user, selected) => <>
    <View style={[styles.adminIcon, !user.emailVerified && styles.adminIconPending]}><Ionicons name={user.emailVerified ? 'person' : 'mail-unread'} size={20} color="#FFF" /></View>
    <View style={styles.flex}><View style={styles.adminUserNameRow}><Text style={styles.assetTitle}>{user.displayName}</Text><View style={[styles.adminStatus, user.emailVerified ? styles.adminStatusVerified : styles.adminStatusPending]}><Text style={[styles.adminStatusText, { color: user.emailVerified ? colors.success : colors.warning }]}>{user.emailVerified ? 'VERIFICADA' : 'PENDIENTE'}</Text></View></View><Text style={styles.assetSymbol}>{user.email}</Text><Text style={styles.settingSub}>{money(user.totalUsd)} · {user.address.slice(0, 7)}...{user.address.slice(-4)}</Text></View>
    <Ionicons name={selected ? 'checkmark-circle' : 'chevron-forward'} size={22} color={selected ? '#6FA8FF' : colors.muted} />
  </>} />;
}

export function AdminScreen({ navigate }: { navigate: Navigate }) {
  const options = [
    { screen: 'adminUsers' as const, icon: 'people-outline' as const, title: 'Gestión de usuarios', body: 'Verifica cuentas, restablece accesos y elimina usuarios.', color: '#625EFF' },
    { screen: 'adminFund' as const, icon: 'cash-outline' as const, title: 'Acreditar saldo', body: 'Transfiere activos ficticios a una cartera registrada.', color: '#2588E8' },
    { screen: 'adminKyc' as const, icon: 'id-card-outline' as const, title: 'Revisión KYC', body: 'Evalúa identidad, documentación y nivel de riesgo.', color: '#16A58A' },
  ];
  return <Screen scroll>
    <Header title="Administración" onBack={() => navigate('profile')} right={<Ionicons name="shield-checkmark" size={23} color="#8F83FF" />} />
    <Text style={commonStyles.title}>Centro administrativo</Text>
    <Text style={[commonStyles.subtitle, { marginTop: 8, marginBottom: 22 }]}>Selecciona el módulo que deseas utilizar.</Text>
    <View style={styles.adminHubList}>{options.map((option) => <Pressable key={option.screen} onPress={() => navigate(option.screen)}><Card style={styles.adminHubCard}><View style={[styles.adminHubIcon, { backgroundColor: option.color }]}><Ionicons name={option.icon} size={27} color="#FFF" /></View><View style={styles.flex}><Text style={styles.adminHubTitle}>{option.title}</Text><Text style={styles.adminHubBody}>{option.body}</Text></View><Ionicons name="chevron-forward" size={24} color={colors.muted} /></Card></Pressable>)}</View>
  </Screen>;
}

export function AdminUsersScreen({ navigate, loadUsers, verifyUser, resetPassword, deleteUser }: {
  navigate: Navigate;
  loadUsers: () => Promise<AdminUser[]>;
  verifyUser: (userId: number) => Promise<{ displayName: string; alreadyVerified: boolean }>;
  resetPassword: (userId: number) => Promise<{ displayName: string; email: string }>;
  deleteUser: (userId: number) => Promise<{ displayName: string }>;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<'verify' | 'reset' | 'delete' | null>(null);
  const { showDialog, dialog } = useWalletDialog();
  const target = users.find((user) => user.id === selectedUserId);
  const reload = async () => {
    try {
      const loaded = (await loadUsers()).filter((user) => user.role !== 'admin');
      setUsers(loaded);
      setSelectedUserId((current) => loaded.some((user) => user.id === current) ? current : null);
    } catch (error) { showDialog({ title: 'No se pudieron cargar las cuentas', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); }
    finally { setLoading(false); }
  };
  const runAction = async (action: 'verify' | 'reset' | 'delete', operation: () => Promise<{ title: string; message: string }>) => {
    try { setBusyAction(action); const result = await operation(); await reload(); showDialog({ title: result.title, message: result.message, tone: 'success' }); }
    catch (error) { showDialog({ title: 'No se pudo completar la acción', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); }
    finally { setBusyAction(null); }
  };
  useEffect(() => { void reload(); }, []);
  return <Screen scroll>
    <Header title="Gestión de usuarios" onBack={() => navigate('admin')} />
    <Text style={commonStyles.title}>Administrar cuenta</Text>
    <Text style={[commonStyles.subtitle, { marginTop: 8, marginBottom: 20 }]}>Elige un usuario desde el selector para gestionar su acceso.</Text>
    <Text style={commonStyles.label}>Usuario</Text>
    <Pressable onPress={() => setPickerOpen(true)} disabled={loading || users.length === 0}><Card style={styles.adminSelector}>{target ? <><View style={[styles.adminIcon, !target.emailVerified && styles.adminIconPending]}><Ionicons name={target.emailVerified ? 'person' : 'mail-unread'} size={21} color="#FFF" /></View><View style={styles.flex}><Text style={styles.assetTitle}>{target.displayName}</Text><Text style={styles.assetSymbol}>{target.email}</Text></View></> : <><View style={styles.adminSelectorPlaceholder}><Ionicons name="person-add-outline" size={23} color="#7FB2FF" /></View><View style={styles.flex}><Text style={styles.assetTitle}>{loading ? 'Cargando usuarios...' : users.length ? 'Seleccionar usuario' : 'No hay usuarios disponibles'}</Text><Text style={styles.assetSymbol}>Abre el buscador para elegir una cuenta</Text></View></>}<Ionicons name="chevron-down" size={22} color="#7FB2FF" /></Card></Pressable>
    {target ? <Card style={styles.adminManagement}>
      <View style={styles.adminUserNameRow}><Text style={styles.adminManagementTitle}>{target.displayName}</Text><View style={[styles.adminStatus, target.emailVerified ? styles.adminStatusVerified : styles.adminStatusPending]}><Text style={[styles.adminStatusText, { color: target.emailVerified ? colors.success : colors.warning }]}>{target.emailVerified ? 'VERIFICADA' : 'PENDIENTE'}</Text></View></View>
      <Text style={styles.settingSub}>{target.email}</Text><Text style={styles.settingSub}>Balance total: {money(target.totalUsd)}</Text>
      <View style={styles.adminManagementActions}>
        {!target.emailVerified ? <Pressable disabled={busyAction !== null} onPress={() => void runAction('verify', async () => { const result = await verifyUser(target.id); return { title: 'Cuenta verificada', message: `${result.displayName} ya puede iniciar sesión normalmente.` }; })} style={[styles.adminActionButton, styles.adminActionVerify]}><Ionicons name="checkmark-circle-outline" size={19} color={colors.success} /><Text style={[styles.adminActionText, { color: colors.success }]}>{busyAction === 'verify' ? 'Verificando...' : 'Verificar cuenta'}</Text></Pressable> : null}
        <Pressable disabled={busyAction !== null} onPress={() => showDialog({ title: 'Restablecer contraseña', message: `Se cerrarán las sesiones de ${target.displayName} y se enviará una contraseña temporal a ${target.email}.`, tone: 'info', confirmLabel: 'Restablecer', cancelLabel: 'Cancelar', onConfirm: () => void runAction('reset', async () => { const result = await resetPassword(target.id); return { title: 'Contraseña restablecida', message: `La contraseña temporal fue enviada a ${result.email}.` }; }) })} style={styles.adminActionButton}><Ionicons name="key-outline" size={19} color="#7FB2FF" /><Text style={styles.adminActionText}>{busyAction === 'reset' ? 'Restableciendo...' : 'Restablecer contraseña'}</Text></Pressable>
        <Pressable disabled={busyAction !== null} onPress={() => showDialog({ title: 'Eliminar usuario', message: `Se eliminarán permanentemente la cuenta, billetera, saldos, tarjetas y movimientos de ${target.displayName}.`, tone: 'error', confirmLabel: 'Eliminar definitivamente', cancelLabel: 'Cancelar', onConfirm: () => void runAction('delete', async () => { const result = await deleteUser(target.id); return { title: 'Usuario eliminado', message: `La cuenta de ${result.displayName} fue eliminada.` }; }) })} style={[styles.adminActionButton, styles.adminActionDelete]}><Ionicons name="trash-outline" size={19} color={colors.danger} /><Text style={[styles.adminActionText, { color: colors.danger }]}>{busyAction === 'delete' ? 'Eliminando...' : 'Eliminar usuario'}</Text></Pressable>
      </View>
    </Card> : null}
    <UserSelectionModal visible={pickerOpen} users={users} selectedId={selectedUserId} onSelect={(user) => setSelectedUserId(user.id)} onClose={() => setPickerOpen(false)} />
    {dialog}
  </Screen>;
}

const kycStatusLabel = { not_submitted: 'NO ENVIADO', pending: 'PENDIENTE', approved: 'APROBADO', rejected: 'RECHAZADO' } as const;
const kycStatusColor = { not_submitted: colors.muted, pending: colors.warning, approved: colors.success, rejected: colors.danger } as const;
const documentLabels = { national_id: 'Cédula / ID nacional', passport: 'Pasaporte', driver_license: 'Licencia de conducir' } as const;

export function KycScreen({ navigate, load, submit }: {
  navigate: Navigate;
  load: () => Promise<KycProfile>;
  submit: (profile: Omit<KycProfile, 'status'>) => Promise<KycProfile>;
}) {
  const [profile, setProfile] = useState<KycProfile>({ status: 'not_submitted' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fullLegalName, setFullLegalName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [nationality, setNationality] = useState('');
  const [residenceCountry, setResidenceCountry] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [documentType, setDocumentType] = useState<'national_id' | 'passport' | 'driver_license'>('national_id');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentReference, setDocumentReference] = useState('');
  const { showDialog, dialog } = useWalletDialog();
  const hydrate = (next: KycProfile) => {
    setProfile(next); setFullLegalName(next.fullLegalName || ''); setBirthDate(next.birthDate || ''); setNationality(next.nationality || '');
    setResidenceCountry(next.residenceCountry || ''); setResidentialAddress(next.residentialAddress || ''); setDocumentType(next.documentType || 'national_id');
    setDocumentNumber(next.documentNumber || ''); setDocumentReference(next.documentReference || '');
  };
  useEffect(() => { void load().then(hydrate).catch((error) => showDialog({ title: 'No se pudo cargar tu KYC', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' })).finally(() => setLoading(false)); }, []);
  const locked = profile.status === 'pending' || profile.status === 'approved';
  const send = async () => {
    if (![fullLegalName, birthDate, nationality, residenceCountry, residentialAddress, documentNumber, documentReference].every((value) => value.trim())) {
      showDialog({ title: 'Completa la información', message: 'Todos los campos son necesarios para enviar la verificación.', tone: 'info' }); return;
    }
    try { setBusy(true); hydrate(await submit({ fullLegalName, birthDate, nationality, residenceCountry, residentialAddress, documentType, documentNumber, documentReference, selfieCheck: true })); showDialog({ title: 'Solicitud enviada', message: 'Administración revisará tu identidad y documentación.', tone: 'success' }); }
    catch (error) { showDialog({ title: 'No se pudo enviar', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); }
    finally { setBusy(false); }
  };
  return <Screen scroll>
    <Header title="Verificación de identidad" onBack={() => navigate('profile')} right={<Ionicons name="shield-checkmark" size={23} color="#58D7B7" />} />
    <Card style={styles.kycHero}><LinearGradient colors={['#123C3B', '#14263C']} style={styles.kycHeroIcon}><Ionicons name="finger-print" size={34} color="#69E0C4" /></LinearGradient><View style={styles.flex}><Text style={styles.adminHubTitle}>Conoce a tu cliente</Text><Text style={styles.adminHubBody}>Tus datos permiten validar identidad y reducir fraude.</Text></View><View style={[styles.kycBadge, { backgroundColor: `${kycStatusColor[profile.status]}20` }]}><Text style={[styles.kycBadgeText, { color: kycStatusColor[profile.status] }]}>{loading ? 'CARGANDO' : kycStatusLabel[profile.status]}</Text></View></Card>
    {profile.status === 'rejected' && profile.reviewNote ? <Card style={styles.kycNotice}><Ionicons name="alert-circle-outline" size={22} color={colors.danger} /><View style={styles.flex}><Text style={styles.settingTitle}>Solicitud observada</Text><Text style={styles.settingSub}>{profile.reviewNote}</Text></View></Card> : null}
    {profile.status === 'approved' ? <Card style={styles.kycApproved}><Ionicons name="checkmark-circle" size={48} color={colors.success} /><Text style={styles.emptyTitle}>Identidad verificada</Text><Text style={styles.emptyBody}>La revisión KYC fue aprobada con nivel de riesgo {profile.riskLevel === 'low' ? 'bajo' : profile.riskLevel === 'medium' ? 'medio' : 'alto'}.</Text></Card> : <View style={styles.kycForm}>
      <Text style={commonStyles.label}>Nombre legal completo</Text><TextInput editable={!locked} value={fullLegalName} onChangeText={setFullLegalName} style={commonStyles.input} placeholder="Como aparece en tu documento" placeholderTextColor={colors.muted} />
      <Text style={commonStyles.label}>Fecha de nacimiento</Text><TextInput editable={!locked} value={birthDate} onChangeText={setBirthDate} style={commonStyles.input} placeholder="AAAA-MM-DD" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" />
      <View style={styles.expiryRow}><View style={styles.flex}><Text style={commonStyles.label}>Nacionalidad</Text><TextInput editable={!locked} value={nationality} onChangeText={setNationality} style={commonStyles.input} placeholder="Ecuatoriana" placeholderTextColor={colors.muted} /></View><View style={styles.flex}><Text style={commonStyles.label}>Residencia</Text><TextInput editable={!locked} value={residenceCountry} onChangeText={setResidenceCountry} style={commonStyles.input} placeholder="Ecuador" placeholderTextColor={colors.muted} /></View></View>
      <Text style={commonStyles.label}>Dirección residencial</Text><TextInput editable={!locked} value={residentialAddress} onChangeText={setResidentialAddress} style={commonStyles.input} placeholder="Ciudad, calle y número" placeholderTextColor={colors.muted} />
      <Text style={commonStyles.label}>Tipo de documento</Text><View style={styles.kycChoiceRow}>{(Object.keys(documentLabels) as Array<keyof typeof documentLabels>).map((type) => <Pressable disabled={locked} key={type} onPress={() => setDocumentType(type)} style={[styles.kycChoice, documentType === type && styles.kycChoiceActive]}><Text style={[styles.kycChoiceText, documentType === type && { color: '#FFF' }]}>{type === 'national_id' ? 'Cédula' : type === 'passport' ? 'Pasaporte' : 'Licencia'}</Text></Pressable>)}</View>
      <Text style={commonStyles.label}>Número de documento</Text><TextInput editable={!locked} value={documentNumber} onChangeText={setDocumentNumber} style={commonStyles.input} placeholder="Número del documento" placeholderTextColor={colors.muted} autoCapitalize="characters" />
      <Text style={commonStyles.label}>Referencia del documento</Text><TextInput editable={!locked} value={documentReference} onChangeText={setDocumentReference} style={commonStyles.input} placeholder="Ej. ID-frente-2026" placeholderTextColor={colors.muted} />
      <Card style={styles.kycPrivacy}><Ionicons name="lock-closed-outline" size={20} color="#7FB2FF" /><Text style={styles.kycPrivacyText}>La captura documental y comprobación biométrica se simulan internamente por ahora. No existe consulta con una entidad externa.</Text></Card>
      <GradientButton disabled={locked || busy || loading} label={profile.status === 'pending' ? 'En revisión administrativa' : busy ? 'Enviando solicitud...' : profile.status === 'rejected' ? 'Volver a enviar' : 'Enviar para revisión'} onPress={() => void send()} />
    </View>}
    {dialog}
  </Screen>;
}

type AdminKycItem = KycProfile & { id: number; userId: number; displayName: string; email: string };

export function AdminKycScreen({ navigate, loadRequests, review }: {
  navigate: Navigate;
  loadRequests: () => Promise<KycProfile[]>;
  review: (userId: number, body: { status: 'approved' | 'rejected'; riskLevel: 'low' | 'medium' | 'high'; reviewNote: string }) => Promise<{ displayName: string; status: string }>;
}) {
  const [requests, setRequests] = useState<AdminKycItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [reviewNote, setReviewNote] = useState('');
  const [busy, setBusy] = useState(false);
  const { showDialog, dialog } = useWalletDialog();
  const selected = requests.find((item) => item.userId === selectedId);
  const reload = async () => { try { const list = await loadRequests(); setRequests(list.filter((item) => item.userId).map((item) => ({ ...item, id: item.userId!, userId: item.userId!, displayName: item.displayName || '', email: item.email || '' }))); } catch (error) { showDialog({ title: 'No se pudo cargar KYC', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); } };
  useEffect(() => { void reload(); }, []);
  const decide = async (status: 'approved' | 'rejected') => {
    if (!selected) return;
    if (status === 'rejected' && reviewNote.trim().length < 5) { showDialog({ title: 'Indica una observación', message: 'Explica qué debe corregir el usuario antes de rechazar.', tone: 'info' }); return; }
    try { setBusy(true); const result = await review(selected.userId, { status, riskLevel, reviewNote }); await reload(); showDialog({ title: status === 'approved' ? 'KYC aprobado' : 'KYC rechazado', message: `La decisión sobre ${result.displayName} fue registrada y enviada por correo.`, tone: 'success' }); }
    catch (error) { showDialog({ title: 'No se pudo registrar la decisión', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); }
    finally { setBusy(false); }
  };
  return <Screen scroll>
    <Header title="Revisión KYC" onBack={() => navigate('admin')} right={<Ionicons name="finger-print" size={25} color="#58D7B7" />} />
    <Text style={commonStyles.title}>Solicitudes de identidad</Text><Text style={[commonStyles.subtitle, { marginTop: 8, marginBottom: 20 }]}>Revisa la información, clasifica el riesgo y registra una decisión.</Text>
    <Text style={commonStyles.label}>Solicitud</Text><Pressable onPress={() => setPickerOpen(true)} disabled={!requests.length}><Card style={styles.adminSelector}>{selected ? <><View style={[styles.adminIcon, { backgroundColor: kycStatusColor[selected.status] }]}><Ionicons name="id-card-outline" size={22} color="#FFF" /></View><View style={styles.flex}><Text style={styles.assetTitle}>{selected.displayName}</Text><Text style={styles.assetSymbol}>{selected.email}</Text></View></> : <><View style={styles.adminSelectorPlaceholder}><Ionicons name="documents-outline" size={23} color="#69E0C4" /></View><View style={styles.flex}><Text style={styles.assetTitle}>{requests.length ? 'Seleccionar solicitud' : 'No hay solicitudes KYC'}</Text><Text style={styles.assetSymbol}>Busca por nombre, correo o documento</Text></View></>}<Ionicons name="chevron-down" size={22} color="#69E0C4" /></Card></Pressable>
    {selected ? <Card style={styles.kycReviewCard}><View style={styles.adminUserNameRow}><Text style={styles.adminManagementTitle}>{selected.fullLegalName}</Text><View style={[styles.kycBadge, { backgroundColor: `${kycStatusColor[selected.status]}20` }]}><Text style={[styles.kycBadgeText, { color: kycStatusColor[selected.status] }]}>{kycStatusLabel[selected.status]}</Text></View></View>
      <View style={styles.kycDetails}>{[['Nacimiento', selected.birthDate], ['Nacionalidad', selected.nationality], ['Residencia', selected.residenceCountry], ['Dirección', selected.residentialAddress], ['Documento', documentLabels[selected.documentType || 'national_id']], ['Número', selected.documentNumber], ['Referencia', selected.documentReference], ['Biometría interna', selected.selfieCheck ? 'Completada' : 'Pendiente']].map(([label, value]) => <View key={label} style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={[styles.infoValue, styles.kycDetailValue]}>{value || '—'}</Text></View>)}</View>
      {selected.status === 'pending' ? <><Text style={[commonStyles.label, { marginTop: 18 }]}>Nivel de riesgo</Text><View style={styles.kycChoiceRow}>{(['low', 'medium', 'high'] as const).map((level) => <Pressable key={level} onPress={() => setRiskLevel(level)} style={[styles.kycChoice, riskLevel === level && styles.kycChoiceActive]}><Text style={[styles.kycChoiceText, riskLevel === level && { color: '#FFF' }]}>{level === 'low' ? 'Bajo' : level === 'medium' ? 'Medio' : 'Alto'}</Text></Pressable>)}</View><Text style={commonStyles.label}>Observación</Text><TextInput value={reviewNote} onChangeText={setReviewNote} style={[commonStyles.input, styles.kycNote]} placeholder="Opcional al aprobar; obligatoria al rechazar" placeholderTextColor={colors.muted} multiline /><View style={styles.expiryRow}><View style={styles.flex}><OutlineButton label="Rechazar" disabled={busy} onPress={() => void decide('rejected')} /></View><View style={styles.flex}><GradientButton label={busy ? 'Procesando...' : 'Aprobar KYC'} disabled={busy} onPress={() => void decide('approved')} /></View></View></> : <Card style={styles.kycNotice}><Ionicons name="information-circle-outline" size={22} color={kycStatusColor[selected.status]} /><Text style={styles.kycPrivacyText}>{selected.reviewNote || `Solicitud ${kycStatusLabel[selected.status].toLowerCase()} con riesgo ${selected.riskLevel || 'sin clasificar'}.`}</Text></Card>}
    </Card> : null}
    <SelectionModal visible={pickerOpen} title="Seleccionar solicitud KYC" placeholder="Buscar nombre, correo o documento" items={requests} selectedId={selectedId} getSearchText={(item) => `${item.displayName} ${item.email} ${item.documentNumber || ''}`} onSelect={(item) => { setSelectedId(item.userId); setRiskLevel(item.riskLevel || 'low'); setReviewNote(item.reviewNote || ''); }} onClose={() => setPickerOpen(false)} renderItem={(item, active) => <><View style={[styles.adminIcon, { backgroundColor: kycStatusColor[item.status] }]}><Ionicons name="id-card-outline" size={20} color="#FFF" /></View><View style={styles.flex}><Text style={styles.assetTitle}>{item.displayName}</Text><Text style={styles.assetSymbol}>{item.email}</Text><Text style={[styles.settingSub, { color: kycStatusColor[item.status] }]}>{kycStatusLabel[item.status]} · {item.documentNumber || 'Sin documento'}</Text></View><Ionicons name={active ? 'checkmark-circle' : 'chevron-forward'} size={22} color={active ? '#69E0C4' : colors.muted} /></>} />
    {dialog}
  </Screen>;
}

export function AdminFundScreen({ assets, navigate, loadUsers, submit }: { assets: Asset[]; navigate: Navigate; loadUsers: () => Promise<AdminUser[]>; submit: (userId: number, symbol: string, amount: number) => Promise<string> }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(assets[0]?.id ?? null);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [amount, setAmount] = useState('100');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showDialog, dialog } = useWalletDialog();
  const target = users.find((user) => user.id === selectedUserId);
  const asset = assets.find((item) => item.id === selectedAssetId) ?? assets[0]!;
  const reload = async () => {
    try { const loaded = (await loadUsers()).filter((user) => user.role !== 'admin'); setUsers(loaded); setSelectedUserId((current) => loaded.some((user) => user.id === current) ? current : null); }
    catch (error) { showDialog({ title: 'No se pudieron cargar las cuentas', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);
  return <Screen scroll>
    <Header title="Acreditar saldo" onBack={() => navigate('admin')} />
    <Text style={commonStyles.title}>Transferir a cartera</Text>
    <Text style={[commonStyles.subtitle, { marginTop: 8, marginBottom: 22 }]}>Selecciona el destinatario, el activo y el monto de la acreditación ficticia.</Text>
    <Text style={commonStyles.label}>Cuenta de destino</Text>
    <Pressable onPress={() => setUserPickerOpen(true)} disabled={loading || users.length === 0}><Card style={styles.adminSelector}>{target ? <><View style={styles.adminIcon}><Ionicons name="person" size={21} color="#FFF" /></View><View style={styles.flex}><Text style={styles.assetTitle}>{target.displayName}</Text><Text style={styles.assetSymbol}>{target.email}</Text><Text style={styles.settingSub}>Balance: {money(target.totalUsd)}</Text></View></> : <><View style={styles.adminSelectorPlaceholder}><Ionicons name="people-outline" size={23} color="#7FB2FF" /></View><View style={styles.flex}><Text style={styles.assetTitle}>{loading ? 'Cargando usuarios...' : users.length ? 'Seleccionar usuario' : 'No hay usuarios disponibles'}</Text><Text style={styles.assetSymbol}>Busca la cuenta que recibirá el saldo</Text></View></>}<Ionicons name="chevron-down" size={22} color="#7FB2FF" /></Card></Pressable>
    <Text style={[commonStyles.label, { marginTop: 20 }]}>Activo o moneda</Text>
    <Pressable onPress={() => setAssetPickerOpen(true)}><Card style={styles.adminSelector}><CoinIcon asset={asset} /><View style={styles.flex}><Text style={styles.assetTitle}>{asset.name}</Text><Text style={styles.assetSymbol}>{asset.symbol} · {asset.network}</Text></View><Ionicons name="chevron-down" size={22} color="#7FB2FF" /></Card></Pressable>
    <Text style={[commonStyles.label, { marginTop: 20 }]}>Cantidad de {asset.symbol}</Text>
    <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={commonStyles.input} placeholder="0.00" placeholderTextColor={colors.muted} />
    <View style={styles.adminPreview}><Text style={styles.infoLabel}>Valor estimado</Text><Text style={styles.infoValue}>{money(Number(amount || 0) * asset.priceUsd)}</Text></View>
    <View style={styles.bottomAction}><GradientButton label={busy ? 'Acreditando saldo...' : 'Confirmar acreditación'} disabled={busy || !target || Number(amount) <= 0} onPress={async () => { if (!target) return; try { setBusy(true); const name = await submit(target.id, asset.symbol, Number(amount)); showDialog({ title: 'Saldo acreditado', message: `${name} recibió ${amountText(Number(amount))} ${asset.symbol}.`, tone: 'success' }); await reload(); } catch (error) { showDialog({ title: 'No se pudo acreditar', message: error instanceof Error ? error.message : 'Intenta nuevamente', tone: 'error' }); } finally { setBusy(false); } }} /></View>
    <UserSelectionModal visible={userPickerOpen} users={users} selectedId={selectedUserId} onSelect={(user) => setSelectedUserId(user.id)} onClose={() => setUserPickerOpen(false)} />
    <SelectionModal visible={assetPickerOpen} title="Seleccionar activo" placeholder="Buscar moneda, símbolo o red" items={assets} selectedId={asset.id} getSearchText={(item) => `${item.name} ${item.symbol} ${item.network}`} onSelect={(item) => setSelectedAssetId(item.id)} onClose={() => setAssetPickerOpen(false)} renderItem={(item, selected) => <><CoinIcon asset={item} /><View style={styles.flex}><Text style={styles.assetTitle}>{item.name}</Text><Text style={styles.assetSymbol}>{item.symbol} · {item.network}</Text><Text style={styles.settingSub}>Precio: {money(item.priceUsd)}</Text></View><Ionicons name={selected ? 'checkmark-circle' : 'chevron-forward'} size={22} color={selected ? '#6FA8FF' : colors.muted} /></>} />
    {dialog}
  </Screen>;
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
  glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, opacity: 0.22, backgroundColor: '#245DA8' },
  glowTop: { left: -130, top: 40 },
  glowBottom: { right: -100, bottom: -20, backgroundColor: '#193C76' },
  diagonalOne: { position: 'absolute', width: 520, height: 90, backgroundColor: '#101B2C', transform: [{ rotate: '38deg' }], left: -180, top: 230, opacity: 0.82 },
  diagonalTwo: { position: 'absolute', width: 520, height: 100, backgroundColor: '#11233B', transform: [{ rotate: '38deg' }], left: -80, bottom: 80, opacity: 0.72 },
  onboardingPager: { flex: 1 },
  onboardingArt: { flex: 1.1, minHeight: 340, alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', width: 270, height: 270, borderRadius: 135, borderWidth: 1 },
  orbitNode: { position: 'absolute', width: 12, height: 12, borderRadius: 6, top: 18, right: 38, shadowColor: '#7A70FF', shadowOpacity: 1, shadowRadius: 12 },
  innerOrbit: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1 },
  animatedArtCoin: { zIndex: 2 },
  artCoin: { width: 168, height: 168, borderRadius: 48, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }], ...shadow },
  artCoinActive: { borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  miniCoin: { position: 'absolute', width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  bitcoinOrbiter: { left: -25, top: 100 },
  ethereumOrbiter: { right: -25, top: 34 },
  miniCoinText: { color: '#FFF', fontSize: 30, fontWeight: '900' },
  onboardingCopy: { minHeight: 182, justifyContent: 'center' },
  onboardingEyebrow: { color: '#6FA8FF', fontSize: 10.5, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
  onboardingTitle: { fontSize: 31, lineHeight: 37 },
  onboardingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 },
  dots: { flexDirection: 'row', gap: 10 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#2B3244' },
  dotActive: { backgroundColor: '#4A8FFF', width: 24, height: 9 },
  nextSquare: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#397DFF', ...shadow },
  onboardingContinue: { minWidth: 142, height: 52, paddingHorizontal: 20, borderRadius: 17, backgroundColor: '#397DFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow },
  onboardingContinueText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  welcome: { minHeight: 740, paddingTop: 18, paddingBottom: 28 },
  entryBrand: { flexDirection: 'row', alignItems: 'center', gap: 11, zIndex: 2 },
  entryBrandText: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  welcomeTop: { alignItems: 'center', zIndex: 2, marginTop: 24 },
  welcomeVisual: { width: '100%', height: 260, alignItems: 'center', justifyContent: 'center' },
  welcomeVisualGlow: { position: 'absolute', width: '78%', height: 185, borderRadius: 70, backgroundColor: '#287CFF', shadowColor: '#378AFF', shadowOpacity: 0.65, shadowRadius: 34 },
  welcomeBalanceFloat: { width: '86%', minHeight: 205, borderRadius: 27, shadowColor: '#2C7EFF', shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 15 }, elevation: 12 },
  welcomeBalanceCard: { width: '100%', minHeight: 205, borderRadius: 27, borderWidth: 1, borderColor: '#29415F', padding: 19, ...shadow },
  welcomeBalanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabel: { color: colors.muted, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.2 },
  previewBalance: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 10 },
  previewGain: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  previewGainText: { color: colors.success, fontSize: 11, fontWeight: '800' },
  previewChart: { height: 75, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 13 },
  previewBar: { width: 4, borderRadius: 4, backgroundColor: '#4A96FF', opacity: 0.85 },
  previewCoin: { position: 'absolute', width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.background, ...shadow },
  previewCoinOne: { backgroundColor: '#F7931A', right: 5, top: 25 },
  previewCoinTwo: { backgroundColor: '#627EEA', left: 2, bottom: 28 },
  previewCoinText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  welcomeTitle: { textAlign: 'center', marginTop: 10, fontSize: 31, lineHeight: 38 },
  welcomeSubtitle: { textAlign: 'center', marginTop: 12, maxWidth: 340 },
  welcomeOrb: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(117,107,255,.32)', backgroundColor: 'rgba(71,67,177,.08)' },
  welcomeOrbInner: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(79,207,255,.18)' },
  welcomeActions: { gap: 16, zIndex: 2 },
  welcomePanel: { gap: 13, zIndex: 2, marginTop: 28, backgroundColor: 'rgba(10,17,27,.86)', borderWidth: 1, borderColor: '#1F2C3D', borderRadius: 25, padding: 16 },
  entryLink: { color: '#74AFFF', textAlign: 'center', fontSize: 13.5, fontWeight: '700', paddingVertical: 5 },
  authLogo: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  authIntro: { marginTop: 8, marginBottom: 24, zIndex: 2 },
  authVisual: { height: 170, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 2 },
  authVisualGlow: { position: 'absolute', width: 138, height: 138, borderRadius: 69, backgroundColor: '#2E74FF', shadowColor: '#4288FF', shadowOpacity: 0.75, shadowRadius: 34 },
  authVisualOrbit: { position: 'absolute', width: 154, height: 154, borderRadius: 77, borderWidth: 1, borderColor: 'rgba(92,145,255,.36)' },
  authVisualOrbitDot: { position: 'absolute', width: 9, height: 9, borderRadius: 5, top: 15, right: 22, backgroundColor: '#78B7FF', shadowColor: '#78B7FF', shadowOpacity: 1, shadowRadius: 9 },
  authVisualOrbitDotSecondary: { position: 'absolute', width: 6, height: 6, borderRadius: 3, bottom: 17, left: 21, backgroundColor: '#625DFF' },
  authVisualCard: { width: 108, height: 108, borderRadius: 32, padding: 1, shadowColor: '#327CFF', shadowOpacity: 0.65, shadowRadius: 22, shadowOffset: { width: 0, height: 13 }, elevation: 14 },
  authVisualGradient: { flex: 1, borderRadius: 31, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  authVisualBadge: { position: 'absolute', right: -7, bottom: 7, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111B2B', borderWidth: 2, borderColor: '#4A8FFF' },
  authVisualChip: { position: 'absolute', width: 35, height: 35, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111C2B', borderWidth: 1, borderColor: '#2C4260', shadowColor: '#3987FF', shadowOpacity: 0.35, shadowRadius: 10 },
  authVisualChipLeft: { left: '21%', bottom: 30, transform: [{ rotate: '-12deg' }] },
  authVisualChipRight: { right: '20%', top: 30, transform: [{ rotate: '10deg' }] },
  authTitle: { marginTop: 4, fontSize: 31 },
  authTitleWithoutVisual: { marginTop: 28 },
  authSubtitle: { marginTop: 10, maxWidth: 350 },
  authPanel: { padding: 18, borderRadius: 25, backgroundColor: 'rgba(14,21,32,.96)', borderColor: '#26364A', zIndex: 2 },
  authForm: { gap: 12 },
  authField: { minHeight: 58, borderRadius: 16, backgroundColor: '#111B29', borderWidth: 1, borderColor: '#26364A', flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 15 },
  authInput: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 0 },
  passwordField: { minHeight: 58, borderRadius: 16, backgroundColor: '#111B29', borderWidth: 1, borderColor: '#26364A', flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 15 },
  passwordInput: { flex: 1, color: colors.text, fontSize: 17, paddingRight: 12 },
  passwordChecks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  passwordCheck: { flexDirection: 'row', alignItems: 'center', gap: 5, width: '47%' },
  passwordCheckText: { color: colors.muted, fontSize: 12 },
  authOptions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 },
  secureAccess: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  secureAccessText: { color: colors.muted, fontSize: 11.5 },
  forgotText: { color: '#6FA8FF', fontSize: 11.5, fontWeight: '700' },
  demoCredentials: { color: colors.success, textAlign: 'center', fontSize: 11, marginTop: 14, zIndex: 2 },
  link: { color: '#6FA8FF', textAlign: 'center', fontSize: 14, fontWeight: '700', marginTop: 18, paddingVertical: 8, zIndex: 2 },
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
  accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingVertical: 7, paddingLeft: 8, paddingRight: 11 },
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
  adminIconPending: { backgroundColor: '#8A6627' },
  adminHubList: { gap: 14 },
  adminHubCard: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 15, padding: 17 },
  adminHubIcon: { width: 56, height: 56, borderRadius: 19, alignItems: 'center', justifyContent: 'center', ...shadow },
  adminHubTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  adminHubBody: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  adminSelector: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 },
  adminSelectorPlaceholder: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#12233A', borderWidth: 1, borderColor: '#294567', alignItems: 'center', justifyContent: 'center' },
  adminSearch: { minHeight: 56, borderRadius: 17, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, marginBottom: 16 },
  adminSearchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 0 },
  adminListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adminListHint: { color: colors.muted, fontSize: 11.5, marginBottom: 9 },
  adminUserList: { gap: 9 },
  adminUserRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 },
  adminUserRowSelected: { borderColor: '#4A8FFF', backgroundColor: '#121F31' },
  adminUserNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  adminStatus: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  adminStatusVerified: { backgroundColor: 'rgba(37,217,154,.12)' },
  adminStatusPending: { backgroundColor: 'rgba(242,177,71,.13)' },
  adminStatusText: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.6 },
  adminManagement: { marginTop: 16, padding: 15, borderColor: '#2A4260' },
  adminManagementTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  adminManagementActions: { gap: 9, marginTop: 15 },
  adminActionButton: { minHeight: 48, borderRadius: 14, backgroundColor: '#121E2E', borderWidth: 1, borderColor: '#2A3B52', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  adminActionVerify: { backgroundColor: 'rgba(37,217,154,.08)', borderColor: 'rgba(37,217,154,.32)' },
  adminActionDelete: { backgroundColor: 'rgba(255,86,112,.07)', borderColor: 'rgba(255,86,112,.3)' },
  adminActionText: { color: '#7FB2FF', fontSize: 13, fontWeight: '800' },
  adminSectionHeader: { marginTop: 28, marginBottom: 15, gap: 5 },
  selectionBackdrop: { flex: 1, backgroundColor: 'rgba(2,5,10,.72)', justifyContent: 'flex-end' },
  selectionSheet: { maxHeight: '78%', minHeight: 360, backgroundColor: '#0C1420', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: '#27384E', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 26 },
  selectionHandle: { width: 48, height: 5, borderRadius: 3, backgroundColor: '#34445B', alignSelf: 'center', marginBottom: 14 },
  selectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  selectionTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  selectionList: { flexGrow: 0 },
  selectionListContent: { gap: 9, paddingBottom: 12 },
  selectionOption: { minHeight: 74, borderRadius: 17, backgroundColor: '#111C2A', borderWidth: 1, borderColor: '#26364A', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  selectionOptionSelected: { borderColor: '#4A8FFF', backgroundColor: '#14253A' },
  adminTarget: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  adminEmpty: { color: colors.muted, textAlign: 'center', paddingVertical: 24 },
  adminPreview: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  kycHero: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 18, padding: 15 },
  kycHeroIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  kycBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, alignSelf: 'flex-start' },
  kycBadgeText: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.6 },
  kycNotice: { marginTop: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 14 },
  kycApproved: { alignItems: 'center', paddingVertical: 32, marginTop: 6 },
  kycForm: { gap: 10 },
  kycChoiceRow: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  kycChoice: { flex: 1, minHeight: 43, borderRadius: 13, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  kycChoiceActive: { backgroundColor: '#246F65', borderColor: '#58D7B7' },
  kycChoiceText: { color: colors.muted, fontSize: 11.5, fontWeight: '800', textAlign: 'center' },
  kycPrivacy: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 13, marginVertical: 4 },
  kycPrivacyText: { color: colors.muted, fontSize: 12, lineHeight: 18, flex: 1 },
  kycReviewCard: { marginTop: 16, padding: 15 },
  kycDetails: { marginTop: 12 },
  kycDetailValue: { maxWidth: '58%', textAlign: 'right' },
  kycNote: { minHeight: 82, textAlignVertical: 'top', paddingTop: 14 },
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
