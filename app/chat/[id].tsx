import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StickerView } from '../../components/StickerView';
import { Avatar, Glass, IconButton, Muted, NeonButton, Sheet } from '../../components/ui';
import { api } from '../../lib/api';
import { useSession } from '../../lib/session';
import { timeOnly } from '../../lib/format';
import { C, F } from '../../lib/theme';

async function buzz() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const [match, setMatch] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [noCredits, setNoCredits] = useState(false);
  const [error, setError] = useState('');
  const scroller = useRef<ScrollView>(null);
  const count = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/chats/${id}`);
      setMatch(res.match);
      setMessages(res.messages || []);
      count.current = res.messages?.length || 0;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await api.get(`/api/chats/${id}`);
        const incoming = res.messages || [];
        if (incoming.length > count.current) {
          const last = incoming[incoming.length - 1];
          if (last.sender_id !== user?.id) buzz();
          count.current = incoming.length;
          setMessages(incoming);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(timer);
  }, [id, user?.id]);

  async function send() {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await api.post(`/api/chats/${id}/messages`, { text: value });
      setMessages((prev) => [...prev, { ...res.message, mine: true }]);
      count.current += 1;
      setText('');
      setMatch((m: any) => (m ? { ...m, credits: res.credits } : m));
      buzz();
    } catch (e: any) {
      if (e.code === 'sem_creditos' || e.status === 402) setNoCredits(true);
      else setError(e.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.pink} />
      </View>
    );
  }

  const other = match?.other;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={['#190612', C.bg, '#040206']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }} edges={['top', 'left', 'right']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <IconButton icon="chevron-back" onPress={() => router.back()} />
            <Avatar uri={other?.photos?.[0]} name={other?.name} size={40} verified={other?.verified} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.text }}>{other?.name}</Text>
              <Muted style={{ fontSize: 10.5 }}>
                {match?.credits ?? 0} créditos · 1 por mensagem
              </Muted>
            </View>
            <IconButton icon="sparkles-outline" onPress={() => router.push('/inspiration')} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              ref={scroller}
              contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}
              onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
            >
              <Glass style={{ alignItems: 'center', gap: 4, paddingVertical: 12 }}>
                <Text style={{ fontFamily: F.displayItalic, fontSize: 13.5, color: C.gold }}>
                  Vocês deram match 💞
                </Text>
                <Muted style={{ fontSize: 11, textAlign: 'center' }}>
                  Conversa protegida. Respeite as regras de uso do Sussurro.
                </Muted>
              </Glass>

              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                if (m.sticker_id || m.emoji) {
                  return (
                    <View key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start' }}>
                      <StickerView sticker={m} size={96} />
                      <Text style={{ fontFamily: F.body, fontSize: 9.5, color: C.muted, textAlign: mine ? 'right' : 'left', marginTop: 3 }}>
                        {timeOnly(m.created_at)}
                      </Text>
                    </View>
                  );
                }
                return (
                  <View
                    key={m.id}
                    style={{
                      alignSelf: mine ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 18,
                      borderBottomRightRadius: mine ? 5 : 18,
                      borderBottomLeftRadius: mine ? 18 : 5,
                      borderWidth: mine ? 0 : 1,
                      borderColor: C.border,
                      backgroundColor: mine ? 'rgba(255,61,154,0.9)' : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <Text style={{ fontFamily: F.body, fontSize: 14, color: mine ? '#FFF6FA' : C.text, lineHeight: 20 }}>
                      {m.text}
                    </Text>
                    <Text
                      style={{
                        fontFamily: F.body,
                        fontSize: 9,
                        color: mine ? 'rgba(255,246,250,0.7)' : C.muted,
                        marginTop: 4,
                        textAlign: 'right',
                      }}
                    >
                      {timeOnly(m.created_at)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {error ? (
              <Text style={{ fontFamily: F.medium, fontSize: 11.5, color: C.danger, paddingHorizontal: 16, paddingBottom: 6 }}>
                {error}
              </Text>
            ) : null}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderTopWidth: 1,
                borderTopColor: C.border,
                backgroundColor: 'rgba(6,2,9,0.6)',
              }}
            >
              <Pressable
                onPress={() => router.push(`/stickers?pick=1&matchId=${id}`)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: C.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(233,199,124,0.08)',
                }}
              >
                <Ionicons name="happy-outline" size={19} color={C.gold} />
              </Pressable>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Sussurre algo..."
                placeholderTextColor="rgba(181,143,160,0.65)"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 20,
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                  color: C.text,
                  fontFamily: F.body,
                  fontSize: 14,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}
                onSubmitEditing={send}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enviar mensagem"
                onPress={send}
                disabled={sending}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: C.pink,
                  shadowColor: C.pink,
                  shadowOpacity: 0.5,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="arrow-up" size={20} color="#fff" />}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      <Sheet visible={noCredits} onClose={() => setNoCredits(false)} title="Créditos esgotados">
        <Muted>
          Cada mensagem consome 1 crédito de conversa. Adquira um pacote para continuar falando com{' '}
          {other?.name?.split(' ')[0]}.
        </Muted>
        <NeonButton
          label="Ver pacotes"
          icon="diamond-outline"
          style={{ marginTop: 10 }}
          onPress={() => {
            setNoCredits(false);
            router.push('/credits');
          }}
        />
      </Sheet>
    </View>
  );
}
