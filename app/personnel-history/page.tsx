'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Plus, Pencil, Download } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase';
import { PersonnelHistory, PersonnelHistoryType } from '@/types';
import { formatDate, paginate } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { exportToExcel } from '@/lib/export-excel';

const HISTORY_TYPES: PersonnelHistoryType[] = ['입사', '승진', '부서이동', '직책변경', '급여변경', '휴직', '복직', '징계', '포상', '퇴사'];

const historyBadgeVariant = (type: string) => {
  const map: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'default' | 'secondary'> = {
    입사: 'success', 퇴사: 'danger', 승진: 'info', 휴직: 'warning',
    복직: 'success', 부서이동: 'secondary', 직책변경: 'secondary',
    급여변경: 'info', 포상: 'success', 징계: 'danger',
  };
  return map[type] ?? 'default';
};

const PAGE_SIZE = 10;

interface EmployeeRow {
  id: string;
  employee_number: string;
  name: string;
  department: string;
  position: string;
  status: string;
}

interface HistoryForm {
  employeeId: string;
  employeeName: string;
  type: PersonnelHistoryType;
  effectiveDate: string;
  details: string;
  previousValue: string;
  newValue: string;
  registeredBy: string;
}

const emptyForm: HistoryForm = {
  employeeId: '', employeeName: '', type: '승진',
  effectiveDate: '', details: '', previousValue: '', newValue: '', registeredBy: '이서연',
};

export default function PersonnelHistoryPage() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [data, setData] = useState<PersonnelHistory[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PersonnelHistory | null>(null);
  const [form, setForm] = useState<HistoryForm>(emptyForm);

  const fetchEmployees = useCallback(async () => {
    const { data: rows } = await supabase
      .from('employees')
      .select('id, employee_number, name, department, position, status');
    if (rows) {
      setEmployees(rows as EmployeeRow[]);
    }
  }, []);

  const fetchHistories = useCallback(async () => {
    const { data: rows } = await supabase
      .from('personnel_histories')
      .select('id, employee_id, type, effective_date, previous_value, new_value, notes, created_at');
    if (rows) {
      // Build a lookup map from employees state; fall back to a fresh fetch if needed
      let empMap: Record<string, string> = {};
      if (employees.length > 0) {
        employees.forEach((e) => { empMap[e.id] = e.name; });
      } else {
        const { data: empRows } = await supabase
          .from('employees')
          .select('id, name');
        if (empRows) {
          (empRows as { id: string; name: string }[]).forEach((e) => { empMap[e.id] = e.name; });
        }
      }

      const mapped: PersonnelHistory[] = rows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        employeeId: r.employee_id as string,
        employeeName: empMap[r.employee_id as string] ?? '',
        type: r.type as PersonnelHistoryType,
        effectiveDate: r.effective_date as string,
        details: (r.notes as string) ?? '',
        previousValue: (r.previous_value as string) ?? undefined,
        newValue: (r.new_value as string) ?? undefined,
        registeredBy: '',
        createdAt: r.created_at as string,
      }));
      setData(mapped);
    }
  }, [employees]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  const filtered = useMemo(() => {
    return data.filter((h) => {
      const matchSearch = !search || h.employeeName.includes(search) || h.details.includes(search);
      const matchType = !typeFilter || h.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [data, search, typeFilter]);

  const sorted = [...filtered].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
  const { data: pageData, totalPages } = paginate(sorted, page, PAGE_SIZE);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEdit(h: PersonnelHistory) {
    setEditTarget(h);
    setForm({
      employeeId: h.employeeId,
      employeeName: h.employeeName,
      type: h.type,
      effectiveDate: h.effectiveDate,
      details: h.details,
      previousValue: h.previousValue || '',
      newValue: h.newValue || '',
      registeredBy: h.registeredBy,
    });
    setIsModalOpen(true);
  }

  function handleEmployeeSelect(empId: string) {
    const emp = employees.find((e) => e.id === empId);
    if (emp) setForm((prev) => ({ ...prev, employeeId: emp.id, employeeName: emp.name }));
  }

  async function handleSubmit() {
    if (!form.employeeName || !form.effectiveDate) {
      alert('직원명과 발령일은 필수입니다.');
      return;
    }

    if (editTarget) {
      const { error } = await supabase
        .from('personnel_histories')
        .update({
          employee_id: form.employeeId,
          type: form.type,
          effective_date: form.effectiveDate,
          previous_value: form.previousValue || null,
          new_value: form.newValue || null,
          notes: form.details || null,
        })
        .eq('id', editTarget.id);

      if (error) {
        alert('수정에 실패했습니다: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('personnel_histories')
        .insert({
          employee_id: form.employeeId,
          type: form.type,
          effective_date: form.effectiveDate,
          previous_value: form.previousValue || null,
          new_value: form.newValue || null,
          notes: form.details || null,
        });

      if (error) {
        alert('등록에 실패했습니다: ' + error.message);
        return;
      }
    }

    setIsModalOpen(false);
    await fetchHistories();
  }

  return (
    <div className="space-y-4">
      {/* 필터 바 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="직원명, 상세내용 검색..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 유형</option>
              {HISTORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              exportToExcel(sorted.map((h) => ({
                employeeName: h.employeeName,
                type: h.type,
                effectiveDate: h.effectiveDate,
                details: h.details,
                previousValue: h.previousValue || '-',
                newValue: h.newValue || '-',
                registeredBy: h.registeredBy,
              })), [
                { key: 'employeeName', label: '직원명' },
                { key: 'type', label: '인사유형' },
                { key: 'effectiveDate', label: '발령일' },
                { key: 'details', label: '상세내용' },
                { key: 'previousValue', label: '이전 값' },
                { key: 'newValue', label: '변경 값' },
                { key: 'registeredBy', label: '등록자' },
              ], '인사이력');
            }}><Download size={16} />엑셀</Button>
            {isAdmin && <Button onClick={openCreate}><Plus size={16} />이력 등록</Button>}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">총 <span className="font-semibold text-gray-900">{filtered.length}</span>건</span>
        </div>
        {filtered.length === 0 ? (
          <EmptyState message="인사 이력이 없습니다" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['직원명', '인사유형', '발령일', '상세내용', '등록자', '관리'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((h) => (
                    <tr key={h.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{h.employeeName}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant={historyBadgeVariant(h.type)}>{h.type}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(h.effectiveDate)}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-md truncate">{h.details}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{h.registeredBy}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isAdmin && <button onClick={() => openEdit(h)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="수정">
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editTarget ? '인사 이력 수정' : '인사 이력 등록'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">직원 선택 *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                value={form.employeeId} onChange={(e) => handleEmployeeSelect(e.target.value)}>
                <option value="">직원 선택...</option>
                {employees.filter((e) => e.status !== '퇴사').map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                ))}
              </select>
            </div>
            <Select label="인사유형 *" value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PersonnelHistoryType })}
              options={HISTORY_TYPES.map((t) => ({ value: t, label: t }))} />
            <Input label="발령일 *" type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
            <Input label="등록자" value={form.registeredBy} onChange={(e) => setForm({ ...form, registeredBy: e.target.value })} />
            <Input label="이전 값" value={form.previousValue} onChange={(e) => setForm({ ...form, previousValue: e.target.value })} placeholder="예: 대리" />
            <Input label="변경 값" value={form.newValue} onChange={(e) => setForm({ ...form, newValue: e.target.value })} placeholder="예: 과장" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">상세내용 *</label>
            <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })}
              placeholder="인사 변동 내용을 입력하세요..." rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" />
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
