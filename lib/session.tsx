import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, setAuthToken } from './api';

export type SUser = {
  id: string;
  name: string;
  email: string;
  bio: string;
  city: string;
  interests: string[];
  intent: string;
  visibility: string;
  credits: number;
  vip: boolean;
  verified: boolean;
  verificationStatus: string;
  selfieUrl?: string | null;
  status: string;
  highlightUntil: string | null;
  role: string;
  age: number | null;
  birthdate?: string;
  photos: string[];
};

const TOKEN_KEY = 'sussurro.token';

type SessionCtx = {
  ready: boolean;
  token: string | null;
  user: SUser | null;
  isAdmin: boolean;
  signIn: (token: string, user: any) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUser: (user: any) => void;
};

const Ctx = createContext<SessionCtx>({
  ready: false,
  token: null,
  user: null,
  isAdmin: false,
  signIn: async () => {},
  signOut: async () => {},
  refresh: async () => {},
  updateUser: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY);
        if (saved) {
          setAuthToken(saved);
          setToken(saved);
          const res = await api.get('/api/auth/me');
          setUser(res.user);
        }
      } catch (err: any) {
        // Só descartamos a sessão quando o servidor recusa o token.
        // Falhas de rede mantêm o token para a próxima tentativa.
        if (err?.status === 401 || err?.status === 403) {
          await AsyncStorage.removeItem(TOKEN_KEY);
          setAuthToken(null);
          setToken(null);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const signIn = useCallback(async (newToken: string, newUser: any) => {
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.user);
    } catch {}
  }, []);

  return (
    <Ctx.Provider
      value={{
        ready,
        token,
        user,
        isAdmin: user?.role === 'admin',
        signIn,
        signOut,
        refresh,
        updateUser: setUser,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  return useContext(Ctx);
}
