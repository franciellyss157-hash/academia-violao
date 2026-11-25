import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Field, Glass, Header, Muted, NeonButton, Screen } from '../components/ui';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { C, F } from '../lib/theme';

const ADMIN_EMAIL = 'francielly.ss157@gmail.com';

export default function AdminLogin() {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/admin/login', { email, password });
      await signIn(res.token, res.user);
      router.replace('/admin');
    } catch (e: any) {
      setError(e.message || 'Acesso negado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Acesso ADM" subtitle="Exclusivo do administrador" />
      <View style={{ marginTop: 26 }}>
        <Text
          style={{
            fontFamily: F.displayItalic,
            fontSize: 26,
            color: C.gold,
            marginBottom: 8,
          }}
        >
          Painel do Sussurro
        </Text>
        <Muted style={{ marginBottom: 22 }}>
          A senha do ADM não fica no aplicativo: ela é lida da variável de ambiente ADMIN_PASSWORD,
          comparada por hash e bloqueada após 5 tentativas erradas.
        </Muted>

        <Field label="E-mail do ADM" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <Field
          label="Senha do ADM"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Senha do administrador"
          onSubmitEditing={submit}
        />

        {error ? (
          <Text style={{ fontFamily: F.medium, fontSize: 12.5, color: C.danger, marginBottom: 12 }}>
            {error}
          </Text>
        ) : null}

        <NeonButton label="Entrar no painel" variant="gold" onPress={submit} loading={loading} icon="shield-checkmark" />

        <Glass style={{ marginTop: 24 }}>
          <Muted style={{ fontSize: 12 }}>
            Proteção ativa: 5 tentativas erradas bloqueiam o acesso por 15 minutos. Todas as
            aprovações e recusas ficam registradas com data e motivo.
          </Muted>
        </Glass>
      </View>
    </Screen>
  );
}
