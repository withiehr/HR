-- ===== 인사관리 시스템 테이블 설계 =====

-- 1. 직원 (employees)
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('Entry B', 'Entry A', 'Junior', 'Senior')),
  job_title TEXT NOT NULL DEFAULT '',
  employment_type TEXT NOT NULL CHECK (employment_type IN ('정규직', '계약직', '인턴', '파견직', '일용직')),
  hire_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT '재직' CHECK (status IN ('재직', '휴직', '퇴사')),
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  birth_date DATE,
  address TEXT DEFAULT '',
  profile_image TEXT,
  is_probation BOOLEAN DEFAULT false,
  probation_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 인사이력 (personnel_histories)
CREATE TABLE personnel_histories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('입사', '승진', '부서이동', '직책변경', '급여변경', '휴직', '복직', '징계', '포상', '퇴사')),
  effective_date DATE NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  previous_value TEXT,
  new_value TEXT,
  registered_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 인사평가 (evaluations)
CREATE TABLE evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  score NUMERIC(3,1) NOT NULL CHECK (score >= 6.0 AND score <= 10.0),
  grade TEXT NOT NULL CHECK (grade IN ('S', 'A', 'B', 'C', 'D')),
  evaluator_name TEXT NOT NULL DEFAULT '',
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (employee_id, year)
);

-- 4. 자격증 (certifications)
CREATE TABLE certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('국가기술자격', '국가전문자격', '민간자격', '외국자격')),
  issuing_organization TEXT NOT NULL DEFAULT '',
  acquired_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT '유효' CHECK (status IN ('유효', '만료', '만료예정', '갱신중')),
  certificate_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 퇴사관리 (resignations)
CREATE TABLE resignations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  resignation_date DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  reason_detail TEXT,
  handover_completed BOOLEAN DEFAULT false,
  asset_returned BOOLEAN DEFAULT false,
  account_deactivated BOOLEAN DEFAULT false,
  severance_settled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 문서관리 (documents)
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('근로계약서', '연봉계약서', '인사발령문서', '자격증사본', '입사서류', '퇴사서류')),
  file_name TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  file_url TEXT,
  uploaded_by TEXT NOT NULL DEFAULT '',
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  description TEXT
);

-- 7. 활동로그 (activity_logs)
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT now(),
  user_id TEXT NOT NULL DEFAULT '',
  user_name TEXT NOT NULL DEFAULT '',
  menu TEXT NOT NULL CHECK (menu IN ('직원관리', '인사이력', '자격증관리', '퇴사관리', '문서관리', '인사평가', '시스템')),
  action_type TEXT NOT NULL CHECK (action_type IN ('등록', '수정', '삭제', '상태변경', '조회', '다운로드', '업로드')),
  target_name TEXT,
  description TEXT NOT NULL DEFAULT ''
);

-- 8. 경력사항 (career_histories)
CREATE TABLE career_histories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  relevance TEXT NOT NULL DEFAULT '다름' CHECK (relevance IN ('일치', '유사', '다름')),
  recognition_rate INTEGER NOT NULL DEFAULT 50 CHECK (recognition_rate IN (100, 80, 50)),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. 연차기록 (leave_records)
CREATE TABLE leave_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL DEFAULT '연차' CHECK (leave_type IN ('연차', '반차(오전)', '반차(오후)', '하계휴가', '특별휴가', '병가', '경조휴가', '공가')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(3,1) NOT NULL DEFAULT 1,
  reason TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT '승인' CHECK (status IN ('승인', '대기', '반려')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 인덱스 =====
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_personnel_histories_employee ON personnel_histories(employee_id);
CREATE INDEX idx_evaluations_employee ON evaluations(employee_id);
CREATE INDEX idx_evaluations_year ON evaluations(year);
CREATE INDEX idx_certifications_employee ON certifications(employee_id);
CREATE INDEX idx_resignations_employee ON resignations(employee_id);
CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_menu ON activity_logs(menu);
CREATE INDEX idx_career_histories_employee ON career_histories(employee_id);
CREATE INDEX idx_leave_records_employee ON leave_records(employee_id);
CREATE INDEX idx_leave_records_dates ON leave_records(start_date, end_date);

-- ===== RLS (Row Level Security) 활성화 =====
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resignations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_records ENABLE ROW LEVEL SECURITY;

-- 모든 테이블에 anon 키로 읽기/쓰기 허용 (개발용, 추후 인증 추가 시 변경)
CREATE POLICY "Allow all for anon" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON personnel_histories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON certifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON resignations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON career_histories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON leave_records FOR ALL USING (true) WITH CHECK (true);

-- ===== updated_at 자동 갱신 트리거 =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_certifications_updated_at BEFORE UPDATE ON certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_resignations_updated_at BEFORE UPDATE ON resignations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_career_histories_updated_at BEFORE UPDATE ON career_histories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_leave_records_updated_at BEFORE UPDATE ON leave_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
