import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { MatchOverlay } from '../../components/MatchOverlay';
import {
  Chip,
  Field,
  Glass,
  Header,
  Loader,
  Muted,
  NeonButton,
  P,
  Screen,
  Sheet,
  StatusPill,
} from '../../components/ui';
import { api, fileUrl } from '../../lib/api';
import { useSession } from '../../lib/session';
import { C, F, INTENTS } from '../../lib/theme';

const REASONS = ['Perfil falso', 'Assédio ou ofensa', 'Conteúdo impróprio', 'Menor de idade', 'Golpe ou fraude'];

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useSession();
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [match, setMatch] = useState<any>(null);
  const [reportSheet, setReportSheet] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/users/${id}`);
        setPerson(res.user);
      } catch (e: any) {
        setNote(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function like() {
    try {
      const res = await api.post(`/api/likes/${id}`);
      if (res.match) setMatch({ matchId: res.matchId });
      else setNote('Curtida enviada. Se houver reciprocidade, avisamos.');
    } catch (e: any) {
      setNote(e.message);
    }
  }

  async function invite() {
    try {
      await api.post('/api/invites', { toUserId: id, message: 'Vamos nos conhecer?' });
      setNote('Convite enviado.');
    } catch (e: any) {
      setNote(e.message);
    }
  }

  async function block() {
    try {
      await api.post(`/api/block/${id}`);
      setNote('Usuário bloqueado. Vocês não se verão mais.');
    } catch (e: any) {
      setNote(e.message);
    }
  }

  async function report() {
    try {
      await api.post('/api/reports', { targetUserId: id, reason, details });
      setReportSheet(false);
      setNote('Denúncia enviada para o ADM. Obrigado por cuidar da comunidade.');
    } catch (e: any) {
      setNote(e.message);
    }
  }

  if (loading) return <Screen><Loader label="Carregando perfil" /></Screen>;
  if (!person) return <Screen><Header title="Perfil" /><Muted>{note || 'Perfil não encontrado.'}</Muted></Screen>;

  const width = Dimensions.get('window').width - 40;

  return (
    <Screen>
      <Header title={person.name?.split(' ')[0]} subtitle={person.city || 'Brasil'} />

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
        {(person.photos?.length ? person.photos : [null]).map((photo: string | null, i: number) => (
          <View key={i} style={{ width, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: C.borderPink }}>
            {photo ? (
              <Image source={{ uri: fileUrl(photo) }} style={{ width, height: width * 1.25 }} resizeMode="cover" />
            ) : (
              <View style={{ width, height: width * 1.25, alignItems: 'center', justifyContent: 'center', backgroundColor: C.wine }}>
                <Text style={{ fontFamily: F.display, fontSize: 44, color: C.gold }}>{person.name?.[0]}</Text>
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(6,2,9,0.9)']}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' }}
            />
            <View style={{ position: 'absolute', left: 16, right: 16, bottom: 14, gap: 6 }}>
              <Text style={{ fontFamily: F.display, fontSize: 26, color: C.text }}>
                {person.name}
                {person.age ? `, ${person.age}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {person.verified ? <StatusPill label="Verificado" color={C.ok} /> : null}
                {person.vip ? <StatusPill label="VIP" color={C.gold} /> : null}
                <StatusPill label={INTENTS[person.intent] || 'Namoro'} color={C.pink} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {person.bio ? (
        <Glass style={{ marginTop: 14 }}>
          <Text style={{ fontFamily: F.semi, fontSize: 11, letterSpacing: 1.6, color: C.gold, marginBottom: 6 }}>
            SOBRE
          </Text>
          <P style={{ fontSize: 13.5 }}>{person.bio}</P>
        </Glass>
      ) : null}

      {person.interests?.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
          {person.interests.map((i: string) => (
            <View
              key={i}
              style={{
                paddingHorizontal: 11,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            >
              <Text style={{ fontFamily: F.medium, fontSize: 11.5, color: C.text }}>{i}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {note ? (
        <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.pinkSoft, marginTop: 14 }}>{note}</Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <NeonButton label="Curtir" icon="heart" onPress={like} style={{ flex: 1 }} />
        <NeonButton label="Convidar" variant="gold" icon="star-outline" onPress={invite} style={{ flex: 1 }} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Pressable
          onPress={block}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <Ionicons name="ban-outline" size={15} color={C.muted} />
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.muted }}>Bloquear</Text>
        </Pressable>
        <Pressable
          onPress={() => setReportSheet(true)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <Ionicons name="flag-outline" size={15} color={C.muted} />
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.muted }}>Denunciar</Text>
        </Pressable>
      </View>

      <MatchOverlay
        visible={Boolean(match)}
        me={me}
        other={person}
        onClose={() => setMatch(null)}
        onChat={() => {
          const matchId = match?.matchId;
          setMatch(null);
          if (matchId) router.push(`/chat/${matchId}`);
        }}
      />

      <Sheet visible={reportSheet} onClose={() => setReportSheet(false)} title="Denunciar perfil">
        <Muted style={{ marginBottom: 10 }}>
          O ADM analisa todas as denúncias. Conteúdo ilegal, assédio, menores de idade e oferta de
          serviços sexuais são proibidos.
        </Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {REASONS.map((r) => (
            <Chip key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />
          ))}
        </View>
        <Field label="Detalhes (opcional)" value={details} onChangeText={setDetails} multiline placeholder="Conte o que aconteceu" />
        <NeonButton label="Enviar denúncia" variant="danger" onPress={report} />
      </Sheet>
    </Screen>
  );
}
