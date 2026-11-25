import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Empty, Glass, Header, Muted, Screen, SectionHeader, StatusPill } from '../components/ui';
import { api } from '../lib/api';
import { brl, dateTime } from '../lib/format';
import { C, F, ORDER_STATUS } from '../lib/theme';

export default function TransactionsScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/orders');
      setOrders(res.orders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const approved = orders.filter((o) => o.status === 'approved');
  const total = approved.reduce((sum, o) => sum + Number(o.amount), 0);

  return (
    <Screen>
      <Header title="Histórico de transações" subtitle="Somente pagamentos aprovados liberam benefícios" />

      <Glass style={{ marginTop: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Muted style={{ fontSize: 11 }}>Total aprovado</Muted>
            <Text style={{ fontFamily: F.display, fontSize: 24, color: C.ok }}>{brl(total)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Muted style={{ fontSize: 11 }}>Pedidos</Muted>
            <Text style={{ fontFamily: F.display, fontSize: 24, color: C.text }}>{orders.length}</Text>
          </View>
        </View>
      </Glass>

      <SectionHeader title="Seus pedidos" />
      {loading ? (
        <ActivityIndicator color={C.pink} />
      ) : orders.length === 0 ? (
        <Empty icon="receipt-outline" title="Nenhuma transação" text="Seus pedidos de créditos aparecem aqui." />
      ) : (
        <View style={{ gap: 10 }}>
          {orders.map((order) => {
            const status = ORDER_STATUS[order.status] || ORDER_STATUS.awaiting_receipt;
            return (
              <Pressable key={order.id} onPress={() => router.push(`/order/${order.id}`)}>
                <Glass>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.text }}>
                      {order.packageName || order.packageId}
                    </Text>
                    <Text style={{ fontFamily: F.display, fontSize: 17, color: C.text }}>{brl(order.amount)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <Muted style={{ fontSize: 11 }}>
                      {order.code} · {dateTime(order.createdAt)}
                    </Muted>
                    <StatusPill label={status.label} color={status.color} />
                  </View>
                  {order.rejectReason ? (
                    <Muted style={{ fontSize: 11, color: C.danger, marginTop: 6 }}>
                      Motivo: {order.rejectReason}
                    </Muted>
                  ) : null}
                </Glass>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
