'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // URL 해시에 토큰이 있으면 세션 복원
  useEffect(() => {
    async function handleTokenFromHash() {
      // Supabase 클라이언트가 자동으로 URL hash의 토큰을 처리
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
      }

      if (!session) {
        // 해시에서 토큰 교환 시도 (magic link 클릭 시)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          // Supabase가 해시를 자동 처리하므로 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (!newSession) {
            setError('인증 세션이 만료되었습니다. 초대 메일을 다시 요청해주세요.');
          }
        }
      }

      setChecking(false);
    }

    handleTokenFromHash();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      // Supabase auth에 비밀번호 설정
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(`비밀번호 설정 실패: ${updateError.message}`);
        setLoading(false);
        return;
      }

      // app_users 상태를 '활성'으로 변경
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await supabase
          .from('app_users')
          .update({ status: '활성' })
          .eq('email', user.email);
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('비밀번호 설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">인증 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">HR</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">비밀번호 설정</h1>
            <p className="text-sm text-gray-500 mt-1">
              로그인에 사용할 비밀번호를 설정해주세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상 입력"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '설정 중...' : '비밀번호 설정 완료'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
