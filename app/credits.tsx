import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Glass, H1, Header, Muted, NeonButton, P, Screen, SectionHeader, StatusPill } from '../components/ui';
import { api } from '../lib/api';
import { brl, dateTime } from '../lib/format';
import { useSession } from '../lib/session';
import { C, F } from '../lib/theme';

export default function CreditsScreen() {
  const router = useRouter();
  const { refresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/packages');
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      refresh();
    }, [load, refresh])
  );

  async function buy(packageId: string) {
    setBusy(packageId);
    setError('');
    try {
      const res = await api.post('/api/orders', { packageId });
      router.push(`/order/${res.order.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <Screen>
      <Header title="Créditos e pacotes" subtitle="Pague com Pix e envie o comprovante" />

      <Glass glowColor={C.pink} style={{ marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: C.pink,
              backgroundColor: 'rgba(255,61,154,0.12)',
            }}
          >
            <Ionicons name="chatbubbles" size={20} color={C.pinkSoft} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.display, fontSize: 24, color: C.text }}>
              {data?.credits ?? 0} créditos
            </Text>
            <Muted style={{ fontSize: 11.5 }}>Cada mensagem enviada consome 1 crédito</Muted>
          </View>
          {data?.vip ? <StatusPill label="VIP ativo" color={C.gold} /> : null}
        </View>
        {data?.highlightUntil && new Date(data.highlightUntil) > new Date() ? (
          <Muted style={{ fontSize: 11, marginTop: 10 }}>
            Destaque de perfil ativo até {dateTime(data.highlightUntil)}
          </Muted>
        ) : null}
      </Glass>

      <SectionHeader title="Escolha seu pacote" />
      {loading ? (
        <ActivityIndicator color={C.pink} />
      ) : (
        <View style={{ gap: 12 }}>
          {(data?.packages || []).map((pkg: any) => {
            const vip = pkg.id === 'vip';
            return (
              <View
                key={pkg.id}
                style={{
                  borderRadius: 24,
                  padding: 1,
                  backgroundColor: vip ? 'rgba(233,199,124,0.55)' : 'rgba(255,61,154,0.35)',
                }}
              >
                <LinearGradient
                  colors={vip ? ['rgba(233,199,124,0.12)', 'rgba(20,7,14,0.96)'] : ['rgba(255,61,154,0.12)', 'rgba(20,7,14,0.96)']}
                  style={{ borderRadius: 23, padding: 16, gap: 8 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: F.display, fontSize: 20, color: C.text }}>{pkg.name}</Text>
                    <Text style={{ fontFamily: F.display, fontSize: 22, color: vip ? C.gold : C.pinkSoft }}>
                      {brl(pkg.price)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.pinkSoft} />
                    <Text style={{ fontFamily: F.semi, fontSize: 12.5, color: C.pinkSoft }}>
                      {pkg.credits} créditos de conversa
                    </Text>
                  </View>
                  <P style={{ fontSize: 12.5, color: 'rgba(249,239,244,0.8)' }}>{pkg.benefit}</P>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {pkg.perks?.highlight ? <StatusPill label="Destaque 24h" color={C.gold} /> : null}
                    {pkg.perks?.seeLikes ? <StatusPill label="Ver quem curtiu você" color={C.pink} /> : null}
                    {pkg.perks?.stickerPack ? <StatusPill label="Figurinhas exclusivas" color={C.ok} /> : null}
                    {pkg.perks?.vip ? <StatusPill label="Selo VIP" color={C.gold} /> : null}
                  </View>
                  <NeonButton
                    label={busy === pkg.id ? 'Gerando pedido...' : 'Pagar com Pix'}
                    variant={vip ? 'gold' : 'pink'}
                    loading={busy === pkg.id}
                    icon="qr-code-outline"
                    style={{ marginTop: 6 }}
                    onPress={() => buy(pkg.id)}
                  />
                </LinearGradient>
              </View>
            );
          })}
        </View>
      )}

      {error ? (
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.danger, marginTop: 12 }}>{error}</Text>
      ) : null}

      <Pressable onPress={() => router.push('/transactions')} style={{ marginTop: 18, alignItems: 'center' }}>
        <Muted>
          Ver <Text style={{ color: C.pinkSoft, fontFamily: F.semi }}>histórico de transações</Text>
        </Muted>
      </Pressable>

      <Glass style={{ marginTop: 18 }}>
        <Text style={{ fontFamily: F.semi, fontSize: 11, letterSpacing: 1.6, color: C.gold, marginBottom: 6 }}>
          COMO FUNCIONA
        </Text>
        <Muted style={{ fontSize: 12 }}>
          1. Escolha o pacote e toque em “Pagar com Pix”.{'\n'}
          2. Copie a chave Pix e pague o valor exato no app do seu banco.{'\n'}
          3. Volte e envie a foto do comprovante.{'\n'}
          4. O pedido fica “Em análise” até o ADM aprovar. Créditos e benefícios são liberados só
          depois da aprovação.
        </Muted>
      </Glass>
    </Screen>
  );
}
