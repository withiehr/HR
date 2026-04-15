import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 로컬 모드: 바로 로그인 페이지로 리다이렉트
  return NextResponse.redirect(new URL('/login', request.url));
}
