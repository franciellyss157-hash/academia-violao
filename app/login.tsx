import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { GlowOrb } from '../components/Particles';
import { Field, H1, Header, Muted, NeonButton, Screen } from '../components/ui';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { C, F } from '../lib/theme';

const USE_NATIVE = Platform.OS !== 'web';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, delay: 100, useNativeDriver: USE_NATIVE }),
      Animated.spring(slideY, { toValue: 0, delay: 100, friction: 7, tension: 45, useNativeDriver: USE_NATIVE }),
    ]).start();
  }, [fade, slideY]);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      await signIn(res.token, res.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <GlowOrb size={280} color={C.pink} opacity={0.1} style={{ top: '8%', right: '-30%' }} />
      <Header title="Acesso" subtitle="Bem-vindo(a) de volta ao Sussurro" />
      <Animated.View style={{ marginTop: 24, opacity: fade, transform: [{ translateY: slideY }] }}>
        <H1 style={{ fontSize: 28 }}>Que bom te ver</H1>
        <Muted style={{ marginTop: 6, marginBottom: 22 }}>
          Entre com o e-mail e a senha que você criou.
        </Muted>

        <Field
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="voce@email.com"
        />
        <Field
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Sua senha"
          onSubmitEditing={submit}
        />

        {error ? (
          <Text style={{ fontFamily: F.medium, fontSize: 12.5, color: C.danger, marginBottom: 12 }}>
            {error}
          </Text>
        ) : null}

        <NeonButton label="Entrar" onPress={submit} loading={loading} icon="log-in-outline" />

        <Pressable onPress={() => router.push('/register')} style={{ marginTop: 20, alignItems: 'center' }}>
          <Muted>
            Ainda não tem conta?{' '}
            <Text style={{ fontFamily: F.semi, color: C.pinkSoft }}>Criar minha conta</Text>
          </Muted>
        </Pressable>

        <Pressable onPress={() => router.push('/admin-login')} style={{ marginTop: 26, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.body, fontSize: 11.5, letterSpacing: 1.4, color: C.gold }}>
            ACESSO ADM
          </Text>
        </Pressable>
      </Animated.View>
    </Screen>
  );
}
