'use client';

import { useEffect, useState, useRef } from 'react';
import { CalendarDays, Search, Download, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { rowToEmployee } from '@/lib/supabase-utils';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { Employee } from '@/types';
import Link from 'next/link';

interface LeaveRecord {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

function mapLeaveRecord(r: any): LeaveRecord {
  return {
    id: r.id,
    employeeId: r.employee_id,
    leaveType: r.leave_type,
    startDate: r.start_date,
    endDate: r.end_date,
    days: Number(r.days),
    status: r.status,
  };
}

function calcAnnualLeave(hireDate: string): number {
  const hire = new Date(hireDate);
  const today = new Date();
  const diffMs = today.getTime() - hire.getTime();
  if (diffMs < 0) return 0;

  let years = today.getFullYear() - hire.getFullYear();
  const anniv = new Date(hire);
  anniv.setFullYear(today.getFullYear());
  if (today < anniv) years--;

  if (years < 1) {
    let months = (today.getFullYear() - hire.getFullYear()) * 12 + (today.getMonth() - hire.getMonth());
    if (today.getDate() < hire.getDate()) months--;
    return Math.min(Math.max(months, 0), 11);
  }

  const extra = Math.floor((years - 1) / 2);
  return Math.min(15 + extra, 25);
}

function getYearsWorked(hireDate: string): number {
  const hire = new Date(hireDate);
  const today = new Date();
  let years = today.getFullYear() - hire.getFullYear();
  const anniv = new Date(hire);
  anniv.setFullYear(today.getFullYear());
  if (today < anniv) years--;
  return Math.max(years, 0);
}

interface EmployeeLeaveInfo {
  employee: Employee;
  entitled: number;
  used: number;
  remain: number;
  yearsWorked: number;
}

// 엑셀 부재 항목 → leave_type 매핑
const ABSENCE_TYPE_MAP: Record<string, string> = {
  '연차': '연차',
  '하계휴가': '하계휴가',
  '특별휴가': '특별휴가',
  '병가': '병가',
  '경조휴가': '경조휴가',
  '공가': '공가',
};

function parseExcelPeriod(period: string): { date: string; halfDay: string | null } {
  // "2026.03.09(오후 / 14:00 ~ 18:00)" → date: "2026-03-09", halfDay: "오후"
  // "2026.03.09(종일 / 00:00 ~ 23:59)" → date: "2026-03-09", halfDay: null
  const dateMatch = period.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
  if (!dateMatch) return { date: '', halfDay: null };
  const date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;

  let halfDay: string | null = null;
  if (period.includes('오전')) halfDay = '오전';
  else if (period.includes('오후')) halfDay = '오후';

  return { date, halfDay };
}

interface UploadResult {
  total: number;
  inserted: number;
  skipped: number;
  errors: string[];
}

export default function LeavesPage() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmployeeLeaveInfo[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('전체');
  const [sortKey, setSortKey] = useState<'name' | 'remain' | 'used' | 'rate'>('name');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
      setLoading(true);
      const [empRes, leaveRes] = await Promise.all([
        supabase.from('employees').select('*').neq('status', '퇴사').order('name'),
        supabase.from('leave_records').select('*').eq('status', '승인'),
      ]);

      const employees: Employee[] = (empRes.data || []).map(rowToEmployee);
      const leaves: LeaveRecord[] = (leaveRes.data || []).map(mapLeaveRecord);

      const currentYear = new Date().getFullYear();

      const result: EmployeeLeaveInfo[] = employees.map((emp) => {
        const entitled = calcAnnualLeave(emp.hireDate);
        const used = leaves
          .filter(
            (l) =>
              l.employeeId === emp.id &&
              (l.leaveType === '연차' || l.leaveType.startsWith('반차')) &&
              new Date(l.startDate).getFullYear() === currentYear
          )
          .reduce((sum, l) => sum + l.days, 0);

        return {
          employee: emp,
          entitled,
          used,
          remain: entitled - used,
          yearsWorked: getYearsWorked(emp.hireDate),
        };
      });

      setData(result);
      setLoading(false);
    };

  useEffect(() => {
    fetchData();
  }, []);

  const departments = ['전체', ...Array.from(new Set(data.map((d) => d.employee.department)))];

  const filtered = data
    .filter((d) => deptFilter === '전체' || d.employee.department === deptFilter)
    .filter(
      (d) =>
        d.employee.name.includes(search) ||
        d.employee.employeeNumber.includes(search) ||
        d.employee.department.includes(search)
    )
    .sort((a, b) => {
      if (sortKey === 'name') return a.employee.name.localeCompare(b.employee.name);
      if (sortKey === 'remain') return a.remain - b.remain;
      if (sortKey === 'used') return b.used - a.used;
      if (sortKey === 'rate') return (b.entitled > 0 ? b.used / b.entitled : 0) - (a.entitled > 0 ? a.used / a.entitled : 0);
      return 0;
    });

  // 전체 통계
  const totalEntitled = filtered.reduce((s, d) => s + d.entitled, 0);
  const totalUsed = filtered.reduce((s, d) => s + d.used, 0);
  const totalRemain = filtered.reduce((s, d) => s + d.remain, 0);
  const avgRate = totalEntitled > 0 ? Math.round((totalUsed / totalEntitled) * 100) : 0;

  const handleExportCSV = () => {
    const header = '사번,이름,부서,직급,입사일,근속연수,발생연차,사용연차,잔여연차,사용률';
    const rows = filtered.map((d) =>
      [
        d.employee.employeeNumber,
        d.employee.name,
        d.employee.department,
        d.employee.position,
        d.employee.hireDate,
        d.yearsWorked,
        d.entitled,
        d.used,
        d.remain,
        d.entitled > 0 ? Math.round((d.used / d.entitled) * 100) + '%' : '0%',
      ].join(',')
    );
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `연차현황_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (rows.length < 2) {
        setUploadResult({ total: 0, inserted: 0, skipped: 0, errors: ['데이터가 없습니다.'] });
        setUploading(false);
        return;
      }

      // 헤더 확인
      const header = rows[0] as string[];
      const nameIdx = header.indexOf('이름');
      const typeIdx = header.indexOf('부재 항목');
      const daysIdx = header.indexOf('일수');
      const periodIdx = header.indexOf('기간');

      if (nameIdx === -1 || typeIdx === -1 || daysIdx === -1 || periodIdx === -1) {
        setUploadResult({ total: 0, inserted: 0, skipped: 0, errors: ['엑셀 형식이 올바르지 않습니다. 필요 컬럼: 이름, 부재 항목, 일수, 기간'] });
        setUploading(false);
        return;
      }

      // 전체 직원 조회 (이름으로 매칭)
      const { data: allEmployees } = await supabase.from('employees').select('id, name');
      const empMap = new Map<string, string>();
      (allEmployees || []).forEach((emp: any) => {
        empMap.set(emp.name, emp.id);
      });

      const result: UploadResult = { total: rows.length - 1, inserted: 0, skipped: 0, errors: [] };
      const insertRows: any[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as any[];
        if (!row || row.length === 0) { result.skipped++; continue; }

        const name = String(row[nameIdx] || '').trim();
        const absenceType = String(row[typeIdx] || '').trim();
        const days = Number(row[daysIdx] || 0);
        const period = String(row[periodIdx] || '');

        // 직원 매칭
        const employeeId = empMap.get(name);
        if (!employeeId) {
          result.errors.push(`${i + 1}행: "${name}" 직원을 찾을 수 없습니다.`);
          result.skipped++;
          continue;
        }

        // 부재 항목 매핑
        let leaveType = ABSENCE_TYPE_MAP[absenceType];
        if (!leaveType) {
          result.errors.push(`${i + 1}행: "${absenceType}" 항목은 연차 유형이 아닙니다. (건너뜀)`);
          result.skipped++;
          continue;
        }

        // 기간 파싱
        const { date, halfDay } = parseExcelPeriod(period);
        if (!date) {
          result.errors.push(`${i + 1}행: 기간 형식을 파싱할 수 없습니다.`);
          result.skipped++;
          continue;
        }

        // 반차 판별 (연차 + 0.5일 + 오전/오후)
        if (leaveType === '연차' && days === 0.5 && halfDay) {
          leaveType = `반차(${halfDay})`;
        }

        insertRows.push({
          employee_id: employeeId,
          leave_type: leaveType,
          start_date: date,
          end_date: date,
          days: days,
          status: '승인',
          reason: '엑셀 업로드',
        });
      }

      // 배치 삽입
      if (insertRows.length > 0) {
        const { error } = await supabase.from('leave_records').insert(insertRows);
        if (error) {
          result.errors.push(`DB 저장 오류: ${error.message}`);
        } else {
          result.inserted = insertRows.length;
        }
      }

      setUploadResult(result);
      if (result.inserted > 0) {
        await fetchData();
      }
    } catch (err: any) {
      setUploadResult({ total: 0, inserted: 0, skipped: 0, errors: [`파일 처리 오류: ${err.message}`] });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">대상 인원</p>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}<span className="text-sm font-normal ml-0.5">명</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-xs text-blue-600 font-medium mb-1">총 발생 연차</p>
          <p className="text-2xl font-bold text-blue-700">{totalEntitled}<span className="text-sm font-normal ml-0.5">일</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-xs text-orange-600 font-medium mb-1">총 사용 연차</p>
          <p className="text-2xl font-bold text-orange-700">{totalUsed}<span className="text-sm font-normal ml-0.5">일</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-xs text-emerald-600 font-medium mb-1">평균 사용률</p>
          <p className="text-2xl font-bold text-emerald-700">{avgRate}<span className="text-sm font-normal ml-0.5">%</span></p>
        </div>
      </div>

      {/* 필터 & 검색 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 사번, 부서 검색..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">이름순</option>
            <option value="remain">잔여연차 적은순</option>
            <option value="used">사용연차 많은순</option>
            <option value="rate">사용률 높은순</option>
          </select>
          {isAdmin && <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              <Upload size={14} /> {uploading ? '업로드 중...' : '엑셀 업로드'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
          </>}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download size={14} /> CSV 내보내기
          </button>
        </div>
      </div>

      {/* 업로드 결과 */}
      {uploadResult && (
        <div className={`rounded-xl border p-4 ${uploadResult.errors.length > 0 && uploadResult.inserted === 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {uploadResult.inserted > 0 ? (
                <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  엑셀 업로드 완료 — 총 {uploadResult.total}건 중 {uploadResult.inserted}건 등록, {uploadResult.skipped}건 건너뜀
                </p>
                {uploadResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {uploadResult.errors.slice(0, 10).map((err, i) => (
                      <li key={i} className="text-xs text-gray-600">• {err}</li>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <li className="text-xs text-gray-500">... 외 {uploadResult.errors.length - 10}건</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <button onClick={() => setUploadResult(null)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 연차 현황 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <CalendarDays size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            {new Date().getFullYear()}년 연차 현황
          </h3>
          <span className="text-xs text-gray-400">({filtered.length}명)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['사번', '이름', '부서', '직급', '입사일', '근속', '발생연차', '사용연차', '잔여연차', '사용률', '상태'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const rate = d.entitled > 0 ? Math.round((d.used / d.entitled) * 100) : 0;
                let statusLabel: string;
                let statusVariant: 'success' | 'info' | 'warning' | 'danger';
                if (d.remain <= 0) {
                  statusLabel = '소진';
                  statusVariant = 'danger';
                } else if (rate >= 80) {
                  statusLabel = '거의 소진';
                  statusVariant = 'warning';
                } else if (rate >= 50) {
                  statusLabel = '적정 사용';
                  statusVariant = 'info';
                } else {
                  statusLabel = '여유';
                  statusVariant = 'success';
                }

                return (
                  <tr key={d.employee.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.employee.employeeNumber}</td>
                    <td className="px-4 py-3">
                      <Link href={`/employees/${d.employee.id}`} className="font-medium text-blue-600 hover:underline">
                        {d.employee.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.employee.department}</td>
                    <td className="px-4 py-3 text-gray-600">{d.employee.position}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(d.employee.hireDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{d.yearsWorked < 1 ? '1년 미만' : `${d.yearsWorked}년`}</td>
                    <td className="px-4 py-3 font-medium text-blue-700">{d.entitled}일</td>
                    <td className="px-4 py-3 font-medium text-orange-700">{d.used}일</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">{d.remain}일</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${rate > 80 ? 'bg-red-500' : rate > 50 ? 'bg-orange-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(rate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">검색 결과가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
