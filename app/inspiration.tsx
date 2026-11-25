import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Glass, Header, Muted, P, Screen, SectionHeader } from '../components/ui';
import { api } from '../lib/api';
import { C, F } from '../lib/theme';

export default function InspirationScreen() {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    api.get('/api/inspiration').then(setData).catch(() => setData({ phrases: [], openers: [] }));
  }, []);

  async function copy(id: string, text: string) {
    await Clipboard.setStringAsync(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 1800);
  }

  if (!data) {
    return (
      <Screen>
        <Header title="Inspiração" />
        <ActivityIndicator color={C.pink} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Inspiração de mensagens" subtitle="Frases românticas e aberturas de conversa" />

      <SectionHeader title="Cartões de frases" />
      <View style={{ gap: 10 }}>
        {data.phrases.map((phrase: any) => (
          <Pressable key={phrase.id} onPress={() => copy(phrase.id, phrase.text)}>
            <Glass style={{ borderColor: 'rgba(233,199,124,0.3)' }}>
              <Text
                style={{
                  fontFamily: F.displayItalic,
                  fontSize: 16,
                  color: C.gold,
                  lineHeight: 24,
                }}
              >
                “{phrase.text}”
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
                <Ionicons
                  name={copied === phrase.id ? 'checkmark' : 'copy-outline'}
                  size={12}
                  color={copied === phrase.id ? C.ok : C.muted}
                />
                <Muted style={{ fontSize: 10.5 }}>
                  {copied === phrase.id ? 'Copiado' : 'Toque para copiar'}
                </Muted>
              </View>
            </Glass>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Dicas de abertura" />
      <View style={{ gap: 10 }}>
        {data.openers.map((opener: any) => (
          <Pressable key={opener.id} onPress={() => copy(opener.id, opener.text)}>
            <Glass>
              <P style={{ fontSize: 13.5 }}>{opener.text}</P>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
                <Ionicons
                  name={copied === opener.id ? 'checkmark' : 'copy-outline'}
                  size={12}
                  color={copied === opener.id ? C.ok : C.muted}
                />
                <Muted style={{ fontSize: 10.5 }}>
                  {copied === opener.id ? 'Copiado' : 'Toque para copiar'}
                </Muted>
              </View>
            </Glass>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
