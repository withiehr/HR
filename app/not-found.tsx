import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h2>
        <p className="text-sm text-gray-500 mb-4">요청하신 페이지가 존재하지 않습니다.</p>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
