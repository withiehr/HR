'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Download, Upload, Eye, X, FileText, FileCheck, FileStack, Award, FileInput, FileMinus } from 'lucide-react';
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
import { useAuth } from '@/components/AuthProvider';
import { exportToExcel } from '@/lib/export-excel';
import { supabase } from '@/lib/supabase';

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
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [data, setData] = useState<Document[]>(initialDocs);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<DocForm>(emptyForm);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const empSearchRef = useRef<HTMLDivElement>(null);

  const filteredEmployees = useMemo(() => {
    if (!empSearch) return employees;
    const q = empSearch.toLowerCase();
    return employees.filter((e) => e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q));
  }, [empSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (empSearchRef.current && !empSearchRef.current.contains(e.target as Node)) {
        setEmpDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 연도 목록 (데이터에서 추출)
  const years = useMemo(() => {
    const yearSet = new Set(data.map((d) => new Date(d.uploadedAt).getFullYear()));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchSearch = !search || d.employeeName.includes(search) || d.fileName.includes(search);
      const matchDept = !deptFilter || d.department === deptFilter;
      const matchType = !typeFilter || d.documentType === typeFilter;
      const matchYear = !yearFilter || new Date(d.uploadedAt).getFullYear().toString() === yearFilter;
      return matchSearch && matchDept && matchType && matchYear;
    });
  }, [data, search, deptFilter, typeFilter, yearFilter]);

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

  // 미리보기
  async function handlePreview(doc: Document) {
    setPreviewDoc(doc);
    setPreviewUrl(null);

    if (!doc.fileUrl) {
      // 파일이 없으면 정보만 표시
      return;
    }

    setPreviewLoading(true);
    try {
      const { data: fileData, error } = await supabase.storage
        .from('documents')
        .download(doc.fileUrl);

      if (error) {
        setPreviewLoading(false);
        return;
      }

      const url = URL.createObjectURL(fileData);
      setPreviewUrl(url);
    } catch {
      // ignore
    }
    setPreviewLoading(false);
  }

  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewDoc(null);
    setPreviewUrl(null);
  }

  function getFileExtension(fileName: string) {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  // 파일 다운로드
  async function handleDownload(doc: Document) {
    if (doc.fileUrl) {
      const { data: fileData, error } = await supabase.storage
        .from('documents')
        .download(doc.fileUrl);

      if (error) {
        alert(`다운로드 실패: ${error.message}`);
        return;
      }

      const url = URL.createObjectURL(fileData);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('해당 문서는 파일이 연결되지 않은 기존 데이터입니다.\n새로 등록한 문서부터 다운로드가 가능합니다.');
    }
  }

  async function handleSubmit() {
    if (!form.employeeName || !form.fileName) {
      alert('직원명과 파일명은 필수입니다.');
      return;
    }

    setUploading(true);
    let fileUrl: string | undefined;
    let fileSize = Math.floor(Math.random() * 2000000) + 100000;

    if (uploadFile) {
      fileSize = uploadFile.size;
      const filePath = `${form.employeeId || 'unknown'}/${Date.now()}_${uploadFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadFile);

      if (uploadError) {
        alert(`파일 업로드 실패: ${uploadError.message}\n파일명만 등록됩니다.`);
      } else {
        fileUrl = filePath;
      }
    }

    const newDoc: Document = {
      ...form,
      id: generateId('doc'),
      fileSize,
      fileUrl,
      uploadedBy: '관리자',
      uploadedAt: new Date().toISOString(),
      description: form.description || undefined,
    };
    setData((prev) => [...prev, newDoc]);
    setIsModalOpen(false);
    setUploadFile(null);
    setUploading(false);
  }

  return (
    <div className="space-y-4">
      {/* 카테고리 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {catSummary.map(({ type, count }) => (
          <button key={type}
            onClick={() => { setTypeFilter((prev) => (prev === type ? '' : type)); setPage(1); }}
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
            <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 연도</option>
              {years.map((y) => <option key={y} value={y.toString()}>{y}년</option>)}
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
            {isAdmin && <Button onClick={() => { setForm(emptyForm); setUploadFile(null); setIsModalOpen(true); }}><Plus size={16} />문서 등록</Button>}
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
                    {['직원명', '문서유형', '파일명', '파일크기', '업로드자', '업로드일', '다운로드'].map((h) => (
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
                        <button
                          onClick={() => handlePreview(doc)}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors text-left"
                        >
                          {docTypeIcon(doc.documentType)}
                          <span className="truncate underline decoration-gray-300 hover:decoration-blue-500">{doc.fileName}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{doc.uploadedBy}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(doc.uploadedAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                          title="다운로드"
                        >
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
            <div className="flex flex-col gap-1.5" ref={empSearchRef}>
              <label className="text-sm font-medium text-gray-700">직원 선택 *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="직원명 또는 부서 검색..."
                  value={form.employeeName ? `${form.employeeName} (${form.department})` : empSearch}
                  onChange={(e) => {
                    setEmpSearch(e.target.value);
                    setEmpDropdownOpen(true);
                    if (form.employeeId) setForm((prev) => ({ ...prev, employeeId: '', employeeName: '', department: '' }));
                  }}
                  onFocus={() => setEmpDropdownOpen(true)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {form.employeeId && (
                  <button type="button" onClick={() => { setForm((prev) => ({ ...prev, employeeId: '', employeeName: '', department: '' })); setEmpSearch(''); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600" title="선택 해제">
                    <X size={14} />
                  </button>
                )}
                {empDropdownOpen && !form.employeeId && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredEmployees.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-400">검색 결과가 없습니다</p>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <button key={emp.id} type="button"
                          onClick={() => { handleEmployeeSelect(emp.id); setEmpSearch(''); setEmpDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors">
                          <span className="font-medium">{emp.name}</span>
                          <span className="text-gray-400 ml-1">({emp.department})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <Select label="문서 유형" value={form.documentType}
              onChange={(e) => setForm({ ...form, documentType: e.target.value as DocumentType })}
              options={DOC_TYPES.map((t) => ({ value: t, label: t }))} />
          </div>
          <Input label="파일명 *" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} placeholder="예: 김민수_근로계약서_2025.pdf" />
          <Input label="설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="문서에 대한 간단한 설명" />

          {/* 파일 업로드 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">파일 첨부</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              {uploadFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  <span className="text-sm text-gray-700 font-medium">{uploadFile.name}</span>
                  <span className="text-xs text-gray-400">({formatFileSize(uploadFile.size)})</span>
                </div>
              ) : (
                <>
                  <Upload size={20} className="mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">클릭하여 파일을 선택하세요</p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX, HWP, XLS, XLSX, JPG, PNG (최대 10MB)</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.hwp,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 10 * 1024 * 1024) {
                    alert('파일 크기는 10MB 이하여야 합니다.');
                    return;
                  }
                  setUploadFile(file);
                  if (!form.fileName) {
                    setForm((prev) => ({ ...prev, fileName: file.name }));
                  }
                }
              }}
              className="hidden"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>취소</Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? '업로드 중...' : '등록'}
          </Button>
        </div>
      </Modal>

      {/* 미리보기 모달 */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closePreview}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col mx-4" onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3 min-w-0">
                {docTypeIcon(previewDoc.documentType)}
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{previewDoc.fileName}</h3>
                  <p className="text-xs text-gray-500">{previewDoc.employeeName} · {previewDoc.department} · {formatDate(previewDoc.uploadedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {previewDoc.fileUrl && (
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="다운로드"
                  >
                    <Download size={18} />
                  </button>
                )}
                <button onClick={closePreview} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 미리보기 본문 */}
            <div className="flex-1 overflow-auto p-6">
              {previewLoading ? (
                <div className="flex items-center justify-center h-64 text-gray-400 text-sm">파일 로딩 중...</div>
              ) : previewUrl ? (
                (() => {
                  const ext = getFileExtension(previewDoc.fileName);
                  if (ext === 'pdf') {
                    return <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg border" title="PDF 미리보기" />;
                  }
                  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                    return <img src={previewUrl} alt={previewDoc.fileName} className="max-w-full max-h-[70vh] mx-auto rounded-lg" />;
                  }
                  return (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <Eye size={40} className="text-gray-300 mb-3" />
                      <p className="text-sm">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
                      <p className="text-xs text-gray-400 mt-1">다운로드하여 확인해주세요.</p>
                      <button
                        onClick={() => handleDownload(previewDoc)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Download size={14} /> 다운로드
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-4">
                  {/* 문서 정보 카드 */}
                  <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">직원명</span>
                        <p className="font-medium text-gray-900">{previewDoc.employeeName}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">부서</span>
                        <p className="font-medium text-gray-900">{previewDoc.department}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">문서유형</span>
                        <p className="font-medium text-gray-900">{previewDoc.documentType}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">파일크기</span>
                        <p className="font-medium text-gray-900">{formatFileSize(previewDoc.fileSize)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">업로드자</span>
                        <p className="font-medium text-gray-900">{previewDoc.uploadedBy}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">업로드일</span>
                        <p className="font-medium text-gray-900">{formatDate(previewDoc.uploadedAt)}</p>
                      </div>
                    </div>
                    {previewDoc.description && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-500">설명</span>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{previewDoc.description}</p>
                      </div>
                    )}
                  </div>

                  {!previewDoc.fileUrl && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <Eye size={40} className="text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">파일이 연결되지 않은 기존 데이터입니다.</p>
                      <p className="text-xs text-gray-400 mt-1">새로 등록한 문서부터 미리보기가 가능합니다.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
