import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '../../lib/session';
import { C, F } from '../../lib/theme';

export default function AdminLayout() {
  const { ready, token, isAdmin } = useSession();

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }
  if (!token) return <Redirect href="/auth" />;
  if (!isAdmin) return <Redirect href="/(tabs)" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(9,3,7,0.98)',
          borderTopColor: C.border,
          height: 74,
          paddingTop: 9,
          paddingBottom: 14,
        },
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontFamily: F.medium, fontSize: 9.5, letterSpacing: 0.4 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pagamentos',
          tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Usuários',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Denúncias',
          tabBarIcon: ({ color, size }) => <Ionicons name="flag-outline" size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="packages"
        options={{
          title: 'Pacotes',
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Ganhos',
          tabBarIcon: ({ color, size }) => <Ionicons name="trending-up-outline" size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen name="order/[id]" options={{ href: null }} />
    </Tabs>
  );
}
