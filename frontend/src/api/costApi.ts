// Mock data for frontend development - replace with real API calls later
import { CostSummary, UnusedResource, WeeklyReportRequest, SubscribeRequest } from "../types";

// Mock data
const mockCostSummary: CostSummary = {
  total: 1247.85,
  periodStart: "2024-10-01T00:00:00Z",
  periodEnd: "2024-10-31T23:59:59Z",
  weeklyDeltaPercent: -12.5,
  byTag: [
    { tag: "Production", cost: 687.45 },
    { tag: "Development", cost: 234.20 },
    { tag: "Testing", cost: 156.80 },
    { tag: "Staging", cost: 169.40 }
  ]
};

const mockUnusedResources: UnusedResource[] = [
  {
    id: "i-0123456789abcdef0",
    type: "EC2 Instance",
    region: "us-east-1",
    estimatedMonthlySavingsUsd: 45.60,
    details: "t3.medium instance stopped for 15 days"
  },
  {
    id: "vol-0987654321fedcba0",
    type: "EBS Volume",
    region: "us-west-2",
    estimatedMonthlySavingsUsd: 12.30,
    details: "50GB gp3 volume unattached"
  },
  {
    id: "snap-abcdef1234567890",
    type: "EBS Snapshot",
    region: "eu-west-1",
    estimatedMonthlySavingsUsd: 8.75,
    details: "Snapshot older than 30 days"
  }
];

export async function fetchCostSummary(): Promise<CostSummary> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockCostSummary;
}

export async function fetchUnusedResources(): Promise<UnusedResource[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  return mockUnusedResources;
}

export async function requestWeeklyReport(payload: WeeklyReportRequest): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("Weekly report requested:", payload);
}

export async function subscribeBudgetAlerts(payload: SubscribeRequest): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("Subscribed to budget alerts:", payload);
}