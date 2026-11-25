import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Glass, Header, Muted, NeonButton, P, Screen, StatusPill } from '../components/ui';
import { api, appendImage, fileUrl, pickImage } from '../lib/api';
import { useSession } from '../lib/session';
import { C, F } from '../lib/theme';

export default function VerificationScreen() {
  const { user, refresh } = useSession();
  const [selfie, setSelfie] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const status = user?.verificationStatus || 'none';

  async function choose() {
    try {
      const asset = await pickImage(true);
      if (asset) setSelfie(asset);
    } catch (e: any) {
      setError(e.message);
    }
  }

  const send = useCallback(async () => {
    if (!selfie) {
      setError('Escolha uma selfie.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const form = new FormData();
      await appendImage(form, 'selfie', selfie);
      await api.upload('/api/verify/selfie', form);
      setSelfie(null);
      setNote('Selfie enviada! O ADM vai conferir e liberar o selo.');
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }, [selfie, refresh]);

  return (
    <Screen>
      <Header title="Verificação de identidade" subtitle="Selo dourado de perfil verificado" />

      <Glass glowColor={C.gold} style={{ marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="shield-checkmark" size={22} color={C.gold} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.semi, fontSize: 13.5, color: C.text }}>Status da verificação</Text>
            <Muted style={{ fontSize: 11.5 }}>
              {status === 'approved'
                ? 'Seu perfil está verificado.'
                : status === 'pending'
                  ? 'Sua selfie está em análise pelo ADM.'
                  : status === 'rejected'
                    ? 'A selfie anterior foi recusada. Envie outra.'
                    : 'Envie uma selfie para confirmar que é você.'}
            </Muted>
          </View>
          <StatusPill
            label={status === 'approved' ? 'Verificado' : status === 'pending' ? 'Em análise' : status === 'rejected' ? 'Recusado' : 'Pendente'}
            color={status === 'approved' ? C.ok : status === 'pending' ? C.warn : status === 'rejected' ? C.danger : C.muted}
          />
        </View>
      </Glass>

      <Glass style={{ marginTop: 12 }}>
        <Text style={{ fontFamily: F.semi, fontSize: 11, letterSpacing: 1.6, color: C.gold, marginBottom: 8 }}>
          COMO FUNCIONA
        </Text>
        <P style={{ fontSize: 12.5 }}>
          Tire uma selfie com boa luz, sem filtros e com o rosto visível. A imagem fica em
          armazenamento privado: só o ADM e você podem vê-la.
        </P>
      </Glass>

      <View
        style={{
          marginTop: 14,
          width: 200,
          height: 200,
          borderRadius: 100,
          alignSelf: 'center',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: C.borderPink,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}
      >
        {selfie ? (
          <Image source={{ uri: selfie.uri }} style={{ width: '100%', height: '100%' }} />
        ) : user?.selfieUrl ? (
          <Image source={{ uri: fileUrl(user.selfieUrl) }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Ionicons name="camera-outline" size={30} color={C.gold} />
            <Muted style={{ fontSize: 11 }}>Sua selfie</Muted>
          </View>
        )}
      </View>

      <NeonButton
        label={selfie ? 'Trocar selfie' : 'Escolher selfie'}
        variant="ghost"
        icon="camera-outline"
        style={{ marginTop: 16 }}
        onPress={choose}
      />
      <NeonButton
        label="Enviar para verificação"
        icon="shield-checkmark-outline"
        loading={sending}
        style={{ marginTop: 10 }}
        onPress={send}
      />

      {error ? (
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.danger, marginTop: 12 }}>{error}</Text>
      ) : null}
      {note ? (
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.ok, marginTop: 12 }}>{note}</Text>
      ) : null}
    </Screen>
  );
}
