import { Evaluation } from '@/types';

export const evaluations: Evaluation[] = [
  // 2022년
  {
    id: 'eval-021', employeeId: 'emp-001', employeeName: '김민수', department: '경영지원팀', position: 'Senior',
    year: 2022, score: 8.2, grade: 'B', evaluatorName: '임수정',
    comment: '업무 수행 안정적. 리더십 역량 개발 필요.',
    createdAt: '2023-01-15T09:00:00', updatedAt: '2023-01-15T09:00:00',
  },
  {
    id: 'eval-022', employeeId: 'emp-002', employeeName: '이서연', department: '인사팀', position: 'Entry A',
    year: 2022, score: 9.0, grade: 'A', evaluatorName: '임수정',
    comment: '인사 업무 전반에 높은 이해도.',
    createdAt: '2023-01-15T09:00:00', updatedAt: '2023-01-15T09:00:00',
  },
  {
    id: 'eval-023', employeeId: 'emp-005', employeeName: '정현우', department: '기술팀', position: 'Entry A',
    year: 2022, score: 7.8, grade: 'B', evaluatorName: '윤태호',
    comment: '기술역량 성장 중. 프로젝트 기여도 양호.',
    createdAt: '2023-01-15T09:00:00', updatedAt: '2023-01-15T09:00:00',
  },
  {
    id: 'eval-024', employeeId: 'emp-003', employeeName: '박지훈', department: '기술팀', position: 'Entry A',
    year: 2022, score: 7.2, grade: 'C', evaluatorName: '윤태호',
    comment: '기본 업무 수행 가능. 기술력 향상 필요.',
    createdAt: '2023-01-15T09:00:00', updatedAt: '2023-01-15T09:00:00',
  },
  {
    id: 'eval-025', employeeId: 'emp-004', employeeName: '최유진', department: '영업팀', position: 'Entry A',
    year: 2022, score: 7.0, grade: 'C', evaluatorName: '배진영',
    comment: '영업 기초 역량 보유. 실적 개선 필요.',
    createdAt: '2023-01-15T09:00:00', updatedAt: '2023-01-15T09:00:00',
  },
  // 2023년
  {
    id: 'eval-001', employeeId: 'emp-001', employeeName: '김민수', department: '경영지원팀', position: 'Senior',
    year: 2023, score: 8.7, grade: 'A', evaluatorName: '임수정',
    comment: '예산관리 업무 효율화 기여. 리더십 성장.',
    createdAt: '2024-01-15T09:00:00', updatedAt: '2024-01-15T09:00:00',
  },
  {
    id: 'eval-002', employeeId: 'emp-002', employeeName: '이서연', department: '인사팀', position: 'Junior',
    year: 2023, score: 9.2, grade: 'A', evaluatorName: '임수정',
    comment: '인사관리 업무 전반에 걸쳐 높은 전문성 발휘.',
    createdAt: '2024-01-15T09:00:00', updatedAt: '2024-01-15T09:00:00',
  },
  {
    id: 'eval-003', employeeId: 'emp-005', employeeName: '정현우', department: '기술팀', position: 'Junior',
    year: 2023, score: 8.5, grade: 'A', evaluatorName: '윤태호',
    comment: '기술팀 핵심인력으로 성장. 프로젝트 관리 우수.',
    createdAt: '2024-01-15T09:00:00', updatedAt: '2024-01-15T09:00:00',
  },
  {
    id: 'eval-004', employeeId: 'emp-003', employeeName: '박지훈', department: '기술팀', position: 'Entry A',
    year: 2023, score: 7.6, grade: 'B', evaluatorName: '윤태호',
    comment: '전년 대비 성장. 전기기사 자격증 준비 중.',
    createdAt: '2024-01-15T09:00:00', updatedAt: '2024-01-15T09:00:00',
  },
  {
    id: 'eval-005', employeeId: 'emp-004', employeeName: '최유진', department: '영업팀', position: 'Entry A',
    year: 2023, score: 7.1, grade: 'C', evaluatorName: '배진영',
    comment: '영업 목표 미달. 꾸준한 개선 노력 필요.',
    createdAt: '2024-01-15T09:00:00', updatedAt: '2024-01-15T09:00:00',
  },
  {
    id: 'eval-006', employeeId: 'emp-007', employeeName: '윤태호', department: '기술팀', position: 'Senior',
    year: 2023, score: 9.1, grade: 'A', evaluatorName: '임수정',
    comment: '기술팀 리더로서 안정적인 팀 운영.',
    createdAt: '2024-01-15T09:00:00', updatedAt: '2024-01-15T09:00:00',
  },
  {
    id: 'eval-007', employeeId: 'emp-006', employeeName: '한소희', department: '경영지원팀', position: 'Entry B',
    year: 2023, score: 7.8, grade: 'B', evaluatorName: '김민수',
    comment: '계약직 업무 성실 수행.',
    createdAt: '2024-01-15T09:00:00', updatedAt: '2024-01-15T09:00:00',
  },
  // 2024년
  {
    id: 'eval-008', employeeId: 'emp-001', employeeName: '김민수', department: '경영지원팀', position: 'Senior',
    year: 2024, score: 9.0, grade: 'A', evaluatorName: '임수정',
    comment: '팀 운영 및 예산관리에서 높은 성과.',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-15T09:00:00',
  },
  {
    id: 'eval-009', employeeId: 'emp-002', employeeName: '이서연', department: '인사팀', position: 'Junior',
    year: 2024, score: 9.6, grade: 'S', evaluatorName: '임수정',
    comment: '인사관리 시스템 도입 주도. 업무 효율화에 크게 기여.',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-15T09:00:00',
  },
  {
    id: 'eval-010', employeeId: 'emp-005', employeeName: '정현우', department: '기술팀', position: 'Junior',
    year: 2024, score: 9.5, grade: 'S', evaluatorName: '윤태호',
    comment: '연간 프로젝트 목표 초과 달성. 후배 지도 적극적.',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-15T09:00:00',
  },
  {
    id: 'eval-011', employeeId: 'emp-003', employeeName: '박지훈', department: '기술팀', position: 'Entry A',
    year: 2024, score: 8.0, grade: 'B', evaluatorName: '윤태호',
    comment: '꾸준한 성장세. 전기기사 자격증 취득.',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-15T09:00:00',
  },
  {
    id: 'eval-012', employeeId: 'emp-004', employeeName: '최유진', department: '영업팀', position: 'Entry A',
    year: 2024, score: 7.9, grade: 'B', evaluatorName: '배진영',
    comment: '영업 실적 개선. 고객 관리 역량 향상.',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-15T09:00:00',
  },
  {
    id: 'eval-013', employeeId: 'emp-007', employeeName: '윤태호', department: '기술팀', position: 'Senior',
    year: 2024, score: 9.7, grade: 'S', evaluatorName: '임수정',
    comment: '기술팀 성과 목표 초과 달성. 팀원 역량 개발 우수.',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-15T09:00:00',
  },
  {
    id: 'eval-014', employeeId: 'emp-009', employeeName: '오승민', department: '영업팀', position: 'Entry A',
    year: 2024, score: 7.3, grade: 'C', evaluatorName: '배진영',
    comment: '업무 적응 중. 영업 프로세스 이해도 향상 필요.',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-15T09:00:00',
  },
  {
    id: 'eval-015', employeeId: 'emp-010', employeeName: '임수정', department: '경영지원팀', position: 'Senior',
    year: 2024, score: 9.8, grade: 'S', evaluatorName: '임수정',
    comment: '전사 경영 지원 총괄. 조직문화 개선 주도.',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-15T09:00:00',
  },
  {
    id: 'eval-016', employeeId: 'emp-012', employeeName: '배진영', department: '영업팀', position: 'Senior',
    year: 2024, score: 9.1, grade: 'A', evaluatorName: '임수정',
    comment: '영업팀 목표 달성 기여. 팀 빌딩 우수.',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-15T09:00:00',
  },
  {
    id: 'eval-017', employeeId: 'emp-013', employeeName: '조하늘', department: '인사팀', position: 'Entry A',
    year: 2024, score: 8.8, grade: 'A', evaluatorName: '이서연',
    comment: '인사 업무 빠르게 적응. 급여 정산 정확도 높음.',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-15T09:00:00',
  },
  {
    id: 'eval-018', employeeId: 'emp-006', employeeName: '한소희', department: '경영지원팀', position: 'Entry B',
    year: 2024, score: 8.1, grade: 'B', evaluatorName: '김민수',
    comment: '계약직 업무 성실 수행. 정규직 전환 검토 필요.',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-15T09:00:00',
  },
];
