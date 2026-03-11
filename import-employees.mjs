import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const supabase = createClient(
  'https://vomiadyjwaikkuxbjeyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbWlhZHlqd2Fpa2t1eGJqZXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMzM2ODEsImV4cCI6MjA4ODYwOTY4MX0.E7Yckg2h8Eg14aOGwQimN6JVE_pry12RqIfcuu2ez6A'
);

// Excel 읽기
const wb = XLSX.readFile('./temp_erp.xls');
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

// 날짜 변환: "2023/05/26" → "2023-05-26"
function formatDate(d) {
  if (!d) return null;
  return String(d).replace(/\//g, '-');
}

// 주민번호에서 생년월일 추출
function birthFromRRN(rrn) {
  if (!rrn) return null;
  const clean = String(rrn).replace(/-/g, '');
  const yy = clean.substring(0, 2);
  const mm = clean.substring(2, 4);
  const dd = clean.substring(4, 6);
  const genderDigit = clean.substring(6, 7);
  // 1,2 = 1900년대, 3,4 = 2000년대
  const century = ['3', '4'].includes(genderDigit) ? '20' : '19';
  return `${century}${yy}-${mm}-${dd}`;
}

// 사원구분 매핑
function mapEmploymentType(t) {
  if (!t) return '정규직';
  if (t === '연봉제') return '정규직';
  if (t === '파견직') return '파견직';
  if (t === '계약직') return '계약직';
  if (t === '인턴') return '인턴';
  if (t === '일용직') return '일용직';
  return '정규직';
}

// 직급 유효성
const validPositions = ['CEO', 'PD', 'Entry B', 'Entry A', 'Junior', 'Senior'];
function mapPosition(p) {
  if (!p || !validPositions.includes(p.trim())) return 'Entry B';
  return p.trim();
}

// 데이터 변환
const employees = rows.slice(1).map((row) => {
  const rrn = row[12] ? String(row[12]) : null;
  return {
    employee_number: String(row[3]),
    name: String(row[4]).replace(/\(.*\)/, '').trim(), // 괄호 제거 (예: 강혜영(열수송관리자))
    department: String(row[2]),
    position: mapPosition(row[6]),
    job_title: row[9] || '',  // 직책
    employment_type: mapEmploymentType(row[13]),
    hire_date: formatDate(row[18]),
    status: '재직',
    phone: row[21] || '',
    email: row[23] || '',
    birth_date: rrn ? birthFromRRN(rrn) : formatDate(row[15]),
    address: row[24] || '',
    is_probation: false,
  };
});

async function importData() {
  console.log(`총 ${employees.length}명 데이터 준비 완료\n`);

  // 미리보기
  employees.forEach((e, i) => {
    console.log(`${i + 1}. ${e.employee_number} ${e.name} | ${e.department} | ${e.position} | ${e.employment_type} | ${e.hire_date} | ${e.birth_date}`);
  });

  // 기존 데이터 삭제
  console.log('\n기존 직원 데이터 삭제 중...');
  const { error: delErr } = await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) {
    console.error('삭제 오류:', delErr.message);
    return;
  }

  // 일괄 삽입
  console.log('새 직원 데이터 삽입 중...');
  const { data, error } = await supabase.from('employees').insert(employees).select();
  if (error) {
    console.error('삽입 오류:', error.message);
    // 개별 삽입 시도
    console.log('\n개별 삽입 시도...');
    let success = 0;
    for (const emp of employees) {
      const { error: e } = await supabase.from('employees').insert(emp);
      if (e) {
        console.error(`실패: ${emp.name} - ${e.message}`);
      } else {
        success++;
      }
    }
    console.log(`\n${success}/${employees.length}명 등록 완료`);
  } else {
    console.log(`\n${data.length}명 등록 완료!`);
  }
}

importData();
