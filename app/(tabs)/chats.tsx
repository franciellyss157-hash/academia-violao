import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Avatar, Empty, Glass, H2, Muted, NeonButton, Screen, Wordmark } from '../../components/ui';
import { api } from '../../lib/api';
import { useSession } from '../../lib/session';
import { relative } from '../../lib/format';
import { C, F } from '../../lib/theme';

export default function ChatsScreen() {
  const router = useRouter();
  const { user, refresh } = useSession();
  const [matches, setMatches] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/matches');
      setMatches(res.matches || []);
      refresh();
    } catch {}
  }, [refresh]);

  useEffect(() => {
    load();
  }, [load]);

  const credits = user?.credits ?? 0;

  return (
    <Screen scroll={false} contentStyle={{ paddingBottom: 0 }}>
      <View style={{ paddingVertical: 10 }}>
        <Wordmark size={24} />
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
        <H2 style={{ marginTop: 4 }}>Conversas</H2>
        <Muted style={{ marginTop: 4, marginBottom: 14 }}>
          Cada mensagem consome 1 crédito. Você tem {credits} crédito(s).
        </Muted>

        {credits <= 3 ? (
          <Glass glowColor={C.gold} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="chatbubbles-outline" size={18} color={C.gold} />
              <Muted style={{ flex: 1, fontSize: 12 }}>
                Seus créditos estão acabando. Recarregue para não perder o fio da conversa.
              </Muted>
            </View>
            <NeonButton
              label="Comprar créditos"
              variant="gold"
              small
              style={{ marginTop: 10 }}
              onPress={() => router.push('/credits')}
            />
          </Glass>
        ) : null}

        {matches.length === 0 ? (
          <Empty
            icon="chatbubble-ellipses-outline"
            title="Nenhuma conversa ainda"
            text="Dê um match para liberar o chat privado entre vocês."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {matches.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => router.push(`/chat/${m.id}`)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.85 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: 'rgba(255,255,255,0.045)',
                })}
              >
                <Avatar uri={m.user?.photos?.[0]} name={m.user?.name} size={52} verified={m.user?.verified} />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 14.5, color: C.text }}>
                      {m.user?.name}
                    </Text>
                    {m.user?.vip ? <Ionicons name="diamond" size={11} color={C.gold} /> : null}
                  </View>
                  <Muted numberOfLines={1} style={{ fontSize: 12 }}>
                    {m.lastMessage
                      ? m.lastMessage.text || '🎀 enviou uma figurinha'
                      : 'Diga o primeiro sussurro'}
                  </Muted>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={{ fontFamily: F.body, fontSize: 10.5, color: C.muted }}>
                    {m.lastMessage?.created_at ? relative(m.lastMessage.created_at) : ''}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={C.muted} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
