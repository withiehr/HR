'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Pencil, AlertCircle, Download } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { certifications as initialData } from '@/data/certifications';
import { employees, departments } from '@/data/employees';
import { Certification, CertificationCategory, CertificationStatus } from '@/types';
import { formatDate, paginate, generateId, getDaysUntil } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-excel';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';

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

function mapDbCert(r: any): Certification {
  // employee 정보 찾기
  const emp = employees.find((e) => e.id === r.employee_id);
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: emp?.name || r.employee_name || '',
    department: emp?.department || r.department || '',
    certificationName: r.certification_name,
    category: r.category,
    issuingOrganization: r.issuing_organization || '',
    acquiredDate: r.acquired_date,
    expiryDate: r.expiry_date || undefined,
    status: r.status,
    certificateNumber: r.certificate_number || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at || r.created_at,
  };
}

export default function CertificationsPage() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [data, setData] = useState<Certification[]>(initialData);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [certNameFilter, setCertNameFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Certification | null>(null);
  const [form, setForm] = useState<CertForm>(emptyForm);

  // Supabase에서 자격증 데이터 가져와 합치기
  useEffect(() => {
    async function fetchSupabaseCerts() {
      const { data: dbCerts, error } = await supabase
        .from('certifications')
        .select('*');
      if (!error && dbCerts && dbCerts.length > 0) {
        const mapped = dbCerts.map(mapDbCert);
        // 정적 데이터의 ID와 중복되지 않는 것만 추가
        const staticIds = new Set(initialData.map((c) => c.id));
        const newCerts = mapped.filter((c) => !staticIds.has(c.id));
        setData([...initialData, ...newCerts]);
      }
    }
    fetchSupabaseCerts();
  }, []);

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
    const now = new Date().toISOString();
    const payload = {
      employee_id: form.employeeId,
      certification_name: form.certificationName,
      category: form.category,
      issuing_organization: form.issuingOrganization,
      acquired_date: form.acquiredDate || null,
      expiry_date: form.expiryDate || null,
      status: form.status,
      certificate_number: form.certificateNumber || null,
    };

    if (editTarget) {
      // Supabase에 있는 데이터면 DB도 업데이트
      const { data: dbData } = await supabase
        .from('certifications')
        .update(payload)
        .eq('id', editTarget.id)
        .select()
        .single();

      if (dbData) {
        const updated = mapDbCert(dbData);
        setData((prev) => prev.map((c) => c.id === editTarget.id ? updated : c));
      } else {
        // 정적 데이터 수정 (로컬만)
        setData((prev) =>
          prev.map((c) => c.id === editTarget.id ? {
            ...c, ...form,
            expiryDate: form.expiryDate || undefined,
            certificateNumber: form.certificateNumber || undefined,
            updatedAt: now,
          } : c)
        );
      }
    } else {
      // 새 자격증 등록 → Supabase에 저장
      const { data: dbData, error } = await supabase
        .from('certifications')
        .insert(payload)
        .select()
        .single();

      if (dbData) {
        const newCert = mapDbCert(dbData);
        setData((prev) => [...prev, newCert]);
      } else {
        // DB 저장 실패 시 로컬만 추가
        if (error) console.error('Supabase insert error:', error);
        const newItem: Certification = {
          ...form,
          id: generateId('cert'),
          expiryDate: form.expiryDate || undefined,
          certificateNumber: form.certificateNumber || undefined,
          createdAt: now,
          updatedAt: now,
        };
        setData((prev) => [...prev, newItem]);
      }
    }
    setIsModalOpen(false);
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
                        {isAdmin && <button onClick={() => openEdit(cert)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="수정">
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
