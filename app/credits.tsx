import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { GlowOrb } from '../components/Particles';
import { Glass, H1, Header, Muted, NeonButton, P, Screen, SectionHeader, StatusPill } from '../components/ui';
import { api } from '../lib/api';
import { brl, dateTime } from '../lib/format';
import { useSession } from '../lib/session';
import { C, F } from '../lib/theme';

const USE_NATIVE = Platform.OS !== 'web';

export default function CreditsScreen() {
  const router = useRouter();
  const { refresh } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const fade = useRef(new Animated.Value(0)).current;

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
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: USE_NATIVE }).start();
    }, [load, refresh, fade])
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
      <GlowOrb size={300} color={C.pink} opacity={0.1} style={{ top: '5%', right: '-30%' }} />
      <Header title="Créditos e planos" subtitle="Pague com Pix e envie o comprovante" />

      <Animated.View style={{ opacity: fade }}>
        <Glass glowColor={C.pink} style={{ marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LinearGradient
              colors={['rgba(255,61,154,0.2)', 'rgba(255,61,154,0.04)']}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chatbubbles" size={22} color={C.pinkSoft} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.display, fontSize: 28, color: C.text }}>
                {data?.credits ?? 0}
              </Text>
              <Muted style={{ fontSize: 11.5 }}>créditos de conversa</Muted>
            </View>
            {data?.vip ? <StatusPill label="VIP ativo" color={C.gold} /> : null}
          </View>
          {data?.highlightUntil && new Date(data.highlightUntil) > new Date() ? (
            <Muted style={{ fontSize: 11, marginTop: 10 }}>
              ✦ Destaque de perfil ativo até {dateTime(data.highlightUntil)}
            </Muted>
          ) : null}
        </Glass>

        <SectionHeader title="Escolha seu plano" />
        {loading ? (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator color={C.pink} />
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {(data?.packages || []).map((pkg: any, i: number) => {
              const vip = pkg.id === 'vip';
              const popular = pkg.id === 'plus';
              return (
                <Animated.View
                  key={pkg.id}
                  style={{
                    opacity: fade,
                    transform: [
                      {
                        translateY: fade.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20 - i * 4, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View
                    style={{
                      borderRadius: 24,
                      padding: 1.5,
                      backgroundColor: vip
                        ? 'rgba(233,199,124,0.6)'
                        : popular
                          ? 'rgba(255,61,154,0.5)'
                          : 'rgba(255,61,154,0.3)',
                    }}
                  >
                    <LinearGradient
                      colors={
                        vip
                          ? ['rgba(233,199,124,0.14)', 'rgba(20,7,14,0.97)']
                          : ['rgba(255,61,154,0.12)', 'rgba(20,7,14,0.97)']
                      }
                      style={{ borderRadius: 23, padding: 18, gap: 10 }}
                    >
                      {(vip || popular) && (
                        <View
                          style={{
                            position: 'absolute',
                            top: -1,
                            right: 20,
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 999,
                            backgroundColor: vip ? C.gold : C.pink,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: F.semi,
                              fontSize: 9.5,
                              letterSpacing: 0.8,
                              color: vip ? '#2A1A05' : '#fff',
                            }}
                          >
                            {vip ? 'PREMIUM' : 'MAIS POPULAR'}
                          </Text>
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: vip || popular ? 10 : 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons
                            name={vip ? 'diamond' : pkg.id === 'plus' ? 'star' : 'chatbubble-ellipses'}
                            size={18}
                            color={vip ? C.gold : C.pinkSoft}
                          />
                          <Text style={{ fontFamily: F.display, fontSize: 20, color: C.text }}>{pkg.name}</Text>
                        </View>
                        <Text style={{ fontFamily: F.display, fontSize: 24, color: vip ? C.gold : C.pinkSoft }}>
                          {brl(pkg.price)}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="chatbubble-ellipses-outline" size={13} color={vip ? C.gold : C.pinkSoft} />
                        <Text style={{ fontFamily: F.semi, fontSize: 13, color: vip ? C.gold : C.pinkSoft }}>
                          {pkg.credits} créditos
                        </Text>
                      </View>

                      <P style={{ fontSize: 12.5, color: 'rgba(249,239,244,0.82)' }}>{pkg.benefit}</P>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {pkg.perks?.highlight ? <StatusPill label="Destaque 24h" color={C.gold} /> : null}
                        {pkg.perks?.seeLikes ? <StatusPill label="Ver quem curtiu" color={C.pink} /> : null}
                        {pkg.perks?.stickerPack ? <StatusPill label="Figurinhas exclusivas" color={C.ok} /> : null}
                        {pkg.perks?.vip ? <StatusPill label="Selo VIP" color={C.gold} /> : null}
                      </View>

                      <NeonButton
                        label={busy === pkg.id ? 'Gerando pedido...' : 'Comprar com Pix'}
                        variant={vip ? 'gold' : 'pink'}
                        loading={busy === pkg.id}
                        icon="qr-code-outline"
                        style={{ marginTop: 4 }}
                        onPress={() => buy(pkg.id)}
                      />
                    </LinearGradient>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        {error ? (
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.danger, marginTop: 12, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}

        <Pressable onPress={() => router.push('/transactions')} style={{ marginTop: 20, alignItems: 'center' }}>
          <Muted>
            Ver <Text style={{ color: C.pinkSoft, fontFamily: F.semi }}>histórico de transações</Text>
          </Muted>
        </Pressable>

        <Glass style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="information-circle-outline" size={16} color={C.gold} />
            <Text style={{ fontFamily: F.semi, fontSize: 11, letterSpacing: 1.6, color: C.gold }}>
              COMO FUNCIONA
            </Text>
          </View>
          <Muted style={{ fontSize: 12, lineHeight: 19 }}>
            1. Escolha o plano e toque em "Comprar com Pix".{'\n'}
            2. Copie a chave Pix e pague o valor exato no app do seu banco.{'\n'}
            3. Volte e envie a foto do comprovante.{'\n'}
            4. O pedido fica "Em análise" até o ADM aprovar. Créditos e benefícios são liberados só
            depois da aprovação.
          </Muted>
        </Glass>
      </Animated.View>
    </Screen>
  );
}
