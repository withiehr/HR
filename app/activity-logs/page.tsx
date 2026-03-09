'use client';

import { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { activityLogs } from '@/data/activity-logs';
import { ActionType, MenuType } from '@/types';
import { formatDateTime, paginate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { exportToExcel } from '@/lib/export-excel';

const MENU_TYPES: MenuType[] = ['직원관리', '인사이력', '자격증관리', '퇴사관리', '문서관리', '인사평가', '시스템'];
const ACTION_TYPES: ActionType[] = ['등록', '수정', '삭제', '상태변경', '조회', '다운로드', '업로드'];

function actionBadgeVariant(type: ActionType) {
  const map: Record<ActionType, 'success' | 'info' | 'danger' | 'warning' | 'default' | 'secondary'> = {
    등록: 'success', 수정: 'info', 삭제: 'danger', 상태변경: 'warning',
    조회: 'default', 다운로드: 'secondary', 업로드: 'info',
  };
  return map[type];
}

function menuBadgeVariant(menu: MenuType) {
  const map: Record<MenuType, 'info' | 'success' | 'warning' | 'danger' | 'secondary' | 'default'> = {
    직원관리: 'info', 인사이력: 'success', 자격증관리: 'warning',
    퇴사관리: 'danger', 문서관리: 'secondary', 인사평가: 'info', 시스템: 'default',
  };
  return map[menu];
}

const PAGE_SIZE = 15;

export default function ActivityLogsPage() {
  const [search, setSearch] = useState('');
  const [menuFilter, setMenuFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchSearch = !search || log.userName.includes(search) || log.targetName?.includes(search) || log.description.includes(search);
      const matchMenu = !menuFilter || log.menu === menuFilter;
      const matchAction = !actionFilter || log.actionType === actionFilter;
      return matchSearch && matchMenu && matchAction;
    });
  }, [search, menuFilter, actionFilter]);

  const sorted = [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const { data: pageData, totalPages } = paginate(sorted, page, PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* 필터 바 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="작업자, 대상자, 내용 검색..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <select value={menuFilter} onChange={(e) => { setMenuFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 메뉴</option>
              {MENU_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 작업유형</option>
              {ACTION_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            {(search || menuFilter || actionFilter) && (
              <button onClick={() => { setSearch(''); setMenuFilter(''); setActionFilter(''); setPage(1); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                필터 초기화
              </button>
            )}
          </div>
          <Button variant="secondary" onClick={() => {
            exportToExcel(sorted.map((log) => ({
              timestamp: formatDateTime(log.timestamp),
              userName: log.userName,
              menu: log.menu,
              actionType: log.actionType,
              targetName: log.targetName || '-',
              description: log.description,
            })), [
              { key: 'timestamp', label: '작업일시' },
              { key: 'userName', label: '작업자' },
              { key: 'menu', label: '메뉴' },
              { key: 'actionType', label: '작업유형' },
              { key: 'targetName', label: '대상자' },
              { key: 'description', label: '변경내용' },
            ], '활동로그');
          }}><Download size={16} />엑셀</Button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">총 <span className="font-semibold text-gray-900">{filtered.length}</span>건</span>
        </div>
        {filtered.length === 0 ? <EmptyState message="활동 로그가 없습니다" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['작업일시', '작업자', '메뉴', '작업유형', '대상자', '변경내용'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((log) => (
                    <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs font-mono">{formatDateTime(log.timestamp)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{log.userName}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant={menuBadgeVariant(log.menu)}>{log.menu}</Badge></td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant={actionBadgeVariant(log.actionType)}>{log.actionType}</Badge></td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{log.targetName || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-lg truncate">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 border-t border-gray-100">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
