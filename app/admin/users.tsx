import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import {
  Avatar,
  Chip,
  Field,
  Glass,
  Header,
  Muted,
  NeonButton,
  Screen,
  Sheet,
  StatusPill,
} from '../../components/ui';
import { api, fileUrl } from '../../lib/api';
import { dateTime } from '../../lib/format';
import { C, F } from '../../lib/theme';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [grant, setGrant] = useState('10');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      const res = await api.get(`/api/admin/users?${params.toString()}`);
      setUsers(res.users || []);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function act(action: string, extra?: any) {
    if (!selected) return;
    try {
      await api.patch(`/api/admin/users/${selected.id}`, { action, ...extra });
      setNote('Ação aplicada.');
      setSelected(null);
      load();
    } catch (e: any) {
      setNote(e.message);
    }
  }

  return (
    <Screen>
      <Header title="Usuários" subtitle="Suspender, banir, verificar e ajustar créditos" />

      <Field label="Buscar" value={q} onChangeText={setQ} placeholder="Nome ou e-mail" onSubmitEditing={load} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
        {[
          { id: '', label: 'Todos' },
          { id: 'active', label: 'Ativos' },
          { id: 'suspended', label: 'Suspensos' },
          { id: 'banned', label: 'Banidos' },
        ].map((f) => (
          <Chip key={f.id || 'all'} label={f.label} selected={status === f.id} onPress={() => setStatus(f.id)} />
        ))}
        <Chip label="Buscar" icon="search" onPress={load} />
      </View>

      {note ? (
        <Text style={{ fontFamily: F.medium, fontSize: 11.5, color: C.pinkSoft, marginBottom: 8 }}>{note}</Text>
      ) : null}

      {loading ? (
        <ActivityIndicator color={C.gold} />
      ) : (
        <View style={{ gap: 9 }}>
          {users.map((u) => (
            <Pressable key={u.id} onPress={() => setSelected(u)}>
              <Glass style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar name={u.name} size={40} verified={u.verified} vip={u.vip} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.text }}>
                      {u.name} {u.age ? `· ${u.age}` : ''}
                    </Text>
                    <Muted style={{ fontSize: 10.5 }}>{u.email}</Muted>
                    <Muted style={{ fontSize: 10 }}>
                      {u.credits} créditos · {u.approvedOrders} aprovados · {u.rejectedOrders} recusados
                    </Muted>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <StatusPill
                      label={u.status === 'active' ? 'Ativo' : u.status === 'suspended' ? 'Suspenso' : 'Banido'}
                      color={u.status === 'active' ? C.ok : u.status === 'suspended' ? C.warn : C.danger}
                    />
                    {u.flagged ? <StatusPill label="Análise" color={C.danger} /> : null}
                  </View>
                </View>
              </Glass>
            </Pressable>
          ))}
        </View>
      )}

      <Sheet visible={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name}>
        <Muted style={{ fontSize: 11.5 }}>
          {selected?.email} · criado em {dateTime(selected?.createdAt)}
        </Muted>
        <Muted style={{ fontSize: 11.5 }}>
          Verificação: {selected?.verificationStatus} · Créditos: {selected?.credits}
        </Muted>
        {selected?.selfieUrl ? (
          <Muted style={{ fontSize: 11 }}>Selfie de verificação disponível para conferência.</Muted>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          <NeonButton label="Verificar perfil" small variant="gold" onPress={() => act('verify')} />
          <NeonButton label="Recusar verificação" small variant="ghost" onPress={() => act('reject_verification')} />
          <NeonButton label="Suspender" small variant="ghost" onPress={() => act('suspend')} />
          <NeonButton label="Banir" small variant="danger" onPress={() => act('ban')} />
          <NeonButton label="Reativar" small variant="ghost" onPress={() => act('reactivate')} />
          <NeonButton label="Remover marcação" small variant="ghost" onPress={() => act('unflag')} />
        </View>

        <View style={{ marginTop: 12 }}>
          <Field label="Adicionar créditos" value={grant} onChangeText={setGrant} keyboardType="numeric" />
          <NeonButton label="Conceder créditos" small icon="add-circle-outline" onPress={() => act('grant', { amount: Number(grant) })} />
        </View>
      </Sheet>
    </Screen>
  );
}
