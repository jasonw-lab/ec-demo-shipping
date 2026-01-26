'use client';

import useSWR from 'swr';
import { fetchSummary } from './shipping-api';
import type { ShippingSummary } from '../types';

export function useSummary() {
  return useSWR<ShippingSummary>('shippings/summary', fetchSummary, {
    refreshInterval: 30000
  });
}
