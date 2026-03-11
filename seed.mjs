import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vomiadyjwaikkuxbjeyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbWlhZHlqd2Fpa2t1eGJqZXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMzM2ODEsImV4cCI6MjA4ODYwOTY4MX0.E7Yckg2h8Eg14aOGwQimN6JVE_pry12RqIfcuu2ez6A'
);

// ===== 직원 데이터 =====
const employeesData = [
  { employee_number: '2020-001', name: '김민수', department: '경영지원팀', position: 'Senior', job_title: '팀장', employment_type: '정규직', hire_date: '2020-03-02', status: '재직', phone: '010-1234-5678', email: 'minsu.kim@company.com', birth_date: '1988-05-15', address: '인천광역시 남동구 구월동 123-45', is_probation: false },
  { employee_number: '2020-002', name: '이서연', department: '인사팀', position: 'Junior', job_title: '', employment_type: '정규직', hire_date: '2020-06-15', status: '재직', phone: '010-2345-6789', email: 'seoyeon.lee@company.com', birth_date: '1992-11-22', address: '인천광역시 연수구 송도동 456-78', is_probation: false },
  { employee_number: '2021-001', name: '박지훈', department: '기술팀', position: 'Entry A', job_title: '', employment_type: '정규직', hire_date: '2021-01-04', status: '재직', phone: '010-3456-7890', email: 'jihoon.park@company.com', birth_date: '1995-03-08', address: '인천광역시 부평구 부평동 789-12', is_probation: false },
  { employee_number: '2021-002', name: '최유진', department: '영업팀', position: 'Entry A', job_title: '', employment_type: '정규직', hire_date: '2021-03-15', status: '재직', phone: '010-4567-8901', email: 'yujin.choi@company.com', birth_date: '1993-07-19', address: '인천광역시 미추홀구 주안동 234-56', is_probation: false },
  { employee_number: '2021-003', name: '정현우', department: '기술팀', position: 'Junior', job_title: '파트장', employment_type: '정규직', hire_date: '2021-07-01', status: '재직', phone: '010-5678-9012', email: 'hyunwoo.jung@company.com', birth_date: '1990-12-03', address: '인천광역시 서구 청라동 567-89', is_probation: false },
  { employee_number: '2022-001', name: '한소희', department: '경영지원팀', position: 'Entry B', job_title: '', employment_type: '계약직', hire_date: '2022-01-10', status: '재직', phone: '010-6789-0123', email: 'sohee.han@company.com', birth_date: '1996-09-25', address: '인천광역시 남동구 논현동 890-12', is_probation: false },
  { employee_number: '2022-002', name: '윤태호', department: '기술팀', position: 'Senior', job_title: '팀장', employment_type: '정규직', hire_date: '2022-04-01', status: '재직', phone: '010-7890-1234', email: 'taeho.yoon@company.com', birth_date: '1987-02-14', address: '인천광역시 계양구 작전동 345-67', is_probation: false },
  { employee_number: '2022-003', name: '강예린', department: '인사팀', position: 'Entry A', job_title: '', employment_type: '정규직', hire_date: '2022-09-01', status: '휴직', phone: '010-8901-2345', email: 'yerin.kang@company.com', birth_date: '1994-06-30', address: '인천광역시 동구 송림동 678-90', is_probation: false },
  { employee_number: '2023-001', name: '오승민', department: '영업팀', position: 'Entry A', job_title: '', employment_type: '정규직', hire_date: '2023-02-06', status: '재직', phone: '010-9012-3456', email: 'seungmin.oh@company.com', birth_date: '1997-01-11', address: '인천광역시 부평구 십정동 901-23', is_probation: false },
  { employee_number: '2023-002', name: '임수정', department: '경영지원팀', position: 'Senior', job_title: '실장', employment_type: '정규직', hire_date: '2023-05-02', status: '재직', phone: '010-0123-4567', email: 'sujung.lim@company.com', birth_date: '1985-04-20', address: '인천광역시 연수구 동춘동 012-34', is_probation: false },
  { employee_number: '2023-003', name: '송도현', department: '기술팀', position: 'Entry B', job_title: '', employment_type: '인턴', hire_date: '2023-07-03', status: '퇴사', phone: '010-1111-2222', email: 'dohyun.song@company.com', birth_date: '1999-08-05', address: '인천광역시 서구 가좌동 111-22', is_probation: false },
  { employee_number: '2024-001', name: '배진영', department: '영업팀', position: 'Senior', job_title: '팀장', employment_type: '정규직', hire_date: '2024-01-02', status: '재직', phone: '010-3333-4444', email: 'jinyoung.bae@company.com', birth_date: '1989-10-12', address: '인천광역시 남동구 간석동 333-44', is_probation: false },
  { employee_number: '2024-002', name: '조하늘', department: '인사팀', position: 'Entry A', job_title: '', employment_type: '정규직', hire_date: '2024-03-04', status: '재직', phone: '010-5555-6666', email: 'haneul.cho@company.com', birth_date: '1994-12-28', address: '인천광역시 미추홀구 용현동 555-66', is_probation: false },
  { employee_number: '2025-001', name: '신우진', department: '기술팀', position: 'Entry A', job_title: '', employment_type: '정규직', hire_date: '2025-01-06', status: '재직', phone: '010-7777-8888', email: 'woojin.shin@company.com', birth_date: '1998-02-17', address: '인천광역시 계양구 효성동 777-88', is_probation: true, probation_end_date: '2025-04-05' },
  { employee_number: '2025-002', name: '문채원', department: '경영지원팀', position: 'Entry B', job_title: '', employment_type: '계약직', hire_date: '2025-02-03', status: '재직', phone: '010-9999-0000', email: 'chaewon.moon@company.com', birth_date: '1997-06-09', address: '인천광역시 동구 만석동 999-00', is_probation: true, probation_end_date: '2025-05-03' },
];

async function seed() {
  console.log('=== Supabase 시드 데이터 삽입 시작 ===\n');

  // 1. 직원 삽입
  const { data: employees, error: empErr } = await supabase
    .from('employees').insert(employeesData).select();
  if (empErr) { console.error('employees 에러:', empErr.message); return; }
  console.log(`✓ employees: ${employees.length}건 삽입`);

  // employee_number -> id 매핑
  const empMap = {};
  employees.forEach(e => { empMap[e.employee_number] = e.id; });

  // 2. 인사이력 삽입
  const personnelData = [
    { employee_id: empMap['2020-001'], type: '입사', effective_date: '2020-03-02', details: '경영지원팀 Entry A로 입사', registered_by: '시스템' },
    { employee_id: empMap['2020-001'], type: '승진', effective_date: '2022-01-01', details: 'Junior → Senior 승진', previous_value: 'Junior', new_value: 'Senior', registered_by: '이서연' },
    { employee_id: empMap['2020-001'], type: '직책변경', effective_date: '2023-01-02', details: '경영지원팀 팀장 발령', new_value: '팀장', registered_by: '이서연' },
    { employee_id: empMap['2020-002'], type: '입사', effective_date: '2020-06-15', details: '인사팀 Entry A로 입사', registered_by: '시스템' },
    { employee_id: empMap['2020-002'], type: '승진', effective_date: '2023-07-01', details: 'Entry A → Junior 승진', previous_value: 'Entry A', new_value: 'Junior', registered_by: '김민수' },
    { employee_id: empMap['2021-003'], type: '부서이동', effective_date: '2023-04-01', details: '영업팀 → 기술팀 이동', previous_value: '영업팀', new_value: '기술팀', registered_by: '이서연' },
    { employee_id: empMap['2021-003'], type: '승진', effective_date: '2023-07-01', details: 'Entry A → Junior 승진', previous_value: 'Entry A', new_value: 'Junior', registered_by: '이서연' },
    { employee_id: empMap['2021-003'], type: '직책변경', effective_date: '2024-01-02', details: '기술팀 파트장 발령', new_value: '파트장', registered_by: '이서연' },
    { employee_id: empMap['2022-003'], type: '휴직', effective_date: '2025-02-01', details: '육아휴직 (2025.02.01 ~ 2025.07.31)', registered_by: '이서연' },
    { employee_id: empMap['2023-003'], type: '퇴사', effective_date: '2024-01-02', details: '인턴 계약 만료에 따른 퇴사', registered_by: '이서연' },
    { employee_id: empMap['2022-002'], type: '급여변경', effective_date: '2025-01-01', details: '연봉 인상 (연봉계약 갱신)', registered_by: '이서연' },
    { employee_id: empMap['2023-001'], type: '포상', effective_date: '2025-02-15', details: '2024년 하반기 우수사원 포상', registered_by: '김민수' },
    { employee_id: empMap['2025-001'], type: '입사', effective_date: '2025-01-06', details: '기술팀 Entry A로 입사 (수습 3개월)', registered_by: '이서연' },
    { employee_id: empMap['2025-002'], type: '입사', effective_date: '2025-02-03', details: '경영지원팀 Entry B로 입사 (계약직, 수습 3개월)', registered_by: '이서연' },
    { employee_id: empMap['2024-001'], type: '승진', effective_date: '2025-01-01', details: 'Junior → Senior 승진 및 영업팀 팀장 발령', previous_value: 'Junior', new_value: 'Senior', registered_by: '이서연' },
  ];
  const { data: phData, error: phErr } = await supabase.from('personnel_histories').insert(personnelData).select();
  if (phErr) console.error('personnel_histories 에러:', phErr.message);
  else console.log(`✓ personnel_histories: ${phData.length}건 삽입`);

  // 3. 인사평가 삽입
  const evalData = [
    { employee_id: empMap['2020-001'], year: 2022, score: 8.2, grade: 'B', evaluator_name: '임수정', comment: '업무 수행 안정적. 리더십 역량 개발 필요.' },
    { employee_id: empMap['2020-002'], year: 2022, score: 9.0, grade: 'A', evaluator_name: '임수정', comment: '인사 업무 전반에 높은 이해도.' },
    { employee_id: empMap['2021-003'], year: 2022, score: 7.8, grade: 'B', evaluator_name: '윤태호', comment: '기술역량 성장 중. 프로젝트 기여도 양호.' },
    { employee_id: empMap['2021-001'], year: 2022, score: 7.2, grade: 'C', evaluator_name: '윤태호', comment: '기본 업무 수행 가능. 기술력 향상 필요.' },
    { employee_id: empMap['2021-002'], year: 2022, score: 7.0, grade: 'C', evaluator_name: '배진영', comment: '영업 기초 역량 보유. 실적 개선 필요.' },
    { employee_id: empMap['2020-001'], year: 2023, score: 8.7, grade: 'A', evaluator_name: '임수정', comment: '예산관리 업무 효율화 기여. 리더십 성장.' },
    { employee_id: empMap['2020-002'], year: 2023, score: 9.2, grade: 'A', evaluator_name: '임수정', comment: '인사관리 업무 전반에 걸쳐 높은 전문성 발휘.' },
    { employee_id: empMap['2021-003'], year: 2023, score: 8.5, grade: 'A', evaluator_name: '윤태호', comment: '기술팀 핵심인력으로 성장. 프로젝트 관리 우수.' },
    { employee_id: empMap['2021-001'], year: 2023, score: 7.6, grade: 'B', evaluator_name: '윤태호', comment: '전년 대비 성장. 전기기사 자격증 준비 중.' },
    { employee_id: empMap['2021-002'], year: 2023, score: 7.1, grade: 'C', evaluator_name: '배진영', comment: '영업 목표 미달. 꾸준한 개선 노력 필요.' },
    { employee_id: empMap['2022-002'], year: 2023, score: 9.1, grade: 'A', evaluator_name: '임수정', comment: '기술팀 리더로서 안정적인 팀 운영.' },
    { employee_id: empMap['2022-001'], year: 2023, score: 7.8, grade: 'B', evaluator_name: '김민수', comment: '계약직 업무 성실 수행.' },
    { employee_id: empMap['2020-001'], year: 2024, score: 9.0, grade: 'A', evaluator_name: '임수정', comment: '팀 운영 및 예산관리에서 높은 성과.' },
    { employee_id: empMap['2020-002'], year: 2024, score: 9.6, grade: 'S', evaluator_name: '임수정', comment: '인사관리 시스템 도입 주도. 업무 효율화에 크게 기여.' },
    { employee_id: empMap['2021-003'], year: 2024, score: 9.5, grade: 'S', evaluator_name: '윤태호', comment: '연간 프로젝트 목표 초과 달성. 후배 지도 적극적.' },
    { employee_id: empMap['2021-001'], year: 2024, score: 8.0, grade: 'B', evaluator_name: '윤태호', comment: '꾸준한 성장세. 전기기사 자격증 취득.' },
    { employee_id: empMap['2021-002'], year: 2024, score: 7.9, grade: 'B', evaluator_name: '배진영', comment: '영업 실적 개선. 고객 관리 역량 향상.' },
    { employee_id: empMap['2022-002'], year: 2024, score: 9.7, grade: 'S', evaluator_name: '임수정', comment: '기술팀 성과 목표 초과 달성. 팀원 역량 개발 우수.' },
    { employee_id: empMap['2023-001'], year: 2024, score: 7.3, grade: 'C', evaluator_name: '배진영', comment: '업무 적응 중. 영업 프로세스 이해도 향상 필요.' },
    { employee_id: empMap['2023-002'], year: 2024, score: 9.8, grade: 'S', evaluator_name: '임수정', comment: '전사 경영 지원 총괄. 조직문화 개선 주도.' },
    { employee_id: empMap['2024-001'], year: 2024, score: 9.1, grade: 'A', evaluator_name: '임수정', comment: '영업팀 목표 달성 기여. 팀 빌딩 우수.' },
    { employee_id: empMap['2024-002'], year: 2024, score: 8.8, grade: 'A', evaluator_name: '이서연', comment: '인사 업무 빠르게 적응. 급여 정산 정확도 높음.' },
    { employee_id: empMap['2022-001'], year: 2024, score: 8.1, grade: 'B', evaluator_name: '김민수', comment: '계약직 업무 성실 수행. 정규직 전환 검토 필요.' },
  ];
  const { data: evData, error: evErr } = await supabase.from('evaluations').insert(evalData).select();
  if (evErr) console.error('evaluations 에러:', evErr.message);
  else console.log(`✓ evaluations: ${evData.length}건 삽입`);

  // 4. 자격증 삽입
  const certData = [
    { employee_id: empMap['2020-001'], certification_name: '전기기사', category: '국가기술자격', issuing_organization: '한국산업인력공단', acquired_date: '2015-07-20', expiry_date: '2026-07-20', status: '유효', certificate_number: 'EE-2015-12345' },
    { employee_id: empMap['2020-001'], certification_name: '에너지관리기사', category: '국가기술자격', issuing_organization: '한국산업인력공단', acquired_date: '2018-11-15', expiry_date: '2026-04-15', status: '만료예정', certificate_number: 'EM-2018-67890' },
    { employee_id: empMap['2021-001'], certification_name: '정보처리기사', category: '국가기술자격', issuing_organization: '한국산업인력공단', acquired_date: '2020-06-20', status: '유효', certificate_number: 'IT-2020-11111' },
    { employee_id: empMap['2021-003'], certification_name: '전기공사기사', category: '국가기술자격', issuing_organization: '한국산업인력공단', acquired_date: '2017-05-10', expiry_date: '2025-05-10', status: '만료예정', certificate_number: 'EC-2017-22222' },
    { employee_id: empMap['2021-003'], certification_name: '소방설비기사(전기)', category: '국가기술자격', issuing_organization: '한국산업인력공단', acquired_date: '2019-09-25', expiry_date: '2027-09-25', status: '유효', certificate_number: 'FE-2019-33333' },
    { employee_id: empMap['2022-002'], certification_name: '건축전기설비기술사', category: '국가기술자격', issuing_organization: '한국산업인력공단', acquired_date: '2016-03-18', status: '유효', certificate_number: 'BE-2016-44444' },
    { employee_id: empMap['2022-002'], certification_name: 'PMP', category: '외국자격', issuing_organization: 'PMI', acquired_date: '2022-08-01', expiry_date: '2025-08-01', status: '유효', certificate_number: 'PMP-2022-55555' },
    { employee_id: empMap['2023-002'], certification_name: '공인회계사', category: '국가전문자격', issuing_organization: '금융감독원', acquired_date: '2012-09-01', status: '유효', certificate_number: 'CPA-2012-66666' },
    { employee_id: empMap['2024-001'], certification_name: '전기기사', category: '국가기술자격', issuing_organization: '한국산업인력공단', acquired_date: '2014-11-22', expiry_date: '2024-11-22', status: '만료', certificate_number: 'EE-2014-77777' },
    { employee_id: empMap['2021-002'], certification_name: '유통관리사 2급', category: '국가전문자격', issuing_organization: '대한상공회의소', acquired_date: '2021-06-15', status: '유효', certificate_number: 'DM-2021-88888' },
  ];
  const { data: ctData, error: ctErr } = await supabase.from('certifications').insert(certData).select();
  if (ctErr) console.error('certifications 에러:', ctErr.message);
  else console.log(`✓ certifications: ${ctData.length}건 삽입`);

  // 5. 퇴사관리 삽입
  const resData = [
    { employee_id: empMap['2023-003'], resignation_date: '2024-01-02', reason: '계약만료', reason_detail: '인턴 계약기간 만료에 따른 자동 퇴사', handover_completed: true, asset_returned: true, account_deactivated: true, severance_settled: true },
  ];
  const { data: rsData, error: rsErr } = await supabase.from('resignations').insert(resData).select();
  if (rsErr) console.error('resignations 에러:', rsErr.message);
  else console.log(`✓ resignations: ${rsData.length}건 삽입`);

  // 6. 문서관리 삽입
  const docData = [
    { employee_id: empMap['2020-001'], document_type: '근로계약서', file_name: '김민수_근로계약서_2020.pdf', file_size: 524288, uploaded_by: '이서연', uploaded_at: '2020-03-02T10:00:00Z', description: '2020년 입사 시 근로계약서' },
    { employee_id: empMap['2020-001'], document_type: '연봉계약서', file_name: '김민수_연봉계약서_2025.pdf', file_size: 312456, uploaded_by: '이서연', uploaded_at: '2025-01-15T14:30:00Z', description: '2025년 연봉계약서' },
    { employee_id: empMap['2020-001'], document_type: '인사발령문서', file_name: '김민수_팀장발령_2023.pdf', file_size: 215678, uploaded_by: '이서연', uploaded_at: '2023-01-02T11:00:00Z', description: '경영지원팀 팀장 발령문서' },
    { employee_id: empMap['2020-001'], document_type: '자격증사본', file_name: '김민수_전기기사_자격증.pdf', file_size: 1048576, uploaded_by: '김민수', uploaded_at: '2020-03-05T09:30:00Z', description: '전기기사 자격증 사본' },
    { employee_id: empMap['2020-002'], document_type: '근로계약서', file_name: '이서연_근로계약서_2020.pdf', file_size: 498765, uploaded_by: '김민수', uploaded_at: '2020-06-15T10:00:00Z' },
    { employee_id: empMap['2021-003'], document_type: '자격증사본', file_name: '정현우_전기공사기사.pdf', file_size: 892345, uploaded_by: '정현우', uploaded_at: '2021-07-05T14:00:00Z', description: '전기공사기사 자격증 사본' },
    { employee_id: empMap['2022-002'], document_type: '자격증사본', file_name: '윤태호_건축전기설비기술사.pdf', file_size: 756890, uploaded_by: '윤태호', uploaded_at: '2022-04-05T11:00:00Z' },
    { employee_id: empMap['2023-003'], document_type: '퇴사서류', file_name: '송도현_퇴사서류_2024.pdf', file_size: 345678, uploaded_by: '이서연', uploaded_at: '2024-01-02T15:00:00Z', description: '인턴 계약만료 퇴사서류' },
    { employee_id: empMap['2025-001'], document_type: '입사서류', file_name: '신우진_입사서류_2025.pdf', file_size: 2097152, uploaded_by: '이서연', uploaded_at: '2025-01-06T10:30:00Z', description: '입사 시 제출서류 일체' },
    { employee_id: empMap['2025-001'], document_type: '근로계약서', file_name: '신우진_근로계약서_2025.pdf', file_size: 456789, uploaded_by: '이서연', uploaded_at: '2025-01-06T11:00:00Z' },
    { employee_id: empMap['2025-002'], document_type: '근로계약서', file_name: '문채원_근로계약서_2025.pdf', file_size: 423456, uploaded_by: '이서연', uploaded_at: '2025-02-03T10:00:00Z' },
    { employee_id: empMap['2022-003'], document_type: '인사발령문서', file_name: '강예린_육아휴직발령_2025.pdf', file_size: 198765, uploaded_by: '이서연', uploaded_at: '2025-02-01T09:00:00Z', description: '육아휴직 발령 문서' },
  ];
  const { data: dcData, error: dcErr } = await supabase.from('documents').insert(docData).select();
  if (dcErr) console.error('documents 에러:', dcErr.message);
  else console.log(`✓ documents: ${dcData.length}건 삽입`);

  // 7. 활동로그 삽입
  const logData = [
    { timestamp: '2025-03-09T09:15:00Z', user_id: 'user-001', user_name: '이서연', menu: '직원관리', action_type: '수정', target_name: '김민수', description: '연락처 정보 수정 (010-1234-5678)' },
    { timestamp: '2025-03-09T09:30:00Z', user_id: 'user-001', user_name: '이서연', menu: '문서관리', action_type: '업로드', target_name: '문채원', description: '근로계약서 업로드 (문채원_근로계약서_2025.pdf)' },
    { timestamp: '2025-03-08T14:20:00Z', user_id: 'user-001', user_name: '이서연', menu: '직원관리', action_type: '등록', target_name: '문채원', description: '신규 직원 등록 (경영지원팀/계약직)' },
    { timestamp: '2025-03-08T11:00:00Z', user_id: 'user-002', user_name: '김민수', menu: '인사이력', action_type: '등록', target_name: '오승민', description: '포상 이력 등록 (2024 하반기 우수사원)' },
    { timestamp: '2025-03-07T16:45:00Z', user_id: 'user-001', user_name: '이서연', menu: '자격증관리', action_type: '수정', target_name: '정현우', description: '전기공사기사 만료일 확인 및 상태 변경 (유효 → 만료예정)' },
    { timestamp: '2025-03-07T15:30:00Z', user_id: 'user-001', user_name: '이서연', menu: '직원관리', action_type: '상태변경', target_name: '강예린', description: '재직상태 변경 (재직 → 휴직)' },
    { timestamp: '2025-03-06T10:00:00Z', user_id: 'user-001', user_name: '이서연', menu: '인사이력', action_type: '등록', target_name: '강예린', description: '휴직 이력 등록 (육아휴직 2025.02~2025.07)' },
    { timestamp: '2025-03-05T09:00:00Z', user_id: 'user-001', user_name: '이서연', menu: '문서관리', action_type: '업로드', target_name: '강예린', description: '육아휴직 발령문서 업로드' },
    { timestamp: '2025-03-04T14:30:00Z', user_id: 'user-002', user_name: '김민수', menu: '문서관리', action_type: '다운로드', target_name: '윤태호', description: '건축전기설비기술사 자격증 사본 다운로드' },
    { timestamp: '2025-03-03T11:20:00Z', user_id: 'user-001', user_name: '이서연', menu: '직원관리', action_type: '등록', target_name: '신우진', description: '신규 직원 등록 (기술팀/정규직/수습)' },
    { timestamp: '2025-03-03T11:30:00Z', user_id: 'user-001', user_name: '이서연', menu: '문서관리', action_type: '업로드', target_name: '신우진', description: '입사서류 및 근로계약서 업로드' },
    { timestamp: '2025-03-02T10:15:00Z', user_id: 'user-001', user_name: '이서연', menu: '인사이력', action_type: '등록', target_name: '배진영', description: '승진 이력 등록 (대리 → 과장, 영업팀 팀장 발령)' },
    { timestamp: '2025-03-01T09:00:00Z', user_id: 'user-001', user_name: '이서연', menu: '자격증관리', action_type: '수정', target_name: '배진영', description: '전기기사 자격증 상태 변경 (유효 → 만료)' },
    { timestamp: '2025-02-28T16:00:00Z', user_id: 'user-002', user_name: '김민수', menu: '퇴사관리', action_type: '조회', target_name: '송도현', description: '퇴사 처리 현황 조회' },
    { timestamp: '2025-02-27T11:00:00Z', user_id: 'user-001', user_name: '이서연', menu: '인사이력', action_type: '등록', target_name: '윤태호', description: '급여변경 이력 등록 (2025년 연봉계약 갱신)' },
  ];
  const { data: lgData, error: lgErr } = await supabase.from('activity_logs').insert(logData).select();
  if (lgErr) console.error('activity_logs 에러:', lgErr.message);
  else console.log(`✓ activity_logs: ${lgData.length}건 삽입`);

  console.log('\n=== 시드 데이터 삽입 완료 ===');
}

seed().catch(console.error);
