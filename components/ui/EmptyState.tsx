'use client';

import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export default function EmptyState({
  message = '데이터가 없습니다',
  description = '조건에 맞는 데이터가 없습니다. 검색 조건을 변경하거나 새로 등록해주세요.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <InboxIcon size={28} className="text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-500">{message}</p>
      <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>
    </div>
  );
}
