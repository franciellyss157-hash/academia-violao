import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import {
  Chip,
  Field,
  Glass,
  Header,
  Muted,
  NeonButton,
  P,
  Screen,
  StatusPill,
} from '../../components/ui';
import { api } from '../../lib/api';
import { dateTime } from '../../lib/format';
import { C, F } from '../../lib/theme';

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/reports?status=${status}`);
      setReports(res.reports || []);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function resolve(id: string, action: 'resolve' | 'dismiss') {
    await api.patch(`/api/admin/reports/${id}`, { action, resolution: notes[id] || '' });
    load();
  }

  return (
    <Screen>
      <Header title="Denúncias" subtitle="Moderação da comunidade" />

      <View style={{ flexDirection: 'row', gap: 7, marginBottom: 12 }}>
        {[
          { id: 'open', label: 'Abertas' },
          { id: 'resolved', label: 'Resolvidas' },
          { id: 'dismissed', label: 'Arquivadas' },
          { id: '', label: 'Todas' },
        ].map((f) => (
          <Chip key={f.id || 'all'} label={f.label} selected={status === f.id} onPress={() => setStatus(f.id)} />
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={C.gold} />
      ) : reports.length === 0 ? (
        <Muted>Nenhuma denúncia neste filtro.</Muted>
      ) : (
        <View style={{ gap: 10 }}>
          {reports.map((report) => (
            <Glass key={report.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: F.semi, fontSize: 13.5, color: C.text }}>{report.reason}</Text>
                <StatusPill
                  label={report.status === 'open' ? 'Aberta' : report.status === 'resolved' ? 'Resolvida' : 'Arquivada'}
                  color={report.status === 'open' ? C.warn : report.status === 'resolved' ? C.ok : C.muted}
                />
              </View>
              <Muted style={{ fontSize: 11.5, marginTop: 4 }}>
                Denunciado: {report.target_name} ({report.target_email})
              </Muted>
              <Muted style={{ fontSize: 11 }}>
                Por {report.reporter_name} · {dateTime(report.created_at)}
              </Muted>
              {report.details ? <P style={{ fontSize: 12, marginTop: 6 }}>{report.details}</P> : null}

              {report.status === 'open' ? (
                <>
                  <Field
                    label="Nota da moderação"
                    value={notes[report.id] || ''}
                    onChangeText={(v) => setNotes({ ...notes, [report.id]: v })}
                    placeholder="O que foi feito"
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <NeonButton label="Resolver" small variant="gold" style={{ flex: 1 }} onPress={() => resolve(report.id, 'resolve')} />
                    <NeonButton label="Arquivar" small variant="ghost" style={{ flex: 1 }} onPress={() => resolve(report.id, 'dismiss')} />
                  </View>
                </>
              ) : report.resolution ? (
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  <Ionicons name="checkmark-circle-outline" size={13} color={C.ok} />
                  <Muted style={{ fontSize: 11 }}>{report.resolution}</Muted>
                </View>
              ) : null}
            </Glass>
          ))}
        </View>
      )}
    </Screen>
  );
}
