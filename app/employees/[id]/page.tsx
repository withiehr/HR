'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Building2, Briefcase, FileText, Award, History, UserMinus } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { employees } from '@/data/employees';
import { personnelHistories } from '@/data/personnel-history';
import { certifications } from '@/data/certifications';
import { documents } from '@/data/documents';
import { resignations } from '@/data/resignations';
import { formatDate, formatFileSize, getDaysUntil } from '@/lib/utils';
import { EmploymentStatus, EmploymentType } from '@/types';

function statusBadgeVariant(status: EmploymentStatus) {
  const map: Record<EmploymentStatus, 'success' | 'warning' | 'danger'> = { 재직: 'success', 휴직: 'warning', 퇴사: 'danger' };
  return map[status];
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employee = employees.find((e) => e.id === params.id);

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 mb-4">직원 정보를 찾을 수 없습니다.</p>
        <Button variant="secondary" onClick={() => router.push('/employees')}>
          <ArrowLeft size={16} /> 목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const empHistories = personnelHistories
    .filter((h) => h.employeeId === employee.id)
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  const empCerts = certifications.filter((c) => c.employeeId === employee.id);
  const empDocs = documents.filter((d) => d.employeeId === employee.id);
  const empResignation = resignations.find((r) => r.employeeId === employee.id);

  const historyBadgeVariant = (type: string) => {
    const map: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'default' | 'secondary'> = {
      입사: 'success', 퇴사: 'danger', 승진: 'info', 휴직: 'warning',
      복직: 'success', 부서이동: 'secondary', 직책변경: 'secondary',
      급여변경: 'info', 포상: 'success', 징계: 'danger',
    };
    return map[type] ?? 'default';
  };

  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/employees')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{employee.name}</h2>
          <p className="text-sm text-gray-500">{employee.employeeNumber} · {employee.department} · {employee.position}</p>
        </div>
        <Badge variant={statusBadgeVariant(employee.status)} className="ml-2">{employee.status}</Badge>
        {employee.isProbation && <Badge variant="warning">수습</Badge>}
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={16} className="text-gray-400" /> 기본 정보
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
          {[
            { label: '사번', value: employee.employeeNumber },
            { label: '이름', value: employee.name },
            { label: '부서', value: employee.department },
            { label: '직급', value: employee.position },
            { label: '직책', value: employee.jobTitle || '-' },
            { label: '고용형태', value: employee.employmentType },
            { label: '입사일', value: formatDate(employee.hireDate) },
            { label: '재직상태', value: employee.status },
            { label: '생년월일', value: formatDate(employee.birthDate) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={14} className="text-gray-400" /> {employee.phone}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail size={14} className="text-gray-400" /> {employee.email}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} className="text-gray-400" /> {employee.address}
          </div>
        </div>
        {employee.isProbation && employee.probationEndDate && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              수습 종료 예정일: <span className="font-semibold">{formatDate(employee.probationEndDate)}</span>
              {' '}(D-{Math.max(0, getDaysUntil(employee.probationEndDate))})
            </p>
          </div>
        )}
      </div>

      {/* 인사 이력 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <History size={16} className="text-gray-400" /> 인사 이력
          <span className="text-xs text-gray-400 font-normal">({empHistories.length}건)</span>
        </h3>
        {empHistories.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">등록된 인사 이력이 없습니다.</p>
        ) : (
          <div className="space-y-0">
            {empHistories.map((h) => (
              <div key={h.id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                <div className="mt-0.5"><Badge variant={historyBadgeVariant(h.type)}>{h.type}</Badge></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{h.details}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.effectiveDate)} · 등록자: {h.registeredBy}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 자격증 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award size={16} className="text-gray-400" /> 자격증 내역
          <span className="text-xs text-gray-400 font-normal">({empCerts.length}건)</span>
        </h3>
        {empCerts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">등록된 자격증이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['자격증명', '자격구분', '발급기관', '취득일', '만료일', '상태'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empCerts.map((c) => (
                  <tr key={c.id} className="border-t border-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{c.certificationName}</td>
                    <td className="px-4 py-2.5 text-gray-600">{c.category}</td>
                    <td className="px-4 py-2.5 text-gray-600">{c.issuingOrganization}</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatDate(c.acquiredDate)}</td>
                    <td className="px-4 py-2.5 text-gray-600">{c.expiryDate ? formatDate(c.expiryDate) : '영구'}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={c.status === '유효' ? 'success' : c.status === '만료예정' ? 'warning' : c.status === '만료' ? 'danger' : 'info'}>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 첨부 문서 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={16} className="text-gray-400" /> 첨부 문서
          <span className="text-xs text-gray-400 font-normal">({empDocs.length}건)</span>
        </h3>
        {empDocs.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">등록된 문서가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['문서유형', '파일명', '파일크기', '업로드자', '업로드일'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empDocs.map((d) => (
                  <tr key={d.id} className="border-t border-gray-50">
                    <td className="px-4 py-2.5"><Badge variant="secondary">{d.documentType}</Badge></td>
                    <td className="px-4 py-2.5 text-gray-800">{d.fileName}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{formatFileSize(d.fileSize)}</td>
                    <td className="px-4 py-2.5 text-gray-600">{d.uploadedBy}</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatDate(d.uploadedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 퇴사 정보 */}
      {employee.status === '퇴사' && empResignation && (
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h3 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2">
            <UserMinus size={16} className="text-red-400" /> 퇴사 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">퇴사일</p>
              <p className="text-sm font-medium text-gray-800">{formatDate(empResignation.resignationDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">퇴사 사유</p>
              <p className="text-sm font-medium text-gray-800">{empResignation.reason}</p>
            </div>
            {empResignation.reasonDetail && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">상세 사유</p>
                <p className="text-sm font-medium text-gray-800">{empResignation.reasonDetail}</p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '인수인계', done: empResignation.handoverCompleted },
              { label: '자산 반납', done: empResignation.assetReturned },
              { label: '계정 회수', done: empResignation.accountDeactivated },
              { label: '퇴직금 정산', done: empResignation.severanceSettled },
            ].map(({ label, done }) => (
              <div key={label} className={`px-3 py-2 rounded-lg text-center text-sm ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {label}: {done ? '완료' : '미완료'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
