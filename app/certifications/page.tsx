'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, AlertCircle, Download } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase';
import { Certification, CertificationCategory, CertificationStatus } from '@/types';
import { formatDate, paginate, getDaysUntil } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-excel';
import { useAuth } from '@/components/AuthProvider';

interface EmployeeRow {
  id: string;
  employee_number: string;
  name: string;
  department: string;
  position: string;
  status: string;
}

const CATEGORIES: CertificationCategory[] = ['국가기술자격', '국가전문자격', '민간자격', '외국자격'];
const STATUS_OPTIONS: { value: CertificationStatus; label: string }[] = [
  { value: '선임', label: '선임' },
  { value: '비선임', label: '비선임' },
  { value: '유효', label: '유효' },
  { value: '만료예정', label: '만료예정' },
  { value: '만료', label: '만료' },
  { value: '갱신중', label: '갱신중' },
];

function certStatusBadge(status: CertificationStatus) {
  const map: Record<CertificationStatus, 'success' | 'warning' | 'danger' | 'info'> = {
    선임: 'success', 비선임: 'info', 유효: 'success', 만료예정: 'warning', 만료: 'danger', 갱신중: 'info',
  };
  return <Badge variant={map[status]}>{status}</Badge>;
}

const PAGE_SIZE = 10;

interface CertForm {
  employeeId: string;
  employeeName: string;
  department: string;
  certificationName: string;
  category: CertificationCategory;
  issuingOrganization: string;
  acquiredDate: string;
  expiryDate: string;
  status: CertificationStatus;
  certificateNumber: string;
}

const emptyForm: CertForm = {
  employeeId: '', employeeName: '', department: '',
  certificationName: '', category: '국가기술자격', issuingOrganization: '',
  acquiredDate: '', expiryDate: '', status: '유효', certificateNumber: '',
};

function mapDbCert(r: Record<string, unknown>, employeeList: EmployeeRow[]): Certification {
  const emp = employeeList.find((e) => e.id === r.employee_id);
  return {
    id: r.id as string,
    employeeId: r.employee_id as string,
    employeeName: emp?.name || '',
    department: emp?.department || '',
    certificationName: (r.name as string) || '',
    category: (r.category as CertificationCategory) || '국가기술자격',
    issuingOrganization: (r.issuing_organization as string) || '',
    acquiredDate: (r.acquired_date as string) || '',
    expiryDate: (r.expiry_date as string) || undefined,
    status: (r.status as CertificationStatus) || '유효',
    certificateNumber: (r.certificate_number as string) || undefined,
    createdAt: r.created_at as string,
    updatedAt: (r.updated_at as string) || (r.created_at as string),
  };
}

export default function CertificationsPage() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [data, setData] = useState<Certification[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [certNameFilter, setCertNameFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Certification | null>(null);
  const [form, setForm] = useState<CertForm>(emptyForm);

  const fetchEmployees = useCallback(async () => {
    const { data: empRows, error } = await supabase
      .from('employees')
      .select('id, employee_number, name, department, position, status');
    if (error) {
      console.error('Failed to fetch employees:', error);
      return [];
    }
    const rows = (empRows || []) as EmployeeRow[];
    setEmployees(rows);
    const depts = Array.from(new Set(rows.map((e) => e.department).filter(Boolean))).sort();
    setDepartments(depts);
    return rows;
  }, []);

  const fetchCertifications = useCallback(async (employeeList: EmployeeRow[]) => {
    const { data: dbCerts, error } = await supabase
      .from('certifications')
      .select('*');
    if (error) {
      console.error('Failed to fetch certifications:', error);
      return;
    }
    if (dbCerts) {
      const mapped = dbCerts.map((r) => mapDbCert(r as Record<string, unknown>, employeeList));
      setData(mapped);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const empList = await fetchEmployees();
      await fetchCertifications(empList);
    }
    init();
  }, [fetchEmployees, fetchCertifications]);

  // 자격증명 목록 (중복 제거)
  const certNames = useMemo(() => Array.from(new Set(data.map((c) => c.certificationName))).sort(), [data]);

  const filtered = useMemo(() => {
    return data.filter((c) => {
      const matchSearch = !search || c.certificationName.includes(search) || c.employeeName.includes(search) || c.issuingOrganization.includes(search);
      const matchDept = !deptFilter || c.department === deptFilter;
      const matchStatus = !statusFilter || c.status === statusFilter;
      const matchCertName = !certNameFilter || c.certificationName === certNameFilter;
      return matchSearch && matchDept && matchStatus && matchCertName;
    });
  }, [data, search, deptFilter, statusFilter, certNameFilter]);

  const { data: pageData, totalPages } = paginate(filtered, page, PAGE_SIZE);
  const expiringCount = data.filter((c) => c.status === '만료예정').length;

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEdit(c: Certification) {
    setEditTarget(c);
    setForm({
      employeeId: c.employeeId,
      employeeName: c.employeeName,
      department: c.department,
      certificationName: c.certificationName,
      category: c.category,
      issuingOrganization: c.issuingOrganization,
      acquiredDate: c.acquiredDate,
      expiryDate: c.expiryDate || '',
      status: c.status,
      certificateNumber: c.certificateNumber || '',
    });
    setIsModalOpen(true);
  }

  function handleEmployeeSelect(empId: string) {
    const emp = employees.find((e) => e.id === empId);
    if (emp) setForm((prev) => ({ ...prev, employeeId: emp.id, employeeName: emp.name, department: emp.department }));
  }

  async function handleSubmit() {
    if (!form.certificationName || !form.employeeName) {
      alert('자격증명과 직원명은 필수입니다.');
      return;
    }
    const payload = {
      employee_id: form.employeeId,
      name: form.certificationName,
      category: form.category,
      issuing_organization: form.issuingOrganization,
      acquired_date: form.acquiredDate || null,
      expiry_date: form.expiryDate || null,
      status: form.status,
      certificate_number: form.certificateNumber || null,
    };

    if (editTarget) {
      const { data: dbData, error } = await supabase
        .from('certifications')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editTarget.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        alert('수정에 실패했습니다.');
        return;
      }
      if (dbData) {
        const updated = mapDbCert(dbData as Record<string, unknown>, employees);
        setData((prev) => prev.map((c) => c.id === editTarget.id ? updated : c));
      }
    } else {
      const { data: dbData, error } = await supabase
        .from('certifications')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        alert('등록에 실패했습니다.');
        return;
      }
      if (dbData) {
        const newCert = mapDbCert(dbData as Record<string, unknown>, employees);
        setData((prev) => [...prev, newCert]);
      }
    }
    setIsModalOpen(false);
  }

  async function handleDelete(certId: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase
      .from('certifications')
      .delete()
      .eq('id', certId);
    if (error) {
      console.error('Supabase delete error:', error);
      alert('삭제에 실패했습니다.');
      return;
    }
    setData((prev) => prev.filter((c) => c.id !== certId));
  }

  return (
    <div className="space-y-4">
      {expiringCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            만료 예정인 자격증이 <span className="font-semibold">{expiringCount}건</span> 있습니다. 갱신 여부를 확인해 주세요.
          </p>
        </div>
      )}

      {/* 필터 바 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="자격증명, 직원명, 발급기관 검색..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 부서</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={certNameFilter} onChange={(e) => { setCertNameFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 자격증</option>
              {certNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 상태</option>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              const rows = filtered.map((c) => ({
                employeeName: c.employeeName,
                department: c.department,
                certificationName: c.certificationName,
                category: c.category,
                issuingOrganization: c.issuingOrganization,
                acquiredDate: c.acquiredDate,
                expiryDate: c.expiryDate || '영구',
                status: c.status,
                certificateNumber: c.certificateNumber || '-',
              }));
              exportToExcel(rows, [
                { key: 'employeeName', label: '직원명' },
                { key: 'department', label: '부서' },
                { key: 'certificationName', label: '자격증명' },
                { key: 'category', label: '자격구분' },
                { key: 'issuingOrganization', label: '발급기관' },
                { key: 'acquiredDate', label: '취득일' },
                { key: 'expiryDate', label: '만료일' },
                { key: 'status', label: '상태' },
                { key: 'certificateNumber', label: '자격증번호' },
              ], '자격증관리');
            }}><Download size={16} />엑셀</Button>
            {isAdmin && <Button onClick={openCreate}><Plus size={16} />자격증 등록</Button>}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">총 <span className="font-semibold text-gray-900">{filtered.length}</span>건</span>
        </div>
        {filtered.length === 0 ? <EmptyState /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['직원명', '자격증명', '자격구분', '발급기관', '취득일', '만료일', '상태', '관리'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((cert) => (
                    <tr key={cert.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{cert.employeeName}</p>
                          <p className="text-xs text-gray-400">{cert.department}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{cert.certificationName}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant="secondary">{cert.category}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{cert.issuingOrganization}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(cert.acquiredDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {cert.expiryDate ? (
                          <div>
                            <span className="text-gray-600">{formatDate(cert.expiryDate)}</span>
                            {cert.status === '만료예정' && (
                              <Badge variant="danger" className="ml-1.5">D-{getDaysUntil(cert.expiryDate)}</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">영구</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{certStatusBadge(cert.status)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isAdmin && (
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(cert)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="수정">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(cert.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="삭제">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editTarget ? '자격증 수정' : '자격증 등록'} size="lg">
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
          <Input label="자격증명 *" value={form.certificationName} onChange={(e) => setForm({ ...form, certificationName: e.target.value })} placeholder="예: 전기기사" />
          <Select label="자격구분" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as CertificationCategory })}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <Input label="발급기관" value={form.issuingOrganization} onChange={(e) => setForm({ ...form, issuingOrganization: e.target.value })} placeholder="예: 한국산업인력공단" />
          <Input label="취득일" type="date" value={form.acquiredDate} onChange={(e) => setForm({ ...form, acquiredDate: e.target.value })} />
          <Input label="만료일 (영구 자격은 빈칸)" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          <Input label="자격증 번호" value={form.certificateNumber} onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} placeholder="예: EE-2020-12345" />
          <Select label="상태" value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as CertificationStatus })}
            options={STATUS_OPTIONS} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>취소</Button>
          <Button onClick={handleSubmit}>{editTarget ? '수정 완료' : '등록'}</Button>
        </div>
      </Modal>
    </div>
  );
}
