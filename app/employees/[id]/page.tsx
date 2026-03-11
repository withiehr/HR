'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Building2, FileText, Award, History, UserMinus, ClipboardList, Camera, Briefcase, Plus, X, Edit2, Trash2, CalendarDays, Download, Upload, FileDown } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { rowToEmployee } from '@/lib/supabase-utils';
import { formatDate, formatFileSize, getDaysUntil } from '@/lib/utils';
import { Employee, PersonnelHistory, Evaluation, Certification, Resignation, Document as DocType, EmploymentStatus, CertificationCategory, CertificationStatus, DocumentType } from '@/types';

interface CareerHistory {
  id: string;
  employeeId: string;
  companyName: string;
  department: string;
  position: string;
  startDate: string;
  endDate: string;
  relevance: '일치' | '유사' | '다름';
  recognitionRate: number;
  description: string;
  createdAt: string;
}

function mapCareerHistory(r: any): CareerHistory {
  return {
    id: r.id,
    employeeId: r.employee_id,
    companyName: r.company_name,
    department: r.department ?? '',
    position: r.position ?? '',
    startDate: r.start_date,
    endDate: r.end_date,
    relevance: r.relevance,
    recognitionRate: r.recognition_rate,
    description: r.description ?? '',
    createdAt: r.created_at,
  };
}

function calcMonthsBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + (e.getDate() >= s.getDate() ? 0 : -1) + 1;
}

function formatMonthsToYM(months: number): string {
  if (months <= 0) return '0개월';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y > 0 && m > 0) return `${y}년 ${m}개월`;
  if (y > 0) return `${y}년`;
  return `${m}개월`;
}

const relevanceRateMap: Record<string, number> = { '일치': 100, '유사': 80, '다름': 50 };

// ===== 연차 관련 =====
interface LeaveRecord {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  createdAt: string;
}

function mapLeaveRecord(r: any): LeaveRecord {
  return {
    id: r.id,
    employeeId: r.employee_id,
    leaveType: r.leave_type,
    startDate: r.start_date,
    endDate: r.end_date,
    days: Number(r.days),
    reason: r.reason ?? '',
    status: r.status,
    createdAt: r.created_at,
  };
}

const LEAVE_TYPES = ['연차', '반차(오전)', '반차(오후)', '하계휴가', '특별휴가', '병가', '경조휴가', '공가'] as const;

/** 근로기준법 기반 연차 발생일수 계산 */
function calcAnnualLeave(hireDate: string): { entitled: number; yearLabel: string; hireDateObj: Date } {
  const hire = new Date(hireDate);
  const today = new Date();
  const diffMs = today.getTime() - hire.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return { entitled: 0, yearLabel: '입사 전', hireDateObj: hire };

  // 근속 연수 계산
  let years = today.getFullYear() - hire.getFullYear();
  const anniv = new Date(hire);
  anniv.setFullYear(today.getFullYear());
  if (today < anniv) years--;

  if (years < 1) {
    // 1년 미만: 1개월 만근 시 1일씩 (최대 11일)
    let months = (today.getFullYear() - hire.getFullYear()) * 12 + (today.getMonth() - hire.getMonth());
    if (today.getDate() < hire.getDate()) months--;
    const entitled = Math.min(Math.max(months, 0), 11);
    return { entitled, yearLabel: '1년 미만 (월 1일 발생)', hireDateObj: hire };
  }

  // 1년 이상: 15일 + 2년마다 1일 추가 (최대 25일)
  const extra = Math.floor((years - 1) / 2);
  const entitled = Math.min(15 + extra, 25);
  return { entitled, yearLabel: `${years}년차 (근속 ${years}년)`, hireDateObj: hire };
}

// ===== Direct query mappers (no join) =====
function mapHistory(r: any): PersonnelHistory {
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: '',
    type: r.type,
    effectiveDate: r.effective_date,
    details: r.details ?? '',
    previousValue: r.previous_value,
    newValue: r.new_value,
    registeredBy: r.registered_by ?? '',
    createdAt: r.created_at,
  };
}

function mapEvaluation(r: any): Evaluation {
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: '',
    department: '',
    position: '' as any,
    year: r.year,
    score: r.score,
    grade: r.grade,
    evaluatorName: r.evaluator_name ?? '',
    comment: r.comment,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapCertification(r: any): Certification {
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: '',
    department: '',
    certificationName: r.certification_name,
    category: r.category,
    issuingOrganization: r.issuing_organization ?? '',
    acquiredDate: r.acquired_date,
    expiryDate: r.expiry_date,
    status: r.status,
    certificateNumber: r.certificate_number,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapDocument(r: any): DocType {
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: '',
    department: '',
    documentType: r.document_type,
    fileName: r.file_name,
    fileSize: r.file_size ?? 0,
    fileUrl: r.file_url,
    uploadedBy: r.uploaded_by ?? '',
    uploadedAt: r.uploaded_at,
    description: r.description,
  };
}

function mapResignation(r: any): Resignation {
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: '',
    department: '',
    position: '' as any,
    resignationDate: r.resignation_date,
    reason: r.reason ?? '',
    reasonDetail: r.reason_detail,
    handoverCompleted: r.handover_completed ?? false,
    assetReturned: r.asset_returned ?? false,
    accountDeactivated: r.account_deactivated ?? false,
    severanceSettled: r.severance_settled ?? false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function statusBadgeVariant(status: EmploymentStatus) {
  const map: Record<EmploymentStatus, 'success' | 'warning' | 'danger'> = { 재직: 'success', 휴직: 'warning', 퇴사: 'danger' };
  return map[status];
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [empHistories, setEmpHistories] = useState<PersonnelHistory[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [empCerts, setEmpCerts] = useState<Certification[]>([]);
  const [empDocs, setEmpDocs] = useState<DocType[]>([]);
  const [empResignation, setEmpResignation] = useState<Resignation | null>(null);
  const [uploading, setUploading] = useState(false);
  const [careers, setCareers] = useState<CareerHistory[]>([]);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [editingCareer, setEditingCareer] = useState<CareerHistory | null>(null);
  const [careerForm, setCareerForm] = useState({
    companyName: '', department: '', position: '', startDate: '', endDate: '', relevance: '다름' as '일치' | '유사' | '다름', description: '',
  });
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: '연차' as string, startDate: '', endDate: '', days: 1, reason: '',
  });

  // 자격증 수정 모달
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [certForm, setCertForm] = useState({
    certificationName: '', category: '국가기술자격' as CertificationCategory, issuingOrganization: '',
    acquiredDate: '', expiryDate: '', status: '유효' as CertificationStatus, certificateNumber: '',
  });

  // 문서 업로드
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    documentType: '근로계약서' as DocumentType, description: '',
  });
  const [docUploadFile, setDocUploadFile] = useState<File | null>(null);

  useEffect(() => {
    if (!params.id) return;

    async function fetchData() {
      setLoading(true);
      const id = params.id as string;

      // Fetch all data in parallel
      const [empRes, histRes, evalRes, certRes, docRes, resignRes, careerRes, leaveRes] = await Promise.all([
        supabase.from('employees').select('*').eq('id', id).single(),
        supabase.from('personnel_histories').select('*').eq('employee_id', id).order('effective_date', { ascending: false }),
        supabase.from('evaluations').select('*').eq('employee_id', id).order('year', { ascending: false }),
        supabase.from('certifications').select('*').eq('employee_id', id),
        supabase.from('documents').select('*').eq('employee_id', id),
        supabase.from('resignations').select('*').eq('employee_id', id).single(),
        supabase.from('career_histories').select('*').eq('employee_id', id).order('start_date', { ascending: false }),
        supabase.from('leave_records').select('*').eq('employee_id', id).order('start_date', { ascending: false }),
      ]);

      if (empRes.data) setEmployee(rowToEmployee(empRes.data));
      if (histRes.data) setEmpHistories(histRes.data.map(mapHistory));
      if (evalRes.data) setEvaluations(evalRes.data.map(mapEvaluation));
      if (certRes.data) setEmpCerts(certRes.data.map(mapCertification));
      if (docRes.data) setEmpDocs(docRes.data.map(mapDocument));
      if (resignRes.data) setEmpResignation(mapResignation(resignRes.data));
      if (careerRes.data) setCareers(careerRes.data.map(mapCareerHistory));
      if (leaveRes.data) setLeaves(leaveRes.data.map(mapLeaveRecord));

      setLoading(false);
    }

    fetchData();
  }, [params.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${employee.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        alert('사진 업로드 실패: ' + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl + '?t=' + Date.now();

      const { error: updateError } = await supabase
        .from('employees')
        .update({ profile_image: publicUrl })
        .eq('id', employee.id);

      if (updateError) {
        alert('프로필 저장 실패: ' + updateError.message);
      } else {
        setEmployee({ ...employee, profileImage: publicUrl });
      }
    } catch (err: any) {
      alert('사진 업로드 오류: ' + (err?.message || err));
    }
    setUploading(false);
  };

  const handlePdfDownload = async () => {
    if (!employee) return;
    const { default: html2canvas } = await import('html2canvas-pro');
    const { default: jsPDF } = await import('jspdf');

    // PDF 전용 숨겨진 HTML 생성
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;background:#fff;padding:40px;font-family:system-ui,-apple-system,sans-serif;';

    const certRows = empCerts.map(c =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${c.certificationName}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${c.category}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${c.issuingOrganization}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${formatDate(c.acquiredDate)}</td></tr>`
    ).join('');

    const historyRows = empHistories.slice(0, 10).map(h =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${formatDate(h.effectiveDate)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${h.type}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${h.details}</td></tr>`
    ).join('');

    const careerRows = careers.map(c =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${c.companyName}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${c.position}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${formatDate(c.startDate)} ~ ${formatDate(c.endDate)}</td></tr>`
    ).join('');

    container.innerHTML = `
      <div style="text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #1e40af;">
        <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin:0 0 4px;">직원 상세 정보</h1>
        <p style="font-size:12px;color:#94a3b8;margin:0;">출력일: ${new Date().toLocaleDateString('ko-KR')}</p>
      </div>

      <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;">
        ${employee.profileImage
          ? `<img src="${employee.profileImage}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb;" crossorigin="anonymous" />`
          : `<div style="width:80px;height:80px;border-radius:50%;background:#3b82f6;display:flex;align-items:center;justify-content:center;"><span style="font-size:28px;font-weight:700;color:#fff;">${employee.name.charAt(0)}</span></div>`
        }
        <div>
          <h2 style="font-size:20px;font-weight:700;color:#1e293b;margin:0;">${employee.name}</h2>
          <p style="font-size:13px;color:#64748b;margin:4px 0 0;">${employee.employeeNumber} · ${employee.department} · ${employee.position} (${positionYears}년차)</p>
        </div>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 16px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">기본 정보</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;width:80px;">사번</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;width:200px;">${employee.employeeNumber}</td>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;width:80px;">이름</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;">${employee.name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;">부서</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;">${employee.department}</td>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;">직급</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;">${employee.position} (${positionYears}년차 · ${formatDate(positionStartDate)}~)</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;">직책</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;">${employee.jobTitle || '-'}</td>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;">고용형태</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;">${employee.employmentType}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;">입사일</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;">${formatDate(employee.hireDate)}</td>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;">재직상태</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;">${employee.status}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;">생년월일</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;">${formatDate(employee.birthDate)}</td>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;">연락처</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;">${employee.phone || '-'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;">이메일</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;">${employee.email || '-'}</td>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;">주소</td>
            <td style="padding:6px 0;font-size:13px;color:#334155;">${employee.address || '-'}</td>
          </tr>
        </table>
      </div>

      ${empCerts.length > 0 ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">자격증</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="background:#f1f5f9;"><th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#475569;">자격증명</th><th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#475569;">분류</th><th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#475569;">발급기관</th><th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#475569;">취득일</th></tr>
          ${certRows}
        </table>
      </div>` : ''}

      ${careers.length > 0 ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">경력사항</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="background:#f1f5f9;"><th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#475569;">회사명</th><th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#475569;">직위</th><th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#475569;">기간</th></tr>
          ${careerRows}
        </table>
      </div>` : ''}

      ${empHistories.length > 0 ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">인사이력</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="background:#f1f5f9;"><th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#475569;">일자</th><th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#475569;">구분</th><th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:#475569;">내용</th></tr>
          ${historyRows}
        </table>
      </div>` : ''}

      <div style="text-align:center;padding-top:16px;border-top:1px solid #e2e8f0;">
        <p style="font-size:11px;color:#94a3b8;">위드인천에너지(주) 인사관리시스템</p>
      </div>
    `;

    document.body.appendChild(container);

    // 이미지 로딩 대기
    const imgs = container.querySelectorAll('img');
    await Promise.all(Array.from(imgs).map(img => new Promise(resolve => {
      if (img.complete) resolve(true);
      else { img.onload = () => resolve(true); img.onerror = () => resolve(true); }
    })));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let pos = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();
    while (pos < pdfHeight) {
      if (pos > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -pos, pdfWidth, pdfHeight);
      pos += pageHeight;
    }

    pdf.save(`${employee.name}_직원상세.pdf`);
  };

  const openCareerModal = (career?: CareerHistory) => {
    if (career) {
      setEditingCareer(career);
      setCareerForm({
        companyName: career.companyName,
        department: career.department,
        position: career.position,
        startDate: career.startDate,
        endDate: career.endDate,
        relevance: career.relevance,
        description: career.description,
      });
    } else {
      setEditingCareer(null);
      setCareerForm({ companyName: '', department: '', position: '', startDate: '', endDate: '', relevance: '다름', description: '' });
    }
    setShowCareerModal(true);
  };

  const handleCareerSubmit = async () => {
    if (!employee || !careerForm.companyName || !careerForm.startDate || !careerForm.endDate) return;
    const rate = relevanceRateMap[careerForm.relevance];
    const payload = {
      employee_id: employee.id,
      company_name: careerForm.companyName,
      department: careerForm.department,
      position: careerForm.position,
      start_date: careerForm.startDate,
      end_date: careerForm.endDate,
      relevance: careerForm.relevance,
      recognition_rate: rate,
      description: careerForm.description,
    };

    if (editingCareer) {
      const { data } = await supabase.from('career_histories').update(payload).eq('id', editingCareer.id).select().single();
      if (data) setCareers(careers.map((c) => (c.id === editingCareer.id ? mapCareerHistory(data) : c)));
    } else {
      const { data } = await supabase.from('career_histories').insert(payload).select().single();
      if (data) setCareers([mapCareerHistory(data), ...careers]);
    }
    setShowCareerModal(false);
  };

  const handleCareerDelete = async (id: string) => {
    if (!confirm('이 경력사항을 삭제하시겠습니까?')) return;
    await supabase.from('career_histories').delete().eq('id', id);
    setCareers(careers.filter((c) => c.id !== id));
  };

  // 총 인정경력 계산
  const totalRecognizedMonths = careers.reduce((sum, c) => {
    const months = calcMonthsBetween(c.startDate, c.endDate);
    return sum + Math.round(months * c.recognitionRate / 100);
  }, 0);

  // 연차 관련 핸들러
  const handleLeaveSubmit = async () => {
    if (!employee || !leaveForm.startDate || !leaveForm.endDate) return;
    const payload = {
      employee_id: employee.id,
      leave_type: leaveForm.leaveType,
      start_date: leaveForm.startDate,
      end_date: leaveForm.endDate,
      days: leaveForm.days,
      reason: leaveForm.reason,
      status: '승인',
    };
    const { data } = await supabase.from('leave_records').insert(payload).select().single();
    if (data) setLeaves([mapLeaveRecord(data), ...leaves]);
    setShowLeaveModal(false);
    setLeaveForm({ leaveType: '연차', startDate: '', endDate: '', days: 1, reason: '' });
  };

  const handleLeaveDelete = async (id: string) => {
    if (!confirm('이 휴가 기록을 삭제하시겠습니까?')) return;
    await supabase.from('leave_records').delete().eq('id', id);
    setLeaves(leaves.filter((l) => l.id !== id));
  };

  // === 자격증 CRUD ===
  const CERT_CATEGORIES: CertificationCategory[] = ['국가기술자격', '국가전문자격', '민간자격', '외국자격'];
  const CERT_STATUSES: CertificationStatus[] = ['유효', '만료', '만료예정', '갱신중', '선임', '비선임'];

  const openCertModal = (cert?: Certification) => {
    if (cert) {
      setEditingCert(cert);
      setCertForm({
        certificationName: cert.certificationName,
        category: cert.category,
        issuingOrganization: cert.issuingOrganization,
        acquiredDate: cert.acquiredDate,
        expiryDate: cert.expiryDate || '',
        status: cert.status,
        certificateNumber: cert.certificateNumber || '',
      });
    } else {
      setEditingCert(null);
      setCertForm({ certificationName: '', category: '국가기술자격', issuingOrganization: '', acquiredDate: '', expiryDate: '', status: '유효', certificateNumber: '' });
    }
    setShowCertModal(true);
  };

  const handleCertSubmit = async () => {
    if (!employee || !certForm.certificationName || !certForm.acquiredDate) return;
    const payload = {
      employee_id: employee.id,
      certification_name: certForm.certificationName,
      category: certForm.category,
      issuing_organization: certForm.issuingOrganization,
      acquired_date: certForm.acquiredDate,
      expiry_date: certForm.expiryDate || null,
      status: certForm.status,
      certificate_number: certForm.certificateNumber || null,
    };

    if (editingCert) {
      const { data } = await supabase.from('certifications').update(payload).eq('id', editingCert.id).select().single();
      if (data) setEmpCerts(empCerts.map((c) => (c.id === editingCert.id ? mapCertification(data) : c)));
    } else {
      const { data } = await supabase.from('certifications').insert(payload).select().single();
      if (data) setEmpCerts([...empCerts, mapCertification(data)]);
    }
    setShowCertModal(false);
  };

  const handleCertDelete = async (id: string) => {
    if (!confirm('이 자격증을 삭제하시겠습니까?')) return;
    await supabase.from('certifications').delete().eq('id', id);
    setEmpCerts(empCerts.filter((c) => c.id !== id));
  };

  // === 문서 업로드/다운로드 ===
  const DOC_TYPES: DocumentType[] = ['근로계약서', '연봉계약서', '인사발령문서', '자격증사본', '입사서류', '퇴사서류'];

  const handleDocUpload = async () => {
    if (!employee || !docUploadFile) return;
    setDocUploading(true);
    try {
      const timestamp = Date.now();
      const storagePath = `${employee.id}/${timestamp}_${docUploadFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, docUploadFile);

      if (uploadError) {
        alert('파일 업로드 실패: ' + uploadError.message);
        setDocUploading(false);
        return;
      }

      const payload = {
        employee_id: employee.id,
        document_type: docForm.documentType,
        file_name: docUploadFile.name,
        file_size: docUploadFile.size,
        file_url: storagePath,
        uploaded_by: 'admin',
        uploaded_at: new Date().toISOString(),
        description: docForm.description || null,
      };

      const { data } = await supabase.from('documents').insert(payload).select().single();
      if (data) setEmpDocs([...empDocs, mapDocument(data)]);
      setShowDocModal(false);
      setDocUploadFile(null);
      setDocForm({ documentType: '근로계약서', description: '' });
    } catch (err) {
      console.error('Document upload failed:', err);
    }
    setDocUploading(false);
  };

  const handleDocDownload = async (doc: DocType) => {
    const fileUrl = (doc as any).fileUrl || (doc as any).file_url;
    if (!fileUrl) {
      alert('다운로드할 파일이 없습니다.');
      return;
    }
    const { data, error } = await supabase.storage.from('documents').download(fileUrl);
    if (error || !data) {
      alert('파일 다운로드 실패');
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDocDelete = async (doc: DocType) => {
    if (!confirm('이 문서를 삭제하시겠습니까?')) return;
    const fileUrl = (doc as any).fileUrl || (doc as any).file_url;
    if (fileUrl) {
      await supabase.storage.from('documents').remove([fileUrl]);
    }
    await supabase.from('documents').delete().eq('id', doc.id);
    setEmpDocs(empDocs.filter((d) => d.id !== doc.id));
  };

  // 연차 자동 일수 계산 (반차 = 0.5일)
  const updateLeaveDays = (type: string, start: string, end: string) => {
    if (!start || !end) return 0;
    if (type === '반차(오전)' || type === '반차(오후)') return 0.5;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 0);
  };

  const historyBadgeVariant = (type: string) => {
    const map: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'default' | 'secondary'> = {
      입사: 'success', 퇴사: 'danger', 승진: 'info', 휴직: 'warning',
      복직: 'success', 부서이동: 'secondary', 직책변경: 'secondary',
      급여변경: 'info', 포상: 'success', 징계: 'danger',
    };
    return map[type] ?? 'default';
  };

  const gradeBadgeVariant = (grade: string) => {
    const map: Record<string, 'danger' | 'info' | 'success' | 'warning'> = {
      S: 'danger', A: 'info', B: 'success', C: 'warning', D: 'danger',
    };
    return map[grade] ?? 'default' as any;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

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

  // Filter promotion histories for 인사기록표
  const promotionHistories = empHistories.filter((h) => h.type === '승진');

  // 현직급 N년차 계산 (가장 최근 승진일 기준, 없으면 입사일)
  const positionStartDate = (() => {
    const lastPromotion = [...promotionHistories]
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0];
    return lastPromotion ? lastPromotion.effectiveDate : employee.hireDate;
  })();
  const positionYears = (() => {
    const start = new Date(positionStartDate);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const monthDiff = now.getMonth() - start.getMonth();
    return monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate()) ? years : years + 1;
  })();

  return (
    <div id="employee-detail-content" className="space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/employees')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>

        {/* 프로필 사진 */}
        <div className="relative group">
          {employee.profileImage ? (
            <Image
              src={employee.profileImage}
              alt={employee.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center border-2 border-blue-400">
              <span className="text-2xl font-bold text-white">{employee.name.charAt(0)}</span>
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Camera size={14} className="text-gray-500" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">{employee.name}</h2>
          <p className="text-sm text-gray-500">{employee.employeeNumber} · {employee.department} · {employee.position} ({positionYears}년차)</p>
        </div>
        <Badge variant={statusBadgeVariant(employee.status)} className="ml-2">{employee.status}</Badge>
        {employee.isProbation && <Badge variant="warning">수습</Badge>}
        {uploading && <span className="text-xs text-gray-400 ml-2">업로드 중...</span>}
        <div className="ml-auto">
          <button
            onClick={handlePdfDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileDown size={14} /> PDF 다운로드
          </button>
        </div>
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
            { label: '직급', value: `${employee.position} (${positionYears}년차 · ${formatDate(positionStartDate)}~)` },
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

      {/* 연차 관리 */}
      {(() => {
        const leaveInfo = calcAnnualLeave(employee.hireDate);
        // 올해 사용한 연차만 합산 (연차/반차만)
        const currentYear = new Date().getFullYear();
        const usedDays = leaves
          .filter((l) => l.status === '승인' && (l.leaveType === '연차' || l.leaveType.startsWith('반차')) && new Date(l.startDate).getFullYear() === currentYear)
          .reduce((sum, l) => sum + l.days, 0);
        const remainDays = leaveInfo.entitled - usedDays;

        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CalendarDays size={16} className="text-gray-400" /> 연차 관리
                <span className="text-xs text-gray-400 font-normal">{leaveInfo.yearLabel}</span>
              </h3>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Plus size={14} /> 휴가 등록
              </button>
            </div>

            {/* 연차 요약 카드 */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">발생 연차</p>
                <p className="text-2xl font-bold text-blue-700">{leaveInfo.entitled}<span className="text-sm font-normal ml-0.5">일</span></p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                <p className="text-xs text-orange-600 font-medium mb-1">사용 연차</p>
                <p className="text-2xl font-bold text-orange-700">{usedDays}<span className="text-sm font-normal ml-0.5">일</span></p>
              </div>
              <div className={`p-4 rounded-xl border text-center ${remainDays > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <p className={`text-xs font-medium mb-1 ${remainDays > 0 ? 'text-emerald-600' : 'text-red-600'}`}>잔여 연차</p>
                <p className={`text-2xl font-bold ${remainDays > 0 ? 'text-emerald-700' : 'text-red-700'}`}>{remainDays}<span className="text-sm font-normal ml-0.5">일</span></p>
              </div>
            </div>

            {/* 사용 진행률 */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>사용률</span>
                <span>{leaveInfo.entitled > 0 ? Math.round((usedDays / leaveInfo.entitled) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usedDays / leaveInfo.entitled > 0.8 ? 'bg-red-500' : usedDays / leaveInfo.entitled > 0.5 ? 'bg-orange-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min((usedDays / Math.max(leaveInfo.entitled, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* 휴가 사용 내역 */}
            <h4 className="text-xs font-semibold text-gray-600 mb-3">휴가 사용 내역 ({leaves.length}건)</h4>
            {leaves.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">등록된 휴가 기록이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['구분', '기간', '일수', '사유', '상태', ''].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((l) => (
                      <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <Badge variant={l.leaveType === '연차' ? 'info' : l.leaveType.startsWith('반차') ? 'secondary' : l.leaveType === '병가' ? 'danger' : 'warning'}>
                            {l.leaveType}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                          {l.startDate === l.endDate ? formatDate(l.startDate) : `${formatDate(l.startDate)} ~ ${formatDate(l.endDate)}`}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{l.days}일</td>
                        <td className="px-4 py-2.5 text-gray-600 max-w-[200px] truncate">{l.reason || '-'}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={l.status === '승인' ? 'success' : l.status === '대기' ? 'warning' : 'danger'}>{l.status}</Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => handleLeaveDelete(l.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 연차 기준 안내 */}
            <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500">
              근로기준법 기준: 1년 미만 월 1일(최대 11일) | 1년 이상 15일 | 3년 이상부터 2년마다 1일 추가 (최대 25일)
            </div>
          </div>
        );
      })()}

      {/* 휴가 등록 모달 */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">휴가 등록</h3>
              <button onClick={() => setShowLeaveModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">휴가 유형 *</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => {
                    const type = e.target.value;
                    const days = updateLeaveDays(type, leaveForm.startDate, leaveForm.endDate);
                    setLeaveForm({ ...leaveForm, leaveType: type, days });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">시작일 *</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => {
                      const start = e.target.value;
                      const end = leaveForm.endDate || start;
                      const days = updateLeaveDays(leaveForm.leaveType, start, end);
                      setLeaveForm({ ...leaveForm, startDate: start, endDate: leaveForm.endDate || start, days });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">종료일 *</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => {
                      const end = e.target.value;
                      const days = updateLeaveDays(leaveForm.leaveType, leaveForm.startDate, end);
                      setLeaveForm({ ...leaveForm, endDate: end, days });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">사용 일수</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={leaveForm.days}
                  onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">사유</label>
                <input
                  type="text"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="휴가 사유 입력"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLeaveSubmit}
                disabled={!leaveForm.startDate || !leaveForm.endDate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg transition-colors"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 경력사항 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase size={16} className="text-gray-400" /> 경력사항
            <span className="text-xs text-gray-400 font-normal">({careers.length}건)</span>
            {careers.length > 0 && (
              <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                총 인정경력: {formatMonthsToYM(totalRecognizedMonths)}
              </span>
            )}
          </h3>
          <button
            onClick={() => openCareerModal()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus size={14} /> 경력 추가
          </button>
        </div>

        {careers.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">등록된 경력사항이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['회사명', '부서', '직위/직책', '근무기간', '실 경력', '관련도', '인정률', '인정경력', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {careers.map((c) => {
                  const actualMonths = calcMonthsBetween(c.startDate, c.endDate);
                  const recognizedMonths = Math.round(actualMonths * c.recognitionRate / 100);
                  return (
                    <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{c.companyName}</td>
                      <td className="px-4 py-2.5 text-gray-600">{c.department || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{c.position || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                        {formatDate(c.startDate)} ~ {formatDate(c.endDate)}
                      </td>
                      <td className="px-4 py-2.5 text-gray-800">{formatMonthsToYM(actualMonths)}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={c.relevance === '일치' ? 'success' : c.relevance === '유사' ? 'info' : 'warning'}>
                          {c.relevance}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-gray-800 font-medium">{c.recognitionRate}%</td>
                      <td className="px-4 py-2.5 text-blue-700 font-semibold">{formatMonthsToYM(recognizedMonths)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openCareerModal(c)} className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleCareerDelete(c.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {careers.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
            경력 인정 기준: <strong>일치(100%)</strong> - 현재 업무와 동일 | <strong>유사(80%)</strong> - 관련 업무 | <strong>다름(50%)</strong> - 비관련 업무
          </div>
        )}
      </div>

      {/* 경력 추가/수정 모달 */}
      {showCareerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">{editingCareer ? '경력 수정' : '경력 추가'}</h3>
              <button onClick={() => setShowCareerModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">회사명 *</label>
                <input
                  type="text"
                  value={careerForm.companyName}
                  onChange={(e) => setCareerForm({ ...careerForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="이전 직장명"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">부서</label>
                  <input
                    type="text"
                    value={careerForm.department}
                    onChange={(e) => setCareerForm({ ...careerForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="부서명"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">직위/직책</label>
                  <input
                    type="text"
                    value={careerForm.position}
                    onChange={(e) => setCareerForm({ ...careerForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="직위 또는 직책"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">근무 시작일 *</label>
                  <input
                    type="date"
                    value={careerForm.startDate}
                    onChange={(e) => setCareerForm({ ...careerForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">근무 종료일 *</label>
                  <input
                    type="date"
                    value={careerForm.endDate}
                    onChange={(e) => setCareerForm({ ...careerForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">업무 관련도 *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['일치', '유사', '다름'] as const).map((rel) => (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => setCareerForm({ ...careerForm, relevance: rel })}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        careerForm.relevance === rel
                          ? rel === '일치' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : rel === '유사' ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {rel}
                      <span className="block text-xs font-normal mt-0.5">
                        {rel === '일치' ? '100% 인정' : rel === '유사' ? '80% 인정' : '50% 인정'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">비고</label>
                <input
                  type="text"
                  value={careerForm.description}
                  onChange={(e) => setCareerForm({ ...careerForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="업무 내용 등"
                />
              </div>
              {careerForm.startDate && careerForm.endDate && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">실 경력</span>
                    <span className="font-medium text-gray-800">{formatMonthsToYM(calcMonthsBetween(careerForm.startDate, careerForm.endDate))}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">인정 경력 ({relevanceRateMap[careerForm.relevance]}%)</span>
                    <span className="font-semibold text-blue-700">
                      {formatMonthsToYM(Math.round(calcMonthsBetween(careerForm.startDate, careerForm.endDate) * relevanceRateMap[careerForm.relevance] / 100))}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCareerModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCareerSubmit}
                disabled={!careerForm.companyName || !careerForm.startDate || !careerForm.endDate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg transition-colors"
              >
                {editingCareer ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 인사기록표 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <ClipboardList size={16} className="text-gray-400" /> 인사기록표
        </h3>

        {/* 기본정보 요약 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">기본정보 요약</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: '성명', value: employee.name },
              { label: '사번', value: employee.employeeNumber },
              { label: '부서', value: employee.department },
              { label: '직급', value: employee.position },
              { label: '입사일', value: formatDate(employee.hireDate) },
              { label: '고용형태', value: employee.employmentType },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 승진 내역 */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-600 mb-3">승진 내역 ({promotionHistories.length}건)</h4>
          {promotionHistories.length === 0 ? (
            <p className="text-sm text-gray-400 py-3 text-center">승진 내역이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['승진일', '이전직급', '변경직급'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {promotionHistories.map((h) => (
                    <tr key={h.id} className="border-t border-gray-50">
                      <td className="px-4 py-2.5 text-gray-800">{formatDate(h.effectiveDate)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{h.previousValue ?? '-'}</td>
                      <td className="px-4 py-2.5 text-gray-800 font-medium">{h.newValue ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 평가 내역 */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 mb-3">평가 내역 ({evaluations.length}건)</h4>
          {evaluations.length === 0 ? (
            <p className="text-sm text-gray-400 py-3 text-center">평가 내역이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['연도', '점수', '등급', '평가자', '코멘트'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((ev) => (
                    <tr key={ev.id} className="border-t border-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{ev.year}</td>
                      <td className="px-4 py-2.5 text-gray-800">{ev.score}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={gradeBadgeVariant(ev.grade)}>{ev.grade}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{ev.evaluatorName || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate">{ev.comment || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Award size={16} className="text-gray-400" /> 자격증 내역
            <span className="text-xs text-gray-400 font-normal">({empCerts.length}건)</span>
          </h3>
          <button
            onClick={() => openCertModal()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus size={14} /> 자격증 추가
          </button>
        </div>
        {empCerts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">등록된 자격증이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['자격증명', '자격구분', '발급기관', '취득일', '상태', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empCerts.map((c) => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{c.certificationName}</td>
                    <td className="px-4 py-2.5 text-gray-600">{c.category}</td>
                    <td className="px-4 py-2.5 text-gray-600">{c.issuingOrganization}</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatDate(c.acquiredDate)}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={c.status === '유효' ? 'success' : c.status === '만료예정' ? 'warning' : c.status === '만료' ? 'danger' : 'info'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openCertModal(c)} title="수정" className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleCertDelete(c.id)} title="삭제" className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 자격증 추가/수정 모달 */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">{editingCert ? '자격증 수정' : '자격증 추가'}</h3>
              <button onClick={() => setShowCertModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">자격증명 *</label>
                <input
                  type="text"
                  value={certForm.certificationName}
                  onChange={(e) => setCertForm({ ...certForm, certificationName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="자격증 이름"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">자격구분 *</label>
                  <select
                    value={certForm.category}
                    onChange={(e) => setCertForm({ ...certForm, category: e.target.value as CertificationCategory })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CERT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">발급기관</label>
                  <input
                    type="text"
                    value={certForm.issuingOrganization}
                    onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="발급기관명"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">취득일 *</label>
                <input
                  type="date"
                  value={certForm.acquiredDate}
                  onChange={(e) => setCertForm({ ...certForm, acquiredDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">상태</label>
                  <select
                    value={certForm.status}
                    onChange={(e) => setCertForm({ ...certForm, status: e.target.value as CertificationStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CERT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">자격증 번호</label>
                  <input
                    type="text"
                    value={certForm.certificateNumber}
                    onChange={(e) => setCertForm({ ...certForm, certificateNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="자격증 번호"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCertModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCertSubmit}
                disabled={!certForm.certificationName || !certForm.acquiredDate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg transition-colors"
              >
                {editingCert ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 첨부 문서 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={16} className="text-gray-400" /> 첨부 문서
            <span className="text-xs text-gray-400 font-normal">({empDocs.length}건)</span>
          </h3>
          <button
            onClick={() => { setDocUploadFile(null); setDocForm({ documentType: '근로계약서', description: '' }); setShowDocModal(true); }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Upload size={14} /> 문서 업로드
          </button>
        </div>
        {empDocs.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">등록된 문서가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['문서유형', '파일명', '파일크기', '업로드자', '업로드일', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empDocs.map((d) => (
                  <tr key={d.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5"><Badge variant="secondary">{d.documentType}</Badge></td>
                    <td className="px-4 py-2.5 text-gray-800">{d.fileName}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{formatFileSize(d.fileSize)}</td>
                    <td className="px-4 py-2.5 text-gray-600">{d.uploadedBy}</td>
                    <td className="px-4 py-2.5 text-gray-600">{formatDate(d.uploadedAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDocDownload(d)} title="다운로드" className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors">
                          <Download size={14} />
                        </button>
                        <button onClick={() => handleDocDelete(d)} title="삭제" className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 문서 업로드 모달 */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">문서 업로드</h3>
              <button onClick={() => setShowDocModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">문서 유형 *</label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value as DocumentType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">파일 선택 *</label>
                <input
                  ref={docFileInputRef}
                  type="file"
                  onChange={(e) => setDocUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {docUploadFile && (
                  <p className="text-xs text-gray-500 mt-1">{docUploadFile.name} ({formatFileSize(docUploadFile.size)})</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
                <input
                  type="text"
                  value={docForm.description}
                  onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="문서 설명 (선택사항)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDocModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDocUpload}
                disabled={!docUploadFile || docUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg transition-colors"
              >
                {docUploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </div>
        </div>
      )}

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
