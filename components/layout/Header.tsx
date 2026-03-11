'use client';

import { usePathname } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

const pageTitles: Record<string, string> = {
  '/dashboard': '대시보드',
  '/employees': '직원 관리',
  '/personnel-history': '인사 이력 관리',
  '/certifications': '자격증 관리',
  '/evaluations': '인사 평가',
  '/leaves': '연차 관리',
  '/resignations': '퇴사 관리',
  '/documents': '문서 관리',
  '/activity-logs': '활동 로그',
  '/admin': '관리자',
};

export default function Header() {
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();
  const ROLE_LABELS: Record<string, string> = { admin: '관리자', manager: '매니저', viewer: '뷰어' };
  const [showNotif, setShowNotif] = useState(false);

  // 직원 상세 페이지 제목 처리
  let title = pageTitles[pathname];
  if (!title && pathname.startsWith('/employees/')) {
    title = '직원 상세';
  }
  title = title ?? '인사관리 시스템';

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2">
              <p className="px-4 py-2 text-sm font-medium text-gray-900 border-b">알림</p>
              <div className="px-4 py-3 text-sm text-gray-600 border-b hover:bg-gray-50">
                <p className="font-medium text-gray-800">자격증 만료 예정</p>
                <p className="text-xs text-gray-500 mt-0.5">정현우 - 전기공사기사 (2025.05.10)</p>
              </div>
              <div className="px-4 py-3 text-sm text-gray-600 border-b hover:bg-gray-50">
                <p className="font-medium text-gray-800">수습 종료 예정</p>
                <p className="text-xs text-gray-500 mt-0.5">신우진 - 수습 종료일: 2025.04.05</p>
              </div>
              <div className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">
                <p className="font-medium text-gray-800">자격증 만료 예정</p>
                <p className="text-xs text-gray-500 mt-0.5">김민수 - 에너지관리기사 (2026.04.15)</p>
              </div>
            </div>
          )}
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-700 leading-tight">{user?.email || ''}</span>
            {role && <span className="text-xs text-gray-400 leading-tight">{ROLE_LABELS[role] || role}</span>}
          </div>
          <button
            onClick={signOut}
            className="ml-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="로그아웃"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
