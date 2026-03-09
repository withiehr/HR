import { Resignation } from '@/types';

export const resignations: Resignation[] = [
  {
    id: 'res-001',
    employeeId: 'emp-011',
    employeeName: '송도현',
    department: '기술팀',
    position: 'Entry B',
    resignationDate: '2024-01-02',
    reason: '계약만료',
    reasonDetail: '인턴 계약기간 만료에 따른 자동 퇴사',
    handoverCompleted: true,
    assetReturned: true,
    accountDeactivated: true,
    severanceSettled: true,
    createdAt: '2024-01-02T09:00:00',
    updatedAt: '2024-01-15T14:00:00',
  },
];
