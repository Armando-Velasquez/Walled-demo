import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
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
} from './components';
import { colors, radii, shadow } from './theme';
import type { AdminUser, AppScreen, Asset, Bootstrap, Dapp, Transaction } from './types';

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
  return (
    <Screen style={styles.splash}>
      <AbstractBackdrop />
      <View style={styles.splashCenter}>
        <LogoMark size={106} />
        <Text style={styles.brand}>Wallet</Text>
        <Text style={styles.tagline}>Tu mundo cripto,{`\n`}en una sola app.</Text>
      </View>
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
  const item = onboarding[index] ?? onboarding[0]!;
  return (
    <Screen>
      <View style={styles.onboardingArt}>
        <View style={[styles.orbit, { borderColor: `${item.accent}55` }]} />
        <LinearGradient colors={[item.accent, '#121936']} style={styles.artCoin}>
          <Ionicons name={item.icon} size={74} color="#E9EBFF" />
        </LinearGradient>
        <View style={[styles.miniCoin, { left: 28, top: 120, backgroundColor: '#F7931A' }]}><Text style={styles.miniCoinText}>₿</Text></View>
        <View style={[styles.miniCoin, { right: 25, top: 85, backgroundColor: '#627EEA' }]}><Text style={styles.miniCoinText}>◆</Text></View>
      </View>
      <View style={styles.onboardingCopy}>
        <Text style={commonStyles.title}>{item.title}</Text>
        <Text style={[commonStyles.subtitle, { marginTop: 14 }]}>{item.body}</Text>
      </View>
      <View style={styles.onboardingBottom}>
        <View style={styles.dots}>{onboarding.map((_, dot) => <View key={dot} style={[styles.dot, dot === index && styles.dotActive]} />)}</View>
        <Pressable onPress={next} style={styles.nextSquare}><Ionicons name="arrow-forward" size={27} color="#FFF" /></Pressable>
      </View>
    </Screen>
  );
}

export function WelcomeScreen({ navigate }: { navigate: Navigate }) {
  return (
    <Screen style={styles.welcome}>
      <View style={styles.welcomeTop}>
        <LogoMark size={106} />
        <Text style={[commonStyles.title, { textAlign: 'center', marginTop: 28 }]}>Bienvenido a Wallet</Text>
        <Text style={[commonStyles.subtitle, { textAlign: 'center', marginTop: 10 }]}>Crea una cuenta para guardar tu billetera o inicia sesión para continuar.</Text>
      </View>
      <View style={styles.welcomeActions}>
        <GradientButton label="Crear cuenta" onPress={() => navigate('register')} />
        <OutlineButton label="Iniciar sesión" onPress={() => navigate('login')} />
        <OutlineButton label="Importar billetera" onPress={() => Alert.alert('Próximamente', 'La importación estará disponible en una próxima versión.')} />
      </View>
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
  const [email, setEmail] = useState(isLogin ? 'demo@wallet.local' : '');
  const [password, setPassword] = useState(isLogin ? 'Demo1234!' : '');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async () => {
    try {
      setBusy(true);
      const result = await submit({ displayName, email, password, pin });
      Alert.alert(
        result === 'verification' ? 'Revisa tu correo' : 'Sesión iniciada',
        result === 'verification' ? 'Enviamos un código de 6 dígitos para confirmar tu cuenta.' : 'Bienvenido de nuevo.',
      );
    } catch (error) {
      Alert.alert(isLogin ? 'No se pudo iniciar sesión' : 'No se pudo crear la cuenta', error instanceof Error ? error.message : 'Intenta nuevamente');
    } finally { setBusy(false); }
  };
  const disabled = busy || !email.trim() || !password || (!isLogin && (!displayName.trim() || !/^\d{6}$/.test(pin)));
  return (
    <Screen scroll>
      <Header title="" onBack={() => navigate('welcome')} />
      <View style={styles.authLogo}><LogoMark size={72} /></View>
      <Text style={[commonStyles.title, { textAlign: 'center' }]}>{isLogin ? 'Iniciar sesión' : 'Crear tu cuenta'}</Text>
      <Text style={[commonStyles.subtitle, styles.authSubtitle]}>{isLogin ? 'Accede a tu portafolio guardado en la base local.' : 'Tus datos y movimientos se guardarán en MySQL local.'}</Text>
      <View style={styles.authForm}>
        {!isLogin ? <><Text style={commonStyles.label}>Nombre</Text><TextInput value={displayName} onChangeText={setDisplayName} style={commonStyles.input} placeholder="Tu nombre" placeholderTextColor={colors.muted} /></> : null}
        <Text style={commonStyles.label}>Correo</Text>
        <TextInput value={email} onChangeText={setEmail} style={commonStyles.input} placeholder="correo@ejemplo.com" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" />
        <Text style={commonStyles.label}>Contraseña</Text>
        <TextInput value={password} onChangeText={setPassword} style={commonStyles.input} placeholder="Mínimo 8 caracteres" placeholderTextColor={colors.muted} secureTextEntry />
        {!isLogin ? <><Text style={commonStyles.label}>PIN de 6 dígitos</Text><TextInput value={pin} onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, 6))} style={commonStyles.input} placeholder="••••••" placeholderTextColor={colors.muted} secureTextEntry keyboardType="number-pad" /></> : null}
        <GradientButton label={busy ? (isLogin ? 'Verificando...' : 'Creando wallet...') : (isLogin ? 'Entrar' : 'Registrarme')} disabled={disabled} onPress={() => void run()} />
      </View>
      {isLogin ? <Text style={styles.demoCredentials}>Acceso administrador: demo@wallet.local · Demo1234!</Text> : null}
      <Pressable onPress={() => navigate(isLogin ? 'register' : 'login')}><Text style={styles.link}>{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</Text></Pressable>
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
  const verify = async () => {
    try {
      setBusy(true);
      await submit(code);
      Alert.alert('Correo confirmado', 'Tu cuenta Wallet ya está activa.');
    } catch (error) {
      Alert.alert('No se pudo verificar', error instanceof Error ? error.message : 'Intenta nuevamente');
    } finally { setBusy(false); }
  };
  const resendCode = async () => {
    try {
      setResending(true);
      await resend();
      Alert.alert('Código enviado', 'Revisa tu bandeja de entrada y la carpeta de spam.');
    } catch (error) {
      Alert.alert('No se pudo reenviar', error instanceof Error ? error.message : 'Intenta nuevamente');
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
      <LinearGradient colors={['#4D8DFF', '#7166FF']} style={styles.quickIcon}><Ionicons name={icon} size={23} color="#FFF" /></LinearGradient>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function AssetRow({ asset, onPress }: { asset: Asset; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.assetRow}>
      <CoinIcon asset={asset} />
      <View style={styles.assetName}><Text style={styles.assetTitle}>{asset.name}</Text><Text style={styles.assetSymbol}>{asset.symbol}</Text></View>
      <View style={styles.assetValue}><Text style={styles.assetTitle}>{money(asset.valueUsd)}</Text><Text style={[styles.assetChange, { color: asset.change24h >= 0 ? colors.success : colors.danger }]}>{asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%</Text></View>
    </Pressable>
  );
}

export function HomeScreen({ data, navigate, offline }: { data: Bootstrap; navigate: Navigate; offline: boolean }) {
  return (
    <Screen>
      <View style={styles.homeHeader}>
        <LogoMark size={34} />
        <View style={styles.headerIcons}><Ionicons name="notifications-outline" size={24} color={colors.text} /><Pressable onPress={() => navigate('profile')}><Ionicons name="settings-outline" size={24} color={colors.text} /></Pressable></View>
      </View>
      {offline ? <View style={styles.offline}><Ionicons name="cloud-offline-outline" size={15} color={colors.warning} /><Text style={styles.offlineText}>Modo local: inicia la API para guardar cambios</Text></View> : null}
      <Text style={styles.balance}>{money(data.wallet.totalUsd)}</Text>
      <Text style={styles.gain}>▲ +{data.wallet.change24h.toFixed(2)}% (24h)</Text>
      <View style={styles.quickRow}>
        <ActionButton icon="arrow-up" label="Enviar" onPress={() => navigate('send')} />
        <ActionButton icon="arrow-down" label="Recibir" onPress={() => navigate('receive')} />
        <ActionButton icon="swap-horizontal" label="Swap" onPress={() => navigate('swap')} />
        <ActionButton icon="card-outline" label="Comprar" onPress={() => navigate('buy')} />
      </View>
      <View style={styles.assetTabs}><Text style={styles.assetTabActive}>Activos</Text><Text style={styles.assetTab}>NFTs</Text><Text style={styles.assetTab}>DeFi</Text></View>
      <ScrollView style={styles.assetList} showsVerticalScrollIndicator={false}>{data.assets.map((asset) => <AssetRow key={asset.symbol} asset={asset} onPress={() => navigate('asset', asset)} />)}</ScrollView>
      <BottomNav active="home" navigate={navigate} />
    </Screen>
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
  const value = Number(amount || 0);
  const send = async () => {
    try { setBusy(true); await submit(value, recipient); Alert.alert('Transferencia completada', 'El saldo ya está disponible en la cuenta de destino.'); navigate('activity'); }
    catch (error) { Alert.alert('No se pudo enviar', error instanceof Error ? error.message : 'Intenta nuevamente'); }
    finally { setBusy(false); }
  };
  return (
    <Screen>
      <Header title={`Enviar ${asset.symbol}`} onBack={() => navigate('home')} />
      <Text style={commonStyles.label}>Destinatario</Text>
      <View style={styles.inputRow}><TextInput value={recipient} onChangeText={setRecipient} style={[commonStyles.input, styles.flex]} placeholder="Correo o dirección Wallet" autoCapitalize="none" placeholderTextColor={colors.muted} /><Ionicons name="person-outline" size={23} color="#8885FF" style={styles.inputIcon} /></View>
      <Text style={[commonStyles.label, { marginTop: 20 }]}>Red</Text>
      <Card style={styles.networkRow}><CoinIcon asset={asset} size={38} /><Text style={styles.assetTitle}>{asset.name} ({asset.symbol})</Text><Ionicons name="chevron-forward" size={22} color={colors.muted} /></Card>
      <Text style={[commonStyles.label, { marginTop: 20 }]}>Cantidad</Text>
      <Card><View style={commonStyles.row}><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.amountInput} /><Pressable onPress={() => setAmount(String(Math.max(0, asset.balance - 0.00001)))} style={styles.max}><Text style={styles.maxText}>Máx</Text></Pressable></View><Text style={styles.amountUsd}>≈ {money(value * asset.priceUsd)}</Text></Card>
      <View style={styles.feeBox}><Text style={styles.infoLabel}>Transferencia interna</Text><Text style={styles.feeText}>Sin comisión</Text></View>
      <View style={styles.bottomAction}><GradientButton label={busy ? 'Procesando transferencia...' : 'Transferir'} disabled={busy || !value || recipient.length < 5} onPress={send} /></View>
    </Screen>
  );
}

function QrPattern() {
  const cells = Array.from({ length: 169 }, (_, index) => ((index * 17 + Math.floor(index / 13) * 11) % 7) < 3);
  return <View style={styles.qr}>{cells.map((dark, index) => <View key={index} style={[styles.qrCell, dark && styles.qrDark]} />)}</View>;
}

export function ReceiveScreen({ asset, walletAddress, navigate }: { asset: Asset; walletAddress: string; navigate: Navigate }) {
  return (
    <Screen>
      <Header title={`Recibir ${asset.symbol}`} onBack={() => navigate('home')} />
      <Card style={styles.receiveCard}>
        <QrPattern />
        <View style={styles.addressBox}><Text numberOfLines={1} style={styles.addressText}>{walletAddress}</Text><Ionicons name="copy-outline" size={22} color="#9290FF" /></View>
        <OutlineButton label="Compartir" onPress={() => Alert.alert('Dirección copiada', walletAddress)} />
      </Card>
      <Text style={[commonStyles.subtitle, { textAlign: 'center', marginTop: 24 }]}>Comparte tu correo o esta dirección para recibir una transferencia de otra cuenta Wallet.</Text>
    </Screen>
  );
}

export function SwapScreen({ assets, navigate, submit }: { assets: Asset[]; navigate: Navigate; submit: (from: Asset, to: Asset, amount: number) => Promise<number> }) {
  const [fromIndex, setFromIndex] = useState(1);
  const [toIndex, setToIndex] = useState(3);
  const [amount, setAmount] = useState('0.5');
  const [busy, setBusy] = useState(false);
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
      <Screen>
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
        <View style={styles.bottomAction}><GradientButton label={busy ? 'Intercambiando...' : 'Intercambiar'} disabled={busy || !numeric} onPress={async () => { try { setBusy(true); const result = await submit(from, to, numeric); Alert.alert('Intercambio completado', `Recibiste ${amountText(result)} ${to.symbol}`); navigate('home'); } catch (error) { Alert.alert('No se pudo intercambiar', error instanceof Error ? error.message : 'Intenta nuevamente'); } finally { setBusy(false); } }} /></View>
      </Screen>
      <BottomNav active="swap" navigate={navigate} />
    </View>
  );
}

function DappRow({ dapp }: { dapp: Dapp }) {
  return <Pressable onPress={() => Alert.alert(dapp.name, 'La conexión con este servicio estará disponible próximamente.')} style={styles.dappRow}><View style={[styles.dappIcon, { backgroundColor: dapp.color }]}><Text style={styles.dappLetter}>{dapp.name[0]}</Text></View><View style={styles.flex}><Text style={styles.assetTitle}>{dapp.name}</Text><Text style={styles.dappDescription}>{dapp.description}</Text><Text style={styles.dappCategory}>{dapp.category}</Text></View><Ionicons name="chevron-forward" size={24} color={colors.muted} /></Pressable>;
}

export function ExploreScreen({ dapps, navigate }: { dapps: Dapp[]; navigate: Navigate }) {
  return (
    <View style={styles.mainShell}>
      <Screen>
        <View style={styles.pageTitleRow}><Text style={commonStyles.title}>Explorar</Text><Ionicons name="ellipsis-horizontal" size={25} color={colors.text} /></View>
        <View style={styles.search}><Ionicons name="search" color={colors.muted} size={20} /><Text style={styles.searchText}>Buscar dApps, tokens, redes...</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{['Todo', 'DeFi', 'NFT', 'Gaming', 'Bridge'].map((chip, index) => <View key={chip} style={[styles.chip, index === 0 && styles.chipActive]}><Text style={[styles.chipText, index === 0 && { color: '#FFF' }]}>{chip}</Text></View>)}</ScrollView>
        <ScrollView showsVerticalScrollIndicator={false}>{dapps.map((dapp) => <DappRow key={dapp.id} dapp={dapp} />)}</ScrollView>
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
        <ScrollView>{transactions.map((transaction) => { const incoming = transaction.type === 'receive' || transaction.type === 'buy'; return <Card key={transaction.id} style={styles.transaction}><View style={[styles.transactionIcon, { backgroundColor: `${transaction.color}30` }]}><Ionicons name={icons[transaction.type]} color={transaction.color} size={23} /></View><View style={styles.flex}><Text style={styles.assetTitle}>{labels[transaction.type]} · {transaction.symbol}</Text><Text style={styles.assetSymbol}>{new Date(transaction.createdAt).toLocaleDateString('es-EC')} · {transaction.status === 'completed' ? 'Completada' : transaction.status}</Text></View><View style={styles.assetValue}><Text style={[styles.assetTitle, { color: incoming ? colors.success : colors.text }]}>{incoming ? '+' : '-'}{amountText(transaction.amount)}</Text><Text style={styles.assetSymbol}>{money(transaction.amountUsd)}</Text></View></Card>; })}</ScrollView>
      </Screen>
      <BottomNav active="activity" navigate={navigate} />
    </View>
  );
}

export function ProfileScreen({ data, navigate, logout }: { data: Bootstrap; navigate: Navigate; logout: () => Promise<void> }) {
  const groups = [
    [{ icon: 'shield-checkmark-outline' as const, title: 'Seguridad' }, { icon: 'cloud-upload-outline' as const, title: 'Backups' }, { icon: 'globe-outline' as const, title: 'Redes', sub: 'Ethereum, Solana, BSC...' }, { icon: 'settings-outline' as const, title: 'Preferencias', sub: 'Fiat, tema, idioma...' }],
    [{ icon: 'help-circle-outline' as const, title: 'Ayuda y soporte' }, { icon: 'information-circle-outline' as const, title: 'Acerca de' }],
  ];
  return (
    <View style={styles.mainShell}>
      <Screen scroll>
        <View style={styles.profileHero}><View style={styles.avatar}><Ionicons name="person-outline" size={40} color="#FFF" /></View><View style={styles.flex}><Text style={styles.profileName}>{data.user.displayName}</Text><Text style={styles.profileAddress}>{data.user.email}</Text><Text style={styles.profileAddress}>{data.wallet.address.slice(0, 8)}...{data.wallet.address.slice(-4)}</Text></View><Ionicons name="copy-outline" size={21} color={colors.muted} /><Ionicons name="wallet-outline" size={23} color={colors.text} /></View>
        {data.user.role === 'admin' ? <Pressable onPress={() => navigate('admin')}><Card style={styles.adminEntry}><View style={styles.adminIcon}><Ionicons name="people" size={25} color="#FFF" /></View><View style={styles.flex}><Text style={styles.settingTitle}>Administrar cuentas</Text><Text style={styles.settingSub}>Consultar usuarios y acreditar saldos</Text></View><Ionicons name="chevron-forward" size={23} color={colors.muted} /></Card></Pressable> : null}
        {groups.map((group, groupIndex) => <Card key={groupIndex} style={styles.profileGroup}>{group.map((item, index) => <Pressable key={item.title} onPress={() => Alert.alert(item.title, 'Esta opción estará disponible próximamente.')} style={[styles.settingRow, index < group.length - 1 && styles.settingBorder]}><Ionicons name={item.icon} size={26} color={colors.text} /><View style={styles.flex}><Text style={styles.settingTitle}>{item.title}</Text>{'sub' in item && item.sub ? <Text style={styles.settingSub}>{item.sub}</Text> : null}</View><Ionicons name="chevron-forward" size={23} color={colors.muted} /></Pressable>)}</Card>)}
        <OutlineButton label="Cerrar sesión" onPress={() => void logout()} />
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
  const targets = users.filter((user) => user.role !== 'admin');
  const target = targets[selectedUser] ?? targets[0];
  const asset = assets[selectedAsset] ?? assets[0]!;
  const reload = async () => {
    try { setUsers(await loadUsers()); } catch (error) { Alert.alert('No se pudieron cargar las cuentas', error instanceof Error ? error.message : 'Intenta nuevamente'); }
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
          <View style={styles.bottomAction}><GradientButton label={busy ? 'Acreditando saldo...' : 'Acreditar saldo'} disabled={busy || !target || Number(amount) <= 0} onPress={async () => { if (!target) return; try { setBusy(true); const name = await submit(target.id, asset.symbol, Number(amount)); Alert.alert('Saldo acreditado', `${name} recibió ${amountText(Number(amount))} ${asset.symbol}.`); await reload(); } catch (error) { Alert.alert('No se pudo acreditar', error instanceof Error ? error.message : 'Intenta nuevamente'); } finally { setBusy(false); } }} /></View>
        </>
      )}
    </Screen>
  );
}

export function BuyScreen({ assets, navigate, submit }: { assets: Asset[]; navigate: Navigate; submit: (asset: Asset, usdAmount: number) => Promise<number> }) {
  const [amount, setAmount] = useState('250');
  const [busy, setBusy] = useState(false);
  const asset = assets[0]!;
  const crypto = Number(amount || 0) / asset.priceUsd;
  return (
    <Screen>
      <Header title="Comprar cripto" onBack={() => navigate('home')} />
      <Text style={[commonStyles.subtitle, { marginBottom: 22 }]}>Selecciona el monto que deseas acreditar a tu portafolio.</Text>
      <Card><Text style={commonStyles.label}>Pagas</Text><View style={commonStyles.row}><Text style={styles.buyCurrency}>USD</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.buyAmount} /></View></Card>
      <View style={styles.buyArrow}><Ionicons name="arrow-down" color="#FFF" size={24} /></View>
      <Card><Text style={commonStyles.label}>Recibes</Text><View style={commonStyles.row}><CoinIcon asset={asset} /><Text style={styles.buyCurrency}>{asset.symbol}</Text><Text style={styles.buyAmount}>{amountText(crypto)}</Text></View></Card>
      <Card style={styles.buyNotice}><Ionicons name="shield-checkmark" size={24} color="#9E91FF" /><Text style={styles.buyNoticeText}>Revisa el monto antes de confirmar la operación.</Text></Card>
      <View style={styles.bottomAction}><GradientButton label={busy ? 'Procesando compra...' : 'Confirmar compra'} disabled={busy || Number(amount) <= 0} onPress={async () => { try { setBusy(true); const received = await submit(asset, Number(amount)); Alert.alert('Compra completada', `Recibiste ${amountText(received)} ${asset.symbol}.`); navigate('activity'); } catch (error) { Alert.alert('No se pudo comprar', error instanceof Error ? error.message : 'Intenta nuevamente'); } finally { setBusy(false); } }} /></View>
    </Screen>
  );
}

export const firstAsset = (data: Bootstrap, preferred?: Asset | null) => preferred ?? data.assets[0]!;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  splash: { alignItems: 'center', justifyContent: 'space-between', paddingTop: 96, paddingBottom: 48, overflow: 'hidden' },
  splashCenter: { alignItems: 'center', zIndex: 2, marginTop: 70 },
  brand: { color: '#FFF', fontSize: 48, fontWeight: '900', letterSpacing: -1.7, marginTop: 22 },
  tagline: { color: '#E2E4EE', fontSize: 19, lineHeight: 28, textAlign: 'center', marginTop: 24 },
  startButton: { zIndex: 2, minWidth: 210, minHeight: 64, borderRadius: 32, borderWidth: 1, borderColor: '#7D74FF', backgroundColor: '#16162E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, ...shadow },
  startText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, opacity: 0.33, backgroundColor: '#703DFF' },
  glowTop: { left: -130, top: 40 },
  glowBottom: { right: -100, bottom: -20, backgroundColor: '#5235FF' },
  diagonalOne: { position: 'absolute', width: 520, height: 90, backgroundColor: '#111737', transform: [{ rotate: '38deg' }], left: -180, top: 230, opacity: 0.8 },
  diagonalTwo: { position: 'absolute', width: 520, height: 100, backgroundColor: '#151344', transform: [{ rotate: '38deg' }], left: -80, bottom: 80, opacity: 0.75 },
  onboardingArt: { flex: 1.1, alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', width: 270, height: 270, borderRadius: 135, borderWidth: 1 },
  artCoin: { width: 175, height: 175, borderRadius: 88, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }], ...shadow },
  miniCoin: { position: 'absolute', width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  miniCoinText: { color: '#FFF', fontSize: 30, fontWeight: '900' },
  onboardingCopy: { minHeight: 190, justifyContent: 'center' },
  onboardingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 },
  dots: { flexDirection: 'row', gap: 10 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#2B3244' },
  dotActive: { backgroundColor: '#766DFF', width: 11, height: 11 },
  nextSquare: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6179FF', ...shadow },
  welcome: { justifyContent: 'space-between', paddingTop: 100, paddingBottom: 55 },
  welcomeTop: { alignItems: 'center' },
  welcomeActions: { gap: 16 },
  authLogo: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  authSubtitle: { textAlign: 'center', marginTop: 10, marginBottom: 26 },
  authForm: { gap: 12 },
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
  homeHeader: { height: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIcons: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  offline: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: '#2A2214', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  offlineText: { color: colors.warning, fontSize: 11 },
  balance: { color: colors.text, fontSize: 38, fontWeight: '800', letterSpacing: -1.2, marginTop: 9 },
  gain: { color: colors.success, fontSize: 14, fontWeight: '700', marginTop: 5 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 21 },
  quickAction: { width: '23%', alignItems: 'center', gap: 8 },
  quickIcon: { width: 56, height: 51, borderRadius: 17, alignItems: 'center', justifyContent: 'center', ...shadow },
  quickLabel: { color: colors.text, fontSize: 12.5, fontWeight: '600' },
  assetTabs: { height: 43, flexDirection: 'row', gap: 34, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  assetTab: { color: colors.muted, fontSize: 15 },
  assetTabActive: { color: colors.text, fontSize: 15, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: '#7A6FFF', height: 43, textAlignVertical: 'center' },
  assetList: { flex: 1 },
  assetRow: { minHeight: 72, borderBottomWidth: 1, borderBottomColor: '#1B2230', flexDirection: 'row', alignItems: 'center', gap: 13 },
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
  chips: { gap: 9, paddingVertical: 16 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: '#6672FF', borderColor: '#6672FF' },
  chipText: { color: colors.muted, fontWeight: '600' },
  dappRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 14 },
  dappIcon: { width: 51, height: 51, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dappLetter: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  dappDescription: { color: colors.muted, fontSize: 13, marginTop: 3 },
  dappCategory: { color: '#7772FF', fontSize: 12, marginTop: 2 },
  transaction: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  transactionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
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
});
