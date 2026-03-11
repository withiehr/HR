'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // app_users에서 역할 정보 가져오기
  async function fetchUserRole(email: string) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('role, status')
        .eq('email', email)
        .single();

      if (error || !data) {
        // app_users에 없으면 기본 admin으로 설정 (첫 사용자)
        setRole('admin');
        return;
      }

      setRole(data.role as UserRole);

      // 초대됨 상태이면 비밀번호 설정 페이지로 이동
      if (data.status === '초대됨' && pathname !== '/set-password') {
        router.push('/set-password');
      }

      // last_login_at 업데이트
      await supabase
        .from('app_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('email', email);
    } catch {
      // 테이블이 없거나 네트워크 오류 시 기본값
      setRole('admin');
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.email) {
        fetchUserRole(currentUser.email).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
