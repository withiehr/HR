'use client';

import { Users, Clock, Award, UserMinus, FileUp, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { employees } from '@/data/employees';
import { personnelHistories } from '@/data/personnel-history';
import { certifications } from '@/data/certifications';
import { documents } from '@/data/documents';
import { formatDate, getDaysUntil } from '@/lib/utils';

export default function DashboardPage() {
  const activeEmployees = employees.filter((e) => e.status === '재직');
  const onLeave = employees.filter((e) => e.status === '휴직');
  const resigned = employees.filter((e) => e.status === '퇴사');
  const probation = employees.filter((e) => e.isProbation);

  // 부서별 인원
  const deptCounts: Record<string, number> = {};
  activeEmployees.forEach((e) => {
    deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
  });

  // 직급별 인원
  const positionCounts: Record<string, number> = {};
  activeEmployees.forEach((e) => {
    positionCounts[e.position] = (positionCounts[e.position] || 0) + 1;
  });

  // 만료 예정 자격증 (6개월 이내)
  const expiringCerts = certifications.filter((c) => {
    if (!c.expiryDate) return false;
    const days = getDaysUntil(c.expiryDate);
    return days > 0 && days <= 180;
  });

  // 최근 인사 변동
  const recentHistory = [...personnelHistories]
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())
    .slice(0, 5);

  // 최근 문서 업로드
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 5);

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
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="총 재직 인원" value={`${activeEmployees.length}명`} icon={Users} color="blue" change={`전체 ${employees.length}명 (휴직 ${onLeave.length}명)`} />
        <StatCard title="수습 중인 직원" value={`${probation.length}명`} icon={Clock} color="amber" change={probation.map((e) => e.name).join(', ') || '없음'} />
        <StatCard title="만료 예정 자격증" value={`${expiringCerts.length}건`} icon={Award} color="red" change="6개월 이내" />
        <StatCard title="퇴사 인원 (누적)" value={`${resigned.length}명`} icon={UserMinus} color="slate" />
      </div>

      {/* 부서별/직급별 인원 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">부서별 인원</h3>
          <div className="space-y-3">
            {Object.entries(deptCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{dept}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / activeEmployees.length) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-10 text-right">{count}명</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">직급별 인원</h3>
          <div className="space-y-3">
            {Object.entries(positionCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([pos, count]) => (
                <div key={pos} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{pos}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(count / activeEmployees.length) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-10 text-right">{count}명</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* 알림 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">자격증 만료 예정</h3>
          </div>
          {expiringCerts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">만료 예정 자격증이 없습니다</p>
          ) : (
            <div className="space-y-0">
              {expiringCerts.map((cert) => {
                const days = getDaysUntil(cert.expiryDate!);
                return (
                  <div key={cert.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{cert.employeeName}</p>
                      <p className="text-xs text-gray-500">{cert.certificationName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={days <= 90 ? 'danger' : 'warning'}>D-{days}</Badge>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(cert.expiryDate!)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">수습 종료 예정</h3>
          </div>
          {probation.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">수습 중인 직원이 없습니다</p>
          ) : (
            <div className="space-y-0">
              {probation.map((emp) => {
                const days = emp.probationEndDate ? getDaysUntil(emp.probationEndDate) : 0;
                return (
                  <div key={emp.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.department} / {emp.position}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={days <= 30 ? 'warning' : 'info'}>D-{Math.max(0, days)}</Badge>
                      <p className="text-xs text-gray-400 mt-0.5">{emp.probationEndDate ? formatDate(emp.probationEndDate) : '-'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 최근 이력 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">최근 인사 변동</h3>
          <div className="space-y-0">
            {recentHistory.map((h) => (
              <div key={h.id} className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <div className="mt-0.5"><Badge variant={historyBadgeVariant(h.type)}>{h.type}</Badge></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{h.employeeName} - {h.details}</p>
                  <p className="text-xs text-gray-400">{formatDate(h.effectiveDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">최근 문서 업로드</h3>
          <div className="space-y-0">
            {recentDocs.map((doc) => (
              <div key={doc.id} className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <div className="mt-0.5"><FileUp size={16} className="text-gray-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{doc.fileName}</p>
                  <p className="text-xs text-gray-400">{doc.employeeName} · {doc.documentType} · {formatDate(doc.uploadedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
