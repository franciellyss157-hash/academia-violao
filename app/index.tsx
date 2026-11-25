import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { GlowOrb, Particles } from '../components/Particles';
import { useSession } from '../lib/session';
import { C, F } from '../lib/theme';

const USE_NATIVE = Platform.OS !== 'web';

function Wave({ progress, delay }: { progress: Animated.Value; delay: number }) {
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, { toValue: 1, duration: 2600, useNativeDriver: USE_NATIVE }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: USE_NATIVE }),
      ])
    ).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 1,
        borderColor: C.gold,
        opacity: progress.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.5, 0] }),
        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.55, 2.3] }) }],
      }}
    />
  );
}

export default function SplashScreen() {
  const router = useRouter();
  const { ready, token, isAdmin } = useSession();
  const [elapsed, setElapsed] = useState(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(24)).current;
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.35)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 1500, useNativeDriver: USE_NATIVE }),
        Animated.spring(logoY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: USE_NATIVE }),
      ]),
      Animated.timing(sloganOpacity, { toValue: 1, duration: 1300, useNativeDriver: USE_NATIVE }),
      Animated.delay(1800),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: USE_NATIVE }),
        Animated.timing(glow, { toValue: 0.35, duration: 1500, useNativeDriver: USE_NATIVE }),
      ])
    );
    loop.start();

    const timer = setTimeout(() => setElapsed(true), 5000);
    return () => {
      loop.stop();
      clearTimeout(timer);
    };
  }, [glow, logoOpacity, logoY, sloganOpacity]);

  useEffect(() => {
    if (!elapsed || !ready) return;
    router.replace(isAdmin ? '/admin' : token ? '/(tabs)' : '/auth');
  }, [elapsed, ready, token, isAdmin, router]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={['#1B0612', '#0A0409', '#030104']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Particles count={22} hearts={5} />
      <GlowOrb size={380} color={C.pink} opacity={0.16} style={{ top: '22%', left: '-20%' }} />
      <GlowOrb size={300} color={C.gold} opacity={0.1} style={{ bottom: '10%', right: '-22%' }} />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 180, width: 180 }}>
          <Wave progress={wave1} delay={0} />
          <Wave progress={wave2} delay={700} />
          <Wave progress={wave3} delay={1400} />
          <Animated.View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: C.gold,
              shadowColor: C.gold,
              shadowOpacity: 0.9,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        </View>

        <Animated.View style={{ opacity: logoOpacity, transform: [{ translateY: logoY }] }}>
          <Animated.Text
            style={{
              fontFamily: F.display,
              fontSize: 52,
              letterSpacing: 4,
              color: C.text,
              textShadowColor: `rgba(255,61,154,${0.9})`,
              textShadowRadius: 30,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            Sussurro
          </Animated.Text>
        </Animated.View>

        <Animated.View style={{ opacity: sloganOpacity, marginTop: 18 }}>
          <Text
            style={{
              fontFamily: F.displayItalic,
              fontSize: 15.5,
              color: C.gold,
              textAlign: 'center',
              letterSpacing: 0.6,
            }}
          >
            Aqui, o amor começa com um sussurro
          </Text>
        </Animated.View>
      </View>

      <View style={{ alignItems: 'center', paddingBottom: 40, gap: 6 }}>
        <View style={{ width: 60, height: 1, backgroundColor: C.border }} />
        <Text style={{ fontFamily: F.body, fontSize: 10.5, letterSpacing: 3, color: C.muted }}>
          +18 · LGPD
        </Text>
      </View>
    </View>
  );
}
