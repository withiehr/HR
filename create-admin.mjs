import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vomiadyjwaikkuxbjeyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbWlhZHlqd2Fpa2t1eGJqZXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMzM2ODEsImV4cCI6MjA4ODYwOTY4MX0.E7Yckg2h8Eg14aOGwQimN6JVE_pry12RqIfcuu2ez6A'
);

const { data, error } = await supabase.auth.signUp({
  email: 'admin@withie.co.kr',
  password: 'withie2025!',
});

if (error) {
  console.error('계정 생성 실패:', error.message);
} else {
  console.log('관리자 계정 생성 완료!');
  console.log('이메일: admin@withie.co.kr');
  console.log('비밀번호: withie2025!');
  console.log('User ID:', data.user?.id);
}
