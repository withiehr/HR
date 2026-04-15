'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types';

interface LocalUser {
  id: string;
  email: string;
  last_sign_in_at?: string;
}

interface AuthContextType {
  user: LocalUser | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_PATHS = ['/login', '/set-password', '/auth/callback'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  async function fetchUserRole(email: string) {
    try {
      const { data } = await supabase
        .from('app_users')
        .select('role, status')
        .eq('email', email)
        .single();

      if (!data) {
        setRole('admin');
        return;
      }

      setRole(data.role as UserRole);
    } catch {
      setRole('admin');
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.email) {
        fetchUserRole(currentUser.email).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.email) {
        fetchUserRole(currentUser.email);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && !user && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  async function signOut() {
    await supabase.auth.signOut();
    setRole(null);
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
