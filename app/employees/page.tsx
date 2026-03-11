'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Pencil, Eye, Download } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { departments } from '@/data/employees';
import { Employee, EmploymentStatus, EmploymentType, Position } from '@/types';
import { formatDate, paginate } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { exportToExcel } from '@/lib/export-excel';
import { supabase } from '@/lib/supabase';
import { rowToEmployee } from '@/lib/supabase-utils';

const STATUS_OPTIONS = [
  { value: '재직', label: '재직' },
  { value: '휴직', label: '휴직' },
  { value: '퇴사', label: '퇴사' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: '정규직', label: '정규직' },
  { value: '계약직', label: '계약직' },
  { value: '인턴', label: '인턴' },
  { value: '파견직', label: '파견직' },
  { value: '일용직', label: '일용직' },
];

const POSITION_OPTIONS = [
  'Entry B', 'Entry A', 'Junior', 'Senior',
].map((p) => ({ value: p, label: p }));

function getServiceYears(hireDate: string): number {
  const hireYear = new Date(hireDate).getFullYear();
  const currentYear = new Date().getFullYear();
  return currentYear - hireYear;
}

function getYearsSincePromotion(promotionDate: string): number {
  const promoYear = new Date(promotionDate).getFullYear();
  const currentYear = new Date().getFullYear();
  return currentYear - promoYear;
}

function statusBadgeVariant(status: EmploymentStatus) {
  const map: Record<EmploymentStatus, 'success' | 'warning' | 'danger'> = { 재직: 'success', 휴직: 'warning', 퇴사: 'danger' };
  return map[status];
}

function employmentTypeBadgeVariant(type: EmploymentType) {
  const map: Record<EmploymentType, 'info' | 'warning' | 'secondary' | 'default' | 'danger'> = {
    정규직: 'info', 계약직: 'warning', 인턴: 'secondary', 파견직: 'default', 일용직: 'danger',
  };
  return map[type];
}

const PAGE_SIZE = 10;

interface EmployeeForm {
  employeeNumber: string;
  name: string;
  department: string;
  position: Position;
  jobTitle: string;
  employmentType: EmploymentType;
  hireDate: string;
  status: EmploymentStatus;
  phone: string;
  email: string;
  birthDate: string;
  address: string;
  isProbation: boolean;
  probationEndDate: string;
}

const emptyForm: EmployeeForm = {
  employeeNumber: '',
  name: '',
  department: departments[0],
  position: 'Entry A',
  jobTitle: '',
  employmentType: '정규직',
  hireDate: '',
  status: '재직',
  phone: '',
  email: '',
  birthDate: '',
  address: '',
  isProbation: false,
  probationEndDate: '',
};

export default function EmployeesPage() {
  const router = useRouter();
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotionDates, setPromotionDates] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('employees')
      .select('*')
      .order('employee_number', { ascending: true });
    if (!error && rows) {
      setData(rows.map(rowToEmployee));
    }
    setLoading(false);
  }, []);

  const fetchPromotionDates = useCallback(async () => {
    const { data: rows } = await supabase
      .from('personnel_histories')
      .select('employee_id, effective_date')
      .eq('type', '승진')
      .order('effective_date', { ascending: false });
    if (rows) {
      const map: Record<string, string> = {};
      rows.forEach((r: { employee_id: string; effective_date: string }) => {
        if (!map[r.employee_id]) map[r.employee_id] = r.effective_date;
      });
      setPromotionDates(map);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchPromotionDates();
  }, [fetchEmployees, fetchPromotionDates]);

  const filtered = useMemo(() => {
    return data.filter((e) => {
      const matchSearch = !search || e.name.includes(search) || e.employeeNumber.includes(search) || e.department.includes(search) || e.phone.includes(search);
      const matchDept = !deptFilter || e.department === deptFilter;
      const matchStatus = !statusFilter || e.status === statusFilter;
      const matchType = !typeFilter || e.employmentType === typeFilter;
      return matchSearch && matchDept && matchStatus && matchType;
    });
  }, [data, search, deptFilter, statusFilter, typeFilter]);

  const { data: pageData, totalPages } = paginate(filtered, page, PAGE_SIZE);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditTarget(emp);
    setForm({
      employeeNumber: emp.employeeNumber,
      name: emp.name,
      department: emp.department,
      position: emp.position,
      jobTitle: emp.jobTitle,
      employmentType: emp.employmentType,
      hireDate: emp.hireDate,
      status: emp.status,
      phone: emp.phone,
      email: emp.email,
      birthDate: emp.birthDate,
      address: emp.address,
      isProbation: emp.isProbation,
      probationEndDate: emp.probationEndDate || '',
    });
    setIsModalOpen(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.employeeNumber) {
      alert('사번과 이름은 필수입니다.');
      return;
    }

    const row = {
      employee_number: form.employeeNumber,
      name: form.name,
      department: form.department,
      position: form.position,
      job_title: form.jobTitle,
      employment_type: form.employmentType,
      hire_date: form.hireDate || null,
      status: form.status,
      phone: form.phone,
      email: form.email,
      birth_date: form.birthDate || null,
      address: form.address,
      is_probation: form.isProbation,
      probation_end_date: form.probationEndDate || null,
    };

    if (editTarget) {
      const { error } = await supabase
        .from('employees')
        .update(row)
        .eq('id', editTarget.id);
      if (error) { alert('수정 실패: ' + error.message); return; }
    } else {
      const { error } = await supabase
        .from('employees')
        .insert(row);
      if (error) { alert('등록 실패: ' + error.message); return; }
    }

    setIsModalOpen(false);
    await fetchEmployees();
  }

  return (
    <div className="space-y-4">
      {/* 필터 바 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="이름, 사번, 부서, 연락처 검색..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 부서</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 상태</option>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 고용형태</option>
              {EMPLOYMENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              const rows = filtered.map((emp) => {
                const lastPromo = promotionDates[emp.id];
                return {
                  employeeNumber: emp.employeeNumber,
                  name: emp.name,
                  department: emp.department,
                  position: emp.position,
                  jobTitle: emp.jobTitle || '-',
                  employmentType: emp.employmentType,
                  hireDate: emp.hireDate,
                  serviceYears: emp.status !== '퇴사' ? getServiceYears(emp.hireDate) + '년' : '-',
                  lastPromotion: lastPromo || '-',
                  status: emp.status,
                  phone: emp.phone,
                  email: emp.email,
                };
              });
              exportToExcel(rows, [
                { key: 'employeeNumber', label: '사번' },
                { key: 'name', label: '이름' },
                { key: 'department', label: '부서' },
                { key: 'position', label: '직급' },
                { key: 'jobTitle', label: '직책' },
                { key: 'employmentType', label: '고용형태' },
                { key: 'hireDate', label: '입사일' },
                { key: 'serviceYears', label: '근속년수' },
                { key: 'lastPromotion', label: '현직급 시작' },
                { key: 'status', label: '재직상태' },
                { key: 'phone', label: '연락처' },
                { key: 'email', label: '이메일' },
              ], '직원목록');
            }}><Download size={16} />엑셀</Button>
            {isAdmin && <Button onClick={openCreate}><Plus size={16} />직원 등록</Button>}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">총 <span className="font-semibold text-gray-900">{filtered.length}</span>명</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm">데이터를 불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['사번', '이름', '부서', '직급', '직책', '고용형태', '입사일', '근속년수', '현직급 시작', '재직상태', '연락처', '관리'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((emp) => (
                    <tr key={emp.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">{emp.employeeNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => router.push(`/employees/${emp.id}`)} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {emp.name}
                        </button>
                        {emp.isProbation && <Badge variant="warning" className="ml-1.5">수습</Badge>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{emp.department}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{emp.position}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{emp.jobTitle || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant={employmentTypeBadgeVariant(emp.employmentType)}>{emp.employmentType}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(emp.hireDate)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {emp.status !== '퇴사' ? (
                          <span>{getServiceYears(emp.hireDate)}년</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {(() => {
                          const startDate = promotionDates[emp.id] || emp.hireDate;
                          const years = getYearsSincePromotion(startDate);
                          return (
                            <div>
                              <span>{formatDate(startDate)}</span>
                              <span className="ml-1.5 text-xs text-gray-400">({years}년차)</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant={statusBadgeVariant(emp.status)}>{emp.status}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{emp.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button onClick={() => router.push(`/employees/${emp.id}`)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" title="상세보기"><Eye size={14} /></button>
                          {isAdmin && <button onClick={() => openEdit(emp)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="수정"><Pencil size={14} /></button>}
                        </div>
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

      {/* 등록/수정 모달 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editTarget ? '직원 정보 수정' : '직원 등록'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="사번 *" value={form.employeeNumber} onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })} placeholder="예: 2025-003" />
          <Input label="이름 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="홍길동" />
          <Select label="부서" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} options={departments.map((d) => ({ value: d, label: d }))} />
          <Select label="직급" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value as Position })} options={POSITION_OPTIONS} />
          <Input label="직책" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="예: 팀장, 파트장" />
          <Select label="고용형태" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmploymentType })} options={EMPLOYMENT_TYPE_OPTIONS} />
          <Input label="입사일" type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
          <Select label="재직상태" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EmploymentStatus })} options={STATUS_OPTIONS} />
          <Input label="연락처" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" />
          <Input label="이메일" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@company.com" />
          <Input label="생년월일" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">수습 여부</label>
            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer">
              <input type="checkbox" checked={form.isProbation} onChange={(e) => setForm({ ...form, isProbation: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-700">수습 기간 중</span>
            </label>
          </div>
          {form.isProbation && (
            <Input label="수습 종료일" type="date" value={form.probationEndDate} onChange={(e) => setForm({ ...form, probationEndDate: e.target.value })} />
          )}
          <div className="sm:col-span-2 lg:col-span-3">
            <Input label="주소" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="인천광역시 ..." />
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
