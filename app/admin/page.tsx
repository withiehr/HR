'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Mail, Shield, RefreshCw, Trash2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { formatDate, formatDateTime } from '@/lib/utils';

/*
  ============================================================
  Supabase SQL - app_users 테이블 생성 (Supabase SQL Editor에서 실행)
  ============================================================

  CREATE TABLE app_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
    name TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT '초대됨' CHECK (status IN ('초대됨', '활성', '비활성')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Allow all for authenticated" ON app_users
    FOR ALL USING (true) WITH CHECK (true);

  ============================================================
*/

interface AppUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  name: string;
  status: '초대됨' | '활성' | '비활성';
  last_login_at: string | null;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: '관리자' },
  { value: 'manager', label: '매니저' },
  { value: 'viewer', label: '뷰어' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: '관리자',
  manager: '매니저',
  viewer: '뷰어',
};

function roleBadgeVariant(role: string) {
  const map: Record<string, 'danger' | 'warning' | 'info'> = {
    admin: 'danger',
    manager: 'warning',
    viewer: 'info',
  };
  return map[role] || 'info';
}

function statusBadgeVariant(status: string) {
  const map: Record<string, 'success' | 'warning' | 'secondary'> = {
    '활성': 'success',
    '초대됨': 'warning',
    '비활성': 'secondary',
  };
  return map[status] || 'secondary';
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 목록 조회 실패:', error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 자동 성공 메시지 숨기기
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 중복 확인
    const existing = users.find((u) => u.email === inviteEmail.trim());
    if (existing) {
      setError('이미 등록된 이메일입니다.');
      return;
    }

    setInviting(true);
    setError('');

    try {
      // 1. Magic link 발송 (OTP 방식으로 초대)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: inviteEmail.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        setError(`초대 메일 발송 실패: ${otpError.message}`);
        setInviting(false);
        return;
      }

      // 2. app_users 테이블에 레코드 추가
      const { error: insertError } = await supabase.from('app_users').insert({
        email: inviteEmail.trim(),
        role: inviteRole,
        name: inviteName.trim(),
        status: '초대됨',
      });

      if (insertError) {
        setError(`사용자 기록 저장 실패: ${insertError.message}`);
        setInviting(false);
        return;
      }

      setSuccessMsg(`${inviteEmail.trim()} 으로 초대 메일이 발송되었습니다.`);
      setInviteEmail('');
      setInviteRole('viewer');
      setInviteName('');
      setInviteOpen(false);
      fetchUsers();
    } catch (err) {
      setError('초대 처리 중 오류가 발생했습니다.');
    } finally {
      setInviting(false);
    }
  }

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`${email} 사용자를 삭제하시겠습니까?`)) return;

    const { error } = await supabase.from('app_users').delete().eq('id', userId);
    if (error) {
      alert(`삭제 실패: ${error.message}`);
    } else {
      fetchUsers();
    }
  }

  async function handleToggleStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === '비활성' ? '활성' : '비활성';
    const { error } = await supabase
      .from('app_users')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) {
      alert(`상태 변경 실패: ${error.message}`);
    } else {
      fetchUsers();
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* 현재 로그인 사용자 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm text-gray-500">현재 로그인</p>
              <p className="text-base font-semibold text-gray-900">{user?.email || '-'}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                마지막 로그인: {user?.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : '-'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-600">관리자</span>
          </div>
        </div>
      </div>

      {/* 성공 메시지 */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* 사용자 목록 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">등록 사용자</h2>
          <p className="text-sm text-gray-500 mt-0.5">총 {users.length}명</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            새로고침
          </Button>
          <Button size="sm" onClick={() => { setInviteOpen(true); setError(''); }}>
            <UserPlus size={14} />
            초대하기
          </Button>
        </div>
      </div>

      {/* 사용자 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            로딩 중...
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            message="등록된 사용자가 없습니다"
            description="초대하기 버튼을 눌러 새 사용자를 추가하세요."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">이메일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">이름</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">역할</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">마지막 로그인</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">등록일</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.name || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleBadgeVariant(u.role)}>
                        {ROLE_LABELS[u.role] || u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeVariant(u.status)}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {u.last_login_at ? formatDateTime(u.last_login_at) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title={u.status === '비활성' ? '활성화' : '비활성화'}
                        >
                          <Shield size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.email)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 초대 모달 */}
      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="사용자 초대" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            입력한 이메일로 매직 링크 초대 메일이 발송됩니다.
          </p>

          <Input
            label="이메일"
            type="email"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <Input
            label="이름 (선택)"
            placeholder="홍길동"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
          />

          <Select
            label="역할"
            options={ROLE_OPTIONS}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              취소
            </Button>
            <Button onClick={handleInvite} disabled={inviting}>
              <Mail size={14} />
              {inviting ? '발송 중...' : '초대 메일 발송'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
