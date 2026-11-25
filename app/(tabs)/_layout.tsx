import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '../../lib/session';
import { C, F } from '../../lib/theme';

export default function TabsLayout() {
  const { ready, token, isAdmin } = useSession();

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.pink} size="large" />
      </View>
    );
  }
  if (!token) return <Redirect href="/auth" />;
  if (isAdmin) return <Redirect href="/admin" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(9,3,7,0.98)',
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 74,
          paddingTop: 9,
          paddingBottom: 14,
        },
        tabBarActiveTintColor: C.pink,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontFamily: F.medium, fontSize: 9.5, letterSpacing: 0.6 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Descobrir',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Conversas',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size - 4} color={color} />,
        }}
      />
    </Tabs>
  );
}
