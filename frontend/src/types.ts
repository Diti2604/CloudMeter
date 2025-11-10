export type CostSummary = {
  totalCost?: number; 
  periodStart: string; 
  periodEnd: string; 
  trend?: string; 
  byService?: Array<{ service: string; cost: number }>; 
  total: number; 
  weeklyDeltaPercent?: number;
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

export type WeeklyReport = {
  period: string;
  totalCost: number;
  weeklyChange: number;
  potentialSavings: number;
  resourceCount: number;
  costBreakdown: Array<{
    service: string;
    currentCost: number;
    previousCost: number;
    change: number;
  }>;
  unusedResources: Array<{
    type: string;
    id: string;
    region: string;
    monthlySavings: number;
    recommendation: string;
  }>;
  recommendations: string[];
};