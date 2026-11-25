import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Avatar, Glass, Muted, NeonButton, Screen, SectionHeader, Stat, StatusPill, Wordmark } from '../../components/ui';
import { fileUrl } from '../../lib/api';
import { useSession } from '../../lib/session';
import { dateTime } from '../../lib/format';
import { C, F, INTENTS } from '../../lib/theme';

function LinkRow({ icon, label, hint, onPress }: { icon: string; label: string; hint?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(233,199,124,0.1)',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <Ionicons name={icon as any} size={16} color={C.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.medium, fontSize: 13.5, color: C.text }}>{label}</Text>
        {hint ? <Muted style={{ fontSize: 11 }}>{hint}</Muted> : null}
      </View>
      <Ionicons name="chevron-forward" size={15} color={C.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, refresh, signOut } = useSession();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const cover = user?.photos?.[0];

  return (
    <Screen scroll={false} contentStyle={{ paddingBottom: 0 }}>
      <View style={{ paddingVertical: 10 }}>
        <Wordmark size={24} />
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            borderRadius: 26,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: C.borderPink,
            backgroundColor: C.wine,
          }}
        >
          {cover ? (
            <Image source={{ uri: fileUrl(cover) }} style={{ width: '100%', height: 190 }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', height: 190, alignItems: 'center', justifyContent: 'center' }}>
              <Avatar name={user?.name} size={92} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(6,2,9,0.85)', 'rgba(6,2,9,0.98)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '72%' }}
          />
          <View style={{ position: 'absolute', left: 16, right: 16, bottom: 14, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: F.display, fontSize: 25, color: C.text }}>
                {user?.name}
                {user?.age ? `, ${user.age}` : ''}
              </Text>
              {user?.verified ? <Ionicons name="checkmark-circle" size={17} color={C.gold} /> : null}
            </View>
            <Muted style={{ fontSize: 12 }}>
              {user?.city || 'Brasil'} · {INTENTS[user?.intent || 'namoro']}
            </Muted>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {user?.vip ? <StatusPill label="VIP" color={C.gold} /> : null}
              {user?.highlightUntil && new Date(user.highlightUntil) > new Date() ? (
                <StatusPill label="Destaque 24h" color={C.pink} />
              ) : null}
              {user?.verificationStatus === 'pending' ? <StatusPill label="Verificação em análise" color={C.warn} /> : null}
            </View>
          </View>
        </View>

        <Glass style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row' }}>
            <Stat value={String(user?.credits ?? 0)} label="créditos" color={C.pinkSoft} />
            <Stat value={String(user?.photos?.length || 0)} label="fotos" />
            <Stat value={user?.vip ? 'VIP' : 'Free'} label="plano" color={C.gold} />
          </View>
          {user?.bio ? <Muted style={{ marginTop: 12, fontSize: 12.5 }}>{user.bio}</Muted> : null}
          {user?.interests?.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {user.interests.map((i) => (
                <View
                  key={i}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(233,199,124,0.3)',
                    backgroundColor: 'rgba(233,199,124,0.08)',
                  }}
                >
                  <Text style={{ fontFamily: F.medium, fontSize: 10.5, color: C.gold }}>{i}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <NeonButton
            label="Editar perfil"
            small
            variant="ghost"
            icon="create-outline"
            style={{ marginTop: 12 }}
            onPress={() => router.push('/edit-profile')}
          />
        </Glass>

        <Pressable
          onPress={() => router.push('/credits')}
          style={({ pressed }) => ({
            marginTop: 12,
            borderRadius: 20,
            padding: 1.5,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <LinearGradient
            colors={['rgba(255,61,154,0.5)', 'rgba(233,199,124,0.3)']}
            style={{ borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,61,154,0.15)' }}>
              <Ionicons name="diamond" size={20} color={C.pinkSoft} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.text }}>Comprar créditos e planos</Text>
              <Text style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginTop: 1 }}>
                Pix · {user?.credits ?? 0} créditos {user?.vip ? '· VIP ativo' : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.gold} />
          </LinearGradient>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <NeonButton label="Figurinhas" small variant="gold" icon="happy-outline" style={{ flex: 1 }} onPress={() => router.push('/stickers')} />
        </View>

        <SectionHeader title="Sua conta" />
        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12 }}>
          <LinkRow
            icon="shield-checkmark-outline"
            label="Verificação de identidade"
            hint={
              user?.verificationStatus === 'approved'
                ? 'Perfil verificado'
                : user?.verificationStatus === 'pending'
                  ? 'Selfie em análise'
                  : 'Envie uma selfie para ganhar o selo'
            }
            onPress={() => router.push('/verification')}
          />
          <LinkRow icon="receipt-outline" label="Histórico de transações" onPress={() => router.push('/transactions')} />
          <LinkRow icon="notifications-outline" label="Notificações" onPress={() => router.push('/notifications')} />
          <LinkRow icon="lock-closed-outline" label="Privacidade e segurança" hint="Visibilidade, LGPD, termos e bloqueios" onPress={() => router.push('/privacy')} />
          <LinkRow icon="sparkles-outline" label="Inspiração de mensagens" onPress={() => router.push('/inspiration')} />
          <LinkRow
            icon="log-out-outline"
            label="Sair da conta"
            onPress={async () => {
              await signOut();
              router.replace('/auth');
            }}
          />
        </View>

        <Muted style={{ textAlign: 'center', marginTop: 14, fontSize: 10.5 }}>
          Sussurro · +18 · Conteúdo protegido e moderado · {dateTime(new Date().toISOString()).slice(0, 10)}
        </Muted>
      </View>
    </Screen>
  );
}
