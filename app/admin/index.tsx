import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import {
  Chip,
  Field,
  Glass,
  H1,
  H2,
  IconButton,
  Muted,
  NeonButton,
  Screen,
  SectionHeader,
  StatusPill,
} from '../../components/ui';
import { api, fileUrl } from '../../lib/api';
import { brl, dateTime } from '../../lib/format';
import { useSession } from '../../lib/session';
import { C, F, ORDER_STATUS } from '../../lib/theme';

const FILTERS = [
  { id: '', label: 'Todos' },
  { id: 'under_review', label: 'Em análise' },
  { id: 'awaiting_receipt', label: 'Aguardando' },
  { id: 'approved', label: 'Aprovados' },
  { id: 'rejected', label: 'Recusados' },
];

export default function AdminPayments() {
  const router = useRouter();
  const { signOut } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [status, setStatus] = useState('under_review');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (q) params.set('q', q);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const [o, s, a] = await Promise.all([
        api.get(`/api/admin/orders?${params.toString()}`),
        api.get('/api/admin/stats'),
        api.get('/api/admin/alerts'),
      ]);
      setOrders(o.orders || []);
      setStats(s);
      setAlerts(a.alerts || []);
    } finally {
      setLoading(false);
    }
  }, [status, q, from, to]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function resolveAlert(id: string) {
    await api.patch(`/api/admin/alerts/${id}`, {});
    load();
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
        <View>
          <Text style={{ fontFamily: F.semi, fontSize: 10, letterSpacing: 2.4, color: C.gold }}>
            PAINEL ADM · SUSSURRO
          </Text>
          <H1 style={{ fontSize: 24, marginTop: 2 }}>Pagamentos</H1>
        </View>
        <IconButton icon="log-out-outline" onPress={async () => { await signOut(); router.replace('/auth'); }} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Glass style={{ flex: 1, padding: 12 }}>
          <Muted style={{ fontSize: 10 }}>Em análise</Muted>
          <Text style={{ fontFamily: F.display, fontSize: 22, color: C.pinkSoft }}>
            {stats?.pending_review ?? 0}
          </Text>
        </Glass>
        <Glass style={{ flex: 1, padding: 12 }}>
          <Muted style={{ fontSize: 10 }}>Aprovados</Muted>
          <Text style={{ fontFamily: F.display, fontSize: 22, color: C.ok }}>{brl(stats?.revenue ?? 0)}</Text>
        </Glass>
        <Glass style={{ flex: 1, padding: 12 }}>
          <Muted style={{ fontSize: 10 }}>Alertas</Muted>
          <Text style={{ fontFamily: F.display, fontSize: 22, color: C.warn }}>{stats?.alerts ?? 0}</Text>
        </Glass>
      </View>

      {alerts.length ? (
        <>
          <SectionHeader title="Alertas antifraude" />
          <View style={{ gap: 8 }}>
            {alerts.slice(0, 4).map((alert) => (
              <Glass key={alert.id} style={{ borderColor: 'rgba(255,200,87,0.4)', padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="warning-outline" size={15} color={C.warn} />
                  <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.text, flex: 1 }}>
                    {alert.message}
                  </Text>
                  <Pressable onPress={() => resolveAlert(alert.id)}>
                    <Text style={{ fontFamily: F.semi, fontSize: 11, color: C.gold }}>OK</Text>
                  </Pressable>
                </View>
              </Glass>
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="Filtros" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {FILTERS.map((f) => (
          <Chip key={f.id || 'all'} label={f.label} selected={status === f.id} onPress={() => setStatus(f.id)} />
        ))}
      </View>

      <View style={{ marginTop: 10 }}>
        <Field label="Buscar usuário, e-mail ou código" value={q} onChangeText={setQ} placeholder="Ex.: SS-A1B2C3" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="De (AAAA-MM-DD)" value={from} onChangeText={setFrom} placeholder="2026-01-01" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Até (AAAA-MM-DD)" value={to} onChangeText={setTo} placeholder="2026-12-31" />
          </View>
        </View>
      </View>
      <NeonButton label="Aplicar filtros" small variant="ghost" icon="funnel-outline" onPress={load} />

      <SectionHeader title={`Pedidos (${orders.length})`} />
      {loading ? (
        <ActivityIndicator color={C.gold} />
      ) : orders.length === 0 ? (
        <Muted>Nenhum pedido neste filtro.</Muted>
      ) : (
        <View style={{ gap: 10 }}>
          {orders.map((order) => {
            const st = ORDER_STATUS[order.status] || ORDER_STATUS.awaiting_receipt;
            const mismatch = order.flags?.length > 0;
            return (
              <Pressable key={order.id} onPress={() => router.push(`/admin/order/${order.id}`)}>
                <Glass style={mismatch ? { borderColor: 'rgba(255,200,87,0.45)' } : undefined}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {order.receiptUrl ? (
                      <Image
                        source={{ uri: fileUrl(order.receiptUrl) }}
                        style={{ width: 58, height: 58, borderRadius: 12 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: C.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="receipt-outline" size={18} color={C.muted} />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontFamily: F.semi, fontSize: 13.5, color: C.text }}>{order.userName}</Text>
                      <Muted style={{ fontSize: 10.5 }}>{order.userEmail}</Muted>
                      <Muted style={{ fontSize: 10.5 }}>
                        {order.packageName} · esperado {brl(order.amount)}
                        {order.amountPaid !== null ? ` · informado ${brl(order.amountPaid)}` : ''}
                      </Muted>
                      <Muted style={{ fontSize: 10 }}>{order.code} · {dateTime(order.createdAt)}</Muted>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 5 }}>
                      <StatusPill label={st.label} color={st.color} />
                      <Ionicons name="chevron-forward" size={14} color={C.muted} />
                    </View>
                  </View>
                  {mismatch ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                      {order.flags.map((flag: string) => (
                        <StatusPill key={flag} label={flag} color={C.warn} />
                      ))}
                    </View>
                  ) : null}
                </Glass>
              </Pressable>
            );
          })}
        </View>
      )}

      <Glass style={{ marginTop: 18 }}>
        <H2 style={{ fontSize: 15 }}>Histórico completo</H2>
        <Muted style={{ fontSize: 11.5, marginTop: 4 }}>
          Aprovações e recusas guardam data, valor e motivo. Use os filtros “Aprovados” e “Recusados”
          para auditar.
        </Muted>
      </Glass>
    </Screen>
  );
}
