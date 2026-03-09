export type EmploymentType = "정규직" | "계약직" | "파견직" | "인턴";
export type EmploymentStatus = "재직" | "휴직" | "퇴직";
export type Grade =
  | "사원"
  | "주임"
  | "대리"
  | "과장"
  | "차장"
  | "부장"
  | "이사"
  | "상무"
  | "전무"
  | "대표";

export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  department: string;
  grade: Grade;
  position: string;
  employmentType: EmploymentType;
  hireDate: string;
  status: EmploymentStatus;
  phone: string;
  email: string;
}

export interface PersonnelHistory {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: string;
  effectiveDate: string;
  details: string;
}

export type CertificationStatus = "유효" | "만료" | "만료예정";

export interface Certification {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  certName: string;
  certCategory: string;
  issuer: string;
  acquisitionDate: string;
  expiryDate: string | null;
  status: CertificationStatus;
}

export interface Resignation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  grade: Grade;
  resignDate: string;
  reason: string;
  handoverDone: boolean;
  assetReturned: boolean;
  accountRevoked: boolean;
  severancePaid: boolean;
}

export type DocumentCategory =
  | "근로계약서"
  | "연봉계약서"
  | "인사발령문서"
  | "자격증사본"
  | "입사서류"
  | "퇴사서류";

export interface Document {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  category: DocumentCategory;
  fileName: string;
  uploadDate: string;
  fileSize: string;
}

// ── 더미 데이터 ──────────────────────────────────────────────
export const DEPARTMENTS = [
  "경영지원",
  "인사총무",
  "영업",
  "마케팅",
  "개발",
  "재무회계",
  "구매",
  "품질관리",
];

export const employees: Employee[] = [
  {
    id: "e1",
    employeeNumber: "2019-001",
    name: "김민준",
    department: "개발",
    grade: "과장",
    position: "팀장",
    employmentType: "정규직",
    hireDate: "2019-03-02",
    status: "재직",
    phone: "010-1234-5678",
    email: "minjun.kim@company.com",
  },
  {
    id: "e2",
    employeeNumber: "2020-002",
    name: "이서연",
    department: "인사총무",
    grade: "대리",
    position: "담당",
    employmentType: "정규직",
    hireDate: "2020-01-06",
    status: "재직",
    phone: "010-2345-6789",
    email: "seoyeon.lee@company.com",
  },
  {
    id: "e3",
    employeeNumber: "2021-003",
    name: "박지호",
    department: "영업",
    grade: "사원",
    position: "담당",
    employmentType: "정규직",
    hireDate: "2021-07-01",
    status: "재직",
    phone: "010-3456-7890",
    email: "jiho.park@company.com",
  },
  {
    id: "e4",
    employeeNumber: "2018-004",
    name: "최수아",
    department: "마케팅",
    grade: "차장",
    position: "팀장",
    employmentType: "정규직",
    hireDate: "2018-04-02",
    status: "재직",
    phone: "010-4567-8901",
    email: "sua.choi@company.com",
  },
  {
    id: "e5",
    employeeNumber: "2022-005",
    name: "정우진",
    department: "개발",
    grade: "주임",
    position: "담당",
    employmentType: "정규직",
    hireDate: "2022-03-02",
    status: "재직",
    phone: "010-5678-9012",
    email: "woojin.jung@company.com",
  },
  {
    id: "e6",
    employeeNumber: "2023-006",
    name: "한소희",
    department: "재무회계",
    grade: "사원",
    position: "담당",
    employmentType: "계약직",
    hireDate: "2023-01-02",
    status: "재직",
    phone: "010-6789-0123",
    email: "sohee.han@company.com",
  },
  {
    id: "e7",
    employeeNumber: "2017-007",
    name: "오태양",
    department: "경영지원",
    grade: "부장",
    position: "팀장",
    employmentType: "정규직",
    hireDate: "2017-02-01",
    status: "재직",
    phone: "010-7890-1234",
    email: "taeyang.oh@company.com",
  },
  {
    id: "e8",
    employeeNumber: "2022-008",
    name: "윤나은",
    department: "품질관리",
    grade: "대리",
    position: "담당",
    employmentType: "정규직",
    hireDate: "2022-09-01",
    status: "휴직",
    phone: "010-8901-2345",
    email: "naeun.yoon@company.com",
  },
  {
    id: "e9",
    employeeNumber: "2023-009",
    name: "임현우",
    department: "구매",
    grade: "사원",
    position: "담당",
    employmentType: "인턴",
    hireDate: "2023-06-01",
    status: "재직",
    phone: "010-9012-3456",
    email: "hyunwoo.lim@company.com",
  },
  {
    id: "e10",
    employeeNumber: "2016-010",
    name: "강다인",
    department: "마케팅",
    grade: "과장",
    position: "담당",
    employmentType: "정규직",
    hireDate: "2016-05-02",
    status: "재직",
    phone: "010-0123-4567",
    email: "dain.kang@company.com",
  },
  {
    id: "e11",
    employeeNumber: "2019-011",
    name: "신동현",
    department: "개발",
    grade: "대리",
    position: "담당",
    employmentType: "정규직",
    hireDate: "2019-09-02",
    status: "재직",
    phone: "010-1111-2222",
    email: "donghyun.shin@company.com",
  },
  {
    id: "e12",
    employeeNumber: "2021-012",
    name: "류지민",
    department: "영업",
    grade: "주임",
    position: "담당",
    employmentType: "정규직",
    hireDate: "2021-01-04",
    status: "재직",
    phone: "010-2222-3333",
    email: "jimin.ryu@company.com",
  },
];

export const personnelHistories: PersonnelHistory[] = [
  {
    id: "ph1",
    employeeId: "e1",
    employeeName: "김민준",
    department: "개발",
    type: "승진",
    effectiveDate: "2023-01-01",
    details: "대리 → 과장 승진",
  },
  {
    id: "ph2",
    employeeId: "e4",
    employeeName: "최수아",
    department: "마케팅",
    type: "전보",
    effectiveDate: "2023-04-01",
    details: "영업팀 → 마케팅팀 이동",
  },
  {
    id: "ph3",
    employeeId: "e8",
    employeeName: "윤나은",
    department: "품질관리",
    type: "휴직",
    effectiveDate: "2024-01-15",
    details: "육아휴직 개시 (복직 예정: 2025-01-15)",
  },
  {
    id: "ph4",
    employeeId: "e7",
    employeeName: "오태양",
    department: "경영지원",
    type: "승진",
    effectiveDate: "2023-07-01",
    details: "차장 → 부장 승진",
  },
  {
    id: "ph5",
    employeeId: "e2",
    employeeName: "이서연",
    department: "인사총무",
    type: "승진",
    effectiveDate: "2024-01-01",
    details: "사원 → 대리 승진",
  },
  {
    id: "ph6",
    employeeId: "e10",
    employeeName: "강다인",
    department: "마케팅",
    type: "보직변경",
    effectiveDate: "2024-03-01",
    details: "콘텐츠팀 담당 → 브랜드팀 담당",
  },
  {
    id: "ph7",
    employeeId: "e5",
    employeeName: "정우진",
    department: "개발",
    type: "입사",
    effectiveDate: "2022-03-02",
    details: "신규 입사 (백엔드 개발팀)",
  },
  {
    id: "ph8",
    employeeId: "e11",
    employeeName: "신동현",
    department: "개발",
    type: "전보",
    effectiveDate: "2024-06-01",
    details: "프론트엔드팀 → 풀스택팀 이동",
  },
];

export const certifications: Certification[] = [
  {
    id: "c1",
    employeeId: "e1",
    employeeName: "김민준",
    department: "개발",
    certName: "정보처리기사",
    certCategory: "IT",
    issuer: "한국산업인력공단",
    acquisitionDate: "2017-11-15",
    expiryDate: null,
    status: "유효",
  },
  {
    id: "c2",
    employeeId: "e1",
    employeeName: "김민준",
    department: "개발",
    certName: "AWS Solutions Architect",
    certCategory: "IT",
    issuer: "Amazon",
    acquisitionDate: "2022-06-20",
    expiryDate: "2025-06-20",
    status: "만료예정",
  },
  {
    id: "c3",
    employeeId: "e2",
    employeeName: "이서연",
    department: "인사총무",
    certName: "공인노무사",
    certCategory: "법정",
    issuer: "고용노동부",
    acquisitionDate: "2020-08-10",
    expiryDate: null,
    status: "유효",
  },
  {
    id: "c4",
    employeeId: "e4",
    employeeName: "최수아",
    department: "마케팅",
    certName: "구글 애널리틱스 자격증",
    certCategory: "마케팅",
    issuer: "Google",
    acquisitionDate: "2022-03-15",
    expiryDate: "2024-03-15",
    status: "만료",
  },
  {
    id: "c5",
    employeeId: "e7",
    employeeName: "오태양",
    department: "경영지원",
    certName: "경영지도사",
    certCategory: "경영",
    issuer: "한국산업인력공단",
    acquisitionDate: "2015-12-20",
    expiryDate: null,
    status: "유효",
  },
  {
    id: "c6",
    employeeId: "e6",
    employeeName: "한소희",
    department: "재무회계",
    certName: "전산세무 1급",
    certCategory: "회계",
    issuer: "한국세무사회",
    acquisitionDate: "2022-06-10",
    expiryDate: null,
    status: "유효",
  },
  {
    id: "c7",
    employeeId: "e11",
    employeeName: "신동현",
    department: "개발",
    certName: "정보보안기사",
    certCategory: "IT",
    issuer: "한국산업인력공단",
    acquisitionDate: "2021-09-10",
    expiryDate: null,
    status: "유효",
  },
  {
    id: "c8",
    employeeId: "e5",
    employeeName: "정우진",
    department: "개발",
    certName: "리눅스마스터 1급",
    certCategory: "IT",
    issuer: "한국정보통신진흥협회",
    acquisitionDate: "2023-04-20",
    expiryDate: "2025-04-20",
    status: "만료예정",
  },
  {
    id: "c9",
    employeeId: "e10",
    employeeName: "강다인",
    department: "마케팅",
    certName: "SNS 광고마케터",
    certCategory: "마케팅",
    issuer: "한국인터넷전문가협회",
    acquisitionDate: "2023-11-05",
    expiryDate: "2025-11-05",
    status: "유효",
  },
  {
    id: "c10",
    employeeId: "e3",
    employeeName: "박지호",
    department: "영업",
    certName: "유통관리사 2급",
    certCategory: "유통",
    issuer: "대한상공회의소",
    acquisitionDate: "2020-12-18",
    expiryDate: null,
    status: "유효",
  },
];

export const resignations: Resignation[] = [
  {
    id: "r1",
    employeeId: "ex1",
    employeeName: "송하은",
    department: "영업",
    grade: "대리",
    resignDate: "2024-02-29",
    reason: "개인 사유",
    handoverDone: true,
    assetReturned: true,
    accountRevoked: true,
    severancePaid: true,
  },
  {
    id: "r2",
    employeeId: "ex2",
    employeeName: "배준혁",
    department: "개발",
    grade: "사원",
    resignDate: "2024-04-30",
    reason: "타사 이직",
    handoverDone: true,
    assetReturned: true,
    accountRevoked: true,
    severancePaid: false,
  },
  {
    id: "r3",
    employeeId: "ex3",
    employeeName: "홍미래",
    department: "재무회계",
    grade: "과장",
    resignDate: "2024-06-30",
    reason: "계약만료",
    handoverDone: true,
    assetReturned: false,
    accountRevoked: false,
    severancePaid: false,
  },
  {
    id: "r4",
    employeeId: "ex4",
    employeeName: "문성준",
    department: "마케팅",
    grade: "주임",
    resignDate: "2023-12-31",
    reason: "개인 사유",
    handoverDone: true,
    assetReturned: true,
    accountRevoked: true,
    severancePaid: true,
  },
  {
    id: "r5",
    employeeId: "ex5",
    employeeName: "권지수",
    department: "구매",
    grade: "대리",
    resignDate: "2024-03-31",
    reason: "해외유학",
    handoverDone: false,
    assetReturned: true,
    accountRevoked: true,
    severancePaid: true,
  },
];

export const documents: Document[] = [
  {
    id: "d1",
    employeeId: "e1",
    employeeName: "김민준",
    department: "개발",
    category: "근로계약서",
    fileName: "근로계약서_김민준_2019.pdf",
    uploadDate: "2019-03-02",
    fileSize: "1.2MB",
  },
  {
    id: "d2",
    employeeId: "e1",
    employeeName: "김민준",
    department: "개발",
    category: "연봉계약서",
    fileName: "연봉계약서_김민준_2024.pdf",
    uploadDate: "2024-01-02",
    fileSize: "0.8MB",
  },
  {
    id: "d3",
    employeeId: "e2",
    employeeName: "이서연",
    department: "인사총무",
    category: "근로계약서",
    fileName: "근로계약서_이서연_2020.pdf",
    uploadDate: "2020-01-06",
    fileSize: "1.1MB",
  },
  {
    id: "d4",
    employeeId: "e2",
    employeeName: "이서연",
    department: "인사총무",
    category: "인사발령문서",
    fileName: "인사발령_이서연_승진_2024.pdf",
    uploadDate: "2024-01-01",
    fileSize: "0.5MB",
  },
  {
    id: "d5",
    employeeId: "e4",
    employeeName: "최수아",
    department: "마케팅",
    category: "인사발령문서",
    fileName: "인사발령_최수아_전보_2023.pdf",
    uploadDate: "2023-04-01",
    fileSize: "0.5MB",
  },
  {
    id: "d6",
    employeeId: "e3",
    employeeName: "박지호",
    department: "영업",
    category: "입사서류",
    fileName: "입사서류_박지호_2021.zip",
    uploadDate: "2021-07-01",
    fileSize: "5.3MB",
  },
  {
    id: "d7",
    employeeId: "ex1",
    employeeName: "송하은",
    department: "영업",
    category: "퇴사서류",
    fileName: "퇴사서류_송하은_2024.pdf",
    uploadDate: "2024-02-29",
    fileSize: "1.4MB",
  },
  {
    id: "d8",
    employeeId: "e1",
    employeeName: "김민준",
    department: "개발",
    category: "자격증사본",
    fileName: "자격증_김민준_정보처리기사.pdf",
    uploadDate: "2019-03-02",
    fileSize: "2.1MB",
  },
  {
    id: "d9",
    employeeId: "e6",
    employeeName: "한소희",
    department: "재무회계",
    category: "근로계약서",
    fileName: "근로계약서_한소희_계약직_2023.pdf",
    uploadDate: "2023-01-02",
    fileSize: "1.0MB",
  },
  {
    id: "d10",
    employeeId: "e7",
    employeeName: "오태양",
    department: "경영지원",
    category: "연봉계약서",
    fileName: "연봉계약서_오태양_2024.pdf",
    uploadDate: "2024-01-02",
    fileSize: "0.9MB",
  },
];
