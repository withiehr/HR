'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Pencil, ArrowUpCircle, Download } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { evaluations as initialData } from '@/data/evaluations';
import { employees, departments } from '@/data/employees';
import { personnelHistories } from '@/data/personnel-history';
import { Evaluation, EvaluationGrade, Position } from '@/types';
import { paginate, generateId } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-excel';

const GRADES: EvaluationGrade[] = ['S', 'A', 'B', 'C', 'D'];
const POSITIONS: Position[] = ['Entry B', 'Entry A', 'Junior', 'Senior'];

// 점수 → 등급
function scoreToGrade(score: number): EvaluationGrade {
  if (score >= 9.5) return 'S';
  if (score >= 8.5) return 'A';
  if (score >= 7.5) return 'B';
  if (score >= 6.5) return 'C';
  return 'D';
}

function gradeBadge(grade: EvaluationGrade) {
  const map: Record<EvaluationGrade, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
    S: 'success', A: 'info', B: 'warning', C: 'danger', D: 'default',
  };
  return <Badge variant={map[grade]}>{grade}</Badge>;
}

function scoreColorClass(score: number) {
  if (score >= 9.5) return 'text-emerald-600 font-bold';
  if (score >= 8.5) return 'text-blue-600 font-semibold';
  if (score >= 7.5) return 'text-amber-600 font-medium';
  if (score >= 6.5) return 'text-orange-500';
  return 'text-red-500';
}

// 직급체류기간 계산 (최근 승진일 기준, 없으면 입사일 기준)
function getPositionTenure(employeeId: string): { years: number; startDate: string } {
  const promotions = personnelHistories
    .filter((h) => h.employeeId === employeeId && h.type === '승진')
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  const emp = employees.find((e) => e.id === employeeId);
  const startDate = promotions.length > 0 ? promotions[0].effectiveDate : (emp?.hireDate || '');
  const start = new Date(startDate);
  const now = new Date();
  const years = Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return { years, startDate };
}

// 승진대상자 판별
// Entry B → Entry A: 체류 3년 이상 + 최근 3개년 D 없음
// Entry A → Junior: 체류 2년 이상 + 최근 2개년 D 없음
// Junior → Senior: 체류 6년 이상 + 최근 3개년 A 1개 이상 + C 없음
function getRecentGrades(employeeId: string, recentN: number, allData: Evaluation[]): EvaluationGrade[] {
  return allData
    .filter((e) => e.employeeId === employeeId)
    .sort((a, b) => b.year - a.year)
    .slice(0, recentN)
    .map((e) => e.grade);
}

function getPromotionEligibility(employeeId: string, allData: Evaluation[]): { eligible: boolean; nextPosition: string; reason?: string } | null {
  const emp = employees.find((e) => e.id === employeeId);
  if (!emp || emp.status === '퇴사') return null;

  const { years } = getPositionTenure(employeeId);

  if (emp.position === 'Entry B' && years >= 3) {
    const grades = getRecentGrades(employeeId, 3, allData);
    if (grades.length > 0 && !grades.includes('D')) {
      return { eligible: true, nextPosition: 'Entry A' };
    }
  }
  if (emp.position === 'Entry A' && years >= 2) {
    const grades = getRecentGrades(employeeId, 2, allData);
    if (grades.length > 0 && !grades.includes('D')) {
      return { eligible: true, nextPosition: 'Junior' };
    }
  }
  if (emp.position === 'Junior' && years >= 6) {
    const grades = getRecentGrades(employeeId, 3, allData);
    const hasAorAbove = grades.includes('A') || grades.includes('S');
    const hasCorBelow = grades.includes('C') || grades.includes('D');
    if (grades.length > 0 && hasAorAbove && !hasCorBelow) {
      return { eligible: true, nextPosition: 'Senior' };
    }
  }
  return null;
}

const PAGE_SIZE = 10;

interface EvalForm {
  employeeId: string;
  employeeName: string;
  department: string;
  position: Position;
  year: number;
  score: number;
  evaluatorName: string;
  comment: string;
}

const currentYear = new Date().getFullYear();

const emptyForm: EvalForm = {
  employeeId: '', employeeName: '', department: '', position: 'Entry A',
  year: currentYear, score: 8.0,
  evaluatorName: '', comment: '',
};

export default function EvaluationsPage() {
  const [data, setData] = useState<Evaluation[]>(initialData);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [promoFilter, setPromoFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Evaluation | null>(null);
  const [form, setForm] = useState<EvalForm>(emptyForm);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(data.map((e) => e.year)));
    return years.sort((a, b) => b - a);
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((e) => {
      const matchSearch = !search || e.employeeName.includes(search) || e.department.includes(search) || e.evaluatorName.includes(search);
      const matchDept = !deptFilter || e.department === deptFilter;
      const matchYear = !yearFilter || e.year.toString() === yearFilter;
      const matchGrade = !gradeFilter || e.grade === gradeFilter;
      const matchPromo = !promoFilter || getPromotionEligibility(e.employeeId, data) !== null;
      return matchSearch && matchDept && matchYear && matchGrade && matchPromo;
    });
  }, [data, search, deptFilter, yearFilter, gradeFilter, promoFilter]);

  const sorted = [...filtered].sort((a, b) => b.year - a.year || a.employeeName.localeCompare(b.employeeName));
  const { data: pageData, totalPages } = paginate(sorted, page, PAGE_SIZE);

  // 3개년 평균
  function get3YearAverage(employeeId: string, baseYear: number): { avgScore: number; avgGrade: EvaluationGrade; count: number } | null {
    const threeYearEvals = data.filter(
      (e) => e.employeeId === employeeId && e.year >= baseYear - 2 && e.year <= baseYear
    );
    if (threeYearEvals.length < 2) return null;
    const totalScore = threeYearEvals.reduce((sum, e) => sum + e.score, 0);
    const avgScore = Math.round((totalScore / threeYearEvals.length) * 10) / 10;
    return { avgScore, avgGrade: scoreToGrade(avgScore), count: threeYearEvals.length };
  }

  // 등급별 집계
  const gradeSummary = GRADES.map((g) => ({
    grade: g, count: filtered.filter((e) => e.grade === g).length,
  }));

  // 승진대상자 수
  const promotionCandidates = useMemo(() => {
    const uniqueEmployees = Array.from(new Set(data.map((e) => e.employeeId)));
    return uniqueEmployees.filter((id) => getPromotionEligibility(id, data) !== null).length;
  }, [data]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEdit(ev: Evaluation) {
    setEditTarget(ev);
    setForm({
      employeeId: ev.employeeId,
      employeeName: ev.employeeName,
      department: ev.department,
      position: ev.position,
      year: ev.year,
      score: ev.score,
      evaluatorName: ev.evaluatorName,
      comment: ev.comment || '',
    });
    setIsModalOpen(true);
  }

  function handleEmployeeSelect(empId: string) {
    const emp = employees.find((e) => e.id === empId);
    if (emp) setForm((prev) => ({ ...prev, employeeId: emp.id, employeeName: emp.name, department: emp.department, position: emp.position }));
  }

  function handleScoreChange(value: string) {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const clamped = Math.round(Math.min(10.0, Math.max(6.0, num)) * 10) / 10;
    setForm((prev) => ({ ...prev, score: clamped }));
  }

  function handleSubmit() {
    if (!form.employeeName || !form.evaluatorName) {
      alert('직원명과 평가자는 필수입니다.');
      return;
    }
    const now = new Date().toISOString();
    const grade = scoreToGrade(form.score);
    if (editTarget) {
      setData((prev) => prev.map((e) => e.id === editTarget.id ? {
        ...e, ...form, grade, comment: form.comment || undefined, updatedAt: now,
      } : e));
    } else {
      const newItem: Evaluation = {
        ...form,
        id: generateId('eval'),
        grade,
        comment: form.comment || undefined,
        createdAt: now, updatedAt: now,
      };
      setData((prev) => [...prev, newItem]);
    }
    setIsModalOpen(false);
  }

  return (
    <div className="space-y-4">
      {/* 승진대상자 알림 */}
      {promotionCandidates > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
          <ArrowUpCircle size={18} className="text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            승진 대상자가 <span className="font-semibold">{promotionCandidates}명</span> 있습니다. 승진 검토를 진행해 주세요.
          </p>
        </div>
      )}

      {/* 등급 분포 요약 */}
      <div className="grid grid-cols-5 gap-3">
        {gradeSummary.map(({ grade, count }) => (
          <button key={grade}
            onClick={() => setGradeFilter((prev) => (prev === grade ? '' : grade))}
            className={`bg-white rounded-xl border p-3 text-center transition-all ${gradeFilter === grade ? 'border-blue-500 ring-1 ring-blue-400' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              {gradeBadge(grade)}
              <span className="text-xs text-gray-500">
                {grade === 'S' ? '9.5~10.0' : grade === 'A' ? '8.5~9.4' : grade === 'B' ? '7.5~8.4' : grade === 'C' ? '6.5~7.4' : '6.0~6.4'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 필터 바 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="직원명, 부서, 평가자 검색..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 부서</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 연도</option>
              {availableYears.map((y) => <option key={y} value={y.toString()}>{y}년</option>)}
            </select>
            <select value={gradeFilter} onChange={(e) => { setGradeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500">
              <option value="">전체 등급</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <button onClick={() => { setPromoFilter((prev) => !prev); setPage(1); }}
              className={`px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${promoFilter ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
              <span className="flex items-center gap-1.5"><ArrowUpCircle size={14} />승진대상자</span>
            </button>
            {(search || deptFilter || yearFilter || gradeFilter || promoFilter) && (
              <button onClick={() => { setSearch(''); setDeptFilter(''); setYearFilter(''); setGradeFilter(''); setPromoFilter(false); setPage(1); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
                필터 초기화
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              const rows = sorted.map((ev) => {
                const avg = get3YearAverage(ev.employeeId, ev.year);
                const tenure = getPositionTenure(ev.employeeId);
                const promo = getPromotionEligibility(ev.employeeId, data);
                const emp = employees.find((e) => e.id === ev.employeeId);
                return {
                  employeeName: ev.employeeName,
                  department: ev.department,
                  year: ev.year,
                  position: emp?.position || ev.position,
                  tenure: tenure.years + '년',
                  score: ev.score.toFixed(1),
                  grade: ev.grade,
                  avg3Score: avg ? avg.avgScore.toFixed(1) : '-',
                  avg3Grade: avg ? avg.avgGrade : '-',
                  promotion: promo ? promo.nextPosition + ' 대상' : '-',
                  evaluator: ev.evaluatorName,
                };
              });
              exportToExcel(rows, [
                { key: 'employeeName', label: '직원명' },
                { key: 'department', label: '부서' },
                { key: 'year', label: '평가연도' },
                { key: 'position', label: '직급' },
                { key: 'tenure', label: '직급체류기간' },
                { key: 'score', label: '점수' },
                { key: 'grade', label: '등급' },
                { key: 'avg3Score', label: '3개년 평균' },
                { key: 'avg3Grade', label: '3개년 평균등급' },
                { key: 'promotion', label: '승진대상' },
                { key: 'evaluator', label: '평가자' },
              ], '인사평가');
            }}><Download size={16} />엑셀</Button>
            <Button onClick={openCreate}><Plus size={16} />평가 등록</Button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">총 <span className="font-semibold text-gray-900">{filtered.length}</span>건</span>
        </div>
        {filtered.length === 0 ? <EmptyState message="인사평가 기록이 없습니다" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['직원명', '평가연도', '직급', '직급체류기간', '점수', '등급', '3개년 평균', '3개년 평균등급', '승진대상', '평가자', '관리'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((ev) => {
                    const avg = get3YearAverage(ev.employeeId, ev.year);
                    const tenure = getPositionTenure(ev.employeeId);
                    const promo = getPromotionEligibility(ev.employeeId, data);
                    const emp = employees.find((e) => e.id === ev.employeeId);
                    return (
                      <tr key={ev.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-gray-900">{ev.employeeName}</p>
                            <p className="text-xs text-gray-400">{ev.department}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">{ev.year}년</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="secondary">{emp?.position || ev.position}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-gray-700">{tenure.years}년</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={scoreColorClass(ev.score)}>{ev.score.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{gradeBadge(ev.grade)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {avg ? (
                            <>
                              <span className={scoreColorClass(avg.avgScore)}>{avg.avgScore.toFixed(1)}</span>
                              <span className="text-xs text-gray-400 ml-1">({avg.count}개년)</span>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {avg ? gradeBadge(avg.avgGrade) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {promo ? (
                            <Badge variant="info">
                              <ArrowUpCircle size={12} className="mr-0.5" />
                              {promo.nextPosition}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{ev.evaluatorName}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button onClick={() => openEdit(ev)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="수정">
                            <Pencil size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editTarget ? '인사평가 수정' : '인사평가 등록'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">직원 선택 *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                value={form.employeeId} onChange={(e) => handleEmployeeSelect(e.target.value)}>
                <option value="">직원 선택...</option>
                {employees.filter((e) => e.status !== '퇴사').map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.department} · {emp.position})</option>
                ))}
              </select>
            </div>
            <Input label="평가자 *" value={form.evaluatorName} onChange={(e) => setForm({ ...form, evaluatorName: e.target.value })} placeholder="평가자 이름" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">평가 연도</label>
              <input type="number" min={2020} max={2030} value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || currentYear })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">평가 점수 (6.0 ~ 10.0)</label>
              <input type="number" min={6.0} max={10.0} step={0.1} value={form.score}
                onChange={(e) => handleScoreChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">점수:</span>
                <span className={`text-xl ${scoreColorClass(form.score)}`}>{form.score.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">등급:</span>
                {gradeBadge(scoreToGrade(form.score))}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-5 gap-1 text-center text-xs">
                {[
                  { grade: 'S' as const, range: '9.5~10.0', color: 'text-emerald-600' },
                  { grade: 'A' as const, range: '8.5~9.4', color: 'text-blue-600' },
                  { grade: 'B' as const, range: '7.5~8.4', color: 'text-amber-600' },
                  { grade: 'C' as const, range: '6.5~7.4', color: 'text-orange-500' },
                  { grade: 'D' as const, range: '6.0~6.4', color: 'text-red-500' },
                ].map(({ grade, range, color }) => (
                  <div key={grade} className={`py-1.5 rounded ${scoreToGrade(form.score) === grade ? 'bg-blue-100 ring-1 ring-blue-400' : 'bg-white'}`}>
                    <div className={`font-bold ${color}`}>{grade}</div>
                    <div className="text-gray-400">{range}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">종합 의견</label>
            <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={3} placeholder="평가에 대한 종합 의견을 입력하세요..."
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
