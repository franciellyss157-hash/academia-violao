import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fileUrl } from '../lib/api';
import { C, F } from '../lib/theme';
import { Particles } from './Particles';

export function Screen({
  children,
  scroll = true,
  particles = true,
  style,
  footer,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  particles?: boolean;
  style?: ViewStyle;
  footer?: ReactNode;
  contentStyle?: ViewStyle;
}) {
  const frame = { width: '100%', maxWidth: 560, alignSelf: 'center' } as const;
  const body = scroll ? (
    <ScrollView
      style={frame}
      contentContainerStyle={[{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 130 }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[frame, { flex: 1, paddingHorizontal: 20, paddingTop: 4 }, contentStyle]}>{children}</View>
  );

  return (
    <LinearGradient colors={['#170511', C.bg, '#040206']} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      {particles ? <Particles /> : null}
      <SafeAreaView style={[{ flex: 1 }, style]} edges={['top', 'left', 'right']}>
        {body}
        {footer}
      </SafeAreaView>
    </LinearGradient>
  );
}

export function Wordmark({ size = 26, subtitle }: { size?: number; subtitle?: string }) {
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <Text
        style={{
          fontFamily: F.display,
          fontSize: size,
          color: C.text,
          letterSpacing: size * 0.06,
          textShadowColor: 'rgba(255,61,154,0.75)',
          textShadowRadius: 18,
        }}
      >
        Sussurro
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontFamily: F.displayItalic,
            fontSize: size * 0.42,
            color: C.gold,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function H1({ children, style }: { children: ReactNode; style?: any }) {
  return (
    <Text style={[{ fontFamily: F.display, fontSize: 30, color: C.text, lineHeight: 36 }, style]}>
      {children}
    </Text>
  );
}

export function H2({ children, style }: { children: ReactNode; style?: any }) {
  return (
    <Text style={[{ fontFamily: F.display, fontSize: 21, color: C.text, lineHeight: 26 }, style]}>
      {children}
    </Text>
  );
}

export function P({ children, style }: { children: ReactNode; style?: any }) {
  return (
    <Text style={[{ fontFamily: F.body, fontSize: 14, color: C.text, lineHeight: 21 }, style]}>
      {children}
    </Text>
  );
}

export function Muted({ children, style }: { children: ReactNode; style?: any }) {
  return (
    <Text style={[{ fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 19 }, style]}>
      {children}
    </Text>
  );
}

export function Label({ children, style }: { children: ReactNode; style?: any }) {
  return (
    <Text
      style={[
        {
          fontFamily: F.semi,
          fontSize: 10.5,
          letterSpacing: 2,
          color: C.gold,
          textTransform: 'uppercase',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function NeonButton({
  label,
  onPress,
  variant = 'pink',
  icon,
  disabled,
  loading,
  style,
  small,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'pink' | 'gold' | 'ghost' | 'danger';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  small?: boolean;
}) {
  const glow = variant === 'gold' ? C.gold : variant === 'danger' ? C.danger : variant === 'ghost' ? 'transparent' : C.pink;
  const colors =
    variant === 'gold'
      ? (['#F7E4B4', '#CBA65A'] as const)
      : variant === 'danger'
        ? (['#FF7B89', '#C22333'] as const)
        : variant === 'ghost'
          ? (['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as const)
          : (['#FF7FBE', '#C2185B'] as const);
  const ink = variant === 'gold' ? '#2A1A05' : variant === 'ghost' ? C.gold : '#FFF6FA';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [{ opacity: disabled ? 0.42 : pressed ? 0.88 : 1 }, style]}
    >
      <View
        style={{
          borderRadius: 16,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: C.border,
          shadowColor: glow,
          shadowOpacity: variant === 'ghost' ? 0 : 0.45,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: variant === 'ghost' ? 0 : 8,
        }}
      >
        <LinearGradient
          colors={colors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            paddingVertical: small ? 10 : 15,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color={ink} />
          ) : (
            <>
              {icon ? <Ionicons name={icon as any} size={small ? 15 : 17} color={ink} /> : null}
              <Text style={{ fontFamily: F.semi, fontSize: small ? 12.5 : 14.5, color: ink, letterSpacing: 0.4 }}>
                {label}
              </Text>
            </>
          )}
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = C.gold,
  size = 38,
  badge,
}: {
  icon: string;
  onPress?: () => void;
  color?: string;
  size?: number;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: 'rgba(255,255,255,0.05)',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon as any} size={size * 0.46} color={color} />
      {badge && badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            paddingHorizontal: 4,
            backgroundColor: C.pink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: F.semi, fontSize: 9, color: '#fff' }}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Header({
  title,
  subtitle,
  right,
  back = true,
  onBack,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  back?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
      {back ? (
        <IconButton
          icon="chevron-back"
          onPress={() => {
            if (onBack) return onBack();
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)');
          }}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        {title ? <H2>{title}</H2> : <Wordmark size={22} />}
        {subtitle ? <Muted style={{ fontSize: 12, marginTop: 1 }}>{subtitle}</Muted> : null}
      </View>
      {right}
    </View>
  );
}

export function Glass({
  children,
  style,
  glowColor,
}: {
  children: ReactNode;
  style?: ViewStyle;
  glowColor?: string;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: C.surface,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: C.border,
          padding: 16,
        },
        glowColor
          ? {
              shadowColor: glowColor,
              shadowOpacity: 0.35,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }
          : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? C.pink : C.border,
        backgroundColor: selected ? 'rgba(255,61,154,0.16)' : 'rgba(255,255,255,0.04)',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {icon ? <Ionicons name={icon as any} size={12} color={selected ? C.pinkSoft : C.muted} /> : null}
      <Text
        style={{
          fontFamily: selected ? F.semi : F.medium,
          fontSize: 12,
          color: selected ? C.pinkSoft : C.muted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Label style={{ marginBottom: 6 }}>{label}</Label> : null}
      <TextInput
        {...props}
        placeholderTextColor="rgba(181,143,160,0.65)"
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          {
            backgroundColor: 'rgba(255,255,255,0.045)',
            borderWidth: 1,
            borderColor: focused ? C.borderPink : C.border,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: C.text,
            fontFamily: F.body,
            fontSize: 14.5,
          },
          style,
        ]}
      />
    </View>
  );
}

export function Avatar({
  uri,
  size = 56,
  name,
  vip,
  verified,
  ring = true,
}: {
  uri?: string | null;
  size?: number;
  name?: string;
  vip?: boolean;
  verified?: boolean;
  ring?: boolean;
}) {
  const src = fileUrl(uri);
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: 2,
          borderWidth: 1.5,
          borderColor: ring ? (vip ? C.gold : C.borderPink) : 'transparent',
        }}
      >
        {src ? (
          <Image source={{ uri: src }} style={{ flex: 1, borderRadius: size / 2 }} resizeMode="cover" />
        ) : (
          <View
            style={{
              flex: 1,
              borderRadius: size / 2,
              backgroundColor: '#2A0A18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: F.display, color: C.gold, fontSize: size * 0.36 }}>
              {(name || 'S').trim().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      {verified ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: C.gold,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: C.bg,
          }}
        >
          <Ionicons name="checkmark" size={9} color="#2A1A05" />
        </View>
      ) : null}
    </View>
  );
}

export function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: `${color}1F`,
      }}
    >
      <Text style={{ fontFamily: F.semi, fontSize: 10.5, letterSpacing: 0.4, color }}>{label}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>{children}</View>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  return (
    <View
      style={[
        { height: 1, backgroundColor: C.border, marginVertical: 14, opacity: 0.8 },
        style,
      ]}
    />
  );
}

export function Loader({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 40 }}>
      <ActivityIndicator color={C.pink} size="large" />
      {label ? <Muted>{label}</Muted> : null}
    </View>
  );
}

export function Empty({ icon = 'sparkles-outline', title, text }: { icon?: string; title: string; text?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 34, gap: 8 }}>
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          borderWidth: 1,
          borderColor: C.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}
      >
        <Ionicons name={icon as any} size={24} color={C.gold} />
      </View>
      <H2 style={{ fontSize: 18, textAlign: 'center' }}>{title}</H2>
      {text ? <Muted style={{ textAlign: 'center', maxWidth: 280 }}>{text}</Muted> : null}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 22,
        marginBottom: 10,
      }}
    >
      <Label>{title}</Label>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.pinkSoft }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Stat({ value, label, color = C.text }: { value: string; label: string; color?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
      <Text style={{ fontFamily: F.display, fontSize: 22, color }}>{value}</Text>
      <Text style={{ fontFamily: F.body, fontSize: 10.5, color: C.muted, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(4,2,6,0.86)', justifyContent: 'center', padding: 20 }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e: any) => e?.stopPropagation?.()}
          style={{
            backgroundColor: '#150610',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: C.border,
            padding: 20,
            gap: 6,
            shadowColor: C.pink,
            shadowOpacity: 0.25,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 12 },
          }}
        >
          {title ? <H2 style={{ marginBottom: 6 }}>{title}</H2> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
