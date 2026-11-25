import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StickerView } from '../components/StickerView';
import { Empty, Glass, Header, Muted, NeonButton, P, Screen, SectionHeader, Sheet } from '../components/ui';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { C, F } from '../lib/theme';

export default function StickersScreen() {
  const router = useRouter();
  const { pick, matchId } = useLocalSearchParams<{ pick?: string; matchId?: string }>();
  const { user, refresh } = useSession();
  const [packs, setPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/stickers');
      setPacks(res.packs || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function useSticker(sticker: any) {
    if (pick === '1' && matchId) {
      try {
        await api.post(`/api/chats/${matchId}/messages`, { stickerId: sticker.id });
        refresh();
        router.back();
      } catch (e: any) {
        setError(e.message);
        setPreview(null);
      }
      return;
    }
    setPreview(sticker);
  }

  return (
    <Screen>
      <Header
        title={pick === '1' ? 'Escolher figurinha' : 'Figurinhas'}
        subtitle={pick === '1' ? 'Cada figurinha enviada consome 1 crédito' : 'Pacotes animados do Sussurro'}
      />

      <NeonButton
        label="Criar minha figurinha"
        icon="color-wand-outline"
        variant="gold"
        style={{ marginTop: 6 }}
        onPress={() => router.push('/sticker-studio')}
      />

      <Muted style={{ marginTop: 10, fontSize: 11.5 }}>
        Você tem {user?.credits ?? 0} crédito(s). Figurinhas animam sozinhas no chat.
      </Muted>

      {error ? (
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.danger, marginTop: 10 }}>{error}</Text>
      ) : null}

      {loading ? (
        <ActivityIndicator color={C.pink} style={{ marginTop: 30 }} />
      ) : (
        packs.map((pack) => (
          <View key={pack.id}>
            <SectionHeader title={pack.name} />
            {!pack.unlocked ? (
              <Glass glowColor={C.gold}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="lock-closed" size={17} color={C.gold} />
                  <Muted style={{ flex: 1, fontSize: 12 }}>
                    Pacote exclusivo. Libere com o Pacote Plus ou a Área VIP.
                  </Muted>
                </View>
                <NeonButton label="Desbloquear" small variant="gold" style={{ marginTop: 10 }} onPress={() => router.push('/credits')} />
              </Glass>
            ) : pack.stickers.length === 0 ? (
              <Muted style={{ fontSize: 12 }}>Nenhuma figurinha aqui ainda.</Muted>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {pack.stickers.map((sticker: any) => (
                  <Pressable
                    key={sticker.id}
                    onPress={() => useSticker(sticker)}
                    style={{
                      width: 78,
                      height: 88,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: C.border,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                  >
                    <StickerView sticker={sticker} size={52} />
                    <Text numberOfLines={1} style={{ fontFamily: F.medium, fontSize: 9, color: C.muted, marginTop: 3 }}>
                      {sticker.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))
      )}

      <Sheet visible={Boolean(preview)} onClose={() => setPreview(null)} title="Prévia da figurinha">
        {preview ? (
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 10 }}>
            <StickerView sticker={preview} size={150} />
            <P style={{ fontSize: 13 }}>{preview.label}</P>
            {pick === '1' ? (
              <NeonButton label="Enviar no chat" icon="send" onPress={() => useSticker(preview)} />
            ) : (
              <NeonButton label="Usar no chat" icon="chatbubble-outline" onPress={() => router.push('/(tabs)/chats')} />
            )}
          </View>
        ) : null}
      </Sheet>

      {!pick && !loading && packs.every((p) => p.stickers.length === 0) ? (
        <Empty icon="happy-outline" title="Sem figurinhas" text="Crie a sua primeira figurinha." />
      ) : null}
    </Screen>
  );
}
