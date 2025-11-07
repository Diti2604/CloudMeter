export type CostSummary = {
  total: number; // USD
  periodStart: string; // ISO
  periodEnd: string; // ISO
  weeklyDeltaPercent: number;
  byTag?: Array<{ tag: string; cost: number }>;
};

export type UnusedResource = {
  id: string;
  type: string;
  region?: string;
  estimatedMonthlySavingsUsd: number;
  details?: string;
};

export type WeeklyReportRequest = {
  startDate: string; // ISO
  endDate: string; // ISO
  email?: string;
};

export type SubscribeRequest = {
  budgetId: string;
  email: string;
  thresholdPercent: number;
};