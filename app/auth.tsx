import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { H1, Muted, P, Screen, Wordmark } from '../components/ui';
import { C, F } from '../lib/theme';

function ChoiceCard({
  icon,
  title,
  text,
  onPress,
  accent,
}: {
  icon: string;
  title: string;
  text: string;
  onPress: () => void;
  accent: 'pink' | 'gold';
}) {
  const color = accent === 'pink' ? C.pink : C.gold;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: accent === 'pink' ? C.borderPink : C.border,
        backgroundColor: 'rgba(255,255,255,0.045)',
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: color,
        shadowOpacity: 0.28,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 10 },
        elevation: 5,
      })}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: color,
          backgroundColor: `${color}1A`,
        }}
      >
        <Ionicons name={icon as any} size={23} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.display, fontSize: 21, color: C.text }}>{title}</Text>
        <Muted style={{ marginTop: 2 }}>{text}</Muted>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.muted} />
    </Pressable>
  );
}

export default function AuthChoice() {
  const router = useRouter();

  return (
    <Screen>
      <View style={{ paddingTop: 34 }}>
        <Wordmark size={38} />
        <Text
          style={{
            fontFamily: F.displayItalic,
            fontSize: 15,
            color: C.gold,
            marginTop: 10,
          }}
        >
          Aqui, o amor começa com um sussurro
        </Text>

        <H1 style={{ marginTop: 42, fontSize: 27 }}>Como você quer entrar?</H1>
        <P style={{ color: C.muted, marginTop: 6, marginBottom: 22 }}>
          Escolha o seu acesso. O Sussurro é exclusivo para maiores de 18 anos.
        </P>

        <View style={{ gap: 14 }}>
          <ChoiceCard
            icon="heart-outline"
            title="Usuário"
            text="Criar conta, descobrir pessoas e conversar."
            accent="pink"
            onPress={() => router.push('/login')}
          />
          <ChoiceCard
            icon="shield-checkmark-outline"
            title="ADM"
            text="Acesso exclusivo do administrador."
            accent="gold"
            onPress={() => router.push('/admin-login')}
          />
        </View>

        <View
          style={{
            marginTop: 30,
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: 'rgba(255,255,255,0.03)',
            gap: 6,
          }}
        >
          <Text style={{ fontFamily: F.semi, fontSize: 11, letterSpacing: 1.6, color: C.gold }}>
            PRIVACIDADE E RESPEITO
          </Text>
          <Muted style={{ fontSize: 12 }}>
            Ao continuar você concorda com os Termos de Uso e a Política de Privacidade (LGPD). É
            proibido conteúdo ilegal, assédio, menores de idade ou oferta de serviços sexuais.
          </Muted>
        </View>
      </View>
    </Screen>
  );
}
