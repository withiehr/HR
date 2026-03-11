'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Pencil, CheckCircle2, XCircle, Download } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { resignations as initialData } from '@/data/resignations';
import { employees, departments } from '@/data/employees';
import { Resignation, Position } from '@/types';
import { formatDate, paginate, generateId } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { exportToExcel } from '@/lib/export-excel';

const RESIGN_REASONS = ['개인사유', '타사이직', '계약만료', '해외유학', '결혼/육아', '권고사직', '정년퇴직', '기타'];

const POSITION_OPTIONS = ['Entry B', 'Entry A', 'Junior', 'Senior']
  .map((p) => ({ value: p, label: p }));

function CheckIcon({ value }: { value: boolean }) {
  return value
    ? <CheckCircle2 size={16} className="text-emerald-500" />
    : <XCircle size={16} className="text-red-400" />;
}

function completionBadge(r: Resignation) {
  const done = [r.handoverCompleted, r.assetReturned, r.accountDeactivated, r.severanceSettled].filter(Boolean).length;
  if (done === 4) return <Badge variant="success">완료</Badge>;
  if (done >= 2) return <Badge variant="warning">진행중</Badge>;
  return <Badge variant="danger">미완료</Badge>;
}

const PAGE_SIZE = 10;

interface ResignForm {
  employeeId: string;
  employeeName: string;
  department: string;
  position: Position;
  resignationDate: string;
  reason: string;
  reasonDetail: string;
  handoverCompleted: boolean;
  assetReturned: boolean;
  accountDeactivated: boolean;
  severanceSettled: boolean;
}

const emptyForm: ResignForm = {
  employeeId: '', employeeName: '', department: departments[0], position: 'Entry A',
  resignationDate: '', reason: '개인사유', reasonDetail: '',
  handoverCompleted: false, assetReturned: false, accountDeactivated: false, severanceSettled: false,

};

type CompletionFilter = '' | '완료' | '진행중' | '미완료';

function getCompletionStatus(r: Resignation): CompletionFilter {
  const done = [r.handoverCompleted, r.assetReturned, r.accountDeactivated, r.severanceSettled].filter(Boolean).length;
  if (done === 4) return '완료';
  if (done >= 2) return '진행중';
  return '미완료';
}

export default function ResignationsPage() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [data, setData] = useState<Resignation[]>(initialData);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<CompletionFilter>('');
  const [yearFilter, setYearFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Resignation | null>(null);
  const [form, setForm] = useState<ResignForm>(emptyForm);

  // 퇴사일 기준 연도 목록 추출
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(data.map((r) => new Date(r.resignationDate).getFullYear())));
    return years.sort((a, b) => b - a);
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const matchSearch = !search || r.employeeName.includes(search) || r.reason.includes(search) || r.department.includes(search);
      const matchDept = !deptFilter || r.department === deptFilter;
      const matchReason = !reasonFilter || r.reason === reasonFilter;
      const matchStatus = !statusFilter || getCompletionStatus(r) === statusFilter;
      const matchYear = !yearFilter || new Date(r.resignationDate).getFullYear().toString() === yearFilter;
      return matchSearch && matchDept && matchReason && matchStatus && matchYear;
    });
  }, [data, search, deptFilter, reasonFilter, statusFilter, yearFilter]);

  const sorted = [...filtered].sort((a, b) => new Date(b.resignationDate).getTime() - new Date(a.resignationDate).getTime());
  const { data: pageData, totalPages } = paginate(sorted, page, PAGE_SIZE);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEdit(r: Resignation) {
    setEditTarget(r);
    setForm({
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      department: r.department,
      position: r.position,
      resignationDate: r.resignationDate,
      reason: r.reason,
      reasonDetail: r.reasonDetail || '',
      handoverCompleted: r.handoverCompleted,
      assetReturned: r.assetReturned,
      accountDeactivated: r.accountDeactivated,
      severanceSettled: r.severanceSettled,
    });
    setIsModalOpen(true);
  }

  function handleEmployeeSelect(empId: string) {
    const emp = employees.find((e) => e.id === empId);
    if (emp) setForm((prev) => ({ ...prev, employeeId: emp.id, employeeName: emp.name, department: emp.department, position: emp.position }));
  }

  function handleSubmit() {
    if (!form.employeeName || !form.resignationDate) {
      alert('직원명과 퇴사일은 필수입니다.');
      return;
    }
    const now = new Date().toISOString();
    if (editTarget) {
      setData((prev) => prev.map((r) => r.id === editTarget.id ? { ...r, ...form, reasonDetail: form.reasonDetail || undefined, updatedAt: now } : r));
    } else {
      const newItem: Resignation = {
        ...form, id: generateId('res'),
        reasonDetail: form.reasonDetail || undefined,
        createdAt: now, updatedAt: now,
      };
      setData((prev) => [...prev, newItem]);
    }
    setIsModalOpen(false);
  }

  return (
    <div className="space-y-4">
      {/* 필터 바 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="직원명, 부서, 퇴사 사유 검색..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 부서</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={reasonFilter} onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 퇴사사유</option>
              {RESIGN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as CompletionFilter); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 처리상태</option>
              <option value="완료">완료</option>
              <option value="진행중">진행중</option>
              <option value="미완료">미완료</option>
            </select>
            <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 연도</option>
              {availableYears.map((y) => <option key={y} value={y.toString()}>{y}년</option>)}
            </select>
            {(search || deptFilter || reasonFilter || statusFilter || yearFilter) && (
              <button onClick={() => { setSearch(''); setDeptFilter(''); setReasonFilter(''); setStatusFilter(''); setYearFilter(''); setPage(1); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
                필터 초기화
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              exportToExcel(sorted.map((r) => ({
                employeeName: r.employeeName,
                department: r.department,
                position: r.position,
                resignationDate: r.resignationDate,
                reason: r.reason,
                reasonDetail: r.reasonDetail || '-',
                handover: r.handoverCompleted ? 'O' : 'X',
                asset: r.assetReturned ? 'O' : 'X',
                account: r.accountDeactivated ? 'O' : 'X',
                severance: r.severanceSettled ? 'O' : 'X',
                status: getCompletionStatus(r),
              })), [
                { key: 'employeeName', label: '직원명' },
                { key: 'department', label: '부서' },
                { key: 'position', label: '직급' },
                { key: 'resignationDate', label: '퇴사일' },
                { key: 'reason', label: '퇴사사유' },
                { key: 'reasonDetail', label: '상세사유' },
                { key: 'handover', label: '인수인계' },
                { key: 'asset', label: '자산반납' },
                { key: 'account', label: '계정회수' },
                { key: 'severance', label: '퇴직금정산' },
                { key: 'status', label: '처리상태' },
              ], '퇴사관리');
            }}><Download size={16} />엑셀</Button>
            {isAdmin && <Button onClick={openCreate}><Plus size={16} />퇴사 등록</Button>}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">총 <span className="font-semibold text-gray-900">{filtered.length}</span>건</span>
        </div>
        {filtered.length === 0 ? <EmptyState message="퇴사 기록이 없습니다" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['직원명', '퇴사일', '퇴사사유', '인수인계', '자산반납', '계정회수', '퇴직금정산', '처리상태', '관리'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((r) => (
                    <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{r.employeeName}</p>
                          <p className="text-xs text-gray-400">{r.department} · {r.position}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(r.resignationDate)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.reason}</td>
                      <td className="px-4 py-3 text-center"><CheckIcon value={r.handoverCompleted} /></td>
                      <td className="px-4 py-3 text-center"><CheckIcon value={r.assetReturned} /></td>
                      <td className="px-4 py-3 text-center"><CheckIcon value={r.accountDeactivated} /></td>
                      <td className="px-4 py-3 text-center"><CheckIcon value={r.severanceSettled} /></td>
                      <td className="px-4 py-3 whitespace-nowrap">{completionBadge(r)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isAdmin && <button onClick={() => openEdit(r)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="수정">
                          <Pencil size={14} />
                        </button>}
                      </td>
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

      {/* 모달 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editTarget ? '퇴사 정보 수정' : '퇴사 등록'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">직원 선택 *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                value={form.employeeId} onChange={(e) => handleEmployeeSelect(e.target.value)}>
                <option value="">직원 선택...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                ))}
              </select>
            </div>
            <Input label="퇴사일 *" type="date" value={form.resignationDate} onChange={(e) => setForm({ ...form, resignationDate: e.target.value })} />
            <Select label="퇴사 사유" value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              options={RESIGN_REASONS.map((r) => ({ value: r, label: r }))} />
            <Input label="상세 사유" value={form.reasonDetail} onChange={(e) => setForm({ ...form, reasonDetail: e.target.value })} placeholder="상세 사유 입력" />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">퇴사 처리 현황</p>
            {[
              { key: 'handoverCompleted' as const, label: '인수인계 완료' },
              { key: 'assetReturned' as const, label: '자산 반납 완료' },
              { key: 'accountDeactivated' as const, label: '계정 회수 완료' },
              { key: 'severanceSettled' as const, label: '퇴직금 정산 완료' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>취소</Button>
          <Button onClick={handleSubmit}>{editTarget ? '수정 완료' : '등록'}</Button>
        </div>
      </Modal>
    </div>
  );
}
