import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import {
  Avatar,
  Empty,
  Glass,
  H2,
  Muted,
  NeonButton,
  Screen,
  SectionHeader,
  StatusPill,
  Wordmark,
} from '../../components/ui';
import { api, fileUrl } from '../../lib/api';
import { C, F } from '../../lib/theme';

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [invites, setInvites] = useState<any>({ incoming: [], outgoing: [] });
  const [likedMe, setLikedMe] = useState<any[]>([]);
  const [locked, setLocked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const [m, i] = await Promise.all([api.get('/api/matches'), api.get('/api/invites')]);
      setMatches(m.matches || []);
      setInvites(i);
      try {
        const l = await api.get('/api/likes/received');
        setLikedMe(l.people || []);
        setLocked(false);
      } catch (e: any) {
        if (e.status === 402) {
          setLocked(true);
          setLikedMe([]);
        }
      }
    } catch (e: any) {
      setNote(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(id: string, action: 'accept' | 'decline') {
    try {
      await api.patch(`/api/invites/${id}`, { action });
      setNote(action === 'accept' ? 'Convite aceito — vocês agora podem conversar.' : 'Convite recusado.');
      load();
    } catch (e: any) {
      setNote(e.message);
    }
  }

  return (
    <Screen scroll={false} contentStyle={{ paddingBottom: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
        <Wordmark size={24} />
        <Pressable onPress={() => router.push('/inspiration')} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name="sparkles-outline" size={14} color={C.gold} />
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.gold }}>Inspiração</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={C.pink}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <H2 style={{ marginTop: 6 }}>Seus encontros</H2>
        <Muted style={{ marginTop: 4 }}>
          Convites, quem sussurrou por você e os matches que já aconteceram.
        </Muted>
        {note ? (
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.pinkSoft, marginTop: 10 }}>{note}</Text>
        ) : null}

        {invites.incoming?.filter((i: any) => i.status === 'pending').length > 0 ? (
          <>
            <SectionHeader title="Convites recebidos" />
            <View style={{ gap: 10 }}>
              {invites.incoming
                .filter((i: any) => i.status === 'pending')
                .map((invite: any) => (
                  <Glass key={invite.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar
                      uri={invite.from?.photos?.[0]}
                      name={invite.from?.name}
                      size={46}
                      verified={invite.from?.verified}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.text }}>
                        {invite.from?.name || 'Alguém'}
                      </Text>
                      <Muted style={{ fontSize: 11.5 }} numberOfLines={1}>
                        {invite.message || 'Enviou um convite'}
                      </Muted>
                    </View>
                    <Pressable
                      onPress={() => respond(invite.id, 'decline')}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        borderWidth: 1,
                        borderColor: C.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="close" size={16} color={C.muted} />
                    </Pressable>
                    <Pressable
                      onPress={() => respond(invite.id, 'accept')}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: C.pink,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="checkmark" size={17} color="#fff" />
                    </Pressable>
                  </Glass>
                ))}
            </View>
          </>
        ) : null}

        <SectionHeader
          title="Quem curtiu você"
          action={locked ? 'Liberar' : undefined}
          onAction={() => router.push('/credits')}
        />
        {locked ? (
          <Glass glowColor={C.gold}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: C.gold,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(233,199,124,0.12)',
                }}
              >
                <Ionicons name="lock-closed" size={19} color={C.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.semi, fontSize: 13.5, color: C.text }}>
                  Recurso do Pacote Plus e da Área VIP
                </Text>
                <Muted style={{ fontSize: 11.5 }}>
                  Descubra quem já sussurrou por você e dê o primeiro passo.
                </Muted>
              </View>
            </View>
            <NeonButton
              label="Ver pacotes"
              variant="gold"
              small
              style={{ marginTop: 12 }}
              onPress={() => router.push('/credits')}
            />
          </Glass>
        ) : likedMe.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {likedMe.map((person) => (
              <Pressable
                key={person.id}
                onPress={() => router.push(`/user/${person.id}`)}
                style={{ alignItems: 'center', width: 72, gap: 5 }}
              >
                <Avatar uri={person.photos?.[0]} name={person.name} size={58} verified={person.verified} />
                <Text numberOfLines={1} style={{ fontFamily: F.medium, fontSize: 11, color: C.text }}>
                  {person.name.split(' ')[0]}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Muted style={{ fontSize: 12 }}>Ninguém por aqui ainda. Continue descobrindo pessoas.</Muted>
        )}

        <SectionHeader title={`Seus matches (${matches.length})`} />
        {matches.length === 0 ? (
          <Empty
            icon="heart-dislike-outline"
            title="Nenhum match ainda"
            text="Quando alguém curtir você de volta, o Sussurro avisa na hora."
          />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {matches.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => router.push(`/chat/${m.id}`)}
                style={{
                  width: '47%',
                  borderRadius: 20,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.wine,
                }}
              >
                {m.user?.photos?.[0] ? (
                  <Image
                    source={{ uri: fileUrl(m.user.photos[0]) }}
                    style={{ width: '100%', aspectRatio: 1 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Avatar name={m.user?.name} size={54} />
                  </View>
                )}
                <View style={{ padding: 10, gap: 3 }}>
                  <Text numberOfLines={1} style={{ fontFamily: F.semi, fontSize: 13, color: C.text }}>
                    {m.user?.name?.split(' ')[0]}
                  </Text>
                  <Muted numberOfLines={1} style={{ fontSize: 10.5 }}>
                    {m.lastMessage?.text || 'Diga o primeiro sussurro'}
                  </Muted>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ marginTop: 22, flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <StatusPill label="Conversas com créditos" color={C.pink} />
          <StatusPill label="Perfis verificados" color={C.ok} />
        </View>
      </ScrollView>
    </Screen>
  );
}
