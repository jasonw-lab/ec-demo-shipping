// Auth Imports
import { IRoute } from '@/types/types';
import {
  HiOutlineHome,
  HiOutlineCube,
  HiOutlineCog8Tooth
} from 'react-icons/hi2';

export const routes: IRoute[] = [
  {
    name: 'ダッシュボード',
    path: '/dashboard/main',
    icon: <HiOutlineHome className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />,
    collapse: false
  },
  {
    name: '発送一覧',
    path: '/dashboard/shipments',
    icon: <HiOutlineCube className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />,
    collapse: false
  },
  {
    name: '設定',
    path: '/dashboard/settings',
    icon: (
      <HiOutlineCog8Tooth className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />
    ),
    collapse: false
  }
];
