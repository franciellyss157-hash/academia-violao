import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Text, View } from 'react-native';
import {
  Chip,
  Field,
  Glass,
  Header,
  Muted,
  NeonButton,
  P,
  Screen,
  SectionHeader,
  Sheet,
  StatusPill,
} from '../../../components/ui';
import { api, fileUrl } from '../../../lib/api';
import { brl, dateTime } from '../../../lib/format';
import { C, F, ORDER_STATUS } from '../../../lib/theme';

const REASONS = [
  'Comprovante falso',
  'Valor errado',
  'Comprovante repetido',
  'Imagem ilegível',
  'Pagamento não localizado',
];

export default function AdminOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/admin/orders/${id}`);
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve() {
    setBusy(true);
    setError('');
    try {
      await api.post(`/api/admin/orders/${id}/approve`);
      setNote('Pedido aprovado. Créditos e benefícios liberados e usuário notificado.');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    const finalReason = custom.trim() || reason;
    setBusy(true);
    setError('');
    try {
      await api.post(`/api/admin/orders/${id}/reject`, { reason: finalReason });
      setSheet(false);
      setCustom('');
      setNote('Pedido recusado. O motivo foi enviado ao usuário.');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Header title="Pedido" />
        <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  const order = data?.order;
  if (!order) {
    return (
      <Screen>
        <Header title="Pedido" />
        <Muted>{error || 'Pedido não encontrado.'}</Muted>
      </Screen>
    );
  }

  const st = ORDER_STATUS[order.status] || ORDER_STATUS.awaiting_receipt;
  const decided = order.status === 'approved' || order.status === 'rejected';

  return (
    <Screen>
      <Header title={order.code} subtitle={`${order.userName} · ${order.userEmail}`} />

      <Glass style={{ marginTop: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Muted style={{ fontSize: 10.5 }}>{order.packageName}</Muted>
            <Text style={{ fontFamily: F.display, fontSize: 24, color: C.text }}>{brl(order.amount)}</Text>
          </View>
          <StatusPill label={st.label} color={st.color} />
        </View>
        <View style={{ marginTop: 10, gap: 3 }}>
          <Muted style={{ fontSize: 11 }}>Valor informado: {order.amountPaid !== null ? brl(order.amountPaid) : '—'}</Muted>
          <Muted style={{ fontSize: 11 }}>Pagador: {order.payerName || '—'}</Muted>
          <Muted style={{ fontSize: 11 }}>Criado em {dateTime(order.createdAt)}</Muted>
          {order.reviewedAt ? <Muted style={{ fontSize: 11 }}>Revisado em {dateTime(order.reviewedAt)}</Muted> : null}
        </View>
        {order.flags?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {order.flags.map((flag: string) => (
              <StatusPill key={flag} label={flag} color={C.warn} />
            ))}
          </View>
        ) : null}
      </Glass>

      {order.userFlagged ? (
        <Glass style={{ marginTop: 10, borderColor: 'rgba(255,90,110,0.45)' }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={16} color={C.danger} />
            <Muted style={{ flex: 1, fontSize: 11.5, color: C.danger }}>
              Usuário marcado para análise (recusas seguidas). Considere suspender em Usuários.
            </Muted>
          </View>
        </Glass>
      ) : null}

      <SectionHeader title="Comprovante" />
      {order.receiptUrl ? (
        <Pressable onPress={() => setZoom(true)}>
          <Image
            source={{ uri: fileUrl(order.receiptUrl) }}
            style={{ width: '100%', height: 280, borderRadius: 18, borderWidth: 1, borderColor: C.border }}
            resizeMode="cover"
          />
          <Muted style={{ fontSize: 10.5, textAlign: 'center', marginTop: 6 }}>Toque para ampliar</Muted>
        </Pressable>
      ) : (
        <Glass>
          <Muted style={{ fontSize: 12 }}>Nenhum comprovante anexado ainda.</Muted>
        </Glass>
      )}

      {data?.submissions?.length ? (
        <>
          <SectionHeader title="Envios registrados" />
          <Glass>
            {data.submissions.map((sub: any) => (
              <View key={sub.id} style={{ paddingVertical: 5 }}>
                <Muted style={{ fontSize: 10.5 }}>
                  {dateTime(sub.created_at)} · {brl(sub.amount_paid)} · {sub.payer_name}
                </Muted>
                <Muted style={{ fontSize: 9.5 }} numberOfLines={1}>
                  hash {sub.hash.slice(0, 24)}...
                </Muted>
              </View>
            ))}
          </Glass>
        </>
      ) : null}

      {note ? (
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.ok, marginTop: 12 }}>{note}</Text>
      ) : null}
      {error ? (
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.danger, marginTop: 12 }}>{error}</Text>
      ) : null}

      {!decided ? (
        <View style={{ marginTop: 16, gap: 10 }}>
          <NeonButton
            label="Aprovar e liberar créditos"
            variant="gold"
            icon="checkmark-circle-outline"
            loading={busy}
            onPress={approve}
          />
          <NeonButton label="Recusar com motivo" variant="danger" icon="close-circle-outline" onPress={() => setSheet(true)} />
        </View>
      ) : (
        <Glass style={{ marginTop: 16 }}>
          <P style={{ fontSize: 12.5 }}>
            Pedido {order.status === 'approved' ? 'aprovado' : 'recusado'}
            {order.rejectReason ? ` — motivo: ${order.rejectReason}` : ''}.
          </P>
          <NeonButton
            label="Voltar aos pagamentos"
            variant="ghost"
            small
            style={{ marginTop: 10 }}
            onPress={() => router.replace('/admin')}
          />
        </Glass>
      )}

      <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}>
        <Pressable
          onPress={() => setZoom(false)}
          style={{ flex: 1, backgroundColor: 'rgba(3,1,5,0.96)', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <Image source={{ uri: fileUrl(order.receiptUrl) }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
          <Muted style={{ marginTop: 12 }}>Toque para fechar</Muted>
        </Pressable>
      </Modal>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Motivo da recusa">
        <Muted style={{ fontSize: 11.5, marginBottom: 10 }}>
          O motivo é obrigatório e será enviado ao usuário nas notificações.
        </Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
          {REASONS.map((r) => (
            <Chip key={r} label={r} selected={!custom && reason === r} onPress={() => { setReason(r); setCustom(''); }} />
          ))}
        </View>
        <Field label="Outro motivo (opcional)" value={custom} onChangeText={setCustom} placeholder="Descreva o motivo" />
        <NeonButton label="Confirmar recusa" variant="danger" loading={busy} onPress={reject} />
      </Sheet>
    </Screen>
  );
}
