// Mock data for frontend development - replace with real API calls later
import { CostSummary, UnusedResource, WeeklyReportRequest, SubscribeRequest, WeeklyReport } from "../types";

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

const mockWeeklyReport: WeeklyReport = {
  period: "October 28 - November 3, 2024",
  totalCost: 1247.85,
  weeklyChange: -12.5,
  potentialSavings: 156.65,
  resourceCount: 47,
  costBreakdown: [
    { service: "EC2 Instances", currentCost: 487.20, previousCost: 532.10, change: -8.4 },
    { service: "S3 Storage", currentCost: 234.50, previousCost: 198.30, change: 18.2 },
    { service: "RDS Database", currentCost: 289.15, previousCost: 301.45, change: -4.1 },
    { service: "Lambda Functions", currentCost: 45.80, previousCost: 52.20, change: -12.3 },
    { service: "CloudWatch", currentCost: 191.20, previousCost: 187.95, change: 1.7 }
  ],
  unusedResources: [
    {
      type: "EC2 Instance",
      id: "i-0123456789abcdef0",
      region: "us-east-1",
      monthlySavings: 45.60,
      recommendation: "Stop or terminate this t3.medium instance that has been idle for 15 days"
    },
    {
      type: "EBS Volume",
      id: "vol-0987654321fedcba0",
      region: "us-west-2",
      monthlySavings: 12.30,
      recommendation: "Delete this unattached 50GB gp3 volume to save on storage costs"
    },
    {
      type: "EBS Snapshot",
      id: "snap-abcdef1234567890",
      region: "eu-west-1",
      monthlySavings: 8.75,
      recommendation: "Delete snapshots older than 30 days or move to cheaper storage class"
    },
    {
      type: "NAT Gateway",
      id: "nat-0fedcba987654321",
      region: "us-east-1",
      monthlySavings: 90.00,
      recommendation: "Replace NAT Gateway with NAT Instance for lower traffic workloads"
    }
  ],
  recommendations: [
    "Consider using Reserved Instances for EC2 workloads that run consistently to save up to 75%",
    "Enable S3 Intelligent Tiering to automatically optimize storage costs",
    "Right-size your RDS instances based on actual CPU and memory utilization",
    "Use AWS Lambda Provisioned Concurrency only when necessary to avoid idle charges",
    "Set up CloudWatch billing alerts to monitor spending thresholds",
    "Review and delete unused security groups, elastic IPs, and load balancers",
    "Consider using Spot Instances for non-critical batch processing workloads"
  ]
};

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

export async function fetchWeeklyReport(): Promise<WeeklyReport> {
  // Simulate API delay for report generation
  await new Promise(resolve => setTimeout(resolve, 2000));
  return mockWeeklyReport;
}