/* eslint-disable */
import { Employee, PersonnelHistory, Evaluation, Certification, Resignation, Document, ActivityLog } from '@/types';

// ===== Supabase row -> 프론트엔드 타입 변환 =====

export function rowToEmployee(r: any): Employee {
  return {
    id: r.id,
    employeeNumber: r.employee_number,
    name: r.name,
    department: r.department,
    position: r.position,
    jobTitle: r.job_title ?? '',
    employmentType: r.employment_type,
    hireDate: r.hire_date,
    status: r.status,
    phone: r.phone ?? '',
    email: r.email ?? '',
    birthDate: r.birth_date ?? '',
    address: r.address ?? '',
    profileImage: r.profile_image,
    isProbation: r.is_probation ?? false,
    probationEndDate: r.probation_end_date,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}


export function rowToPersonnelHistory(r: any): PersonnelHistory {
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employees?.name ?? '',
    type: r.type,
    effectiveDate: r.effective_date,
    details: r.details ?? '',
    previousValue: r.previous_value,
    newValue: r.new_value,
    registeredBy: r.registered_by ?? '',
    createdAt: r.created_at,
  };
}


export function rowToEvaluation(r: any): Evaluation {
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employees?.name ?? '',
    department: r.employees?.department ?? '',
    position: r.employees?.position ?? '',
    year: r.year,
    score: r.score,
    grade: r.grade,
    evaluatorName: r.evaluator_name ?? '',
    comment: r.comment,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}


export function rowToCertification(r: any): Certification {
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employees?.name ?? '',
    department: r.employees?.department ?? '',
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


export function rowToResignation(r: any): Resignation {
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employees?.name ?? '',
    department: r.employees?.department ?? '',
    position: r.employees?.position ?? '',
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


export function rowToDocument(r: any): Document {
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employees?.name ?? '',
    department: r.employees?.department ?? '',
    documentType: r.document_type,
    fileName: r.file_name,
    fileSize: r.file_size ?? 0,
    uploadedBy: r.uploaded_by ?? '',
    uploadedAt: r.uploaded_at,
    description: r.description,
  };
}


export function rowToActivityLog(r: any): ActivityLog {
  return {
    id: r.id,
    timestamp: r.timestamp,
    userId: r.user_id ?? '',
    userName: r.user_name ?? '',
    menu: r.menu,
    actionType: r.action_type,
    targetName: r.target_name,
    description: r.description ?? '',
  };
}
