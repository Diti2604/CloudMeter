import React, { useEffect, useState } from "react";
import { fetchCostSummary } from "../api/costApi";
import { CostSummary } from "../types";
import CostChart from "./CostChart";
import { DollarSign, TrendingDown, TrendingUp, Mail, FileText, AlertTriangle } from "./Icons";

interface DashboardProps {
  onNavigateToReports: () => void;
}

export default function Dashboard({ onNavigateToReports }: DashboardProps): JSX.Element {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await fetchCostSummary();
        if (!mounted) return;
        setSummary(s);
      } catch (err) {
        console.error("Load error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">${(summary?.totalCost || summary?.total || 0).toFixed(2)}</div>
            <div className="metric-label">Total Cost</div>
          </div>
        </div>

        <div className="metric-card">
          <div className={`metric-icon ${summary && typeof summary.weeklyDeltaPercent === 'number' && summary.weeklyDeltaPercent < 0 ? 'positive' : 'negative'}`}>
            {summary && typeof summary.weeklyDeltaPercent === 'number' && summary.weeklyDeltaPercent < 0 ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
          </div>
          <div className="metric-content">
            <div className={`metric-value ${summary && typeof summary.weeklyDeltaPercent === 'number' && summary.weeklyDeltaPercent < 0 ? 'positive' : 'negative'}`}>
              {typeof summary?.weeklyDeltaPercent === 'number' ? `${summary.weeklyDeltaPercent.toFixed(1)}%` : summary?.trend || "0.0%"}
            </div>
            <div className="metric-label">{summary?.trend ? "Trend" : "Weekly Change"}</div>
          </div>
        </div>
      </div>

      {/* Cost Chart */}
      <div className="chart-section">
        <div className="card">
          <h2>Cost Breakdown by Services</h2>
          {(summary?.byTag || summary?.byService) ? (
            <CostChart data={summary.byTag || summary.byService?.map(item => ({ tag: item.service, cost: item.cost })) || []} />
          ) : (
            <div className="no-data">No cost data available</div>
          )}
        </div>
      </div>

      {/* Automation Features */}
      <div className="automation-grid">
        <div className="card automation-card">
          <div className="automation-header">
            <FileText size={24} />
            <h3>Cost Reports</h3>
          </div>
          <div className="automation-purpose">Cost Reports</div>
          <div className="automation-description">
            "Weekly cost report automatically generated every Monday at 9 AM."
          </div>
        </div>

        <div className="card automation-card">
          <div className="automation-header">
            <Mail size={24} />
            <h3>Weekly Reports</h3>
          </div>
          <div className="automation-purpose">Email </div>
          <div className="automation-description">
            "Reports are delivered directly to your verified email via Amazon SES."
          </div>
        </div>

        <div className="card automation-card">
          <div className="automation-header">
            <AlertTriangle size={24} />
            <h3>Budget Alerts</h3>
          </div>
          <div className="automation-purpose">AWS Budgets</div>
          <div className="automation-description">
            "Budget thresholds are monitored through AWS Budgets; alerts are sent when exceeded."
          </div>
        </div>
      </div>
    </div>
  );
}