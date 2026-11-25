import { useEffect, useRef } from 'react';
import { Animated, Modal, Platform, Text, View } from 'react-native';
import { C, F } from '../lib/theme';
import { Avatar, NeonButton } from './ui';

const USE_NATIVE = Platform.OS !== 'web';

const HEARTS = ['❤️', '💖', '✨', '💘', '🌹', '💫'];

function Burst({ index, angle }: { index: number; angle: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(index * 120),
        Animated.timing(progress, { toValue: 1, duration: 2200, useNativeDriver: USE_NATIVE }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: USE_NATIVE }),
      ])
    ).start();
  }, [index, progress]);

  const distance = 120 + (index % 3) * 40;

  return (
    <Animated.Text
      pointerEvents="none"
      style={{
        position: 'absolute',
        fontSize: 22 + (index % 3) * 6,
        opacity: progress.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 0.7, 0] }),
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance] }) },
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance] }) },
          { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] }) },
        ],
      }}
    >
      {HEARTS[index % HEARTS.length]}
    </Animated.Text>
  );
}

export function MatchOverlay({
  visible,
  me,
  other,
  onChat,
  onClose,
}: {
  visible: boolean;
  me?: any;
  other?: any;
  onChat: () => void;
  onClose: () => void;
}) {
  const glow = useRef(new Animated.Value(0.4)).current;
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    rise.setValue(0);
    Animated.spring(rise, { toValue: 1, friction: 6, useNativeDriver: USE_NATIVE }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: USE_NATIVE }),
        Animated.timing(glow, { toValue: 0.4, duration: 1400, useNativeDriver: USE_NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, glow, rise]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(6,2,9,0.94)', alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: 340,
            height: 340,
            borderRadius: 340,
            backgroundColor: C.pink,
            opacity: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.12, 0.24] }),
          }}
        />
        {Array.from({ length: 10 }).map((_, i) => (
          <Burst key={i} index={i} angle={(i / 10) * Math.PI * 2} />
        ))}

        <Animated.View
          style={{
            alignItems: 'center',
            gap: 14,
            paddingHorizontal: 28,
            transform: [{ scale: rise.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            opacity: rise,
          }}
        >
          <Text
            style={{
              fontFamily: F.displayItalic,
              fontSize: 40,
              color: C.text,
              textShadowColor: 'rgba(255,61,154,0.9)',
              textShadowRadius: 26,
            }}
          >
            É um match!
          </Text>
          <Text style={{ fontFamily: F.body, fontSize: 14, color: C.muted, textAlign: 'center' }}>
            Vocês se curtiram. O primeiro sussurro é de vocês.
          </Text>

          <View style={{ flexDirection: 'row', gap: 26, marginVertical: 10 }}>
            <Avatar uri={me?.photos?.[0]} name={me?.name} size={92} verified={me?.verified} />
            <View style={{ justifyContent: 'center' }}>
              <Text style={{ fontSize: 26 }}>💞</Text>
            </View>
            <Avatar uri={other?.photos?.[0]} name={other?.name} size={92} verified={other?.verified} />
          </View>

          <NeonButton label="Conversar agora" icon="chatbubble-ellipses" onPress={onChat} style={{ minWidth: 240 }} />
          <NeonButton label="Continuar descobrindo" variant="ghost" onPress={onClose} style={{ minWidth: 240 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}
