import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Field, Glass, Header, Muted, NeonButton, Screen, Sheet } from '../components/ui';
import { api, appendImage, pickImage, squareCrop } from '../lib/api';
import { C, F } from '../lib/theme';

const EMOJIS = ['❤️', '😘', '🥰', '💋', '🌹', '✨', '😍', '💌'];

export default function StickerStudio() {
  const router = useRouter();
  const [photo, setPhoto] = useState<any>(null);
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('❤️');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function choose() {
    try {
      const asset = await pickImage();
      if (!asset) return;
      const cropped = await squareCrop(asset);
      setPhoto(cropped);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function save() {
    if (!photo && !emoji) {
      setError('Escolha uma foto ou um emoji.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const form = new FormData();
      if (photo) await appendImage(form, 'photo', photo);
      form.append('text', text);
      form.append('emoji', emoji);
      await api.upload('/api/stickers', form);
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Header title="Criador de figurinhas" subtitle="Recorte, escreva e salve a sua" />

      <Glass style={{ marginTop: 8, alignItems: 'center' }}>
        <View
          style={{
            width: 220,
            height: 220,
            borderRadius: 28,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: C.borderPink,
            backgroundColor: 'rgba(255,255,255,0.04)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {photo ? (
            <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Ionicons name="image-outline" size={34} color={C.gold} />
              <Muted style={{ fontSize: 11.5 }}>Escolha uma foto</Muted>
            </View>
          )}

          {text ? (
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                paddingVertical: 7,
                paddingHorizontal: 8,
                backgroundColor: 'rgba(6,2,9,0.66)',
              }}
            >
              <Text style={{ fontFamily: F.semi, fontSize: 15, color: C.text, textAlign: 'center' }} numberOfLines={1}>
                {text}
              </Text>
            </View>
          ) : null}

          <Text
            style={{
              position: 'absolute',
              top: 8,
              right: 10,
              fontSize: 34,
              textShadowColor: 'rgba(255,61,154,0.65)',
              textShadowRadius: 12,
            }}
          >
            {emoji}
          </Text>
        </View>

        <NeonButton
          label={photo ? 'Trocar foto' : 'Escolher foto'}
          variant="ghost"
          small
          icon="camera-outline"
          style={{ marginTop: 14 }}
          onPress={choose}
        />
        <Muted style={{ fontSize: 10.5, marginTop: 8, textAlign: 'center' }}>
          A foto é recortada em quadrado automaticamente para virar figurinha.
        </Muted>
      </Glass>

      <View style={{ marginTop: 14 }}>
        <Field
          label="Texto da figurinha"
          value={text}
          onChangeText={(v) => setText(v.slice(0, 24))}
          placeholder="Te quero aqui 🥰"
          maxLength={24}
        />
        <Text style={{ fontFamily: F.semi, fontSize: 11, letterSpacing: 1.6, color: C.gold, marginBottom: 8 }}>
          EMOJI
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {EMOJIS.map((e) => (
            <Text
              key={e}
              onPress={() => setEmoji(e)}
              style={{
                fontSize: 26,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: emoji === e ? C.pink : C.border,
                backgroundColor: emoji === e ? 'rgba(255,61,154,0.14)' : 'rgba(255,255,255,0.03)',
              }}
            >
              {e}
            </Text>
          ))}
        </View>
      </View>

      {error ? (
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.danger, marginTop: 12 }}>{error}</Text>
      ) : null}

      <NeonButton
        label="Salvar figurinha"
        icon="save-outline"
        loading={saving}
        style={{ marginTop: 16 }}
        onPress={save}
      />

      <Sheet visible={done} onClose={() => setDone(false)} title="Figurinha criada!">
        <Muted>Sua figurinha está no pacote “Minhas figurinhas” e já pode ser enviada no chat.</Muted>
        <NeonButton
          label="Ver minhas figurinhas"
          style={{ marginTop: 10 }}
          onPress={() => {
            setDone(false);
            router.replace('/stickers');
          }}
        />
      </Sheet>
    </Screen>
  );
}
