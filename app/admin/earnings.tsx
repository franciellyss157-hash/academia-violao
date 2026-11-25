import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Chip, Glass, Header, Muted, Screen, Stat } from '../../components/ui';
import { api } from '../../lib/api';
import { brl } from '../../lib/format';
import { C, F } from '../../lib/theme';

export default function AdminEarnings() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: 'day' | 'week' | 'month') => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/earnings?period=${p}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(period);
    }, [load, period])
  );

  const max = Math.max(1, ...(data?.buckets || []).map((b: any) => b.total));

  return (
    <Screen>
      <Header title="Relatório de ganhos" subtitle="Somente pagamentos aprovados" />

      <Glass glowColor={C.gold}>
        <View style={{ flexDirection: 'row' }}>
          <Stat value={brl(data?.totals?.today ?? 0)} label="hoje" color={C.ok} />
          <Stat value={brl(data?.totals?.week ?? 0)} label="semana" />
          <Stat value={brl(data?.totals?.month ?? 0)} label="mês" />
        </View>
        <View style={{ height: 1, backgroundColor: C.border, marginVertical: 12 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Muted style={{ fontSize: 11 }}>Total aprovado</Muted>
          <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.gold }}>
            {brl(data?.totals?.all_time ?? 0)} · {data?.totals?.approved_count ?? 0} pedidos
          </Text>
        </View>
      </Glass>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        <Chip label="Por dia" selected={period === 'day'} onPress={() => setPeriod('day')} />
        <Chip label="Por semana" selected={period === 'week'} onPress={() => setPeriod('week')} />
        <Chip label="Por mês" selected={period === 'month'} onPress={() => setPeriod('month')} />
      </View>

      {loading ? (
        <ActivityIndicator color={C.gold} style={{ marginTop: 24 }} />
      ) : (
        <View style={{ gap: 8, marginTop: 14 }}>
          {(data?.buckets || []).length === 0 ? (
            <Muted>Nenhum pagamento aprovado ainda.</Muted>
          ) : (
            data.buckets.map((bucket: any) => (
              <View key={bucket.bucket} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Muted style={{ fontSize: 11 }}>{bucket.bucket}</Muted>
                  <Text style={{ fontFamily: F.semi, fontSize: 11.5, color: C.text }}>
                    {brl(bucket.total)} · {bucket.orders}
                  </Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.07)' }}>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: `${Math.max(4, (bucket.total / max) * 100)}%`,
                      backgroundColor: C.gold,
                    }}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </Screen>
  );
}
