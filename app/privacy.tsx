import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Chip, Glass, Header, Muted, P, Screen, SectionHeader } from '../components/ui';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { C, F } from '../lib/theme';

export default function PrivacyScreen() {
  const { user, refresh } = useSession();
  const [visibility, setVisibility] = useState(user?.visibility || 'public');
  const [note, setNote] = useState('');

  async function setVisibilityAndSave(next: string) {
    setVisibility(next);
    try {
      await api.put('/api/profile', { visibility: next });
      await refresh();
      setNote(
        next === 'public'
          ? 'Seu perfil aparece nas descobertas.'
          : 'Perfil oculto: só quem já deu match com você consegue ver.'
      );
    } catch (e: any) {
      setNote(e.message);
    }
  }

  return (
    <Screen>
      <Header title="Privacidade e segurança" subtitle="Você no controle do seu perfil" />

      <SectionHeader title="Visibilidade do perfil" />
      <Glass>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Visível nas descobertas" selected={visibility === 'public'} onPress={() => setVisibilityAndSave('public')} />
          <Chip label="Perfil oculto" selected={visibility === 'hidden'} onPress={() => setVisibilityAndSave('hidden')} />
        </View>
        <Muted style={{ fontSize: 11.5, marginTop: 10 }}>
          Perfis ocultos não aparecem na busca, mas continuam acessíveis para quem já deu match.
        </Muted>
        {note ? <Text style={{ fontFamily: F.medium, fontSize: 11.5, color: C.pinkSoft, marginTop: 8 }}>{note}</Text> : null}
      </Glass>

      <SectionHeader title="Bloquear e denunciar" />
      <Glass>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Ionicons name="ban-outline" size={16} color={C.gold} style={{ marginTop: 2 }} />
          <Muted style={{ flex: 1, fontSize: 12 }}>
            Em qualquer perfil, use “Bloquear” para que vocês não se vejam mais, ou “Denunciar” para
            avisar o ADM. Denúncias são analisadas com prioridade e podem resultar em suspensão.
          </Muted>
        </View>
      </Glass>

      <SectionHeader title="Conversas protegidas" />
      <Glass>
        <Muted style={{ fontSize: 12 }}>
          As mensagens trafegam por conexão autenticada (token por sessão) e ficam guardadas em banco
          privado, acessível apenas aos dois participantes do match. Comprovantes e selfies ficam em
          armazenamento privado, visíveis só para você e para o ADM.
        </Muted>
      </Glass>

      <SectionHeader title="Regras de uso" />
      <Glass>
        <P style={{ fontSize: 12.5, lineHeight: 19 }}>
          É proibido: oferecer ou cobrar serviços sexuais, publicar conteúdo ilegal, interagir com
          menores de idade, assediar, ameaçar, divulgar dados de terceiros ou usar comprovantes
          falsos. O descumprimento leva a advertência, suspensão ou banimento.
        </P>
      </Glass>

      <SectionHeader title="LGPD e consentimento" />
      <Glass>
        <Muted style={{ fontSize: 12 }}>
          Tratamos seus dados (nome, e-mail, data de nascimento, fotos, interesses e histórico de
          pagamentos) para operar o Sussurro. Você pode solicitar acesso, correção, portabilidade ou
          exclusão dos seus dados pelo e-mail do suporte. A base legal é o seu consentimento, dado no
          cadastro, e a execução do serviço.
        </Muted>
        <Muted style={{ fontSize: 11, marginTop: 8 }}>
          Dados de pagamento: apenas comprovantes enviados por você. Não armazenamos dados bancários.
        </Muted>
      </Glass>

      <SectionHeader title="Segurança da conta" />
      <Glass>
        <Muted style={{ fontSize: 12 }}>
          Nunca compartilhe sua senha. O acesso ADM é separado, protegido por variável de ambiente,
          hash de senha e bloqueio após tentativas erradas.
        </Muted>
      </Glass>
    </Screen>
  );
}
