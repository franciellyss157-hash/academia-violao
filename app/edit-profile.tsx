import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Chip, Field, Glass, Header, Muted, NeonButton, Screen, SectionHeader } from '../components/ui';
import { api, appendImage, fileUrl, pickImage } from '../lib/api';
import { useSession } from '../lib/session';
import { C, F, INTENTS } from '../lib/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refresh } = useSession();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [intent, setIntent] = useState(user?.intent || 'namoro');
  const [interests, setInterests] = useState((user?.interests || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api.put('/api/profile', {
        name,
        bio,
        city,
        intent,
        interests: interests
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean),
      });
      await refresh();
      setNote('Perfil atualizado.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function addPhoto() {
    setUploading(true);
    setError('');
    try {
      const asset = await pickImage();
      if (!asset) return;
      const form = new FormData();
      await appendImage(form, 'photo', asset);
      await api.upload('/api/profile/photo', form);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(id: string) {
    await api.del(`/api/profile/photo/${id}`);
    await refresh();
  }

  return (
    <Screen>
      <Header title="Editar perfil" subtitle="Fotos, bio, interesses e o que você procura" />

      <SectionHeader title="Suas fotos" action={uploading ? 'Enviando...' : 'Adicionar'} onAction={addPhoto} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {(user?.photos || []).map((photo: string) => (
          <Pressable key={photo} onPress={() => removePhoto(photo)} style={{ width: 96, height: 120, borderRadius: 16, overflow: 'hidden' }}>
            <Image source={{ uri: fileUrl(photo) }} style={{ width: '100%', height: '100%' }} />
            <View
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: 'rgba(6,2,9,0.7)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={12} color="#fff" />
            </View>
          </Pressable>
        ))}
        <Pressable
          onPress={addPhoto}
          style={{
            width: 96,
            height: 120,
            borderRadius: 16,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: C.border,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Ionicons name="add" size={20} color={C.gold} />
          <Muted style={{ fontSize: 9.5 }}>Foto</Muted>
        </Pressable>
      </View>
      <Muted style={{ fontSize: 10.5, marginTop: 6 }}>Toque em uma foto para removê-la.</Muted>

      <View style={{ marginTop: 16 }}>
        <Field label="Nome" value={name} onChangeText={setName} />
        <Field label="Cidade" value={city} onChangeText={setCity} placeholder="Salvador, BA" />
        <Field
          label="Bio"
          value={bio}
          onChangeText={(v) => setBio(v.slice(0, 400))}
          multiline
          numberOfLines={4}
          placeholder="Conte o que te faz sorrir..."
          style={{ minHeight: 92, textAlignVertical: 'top' }}
        />
        <Field
          label="Interesses (separados por vírgula)"
          value={interests}
          onChangeText={setInterests}
          placeholder="Música, vinho, viagens"
        />
      </View>

      <Text style={{ fontFamily: F.semi, fontSize: 11, letterSpacing: 1.6, color: C.gold, marginBottom: 8 }}>
        O QUE VOCÊ PROCURA
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Object.entries(INTENTS).map(([key, label]) => (
          <Chip key={key} label={label} selected={intent === key} onPress={() => setIntent(key)} />
        ))}
      </View>

      {error ? (
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.danger, marginTop: 12 }}>{error}</Text>
      ) : null}
      {note ? (
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.ok, marginTop: 12 }}>{note}</Text>
      ) : null}

      <NeonButton label="Salvar alterações" icon="checkmark" loading={saving} style={{ marginTop: 18 }} onPress={save} />
      <NeonButton label="Voltar ao perfil" variant="ghost" style={{ marginTop: 10 }} onPress={() => router.back()} />

      <Glass style={{ marginTop: 18 }}>
        <Muted style={{ fontSize: 11.5 }}>
          Moderação: fotos com nudez explícita, menores de idade, violência ou conteúdo ilegal são
          removidas e podem levar à suspensão da conta.
        </Muted>
      </Glass>
    </Screen>
  );
}
