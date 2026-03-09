'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  History,
  Award,
  UserMinus,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/employees', label: '직원 관리', icon: Users },
  { href: '/personnel-history', label: '인사 이력', icon: History },
  { href: '/certifications', label: '자격증 관리', icon: Award },
  { href: '/evaluations', label: '인사 평가', icon: Star },
  { href: '/resignations', label: '퇴사 관리', icon: UserMinus },
  { href: '/documents', label: '문서 관리', icon: FileText },
  { href: '/activity-logs', label: '활동 로그', icon: ClipboardList },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* 로고 */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700 min-h-[64px]">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Building2 size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold leading-tight">
            인사관리 시스템
            <br />
            <span className="text-xs text-slate-400 font-normal">위드인천에너지</span>
          </span>
        )}
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* 하단 사용자 정보 */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              관
            </div>
            <div>
              <p className="text-xs text-slate-400">관리자</p>
              <p className="text-sm text-slate-200 font-medium">이서연</p>
            </div>
          </div>
        </div>
      )}

      {/* 접기/펼치기 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 transition-colors z-10 border border-slate-600"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
