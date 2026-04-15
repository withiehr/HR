/* eslint-disable */

// ===== Supabase / localStorage 하이브리드 클라이언트 =====
// Vercel: 데이터는 Supabase DB, 인증은 app_users 테이블 기반 (Supabase Auth 미사용)
// 로컬: 데이터+인증 모두 localStorage

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const USE_SUPABASE = !!(supabaseUrl && supabaseAnonKey);

// ===== localStorage 시드 데이터 =====

import seedEmployees from '@/data/seed-employees.json';
import seedPersonnelHistories from '@/data/seed-personnel_histories.json';
import seedEvaluations from '@/data/seed-evaluations.json';
import seedCertifications from '@/data/seed-certifications.json';
import seedDocuments from '@/data/seed-documents.json';
import seedResignations from '@/data/seed-resignations.json';
import seedActivityLogs from '@/data/seed-activity_logs.json';
import seedLeaveRecords from '@/data/seed-leave_records.json';
import seedCareerHistories from '@/data/seed-career_histories.json';
import seedAppUsers from '@/data/seed-app_users.json';

const TABLES: Record<string, { storageKey: string; seedFn: () => any[] }> = {
  employees: { storageKey: 'hr_employees', seedFn: () => seedEmployees as any[] },
  personnel_histories: { storageKey: 'hr_personnel_histories', seedFn: () => seedPersonnelHistories as any[] },
  evaluations: { storageKey: 'hr_evaluations', seedFn: () => seedEvaluations as any[] },
  certifications: { storageKey: 'hr_certifications', seedFn: () => seedCertifications as any[] },
  documents: { storageKey: 'hr_documents', seedFn: () => seedDocuments as any[] },
  resignations: { storageKey: 'hr_resignations', seedFn: () => seedResignations as any[] },
  activity_logs: { storageKey: 'hr_activity_logs', seedFn: () => seedActivityLogs as any[] },
  leave_records: { storageKey: 'hr_leave_records', seedFn: () => seedLeaveRecords as any[] },
  career_histories: { storageKey: 'hr_career_histories', seedFn: () => seedCareerHistories as any[] },
  app_users: { storageKey: 'hr_app_users', seedFn: () => seedAppUsers as any[] },
};

const DATA_VERSION = 'v3-withie';

function isBrowser() {
  return typeof window !== 'undefined';
}

function ensureDataVersion() {
  if (!isBrowser()) return;
  const current = localStorage.getItem('hr_data_version');
  if (current !== DATA_VERSION) {
    Object.values(TABLES).forEach((t) => localStorage.removeItem(t.storageKey));
    localStorage.removeItem('hr_auth_session');
    localStorage.setItem('hr_data_version', DATA_VERSION);
  }
}

function getTable(tableName: string): any[] {
  if (!isBrowser()) return [];
  ensureDataVersion();
  const config = TABLES[tableName];
  if (!config) return [];
  const raw = localStorage.getItem(config.storageKey);
  if (raw) return JSON.parse(raw);
  const seed = config.seedFn();
  localStorage.setItem(config.storageKey, JSON.stringify(seed));
  return seed;
}

function saveTable(tableName: string, rows: any[]) {
  if (!isBrowser()) return;
  const config = TABLES[tableName];
  if (!config) return;
  localStorage.setItem(config.storageKey, JSON.stringify(rows));
}

// ===== localStorage Query Builder =====

type OrderConfig = { column: string; ascending: boolean };
type FilterFn = (row: any) => boolean;

class QueryBuilder {
  private tableName: string;
  private selectColumns: string | null = null;
  private filters: FilterFn[] = [];
  private ordering: OrderConfig[] = [];
  private limitCount: number | null = null;
  private singleResult = false;
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;

  constructor(tableName: string) { this.tableName = tableName; }

  select(columns?: string) { this.operation = 'select'; this.selectColumns = columns || '*'; return this; }
  insert(data: any | any[]) { this.operation = 'insert'; this.payload = Array.isArray(data) ? data : [data]; return this; }
  update(data: any) { this.operation = 'update'; this.payload = data; return this; }
  delete() { this.operation = 'delete'; return this; }
  eq(column: string, value: any) { this.filters.push((row) => row[column] === value); return this; }
  neq(column: string, value: any) { this.filters.push((row) => row[column] !== value); return this; }
  order(column: string, opts?: { ascending?: boolean }) { this.ordering.push({ column, ascending: opts?.ascending ?? true }); return this; }
  limit(count: number) { this.limitCount = count; return this; }
  single() { this.singleResult = true; return this; }

  private applyFilters(rows: any[]): any[] {
    let result = rows;
    for (const fn of this.filters) result = result.filter(fn);
    return result;
  }

  private applyOrdering(rows: any[]): any[] {
    if (this.ordering.length === 0) return rows;
    return [...rows].sort((a, b) => {
      for (const { column, ascending } of this.ordering) {
        const va = a[column]; const vb = b[column];
        if (va < vb) return ascending ? -1 : 1;
        if (va > vb) return ascending ? 1 : -1;
      }
      return 0;
    });
  }

  private resolveJoins(rows: any[], selectStr: string | null): any[] {
    if (!selectStr || !selectStr.includes('employees(')) return rows;
    const match = selectStr.match(/employees\(([^)]+)\)/);
    if (!match) return rows;
    const joinCols = match[1].split(',').map((s) => s.trim());
    const empRows = getTable('employees');
    const empMap: Record<string, any> = {};
    empRows.forEach((e: any) => { empMap[e.id] = e; });
    return rows.map((row) => {
      const emp = empMap[row.employee_id];
      if (!emp) return { ...row, employees: null };
      const joined: any = {};
      joinCols.forEach((col) => { joined[col] = emp[col]; });
      return { ...row, employees: joined };
    });
  }

  then(resolve: (result: { data: any; error: any }) => void, reject?: (err: any) => void) {
    try { resolve(this.execute()); }
    catch (err: any) { if (reject) reject(err); else resolve({ data: null, error: { message: err.message } }); }
  }

  execute(): { data: any; error: any } {
    try {
      let rows = getTable(this.tableName);
      switch (this.operation) {
        case 'select': {
          rows = this.applyFilters(rows);
          rows = this.resolveJoins(rows, this.selectColumns);
          rows = this.applyOrdering(rows);
          if (this.limitCount) rows = rows.slice(0, this.limitCount);
          return this.singleResult ? { data: rows[0] || null, error: null } : { data: rows, error: null };
        }
        case 'insert': {
          const newRows = this.payload.map((item: any) => ({
            id: item.id || crypto.randomUUID(),
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
            ...item,
          }));
          rows = [...rows, ...newRows];
          saveTable(this.tableName, rows);
          if (this.selectColumns) {
            let result = this.resolveJoins(newRows, this.selectColumns);
            return this.singleResult ? { data: result[0] || null, error: null } : { data: result, error: null };
          }
          return this.singleResult ? { data: newRows[0] || null, error: null } : { data: newRows, error: null };
        }
        case 'update': {
          const filtered = this.applyFilters(rows);
          const ids = new Set(filtered.map((r: any) => r.id));
          rows = rows.map((r: any) => ids.has(r.id) ? { ...r, ...this.payload, updated_at: new Date().toISOString() } : r);
          saveTable(this.tableName, rows);
          const updated = rows.filter((r: any) => ids.has(r.id));
          if (this.selectColumns) {
            let result = this.resolveJoins(updated, this.selectColumns);
            return this.singleResult ? { data: result[0] || null, error: null } : { data: result, error: null };
          }
          return this.singleResult ? { data: updated[0] || null, error: null } : { data: updated, error: null };
        }
        case 'delete': {
          const toDelete = this.applyFilters(rows);
          const deleteIds = new Set(toDelete.map((r: any) => r.id));
          rows = rows.filter((r: any) => !deleteIds.has(r.id));
          saveTable(this.tableName, rows);
          return { data: toDelete, error: null };
        }
        default: return { data: null, error: { message: 'Unknown operation' } };
      }
    } catch (err: any) { return { data: null, error: { message: err.message } }; }
  }
}

// ===== 공통 인증 (Supabase Auth 미사용, app_users 테이블 기반) =====

const AUTH_KEY = 'hr_auth_session';

function getAuthSession() {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

function setAuthSession(session: any) {
  if (!isBrowser()) return;
  if (session) localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  else localStorage.removeItem(AUTH_KEY);
}

const authListeners: Set<(event: string, session: any) => void> = new Set();

// 실제 Supabase 데이터 클라이언트 (Vercel에서만 사용)
let _supabaseDataClient: any = null;
function getDataClient() {
  if (!_supabaseDataClient && USE_SUPABASE) {
    const { createClient } = require('@supabase/supabase-js');
    _supabaseDataClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseDataClient;
}

// app_users 조회 (Vercel: Supabase DB, 로컬: localStorage)
async function queryAppUsers(email: string): Promise<any> {
  if (USE_SUPABASE) {
    const client = getDataClient();
    const { data } = await client.from('app_users').select('*').eq('email', email).single();
    return data;
  } else {
    const users = getTable('app_users');
    return users.find((u: any) => u.email === email) || null;
  }
}

const customAuth = {
  async getSession() {
    return { data: { session: getAuthSession() }, error: null };
  },
  async getUser() {
    const session = getAuthSession();
    return { data: { user: session?.user ?? null }, error: null };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    // app_users 테이블에서 이메일 확인
    const user = await queryAppUsers(email);
    if (!user) {
      return { data: { session: null }, error: { message: '등록되지 않은 이메일입니다. 관리자에게 문의하세요.' } };
    }
    if (user.status === '비활성') {
      return { data: { session: null }, error: { message: '비활성화된 계정입니다. 관리자에게 문의하세요.' } };
    }

    // 비밀번호 확인 (비밀번호가 설정되어 있는 경우만)
    const passwords = getPasswordStore();
    const storedPw = passwords[email];
    if (storedPw && storedPw !== password) {
      return { data: { session: null }, error: { message: '비밀번호가 올바르지 않습니다.' } };
    }

    const sessionUser = { id: user.id, email, last_sign_in_at: new Date().toISOString() };
    const session = { user: sessionUser, access_token: 'app-token' };
    setAuthSession(session);

    // Vercel: last_login_at 업데이트
    if (USE_SUPABASE) {
      const client = getDataClient();
      await client.from('app_users').update({ last_login_at: new Date().toISOString() }).eq('email', email);
    }

    authListeners.forEach((fn) => fn('SIGNED_IN', session));
    return { data: { session, user: sessionUser }, error: null };
  },
  async signInWithOtp({ email }: { email: string; options?: any }) {
    return { data: {}, error: null };
  },
  async signOut() {
    setAuthSession(null);
    authListeners.forEach((fn) => fn('SIGNED_OUT', null));
    return { error: null };
  },
  async updateUser({ password }: { password: string }) {
    return { data: {}, error: null };
  },
  onAuthStateChange(callback: (event: string, session: any) => void) {
    authListeners.add(callback);
    return { data: { subscription: { unsubscribe: () => { authListeners.delete(callback); } } } };
  },
};

// ===== 비밀번호 저장 (localStorage 기반) =====

const PW_KEY = 'hr_passwords';

function getPasswordStore(): Record<string, string> {
  if (!isBrowser()) return {};
  const raw = localStorage.getItem(PW_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function setPassword(email: string, password: string) {
  if (!isBrowser()) return;
  const store = getPasswordStore();
  store[email] = password;
  localStorage.setItem(PW_KEY, JSON.stringify(store));
}

export function getPassword(email: string): string {
  return getPasswordStore()[email] || '';
}

// ===== Storage =====

const localStorageObj = {
  from(_bucket: string) {
    return {
      async upload(_path: string, _file: any) { return { data: { path: _path }, error: null }; },
      async download(_path: string) { return { data: null, error: { message: '파일 다운로드를 지원하지 않습니다.' } }; },
    };
  },
};

// ===== Export =====

function createHybridClient(): any {
  if (USE_SUPABASE) {
    const dataClient = getDataClient();
    return {
      from(tableName: string) { return dataClient.from(tableName); },
      auth: customAuth,
      storage: dataClient.storage,
    };
  }
  return {
    from(tableName: string) { return new QueryBuilder(tableName); },
    auth: customAuth,
    storage: localStorageObj,
  };
}

export const supabase: any = createHybridClient();
