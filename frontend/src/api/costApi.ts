import axios from 'axios';
import { CostSummary, WeeklyReportRequest, SubscribeRequest, WeeklyReport } from "../types";

const BASE_URL = process.env.REACT_APP_API_BASE_URL  //"|| https://fallback-api.cost-optimizer.example.com";

if (!process.env.REACT_APP_API_BASE_URL) {
  console.warn("REACT_APP_API_BASE_URL not found in environment, using fallback URL:", BASE_URL);
}


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

const mockWeeklyReport: WeeklyReport = {
  period: "October 28 - November 3, 2024",
  totalCost: 1247.85,
  weeklyChange: -12.5,
  potentialSavings: 0,
  resourceCount: 47,
  costBreakdown: [
    { service: "EC2 Instances", currentCost: 487.20, previousCost: 532.10, change: -8.4 },
    { service: "S3 Storage", currentCost: 234.50, previousCost: 198.30, change: 18.2 },
    { service: "RDS Database", currentCost: 289.15, previousCost: 301.45, change: -4.1 },
    { service: "Lambda Functions", currentCost: 45.80, previousCost: 52.20, change: -12.3 },
    { service: "CloudWatch", currentCost: 191.20, previousCost: 187.95, change: 1.7 }
  ],
  unusedResources: [],
  recommendations: [
    "Consider using Reserved Instances for EC2 workloads that run consistently to save up to 75%",
    "Enable S3 Intelligent Tiering to automatically optimize storage costs",
    "Right-size your RDS instances based on actual CPU and memory utilization",
    "Use AWS Lambda Provisioned Concurrency only when necessary to avoid idle charges",
    "Set up CloudWatch billing alerts to monitor spending thresholds"
  ]
};

export async function fetchCostSummary(): Promise<CostSummary> {
  try {
    const res = await axios.get(`${BASE_URL}/api/costs`);
    
    // The API returns the data directly, not wrapped in another object
    const apiData = res.data;
    
    // Map API response to expected format
    const mappedData: CostSummary = {
      // Primary fields from API
      totalCost: apiData.totalCost || 0,
      periodStart: apiData.periodStart || new Date().toISOString(),
      periodEnd: apiData.periodEnd || new Date().toISOString(),
      trend: apiData.trend || "",
      byService: apiData.byService || [],
      // Required legacy fields
      total: apiData.totalCost || 0,
      byTag: apiData.byService?.map((item: any) => ({
        tag: item.service,
        cost: item.cost
      })) || []
    };
    
    return mappedData;
  } catch (error) {
    console.error("Failed to fetch cost data from API:", error);
    console.warn("Using fallback mock data");
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      ...mockCostSummary,
      totalCost: mockCostSummary.total,
      total: mockCostSummary.total, // Ensure required field is present
      byService: mockCostSummary.byTag?.map(item => ({
        service: item.tag,
        cost: item.cost
      })) || []
    };
  }
}

export async function fetchLatestReport(): Promise<any> {
  try {
    const res = await axios.get(`${BASE_URL}/api/reports`);
    return res.data;
  } catch (error) {
    console.warn("Failed to fetch report data from API:", error);
    throw error;
  }
}

export async function requestWeeklyReport(payload: WeeklyReportRequest): Promise<void> {
  try {
    await axios.post(`${BASE_URL}/api/reports/weekly`, payload);
  } catch (error) {
    console.warn("Failed to request weekly report, using mock:", error);
    // Simulate API delay for fallback
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export async function subscribeBudgetAlerts(payload: SubscribeRequest): Promise<void> {
  try {
    await axios.post(`${BASE_URL}/api/budget/subscribe`, payload);
  } catch (error) {
    console.warn("Failed to subscribe to budget alerts, using mock:", error);
    // Simulate API delay for fallback
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export async function fetchWeeklyReport(): Promise<WeeklyReport> {
  try {
    const res = await axios.get(`${BASE_URL}/api/reports/weekly`);
    return res.data;
  } catch (error) {
    console.warn("Failed to fetch weekly report from API, using mock data:", error);
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 2000));
    return mockWeeklyReport;
  }
}