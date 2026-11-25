import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MatchOverlay } from '../../components/MatchOverlay';
import {
  Avatar,
  Chip,
  Empty,
  IconButton,
  Muted,
  NeonButton,
  P,
  Screen,
  StatusPill,
  Wordmark,
} from '../../components/ui';
import { api, fileUrl } from '../../lib/api';
import { useSession } from '../../lib/session';
import { C, F, INTENTS } from '../../lib/theme';

const USE_NATIVE = Platform.OS !== 'web';

export default function DiscoverScreen() {
  const router = useRouter();
  const { user, refresh } = useSession();
  const [people, setPeople] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [unread, setUnread] = useState(0);
  const [match, setMatch] = useState<{ other: any; matchId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const { width: winW, height: winH } = useWindowDimensions();
  const cardWidth = Math.min(winW - 40, 520);
  const cardHeight = Math.max(340, Math.min(cardWidth * 1.25, winH * 0.54));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [discover, notifs] = await Promise.all([
        api.get('/api/discover'),
        api.get('/api/notifications').catch(() => ({ unread: 0 })),
      ]);
      setPeople(discover.people || []);
      setIndex(0);
      setUnread(notifs.unread || 0);
    } catch (e: any) {
      setNote(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = people[index];

  useEffect(() => {
    if (!current) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: USE_NATIVE }).start();
  }, [current?.id, fade]);

  const advance = (message?: string) => {
    if (message) setNote(message);
    setIndex((i) => i + 1);
    refresh();
  };

  async function like() {
    if (!current || busy) return;
    setBusy(true);
    setNote('');
    try {
      const res = await api.post(`/api/likes/${current.id}`);
      if (res.match) {
        setMatch({ other: current, matchId: res.matchId });
      } else {
        advance(
          res.likesLeft >= 0
            ? `Curtida enviada. Restam ${res.likesLeft} curtidas hoje.`
            : 'Curtida enviada.'
        );
      }
    } catch (e: any) {
      setNote(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function invite() {
    if (!current || busy) return;
    setBusy(true);
    try {
      await api.post('/api/invites', { toUserId: current.id, message: 'Vamos nos conhecer?' });
      advance(`Convite enviado para ${current.name.split(' ')[0]}.`);
    } catch (e: any) {
      setNote(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
        <Wordmark size={24} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => router.push('/credits')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 11,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <Ionicons name="chatbubbles-outline" size={13} color={C.gold} />
            <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.gold }}>{user?.credits ?? 0}</Text>
          </Pressable>
          <IconButton icon="notifications-outline" badge={unread} onPress={() => router.push('/notifications')} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Chip label="Inspiração de mensagens" icon="sparkles" onPress={() => router.push('/inspiration')} />
        <Chip label="Figurinhas" icon="happy-outline" onPress={() => router.push('/stickers')} />
      </View>

      {(user?.credits ?? 0) <= 2 ? (
        <Pressable
          onPress={() => router.push('/credits')}
          style={({ pressed }) => ({
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.borderPink,
            backgroundColor: 'rgba(255,61,154,0.1)',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="diamond-outline" size={18} color={C.pink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.semi, fontSize: 12.5, color: C.pinkSoft }}>
              Créditos acabando!
            </Text>
            <Text style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>
              Toque para ver os planos e continuar conversando
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={C.pink} />
        </Pressable>
      ) : null}

      {loading ? (
        <View style={{ paddingVertical: 60 }}>
          <ActivityIndicator color={C.pink} />
        </View>
      ) : !current ? (
        <View style={{ marginTop: 20 }}>
          <Empty
            icon="moon-outline"
            title="Por agora, é só você"
            text="Você viu todos os perfis disponíveis. Volte mais tarde ou amplie suas preferências."
          />
          <NeonButton label="Atualizar descobertas" variant="ghost" onPress={load} style={{ marginTop: 10 }} />
        </View>
      ) : (
        <>
          <Animated.View
            style={{
              marginTop: 14,
              opacity: fade,
              transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
            <Pressable onPress={() => router.push(`/user/${current.id}`)}>
              <View
                style={{
                  borderRadius: 28,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: C.borderPink,
                  backgroundColor: C.wine,
                  shadowColor: C.pink,
                  shadowOpacity: 0.3,
                  shadowRadius: 26,
                  shadowOffset: { width: 0, height: 14 },
                  elevation: 8,
                }}
              >
                {current.photos?.[0] ? (
                  <Image
                    source={{ uri: fileUrl(current.photos[0]) }}
                    style={{ width: '100%', height: cardHeight }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: '100%', height: cardHeight, alignItems: 'center', justifyContent: 'center' }}>
                    <Avatar name={current.name} size={110} />
                  </View>
                )}

                <LinearGradient
                  colors={['transparent', 'rgba(6,2,9,0.55)', 'rgba(6,2,9,0.96)']}
                  locations={[0.35, 0.68, 1]}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '66%' }}
                />

                <View style={{ position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', gap: 6 }}>
                  {current.highlightUntil ? <StatusPill label="Destaque" color={C.gold} /> : null}
                  {current.vip ? <StatusPill label="VIP" color={C.pink} /> : null}
                  {current.verified ? <StatusPill label="Verificado" color={C.ok} /> : null}
                </View>

                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, gap: 7 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text style={{ fontFamily: F.display, fontSize: 27, color: C.text }}>
                      {current.name.split(' ')[0]}
                      {current.age ? `, ${current.age}` : ''}
                    </Text>
                    {current.verified ? <Ionicons name="checkmark-circle" size={17} color={C.gold} /> : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="location-outline" size={12} color={C.muted} />
                    <Muted style={{ fontSize: 12 }}>{current.city || 'Brasil'}</Muted>
                    <Text style={{ color: C.border }}>·</Text>
                    <Muted style={{ fontSize: 12, color: C.pinkSoft }}>
                      {INTENTS[current.intent] || current.intent}
                    </Muted>
                  </View>
                  {current.bio ? (
                    <P numberOfLines={2} style={{ fontSize: 13, color: 'rgba(249,239,244,0.86)' }}>
                      {current.bio}
                    </P>
                  ) : null}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                    {(current.interests || []).slice(0, 4).map((interest: string) => (
                      <View
                        key={interest}
                        style={{
                          paddingHorizontal: 9,
                          paddingVertical: 4,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: 'rgba(233,199,124,0.35)',
                          backgroundColor: 'rgba(233,199,124,0.1)',
                        }}
                      >
                        <Text style={{ fontFamily: F.medium, fontSize: 10.5, color: C.gold }}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 26, marginTop: 20 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Passar perfil"
              onPress={() => advance()}
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <Ionicons name="close" size={26} color={C.muted} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar convite"
              onPress={invite}
              disabled={busy}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(233,199,124,0.1)',
              }}
            >
              <Ionicons name="star-outline" size={21} color={C.gold} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Curtir perfil"
              onPress={like}
              disabled={busy}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: C.pink,
                shadowColor: C.pink,
                shadowOpacity: 0.6,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: 8 },
                elevation: 10,
              }}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="heart" size={31} color="#fff" />}
            </Pressable>
          </View>

          {note ? (
            <Muted style={{ textAlign: 'center', marginTop: 14, fontSize: 12 }}>{note}</Muted>
          ) : (
            <Muted style={{ textAlign: 'center', marginTop: 14, fontSize: 11.5 }}>
              Toque na foto para ver o perfil completo
            </Muted>
          )}
        </>
      )}

      <MatchOverlay
        visible={Boolean(match)}
        me={user}
        other={match?.other}
        onClose={() => {
          setMatch(null);
          setIndex((i) => i + 1);
          load();
        }}
        onChat={() => {
          const matchId = match?.matchId;
          setMatch(null);
          if (matchId) router.push(`/chat/${matchId}`);
        }}
      />
    </Screen>
  );
}
