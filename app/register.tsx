import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Field, H1, Header, Muted, NeonButton, Screen } from '../components/ui';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { C, F } from '../lib/theme';

function toIsoDate(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) return '';
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4);
  return `${year}-${month}-${day}`;
}

function maskDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    const iso = toIsoDate(birthdate);
    if (!iso) {
      setError('Informe a data de nascimento no formato DD/MM/AAAA.');
      return;
    }
    if (!terms) {
      setError('Você precisa aceitar os termos e a política de privacidade.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        name,
        email,
        password,
        birthdate: iso,
        acceptedTerms: true,
      });
      await signIn(res.token, res.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Não foi possível criar sua conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Cadastro" subtitle="Só para maiores de 18 anos" />
      <View style={{ marginTop: 18 }}>
        <H1 style={{ fontSize: 27 }}>Comece a sussurrar</H1>
        <Muted style={{ marginTop: 6, marginBottom: 20 }}>
          Seus dados são tratados conforme a LGPD e nunca aparecem para quem você não quiser.
        </Muted>

        <Field label="Nome" value={name} onChangeText={setName} placeholder="Como quer ser chamado(a)" />
        <Field
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="voce@email.com"
        />
        <Field
          label="Data de nascimento"
          value={birthdate}
          onChangeText={(v) => setBirthdate(maskDate(v))}
          placeholder="DD/MM/AAAA"
          keyboardType="numeric"
        />
        <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo 6 caracteres" />
        <Field
          label="Confirmar senha"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="Repita a senha"
        />

        <Pressable
          onPress={() => setTerms(!terms)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: terms ? C.pink : C.border,
              backgroundColor: terms ? C.pink : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
            }}
          >
            {terms ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
          </View>
          <Muted style={{ flex: 1, fontSize: 12 }}>
            Confirmo que tenho 18 anos ou mais e aceito os Termos de Uso, as Regras de Conduta e a
            Política de Privacidade.
          </Muted>
        </Pressable>

        {error ? (
          <Text style={{ fontFamily: F.medium, fontSize: 12.5, color: C.danger, marginBottom: 12 }}>
            {error}
          </Text>
        ) : null}

        <NeonButton label="Criar conta" onPress={submit} loading={loading} icon="heart-outline" />

        <Pressable onPress={() => router.back()} style={{ marginTop: 18, alignItems: 'center' }}>
          <Muted>
            Já tem conta? <Text style={{ fontFamily: F.semi, color: C.pinkSoft }}>Entrar</Text>
          </Muted>
        </Pressable>
      </View>
    </Screen>
  );
}
