import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Loading } from './components';
import { ApiRequestError, loadWallet, restoreSession, walletApi } from './api';
import {
  ActivityScreen,
  AdminScreen,
  AssetScreen,
  AuthScreen,
  BuyScreen,
  CreateWalletScreen,
  ExploreScreen,
  HomeScreen,
  OnboardingScreen,
  PinScreen,
  ProfileScreen,
  ReceiveScreen,
  RecoveryScreen,
  SendScreen,
  SplashScreen,
  SwapScreen,
  VerifyEmailScreen,
  WelcomeScreen,
  firstAsset,
} from './screens';
import type { AppScreen, Asset, Bootstrap } from './types';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [data, setData] = useState<Bootstrap | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [verificationEmail, setVerificationEmail] = useState('');

  const refresh = useCallback(async () => {
    const wallet = await loadWallet();
    setData(wallet);
    return wallet;
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const active = await restoreSession();
        setAuthenticated(active);
        if (active) await refresh();
      } catch {
        setAuthenticated(false);
      } finally { setCheckingSession(false); }
    })();
  }, [refresh]);

  const navigate = (next: AppScreen, asset?: Asset) => {
    if (asset) setSelectedAsset(asset);
    setScreen(next);
  };

  const authenticate = async (mode: 'login' | 'register', values: { displayName: string; email: string; password: string; pin: string }) => {
    if (mode === 'register') {
      const result = await walletApi.register(values);
      setVerificationEmail(result.email);
      navigate('verifyEmail');
      return 'verification' as const;
    }
    try {
      await walletApi.login({ email: values.email, password: values.password });
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'EMAIL_NOT_VERIFIED') {
        setVerificationEmail(values.email.trim().toLowerCase());
        navigate('verifyEmail');
        return 'verification' as const;
      }
      throw error;
    }
    setAuthenticated(true);
    await refresh();
    navigate('home');
    return 'authenticated' as const;
  };

  const confirmEmail = async (code: string) => {
    await walletApi.verifyEmail({ email: verificationEmail, code });
    setAuthenticated(true);
    await refresh();
    navigate('home');
  };

  const logout = async () => {
    await walletApi.logout();
    setAuthenticated(false);
    setData(null);
    setSelectedAsset(null);
    navigate('welcome');
    Alert.alert('Sesión cerrada', 'Tu sesión local se cerró correctamente.');
  };

  const completePin = async () => {
    if (authenticated) {
      await walletApi.onboarding(true);
      await refresh();
      navigate('home');
    } else navigate('register');
  };

  if (checkingSession) return <SafeAreaProvider><Loading /></SafeAreaProvider>;

  const requireData = () => {
    if (!data) return <Loading />;
    const asset = firstAsset(data, selectedAsset);
    const send = async (amount: number, recipient: string) => {
      await walletApi.send({ symbol: asset.symbol, amount, recipient });
      await refresh();
    };
    const swap = async (from: Asset, to: Asset, amount: number) => {
      const result = await walletApi.swap({ fromSymbol: from.symbol, toSymbol: to.symbol, amount });
      await refresh();
      return result.received;
    };
    const buy = async (target: Asset, usdAmount: number) => {
      const result = await walletApi.buy({ symbol: target.symbol, usdAmount });
      await refresh();
      return result.received;
    };

    switch (screen) {
      case 'home': return <HomeScreen data={data} navigate={navigate} offline={false} />;
      case 'asset': return <AssetScreen asset={asset} navigate={navigate} />;
      case 'send': return <SendScreen asset={asset} navigate={navigate} submit={send} />;
      case 'receive': return <ReceiveScreen asset={asset} walletAddress={data.wallet.address} navigate={navigate} />;
      case 'swap': return <SwapScreen assets={data.assets} navigate={navigate} submit={swap} />;
      case 'explore': return <ExploreScreen dapps={data.dapps} navigate={navigate} />;
      case 'activity': return <ActivityScreen transactions={data.transactions} navigate={navigate} />;
      case 'profile': return <ProfileScreen data={data} navigate={navigate} logout={logout} />;
      case 'admin': return <AdminScreen assets={data.assets} navigate={navigate} loadUsers={async () => (await walletApi.adminUsers()).users} submit={async (userId, symbol, amount) => (await walletApi.adminFund({ userId, symbol, amount })).recipientName} />;
      case 'buy': return <BuyScreen assets={data.assets} navigate={navigate} submit={buy} />;
      default: return <HomeScreen data={data} navigate={navigate} offline={false} />;
    }
  };

  let content;
  switch (screen) {
    case 'splash': content = <SplashScreen next={() => navigate(authenticated ? 'home' : 'onboarding1')} />; break;
    case 'onboarding1': content = <OnboardingScreen index={0} next={() => navigate('onboarding2')} />; break;
    case 'onboarding2': content = <OnboardingScreen index={1} next={() => navigate('onboarding3')} />; break;
    case 'onboarding3': content = <OnboardingScreen index={2} next={() => navigate('welcome')} />; break;
    case 'welcome': content = <WelcomeScreen navigate={navigate} />; break;
    case 'login': content = <AuthScreen mode="login" navigate={navigate} submit={(values) => authenticate('login', values)} />; break;
    case 'register': content = <AuthScreen mode="register" navigate={navigate} submit={(values) => authenticate('register', values)} />; break;
    case 'verifyEmail': content = <VerifyEmailScreen email={verificationEmail} navigate={navigate} submit={confirmEmail} resend={() => walletApi.resendVerification(verificationEmail).then(() => undefined)} />; break;
    case 'create': content = <CreateWalletScreen navigate={navigate} />; break;
    case 'recovery': content = <RecoveryScreen navigate={navigate} />; break;
    case 'pin': content = <PinScreen complete={completePin} navigate={navigate} />; break;
    default: content = authenticated ? requireData() : <WelcomeScreen navigate={navigate} />;
  }

  return <SafeAreaProvider><StatusBar style="light" />{content}</SafeAreaProvider>;
}
