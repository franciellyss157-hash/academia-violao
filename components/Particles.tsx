import { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { C } from '../lib/theme';

const USE_NATIVE = Platform.OS !== 'web';

function Mote({ left, size, delay, duration, opacity, height }: any) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, { toValue: 1, duration, useNativeDriver: USE_NATIVE }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: USE_NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${left}%`,
        bottom: -10,
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: C.gold,
        opacity: progress.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, opacity, opacity * 0.7, 0] }),
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -height] }) },
          { scale: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1.2, 0.8] }) },
        ],
      }}
    />
  );
}

function Heart({ left, delay, duration, size, height }: any) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, { toValue: 1, duration, useNativeDriver: USE_NATIVE }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: USE_NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, progress]);

  return (
    <Animated.Text
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${left}%`,
        bottom: 0,
        fontSize: size,
        opacity: progress.interpolate({ inputRange: [0, 0.2, 0.75, 1], outputRange: [0, 0.5, 0.28, 0] }),
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -height] }) },
          { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '14deg'] }) },
        ],
      }}
    >
      ♥
    </Animated.Text>
  );
}

export function Particles({ count = 16, hearts = 3 }: { count?: number; hearts?: number }) {
  const { height } = useWindowDimensions();

  const motes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        key: `mote-${i}`,
        left: Math.random() * 96,
        size: 2 + Math.random() * 3.4,
        delay: Math.random() * 8000,
        duration: 9000 + Math.random() * 8000,
        opacity: 0.25 + Math.random() * 0.55,
        height: height * (0.55 + Math.random() * 0.45),
      })),
    [count, height]
  );

  const floaters = useMemo(
    () =>
      Array.from({ length: hearts }).map((_, i) => ({
        key: `heart-${i}`,
        left: 4 + Math.random() * 88,
        delay: 1200 + Math.random() * 6000,
        duration: 11000 + Math.random() * 7000,
        size: 12 + Math.random() * 16,
        height: height * (0.6 + Math.random() * 0.4),
      })),
    [hearts, height]
  );

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {motes.map((m) => (
        <Mote key={m.key} {...m} />
      ))}
      {floaters.map((h) => (
        <Heart key={h.key} {...h} />
      ))}
    </View>
  );
}

export function GlowOrb({ size = 320, color = C.pink, opacity = 0.16, style }: any) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
          opacity,
        },
        Platform.OS === 'web' ? ({ filter: `blur(${Math.round(size / 3)}px)` } as any) : null,
        style,
      ]}
    />
  );
}

export function GoldText({ children, style }: any) {
  return <Text style={[{ color: C.gold }, style]}>{children}</Text>;
}
