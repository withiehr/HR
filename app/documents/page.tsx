'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Download, FileText, FileCheck, FileStack, Award, FileInput, FileMinus } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { documents as initialDocs } from '@/data/documents';
import { employees, departments } from '@/data/employees';
import { Document, DocumentType } from '@/types';
import { formatDate, formatFileSize, paginate, generateId } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-excel';

const DOC_TYPES: DocumentType[] = ['근로계약서', '연봉계약서', '인사발령문서', '자격증사본', '입사서류', '퇴사서류'];

function docTypeIcon(type: DocumentType) {
  const cls = 'flex-shrink-0';
  switch (type) {
    case '근로계약서': return <FileText size={16} className={`text-blue-500 ${cls}`} />;
    case '연봉계약서': return <FileCheck size={16} className={`text-green-500 ${cls}`} />;
    case '인사발령문서': return <FileStack size={16} className={`text-purple-500 ${cls}`} />;
    case '자격증사본': return <Award size={16} className={`text-amber-500 ${cls}`} />;
    case '입사서류': return <FileInput size={16} className={`text-indigo-500 ${cls}`} />;
    case '퇴사서류': return <FileMinus size={16} className={`text-red-500 ${cls}`} />;
  }
}

function docTypeBadge(type: DocumentType) {
  const map: Record<DocumentType, 'info' | 'success' | 'secondary' | 'warning' | 'default' | 'danger'> = {
    근로계약서: 'info', 연봉계약서: 'success', 인사발령문서: 'secondary',
    자격증사본: 'warning', 입사서류: 'default', 퇴사서류: 'danger',
  };
  return <Badge variant={map[type]}>{type}</Badge>;
}

const PAGE_SIZE = 10;

interface DocForm {
  employeeId: string;
  employeeName: string;
  department: string;
  documentType: DocumentType;
  fileName: string;
  description: string;
}

const emptyForm: DocForm = {
  employeeId: '', employeeName: '', department: '',
  documentType: '근로계약서', fileName: '', description: '',
};

export default function DocumentsPage() {
  const [data, setData] = useState<Document[]>(initialDocs);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<DocForm>(emptyForm);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchSearch = !search || d.employeeName.includes(search) || d.fileName.includes(search);
      const matchDept = !deptFilter || d.department === deptFilter;
      const matchType = !typeFilter || d.documentType === typeFilter;
      return matchSearch && matchDept && matchType;
    });
  }, [data, search, deptFilter, typeFilter]);

  const sorted = [...filtered].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  const { data: pageData, totalPages } = paginate(sorted, page, PAGE_SIZE);

  // 카테고리별 집계
  const catSummary = DOC_TYPES.map((type) => ({
    type,
    count: data.filter((d) => d.documentType === type).length,
  }));

  function handleEmployeeSelect(empId: string) {
    const emp = employees.find((e) => e.id === empId);
    if (emp) setForm((prev) => ({ ...prev, employeeId: emp.id, employeeName: emp.name, department: emp.department }));
  }

  function handleSubmit() {
    if (!form.employeeName || !form.fileName) {
      alert('직원명과 파일명은 필수입니다.');
      return;
    }
    const newDoc: Document = {
      ...form,
      id: generateId('doc'),
      fileSize: Math.floor(Math.random() * 2000000) + 100000,
      uploadedBy: '이서연',
      uploadedAt: new Date().toISOString(),
      description: form.description || undefined,
    };
    setData((prev) => [...prev, newDoc]);
    setIsModalOpen(false);
  }

  return (
    <div className="space-y-4">
      {/* 카테고리 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {catSummary.map(({ type, count }) => (
          <button key={type}
            onClick={() => setTypeFilter((prev) => (prev === type ? '' : type))}
            className={`bg-white rounded-xl border p-3 text-left transition-all ${typeFilter === type ? 'border-blue-500 ring-1 ring-blue-400' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="flex items-center gap-2 mb-1">
              {docTypeIcon(type)}
              <span className="text-lg font-bold text-gray-900">{count}</span>
            </div>
            <p className="text-xs text-gray-500 leading-tight">{type}</p>
          </button>
        ))}
      </div>

      {/* 필터 바 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="직원명, 파일명 검색..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 부서</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 유형</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              exportToExcel(sorted.map((d) => ({
                employeeName: d.employeeName,
                department: d.department,
                documentType: d.documentType,
                fileName: d.fileName,
                fileSize: formatFileSize(d.fileSize),
                uploadedBy: d.uploadedBy,
                uploadedAt: formatDate(d.uploadedAt),
              })), [
                { key: 'employeeName', label: '직원명' },
                { key: 'department', label: '부서' },
                { key: 'documentType', label: '문서유형' },
                { key: 'fileName', label: '파일명' },
                { key: 'fileSize', label: '파일크기' },
                { key: 'uploadedBy', label: '업로드자' },
                { key: 'uploadedAt', label: '업로드일' },
              ], '문서관리');
            }}><Download size={16} />엑셀</Button>
            <Button onClick={() => { setForm(emptyForm); setIsModalOpen(true); }}><Plus size={16} />문서 등록</Button>
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
                    {['직원명', '문서유형', '파일명', '파일크기', '업로드자', '업로드일', '관리'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((doc) => (
                    <tr key={doc.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{doc.employeeName}</p>
                          <p className="text-xs text-gray-400">{doc.department}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{docTypeBadge(doc.documentType)}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs">
                        <div className="flex items-center gap-2">
                          {docTypeIcon(doc.documentType)}
                          <span className="truncate">{doc.fileName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{doc.uploadedBy}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(doc.uploadedAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="다운로드">
                          <Download size={14} />
                        </button>
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

      {/* 등록 모달 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="문서 등록" size="lg">
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
            <Select label="문서 유형" value={form.documentType}
              onChange={(e) => setForm({ ...form, documentType: e.target.value as DocumentType })}
              options={DOC_TYPES.map((t) => ({ value: t, label: t }))} />
          </div>
          <Input label="파일명 *" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} placeholder="예: 김민수_근로계약서_2025.pdf" />
          <Input label="설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="문서에 대한 간단한 설명" />
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 text-center">
            <p className="text-sm text-gray-500">파일 첨부 기능은 Supabase Storage 연동 시 활성화됩니다</p>
            <p className="text-xs text-gray-400 mt-1">현재는 파일명만 등록됩니다</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>취소</Button>
          <Button onClick={handleSubmit}>등록</Button>
        </div>
      </Modal>
    </div>
  );
}
