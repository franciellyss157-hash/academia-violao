import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Chip, Field, Glass, Header, Muted, NeonButton, Screen } from '../../components/ui';
import { api } from '../../lib/api';
import { brl } from '../../lib/format';
import { C, F } from '../../lib/theme';

export default function AdminPackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/packages');
      setPackages(res.packages || []);
      const next: Record<string, any> = {};
      for (const pkg of res.packages || []) {
        next[pkg.id] = { price: String(pkg.price).replace('.', ','), credits: String(pkg.credits), benefit: pkg.benefit };
      }
      setDrafts(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function save(id: string, extra?: any) {
    const draft = drafts[id] || {};
    try {
      await api.put(`/api/admin/packages/${id}`, {
        price: Number(String(draft.price).replace(',', '.')),
        credits: Number(draft.credits),
        benefit: draft.benefit,
        ...extra,
      });
      setNote('Pacote atualizado.');
      load();
    } catch (e: any) {
      setNote(e.message);
    }
  }

  return (
    <Screen>
      <Header title="Pacotes e preços" subtitle="Ajuste valores, créditos e benefícios" />

      {note ? (
        <Text style={{ fontFamily: F.medium, fontSize: 11.5, color: C.pinkSoft, marginBottom: 8 }}>{note}</Text>
      ) : null}

      {loading ? (
        <ActivityIndicator color={C.gold} />
      ) : (
        <View style={{ gap: 12 }}>
          {packages.map((pkg) => {
            const draft = drafts[pkg.id] || {};
            return (
              <Glass key={pkg.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: F.display, fontSize: 19, color: C.text }}>{pkg.name}</Text>
                  <Chip
                    label={pkg.active ? 'Ativo' : 'Inativo'}
                    selected={pkg.active}
                    onPress={() => save(pkg.id, { active: !pkg.active })}
                  />
                </View>
                <Muted style={{ fontSize: 10.5, marginTop: 2 }}>
                  Preço atual {brl(pkg.price)} · {pkg.credits} créditos
                </Muted>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Preço (R$)"
                      value={draft.price || ''}
                      onChangeText={(v) => setDrafts({ ...drafts, [pkg.id]: { ...draft, price: v } })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Créditos"
                      value={draft.credits || ''}
                      onChangeText={(v) => setDrafts({ ...drafts, [pkg.id]: { ...draft, credits: v } })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <Field
                  label="Benefício"
                  value={draft.benefit || ''}
                  onChangeText={(v) => setDrafts({ ...drafts, [pkg.id]: { ...draft, benefit: v } })}
                  multiline
                />
                <NeonButton label="Salvar alterações" small variant="gold" onPress={() => save(pkg.id)} />
              </Glass>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
