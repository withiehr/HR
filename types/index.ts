// ===== 공통 타입 =====
export type UserRole = 'admin' | 'manager' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

// ===== 직원 관련 타입 =====
export type EmploymentStatus = '재직' | '휴직' | '퇴사';
export type EmploymentType = '정규직' | '계약직' | '인턴' | '파견직' | '일용직';
export type Position = 'Entry B' | 'Entry A' | 'Junior' | 'Senior';

export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  department: string;
  position: Position;
  jobTitle: string;
  employmentType: EmploymentType;
  hireDate: string;
  status: EmploymentStatus;
  phone: string;
  email: string;
  birthDate: string;
  address: string;
  profileImage?: string;
  isProbation: boolean;
  probationEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== 인사 이력 타입 =====
export type PersonnelHistoryType =
  | '입사'
  | '승진'
  | '부서이동'
  | '직책변경'
  | '급여변경'
  | '휴직'
  | '복직'
  | '징계'
  | '포상'
  | '퇴사';

export interface PersonnelHistory {
  id: string;
  employeeId: string;
  employeeName: string;
  type: PersonnelHistoryType;
  effectiveDate: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  registeredBy: string;
  createdAt: string;
}

// ===== 자격증 타입 =====
export type CertificationCategory = '국가기술자격' | '국가전문자격' | '민간자격' | '외국자격';
export type CertificationStatus = '유효' | '만료' | '만료예정' | '갱신중';

export interface Certification {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  certificationName: string;
  category: CertificationCategory;
  issuingOrganization: string;
  acquiredDate: string;
  expiryDate?: string;
  status: CertificationStatus;
  certificateNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== 퇴사 관리 타입 =====
export interface Resignation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: Position;
  resignationDate: string;
  reason: string;
  reasonDetail?: string;
  handoverCompleted: boolean;
  assetReturned: boolean;
  accountDeactivated: boolean;
  severanceSettled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== 문서 관리 타입 =====
export type DocumentType =
  | '근로계약서'
  | '연봉계약서'
  | '인사발령문서'
  | '자격증사본'
  | '입사서류'
  | '퇴사서류';

export interface Document {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
}

// ===== 활동 로그 타입 =====
export type ActionType = '등록' | '수정' | '삭제' | '상태변경' | '조회' | '다운로드' | '업로드';
export type MenuType = '직원관리' | '인사이력' | '자격증관리' | '퇴사관리' | '문서관리' | '인사평가' | '시스템';

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  menu: MenuType;
  actionType: ActionType;
  targetName?: string;
  description: string;
}

// ===== 인사평가 타입 =====
export type EvaluationGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface Evaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: Position;
  year: number;
  score: number;           // 6.0 ~ 10.0 (0.1 단위)
  grade: EvaluationGrade;  // 점수 기반 자동 산출
  evaluatorName: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== 필터/검색 타입 =====
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

// ===== 권한 설정 =====
export interface Permission {
  menu: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { menu: '대시보드', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { menu: '직원관리', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { menu: '인사이력', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { menu: '자격증관리', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { menu: '퇴사관리', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { menu: '문서관리', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { menu: '인사평가', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { menu: '활동로그', canView: true, canCreate: false, canEdit: false, canDelete: false },
  ],
  manager: [
    { menu: '대시보드', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { menu: '직원관리', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { menu: '인사이력', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { menu: '자격증관리', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { menu: '퇴사관리', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { menu: '문서관리', canView: true, canCreate: true, canEdit: false, canDelete: false },
    { menu: '인사평가', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { menu: '활동로그', canView: true, canCreate: false, canEdit: false, canDelete: false },
  ],
  viewer: [
    { menu: '대시보드', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { menu: '직원관리', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { menu: '인사이력', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { menu: '자격증관리', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { menu: '퇴사관리', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { menu: '문서관리', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { menu: '인사평가', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { menu: '활동로그', canView: false, canCreate: false, canEdit: false, canDelete: false },
  ],
};
