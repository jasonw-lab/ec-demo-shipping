'use client';

import useSWR from 'swr';
import { fetchPriorityShippings } from './shipping-api';
import type { Shipping } from '../types';

export function usePriorityList(limit: number = 5) {
  return useSWR<Shipping[]>(
    `shippings/priority?limit=${limit}`,
    () => fetchPriorityShippings(limit),
    {
      refreshInterval: 30000
    }
  );
}
