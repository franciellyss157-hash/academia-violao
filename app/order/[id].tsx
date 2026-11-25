import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import {
  Field,
  Glass,
  H2,
  Header,
  Muted,
  NeonButton,
  P,
  Screen,
  StatusPill,
} from '../../components/ui';
import { api, appendImage, fileUrl, pickImage } from '../../lib/api';
import { brl, dateTime } from '../../lib/format';
import { useSession } from '../../lib/session';
import { C, F, ORDER_STATUS } from '../../lib/theme';

const STEPS = ['awaiting_receipt', 'under_review', 'reviewed'];

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refresh } = useSession();
  const [order, setOrder] = useState<any>(null);
  const [pix, setPix] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [payerName, setPayerName] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const poll = useRef<any>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/orders/${id}`);
      setOrder(res.order);
      setPix(res.pix);
      setAmountPaid((prev) => prev || String(res.order.amount).replace('.', ','));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    poll.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/orders/${id}`);
        setOrder(res.order);
      } catch {}
    }, 8000);
    return () => clearInterval(poll.current);
  }, [id]);

  async function copyKey() {
    if (!pix?.key) return;
    await Clipboard.setStringAsync(pix.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  async function chooseReceipt() {
    try {
      const asset = await pickImage();
      if (asset) setReceipt(asset);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function submitReceipt() {
    if (!receipt) {
      setError('Anexe a foto do comprovante.');
      return;
    }
    if (!payerName.trim()) {
      setError('Informe o nome do pagador.');
      return;
    }
    setSending(true);
    setError('');
    setNote('');
    try {
      const form = new FormData();
      await appendImage(form, 'receipt', receipt);
      form.append('payerName', payerName.trim());
      form.append('amountPaid', amountPaid.replace(',', '.'));
      const res = await api.upload(`/api/orders/${id}/receipt`, form);
      setOrder(res.order);
      setReceipt(null);
      setNote('Comprovante enviado! Seu pedido está em análise.');
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Header title="Pedido" />
        <ActivityIndicator color={C.pink} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <Header title="Pedido" />
        <Muted>{error || 'Pedido não encontrado.'}</Muted>
      </Screen>
    );
  }

  const status = ORDER_STATUS[order.status] || ORDER_STATUS.awaiting_receipt;
  const canSend = order.status === 'awaiting_receipt' || order.status === 'rejected';
  const stepIndex = order.status === 'approved' || order.status === 'rejected' ? 2 : order.status === 'under_review' ? 1 : 0;

  return (
    <Screen>
      <Header title={`Pedido ${order.code}`} subtitle={order.packageName || 'Pacote Sussurro'} />

      <Glass glowColor={order.status === 'approved' ? C.ok : order.status === 'rejected' ? C.danger : C.pink} style={{ marginTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Muted style={{ fontSize: 11 }}>Valor do pacote</Muted>
            <Text style={{ fontFamily: F.display, fontSize: 26, color: C.text }}>{brl(order.amount)}</Text>
          </View>
          <StatusPill label={status.label} color={status.color} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: i <= stepIndex ? status.color : 'rgba(255,255,255,0.08)',
                }}
              >
                <Text style={{ fontFamily: F.semi, fontSize: 10, color: i <= stepIndex ? '#0B0409' : C.muted }}>
                  {i + 1}
                </Text>
              </View>
              {i < STEPS.length - 1 ? (
                <View style={{ flex: 1, height: 1, backgroundColor: i < stepIndex ? status.color : 'rgba(255,255,255,0.12)' }} />
              ) : null}
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Muted style={{ fontSize: 9.5 }}>Comprovante</Muted>
          <Muted style={{ fontSize: 9.5 }}>Análise do ADM</Muted>
          <Muted style={{ fontSize: 9.5 }}>Resultado</Muted>
        </View>
      </Glass>

      {order.status === 'rejected' ? (
        <Glass style={{ marginTop: 12, borderColor: 'rgba(255,90,110,0.5)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="alert-circle" size={17} color={C.danger} />
            <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.danger }}>Comprovante recusado</Text>
          </View>
          <P style={{ fontSize: 12.5, marginTop: 6 }}>
            Motivo: {order.rejectReason || 'não informado'}
          </P>
          <Muted style={{ fontSize: 11.5, marginTop: 4 }}>
            Você pode enviar um novo comprovante abaixo.
          </Muted>
        </Glass>
      ) : null}

      {order.status === 'approved' ? (
        <Glass style={{ marginTop: 12, borderColor: 'rgba(91,224,168,0.45)' }} glowColor={C.ok}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="checkmark-circle" size={18} color={C.ok} />
            <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.ok }}>Pagamento aprovado</Text>
          </View>
          <Muted style={{ fontSize: 12, marginTop: 6 }}>
            Créditos e benefícios liberados em {dateTime(order.reviewedAt)}.
          </Muted>
          <NeonButton label="Ver meus créditos" small variant="gold" style={{ marginTop: 10 }} onPress={() => router.push('/credits')} />
        </Glass>
      ) : null}

      <Glass style={{ marginTop: 12 }}>
        <Text style={{ fontFamily: F.semi, fontSize: 11, letterSpacing: 1.6, color: C.gold, marginBottom: 8 }}>
          PAGAMENTO PIX
        </Text>
        <Muted style={{ fontSize: 11.5 }}>Chave Pix (e-mail)</Muted>
        <Text style={{ fontFamily: F.semi, fontSize: 15, color: C.text, marginTop: 3 }}>{pix?.key}</Text>
        <Muted style={{ fontSize: 11.5, marginTop: 6 }}>
          Favorito: {pix?.holder} · Valor exato: {brl(order.amount)}
        </Muted>
        <NeonButton
          label={copied ? 'Chave copiada!' : 'Copiar chave'}
          variant="ghost"
          small
          icon={copied ? 'checkmark' : 'copy-outline'}
          style={{ marginTop: 12 }}
          onPress={copyKey}
        />
        <View
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: 'rgba(255,255,255,0.03)',
          }}
        >
          <Muted style={{ fontSize: 11 }}>
            Código único do pedido: <Text style={{ fontFamily: F.semi, color: C.gold }}>{order.code}</Text>
          </Muted>
        </View>
      </Glass>

      {order.receiptUrl ? (
        <Glass style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: F.semi, fontSize: 11, letterSpacing: 1.6, color: C.gold, marginBottom: 8 }}>
            SEU COMPROVANTE
          </Text>
          <Image
            source={{ uri: fileUrl(order.receiptUrl) }}
            style={{ width: '100%', height: 190, borderRadius: 14 }}
            resizeMode="cover"
          />
          <Muted style={{ fontSize: 11, marginTop: 8 }}>
            Pagador: {order.payerName} · Valor informado: {brl(order.amountPaid)}
          </Muted>
          {order.flags?.length ? (
            <Muted style={{ fontSize: 11, color: C.warn, marginTop: 4 }}>
              Observação do ADM: {order.flags.join(' · ')}
            </Muted>
          ) : null}
        </Glass>
      ) : null}

      {canSend ? (
        <Glass style={{ marginTop: 12 }}>
          <H2 style={{ fontSize: 17 }}>Enviar comprovante</H2>
          <Muted style={{ fontSize: 11.5, marginTop: 4, marginBottom: 10 }}>
            Anexe o print do Pix. O ADM confere o valor e libera os créditos manualmente.
          </Muted>

          <NeonButton
            label={receipt ? 'Trocar imagem' : 'Anexar foto do comprovante'}
            variant="ghost"
            small
            icon="image-outline"
            onPress={chooseReceipt}
          />
          {receipt ? (
            <Image source={{ uri: receipt.uri }} style={{ width: '100%', height: 170, borderRadius: 14, marginTop: 10 }} />
          ) : null}

          <View style={{ marginTop: 12 }}>
            <Field
              label="Valor pago (R$)"
              value={amountPaid}
              onChangeText={setAmountPaid}
              keyboardType="decimal-pad"
              placeholder="0,99"
            />
            <Field
              label="Nome do pagador"
              value={payerName}
              onChangeText={setPayerName}
              placeholder="Nome que aparece no comprovante"
            />
          </View>

          {error ? (
            <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.danger, marginBottom: 10 }}>{error}</Text>
          ) : null}

          <NeonButton
            label="Enviar comprovante"
            icon="cloud-upload-outline"
            loading={sending}
            onPress={submitReceipt}
          />
        </Glass>
      ) : null}

      {order.status === 'under_review' ? (
        <Glass style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="time-outline" size={17} color={C.pink} />
            <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.pinkSoft }}>Em análise</Text>
          </View>
          <Muted style={{ fontSize: 12, marginTop: 6 }}>
            O ADM vai conferir seu comprovante. Você recebe uma notificação assim que o pedido for
            aprovado ou recusado. Créditos nunca são liberados automaticamente.
          </Muted>
        </Glass>
      ) : null}

      {note ? (
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.ok, marginTop: 12 }}>{note}</Text>
      ) : null}
    </Screen>
  );
}
