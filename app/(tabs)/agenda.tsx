import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  Chip,
  Empty,
  Field,
  Glass,
  H2,
  Muted,
  NeonButton,
  Screen,
  SectionHeader,
  Sheet,
  StatusPill,
  Wordmark,
} from '../../components/ui';
import { api } from '../../lib/api';
import { timeOnly, ymd } from '../../lib/format';
import { C, F } from '../../lib/theme';

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function AgendaScreen() {
  const [view, setView] = useState<'dia' | 'semana' | 'mes'>('mes');
  const [selected, setSelected] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [sheet, setSheet] = useState(false);
  const [note, setNote] = useState('');
  const [form, setForm] = useState({ title: '', place: '', date: '', time: '', matchId: '' });

  const load = useCallback(async () => {
    try {
      const [a, m] = await Promise.all([api.get('/api/appointments'), api.get('/api/matches')]);
      setAppointments(a.appointments || []);
      setMatches(m.matches || []);
    } catch (e: any) {
      setNote(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const appt of appointments) {
      const key = ymd(new Date(appt.starts_at));
      map[key] = map[key] || [];
      map[key].push(appt);
    }
    return map;
  }, [appointments]);

  const monthDays = useMemo(() => {
    const year = selected.getFullYear();
    const month = selected.getMonth();
    const first = new Date(year, month, 1);
    const total = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: first.getDay() }).map(() => null);
    for (let d = 1; d <= total; d += 1) cells.push(new Date(year, month, d));
    return cells;
  }, [selected]);

  const weekDays = useMemo(() => {
    const start = new Date(selected);
    start.setDate(selected.getDate() - selected.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selected]);

  const dayList = byDay[ymd(selected)] || [];

  async function create() {
    setNote('');
    const [d, m, y] = form.date.split('/');
    if (!form.title || !form.date || !form.time) {
      setNote('Preencha o nome, a data e o horário do encontro.');
      return;
    }
    const iso = new Date(`${y}-${m}-${d}T${form.time}:00`).toISOString();
    try {
      await api.post('/api/appointments', {
        title: form.title,
        place: form.place,
        startsAt: iso,
        matchId: form.matchId || null,
      });
      setSheet(false);
      setForm({ title: '', place: '', date: '', time: '', matchId: '' });
      setNote('Encontro agendado. O lembrete chega nas notificações.');
      load();
    } catch (e: any) {
      setNote(e.message);
    }
  }

  async function update(id: string, status: string) {
    await api.patch(`/api/appointments/${id}`, { status });
    load();
  }

  return (
    <Screen scroll={false} contentStyle={{ paddingBottom: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
        <Wordmark size={24} />
        <Pressable
          onPress={() => setSheet(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: C.pink,
          }}
        >
          <Ionicons name="add" size={15} color="#fff" />
          <Text style={{ fontFamily: F.semi, fontSize: 12, color: '#fff' }}>Encontro</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        <H2>Agenda dos encontros</H2>
        <Muted style={{ marginTop: 4 }}>
          {selected.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </Muted>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {(['dia', 'semana', 'mes'] as const).map((v) => (
            <Chip key={v} label={v === 'mes' ? 'Mensal' : v === 'dia' ? 'Diária' : 'Semanal'} selected={view === v} onPress={() => setView(v)} />
          ))}
        </View>

        {note ? (
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.pinkSoft, marginTop: 10 }}>{note}</Text>
        ) : null}

        {view === 'mes' ? (
          <Glass style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Pressable
                onPress={() => setSelected(new Date(selected.getFullYear(), selected.getMonth() - 1, 1))}
                style={{ padding: 4 }}
              >
                <Ionicons name="chevron-back" size={16} color={C.gold} />
              </Pressable>
              <Text style={{ fontFamily: F.display, fontSize: 16, color: C.text }}>
                {selected.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable
                onPress={() => setSelected(new Date(selected.getFullYear(), selected.getMonth() + 1, 1))}
                style={{ padding: 4 }}
              >
                <Ionicons name="chevron-forward" size={16} color={C.gold} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row' }}>
              {WEEK.map((d, i) => (
                <Text
                  key={`${d}-${i}`}
                  style={{ flex: 1, textAlign: 'center', fontFamily: F.medium, fontSize: 10, color: C.muted }}
                >
                  {d}
                </Text>
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
              {monthDays.map((day, i) => {
                const key = day ? ymd(day) : `empty-${i}`;
                const isSelected = day && ymd(day) === ymd(selected);
                const has = day ? (byDay[ymd(day)] || []).length : 0;
                return (
                  <View key={key} style={{ width: `${100 / 7}%`, padding: 2 }}>
                    {day ? (
                      <Pressable
                        onPress={() => setSelected(day)}
                        style={{
                          alignItems: 'center',
                          paddingVertical: 7,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: isSelected ? C.pink : 'transparent',
                          backgroundColor: isSelected ? 'rgba(255,61,154,0.14)' : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: isSelected ? F.semi : F.body,
                            fontSize: 12.5,
                            color: isSelected ? C.pinkSoft : C.text,
                          }}
                        >
                          {day.getDate()}
                        </Text>
                        {has ? <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, marginTop: 3 }} /> : null}
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </Glass>
        ) : null}

        {view === 'semana' ? (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
            {weekDays.map((d) => {
              const isSelected = ymd(d) === ymd(selected);
              const has = (byDay[ymd(d)] || []).length;
              return (
                <Pressable
                  key={ymd(d)}
                  onPress={() => setSelected(d)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isSelected ? C.pink : C.border,
                    backgroundColor: isSelected ? 'rgba(255,61,154,0.14)' : 'rgba(255,255,255,0.04)',
                    gap: 3,
                  }}
                >
                  <Text style={{ fontFamily: F.medium, fontSize: 9.5, color: C.muted }}>
                    {WEEK[d.getDay()]}
                  </Text>
                  <Text style={{ fontFamily: F.semi, fontSize: 14, color: isSelected ? C.pinkSoft : C.text }}>
                    {d.getDate()}
                  </Text>
                  {has ? <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold }} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <SectionHeader title={view === 'dia' ? 'Encontros do dia' : 'Encontros'} />

        {dayList.length === 0 ? (
          <Empty
            icon="calendar-clear-outline"
            title="Nada marcado"
            text="Agende um encontro para receber o lembrete nas notificações."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {dayList.map((appt) => (
              <Glass key={appt.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: C.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(233,199,124,0.08)',
                    }}
                  >
                    <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.gold }}>
                      {timeOnly(appt.starts_at)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.text }}>{appt.title}</Text>
                    <Muted style={{ fontSize: 11.5 }}>
                      {appt.place || 'Local a combinar'}
                      {appt.partner_name ? ` · com ${appt.partner_name.split(' ')[0]}` : ''}
                    </Muted>
                  </View>
                  <StatusPill
                    label={appt.status === 'done' ? 'Concluído' : appt.status === 'canceled' ? 'Cancelado' : 'Confirmado'}
                    color={appt.status === 'done' ? C.ok : appt.status === 'canceled' ? C.danger : C.gold}
                  />
                </View>
                {appt.status === 'confirmed' ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <NeonButton label="Concluir" small variant="ghost" style={{ flex: 1 }} onPress={() => update(appt.id, 'done')} />
                    <NeonButton label="Cancelar" small variant="ghost" style={{ flex: 1 }} onPress={() => update(appt.id, 'canceled')} />
                  </View>
                ) : null}
              </Glass>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Novo encontro">
        <Field label="Nome do encontro" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="Jantar à luz de velas" />
        <Field label="Local" value={form.place} onChangeText={(v) => setForm({ ...form, place: v })} placeholder="Restaurante, praia, cinema..." />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Data" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} placeholder="DD/MM/AAAA" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Hora" value={form.time} onChangeText={(v) => setForm({ ...form, time: v })} placeholder="20:30" />
          </View>
        </View>
        {matches.length ? (
          <>
            <Text style={{ fontFamily: F.medium, fontSize: 11, letterSpacing: 1.4, color: C.gold, marginBottom: 6 }}>
              COM QUEM
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {matches.map((m) => (
                <Chip
                  key={m.id}
                  label={m.user?.name?.split(' ')[0]}
                  selected={form.matchId === m.id}
                  onPress={() => setForm({ ...form, matchId: form.matchId === m.id ? '' : m.id })}
                />
              ))}
            </View>
          </>
        ) : null}
        <NeonButton label="Agendar encontro" icon="calendar" onPress={create} />
      </Sheet>
    </Screen>
  );
}
