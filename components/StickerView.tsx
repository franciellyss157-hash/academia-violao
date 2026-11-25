import { useEffect, useRef } from 'react';
import { Animated, Image, Platform, Text, View } from 'react-native';
import { fileUrl } from '../lib/api';
import { C, F } from '../lib/theme';

const USE_NATIVE = Platform.OS !== 'web';

export function StickerView({ sticker, size = 72 }: { sticker: any; size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: USE_NATIVE }),
        Animated.timing(pulse, { toValue: 0, duration: 850, useNativeDriver: USE_NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.08] });
  const rotate = pulse.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });

  if (sticker?.imageUrl) {
    return (
      <Animated.View style={{ transform: [{ scale }, { rotate }] }}>
        <Image
          source={{ uri: fileUrl(sticker.imageUrl) }}
          style={{ width: size, height: size, borderRadius: size * 0.18 }}
          resizeMode="cover"
        />
        {sticker.emojiOverlay ? (
          <Text
            style={{
              position: 'absolute',
              right: -4,
              top: -6,
              fontSize: size * 0.4,
              textShadowColor: 'rgba(255,61,154,0.6)',
              textShadowRadius: 10,
            }}
          >
            {sticker.emojiOverlay}
          </Text>
        ) : null}
        {sticker.textOverlay ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 4,
              paddingVertical: 3,
              backgroundColor: 'rgba(6,2,8,0.62)',
              borderBottomLeftRadius: size * 0.18,
              borderBottomRightRadius: size * 0.18,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: F.semi,
                fontSize: Math.max(8, size * 0.15),
                color: C.text,
                textAlign: 'center',
              }}
            >
              {sticker.textOverlay}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    );
  }

  return (
    <Animated.Text
      style={{
        fontSize: size * 0.8,
        transform: [{ scale }, { rotate }],
        textShadowColor: 'rgba(255,61,154,0.7)',
        textShadowRadius: 16,
      }}
    >
      {sticker?.emoji || '❤️'}
    </Animated.Text>
  );
}
