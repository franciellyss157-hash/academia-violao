import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

const USE_NATIVE = Platform.OS !== 'web';

export function useFadeIn(delay = 0, translateY = 16, duration = 500) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(translateY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: USE_NATIVE,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        delay,
        friction: 7,
        tension: 45,
        useNativeDriver: USE_NATIVE,
      }),
    ]).start();
  }, [opacity, translateYAnim, delay, duration]);

  return { opacity, transform: [{ translateY: translateYAnim }] };
}
