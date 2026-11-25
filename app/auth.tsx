import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { GlowOrb } from '../components/Particles';
import { H1, Muted, P, Screen, Wordmark } from '../components/ui';
import { C, F } from '../lib/theme';

const USE_NATIVE = Platform.OS !== 'web';

function ChoiceCard({
  icon,
  title,
  text,
  onPress,
  accent,
  index,
}: {
  icon: string;
  title: string;
  text: string;
  onPress: () => void;
  accent: 'pink' | 'gold';
  index: number;
}) {
  const color = accent === 'pink' ? C.pink : C.gold;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, delay: 300 + index * 150, useNativeDriver: USE_NATIVE }),
      Animated.spring(translateY, { toValue: 0, delay: 300 + index * 150, friction: 8, tension: 40, useNativeDriver: USE_NATIVE }),
      Animated.spring(scale, { toValue: 1, delay: 300 + index * 150, friction: 6, tension: 50, useNativeDriver: USE_NATIVE }),
    ]).start();
  }, [opacity, translateY, scale, index]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.88 : 1,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: accent === 'pink' ? C.borderPink : C.border,
          backgroundColor: 'rgba(255,255,255,0.045)',
          padding: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          shadowColor: color,
          shadowOpacity: 0.3,
          shadowRadius: 26,
          shadowOffset: { width: 0, height: 12 },
          elevation: 6,
        })}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
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
    </Animated.View>
  );
}

export default function AuthChoice() {
  const router = useRouter();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: USE_NATIVE }),
      Animated.spring(logoY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: USE_NATIVE }),
    ]).start();
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, delay: 200, useNativeDriver: USE_NATIVE }),
      Animated.spring(titleY, { toValue: 0, delay: 200, friction: 7, tension: 45, useNativeDriver: USE_NATIVE }),
    ]).start();
  }, [logoOpacity, logoY, titleOpacity, titleY]);

  return (
    <Screen>
      <GlowOrb size={320} color={C.pink} opacity={0.12} style={{ top: '-8%', right: '-20%' }} />
      <GlowOrb size={260} color={C.gold} opacity={0.08} style={{ bottom: '5%', left: '-25%' }} />

      <View style={{ paddingTop: 34 }}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ translateY: logoY }] }}>
          <Wordmark size={38} />
          <Text style={{ fontFamily: F.displayItalic, fontSize: 15, color: C.gold, marginTop: 10 }}>
            Aqui, o amor começa com um sussurro
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], marginTop: 42 }}>
          <H1 style={{ fontSize: 27 }}>Como você quer entrar?</H1>
          <P style={{ color: C.muted, marginTop: 6, marginBottom: 22 }}>
            Escolha o seu acesso. O Sussurro é exclusivo para maiores de 18 anos.
          </P>
        </Animated.View>

        <View style={{ gap: 14 }}>
          <ChoiceCard
            icon="heart-outline"
            title="Usuário"
            text="Criar conta, descobrir pessoas e conversar."
            accent="pink"
            index={0}
            onPress={() => router.push('/login')}
          />
          <ChoiceCard
            icon="shield-checkmark-outline"
            title="ADM"
            text="Acesso exclusivo do administrador."
            accent="gold"
            index={1}
            onPress={() => router.push('/admin-login')}
          />
        </View>

        <Animated.View
          style={{
            marginTop: 30,
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: 'rgba(255,255,255,0.03)',
            gap: 6,
            opacity: titleOpacity,
          }}
        >
          <Text style={{ fontFamily: F.semi, fontSize: 11, letterSpacing: 1.6, color: C.gold }}>
            PRIVACIDADE E RESPEITO
          </Text>
          <Muted style={{ fontSize: 12 }}>
            Ao continuar você concorda com os Termos de Uso e a Política de Privacidade (LGPD). É
            proibido conteúdo ilegal, assédio, menores de idade ou oferta de serviços sexuais.
          </Muted>
        </Animated.View>
      </View>
    </Screen>
  );
}
