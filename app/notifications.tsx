import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Empty, Glass, Header, Muted, NeonButton, Screen } from '../components/ui';
import { api } from '../lib/api';
import { relative } from '../lib/format';
import { C, F } from '../lib/theme';

const ICONS: Record<string, string> = {
  match: 'heart',
  mensagem: 'chatbubble-ellipses',
  convite: 'mail-unread',
  pagamento: 'card',
  encontro: 'calendar',
  verificacao: 'shield-checkmark',
  nova_curtida: 'flame',
  boas_vindas: 'sparkles',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications');
      setItems(res.notifications || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function markAll() {
    await api.post('/api/notifications/read', {});
    load();
  }

  function open(item: any) {
    if (item.type === 'pagamento' && item.data?.orderId) router.push(`/order/${item.data.orderId}`);
    else if (item.data?.matchId) router.push(`/chat/${item.data.matchId}`);
    else if (item.type === 'encontro') router.push('/(tabs)/agenda');
    else if (item.type === 'verificacao') router.push('/verification');
  }

  return (
    <Screen>
      <Header
        title="Notificações"
        subtitle="Match, mensagens, convites, encontros e pagamentos"
        right={<NeonButton label="Marcar lidas" small variant="ghost" onPress={markAll} />}
      />

      {loading ? (
        <ActivityIndicator color={C.pink} style={{ marginTop: 30 }} />
      ) : items.length === 0 ? (
        <Empty icon="notifications-off-outline" title="Nada por aqui" text="Você será avisado(a) de cada novidade." />
      ) : (
        <View style={{ gap: 10, marginTop: 6 }}>
          {items.map((item) => (
            <Pressable key={item.id} onPress={() => open(item)}>
              <Glass
                style={{
                  borderColor: item.read ? C.border : 'rgba(255,61,154,0.4)',
                  backgroundColor: item.read ? 'rgba(255,255,255,0.04)' : 'rgba(255,61,154,0.07)',
                }}
              >
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(233,199,124,0.1)',
                      borderWidth: 1,
                      borderColor: C.border,
                    }}
                  >
                    <Ionicons name={(ICONS[item.type] || 'ellipse-outline') as any} size={15} color={C.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.text }}>{item.title}</Text>
                    <Muted style={{ fontSize: 11.5, marginTop: 2 }}>{item.body}</Muted>
                    <Muted style={{ fontSize: 10, marginTop: 4 }}>{relative(item.created_at)}</Muted>
                  </View>
                  {!item.read ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.pink, marginTop: 6 }} /> : null}
                </View>
              </Glass>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
