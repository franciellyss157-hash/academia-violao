import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_600SemiBold_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { Asset } from 'expo-asset';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Fontes do Sussurro.
 * No nativo usamos o carregador do expo-font. Na web algumas redes/proxies
 * bloqueiam o download feito pelo CSS @font-face, então baixamos o arquivo e
 * registramos a FontFace a partir dos bytes — mesmo resultado visual.
 */
export const FONTS: Record<string, any> = {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_600SemiBold_Italic,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
};

async function loadWebFonts() {
  const entries = Object.entries(FONTS);
  await Promise.all(
    entries.map(async ([family, module]) => {
      try {
        const asset = Asset.fromModule(module);
        if (!asset.uri) await asset.downloadAsync();
        const res = await fetch(asset.uri);
        const buffer = await res.arrayBuffer();
        const face = new (window as any).FontFace(family, buffer);
        await face.load();
        (document as any).fonts.add(face);
      } catch (err) {
        console.warn(`[fonts] falha ao carregar ${family}`, err);
      }
    })
  );
}

export function useAppFonts(): [boolean, Error | null] {
  const [nativeLoaded, nativeError] = useFonts(Platform.OS === 'web' ? {} : FONTS);
  const [webLoaded, setWebLoaded] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let alive = true;
    loadWebFonts().finally(() => {
      if (alive) setWebLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return Platform.OS === 'web' ? [webLoaded, null] : [nativeLoaded, nativeError || null];
}
