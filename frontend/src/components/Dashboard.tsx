import React, { useEffect, useState } from "react";
import { fetchCostSummary, requestWeeklyReport, subscribeBudgetAlerts } from "../api/costApi";
import { CostSummary } from "../types";
import CostChart from "./CostChart";
import { DollarSign, TrendingDown, TrendingUp, Mail, Download, FileText } from "./Icons";

interface DashboardProps {
  onNavigateToReports: () => void;
}

export default function Dashboard({ onNavigateToReports }: DashboardProps): JSX.Element {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [budgetThreshold, setBudgetThreshold] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

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

  const sendWeeklyReport = async () => {
    if (!summary || !email) return;
    setReportLoading(true);
    try {
      await requestWeeklyReport({ startDate: summary.periodStart, endDate: summary.periodEnd, email });
      alert("Weekly report requested successfully!");
    } catch (err) {
      alert("Failed to request report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  const subscribe = async () => {
    if (!email || !budgetThreshold) return;
    const threshold = parseFloat(budgetThreshold);
    if (isNaN(threshold) || threshold <= 0) {
      alert("Please enter a valid budget threshold amount.");
      return;
    }
    setSubscribeLoading(true);
    try {
      await subscribeBudgetAlerts({ budgetId: "default", email, thresholdPercent: threshold });
      alert(`Successfully subscribed to budget alerts! You'll be notified when spending exceeds $${threshold.toFixed(2)}.`);
    } catch (err) {
      alert("Failed to subscribe. Please try again.");
    } finally {
      setSubscribeLoading(false);
    }
  };

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

      {/* Actions */}
      <div className="actions-grid">
        <div className="card action-card">
          <h3><FileText size={20} /> Cost Reports</h3>
          <p>Generate detailed PDF reports with cost analysis and optimization recommendations</p>
          <div className="action-form">
            <button 
              onClick={onNavigateToReports}
              className="action-button primary"
            >
              <FileText size={16} />
              Generate Report
            </button>
          </div>
        </div>

        <div className="card action-card">
          <h3><Mail size={20} /> Weekly Reports</h3>
          <p>Get detailed cost analysis delivered to your inbox</p>
          <div className="action-form">
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email"
              className="email-input"
            />
            <button 
              onClick={sendWeeklyReport} 
              disabled={!email || reportLoading}
              className="action-button primary"
            >
              <Download size={16} />
              {reportLoading ? "Requesting..." : "Request Report"}
            </button>
          </div>
        </div>

        <div className="card action-card">
          <h3><Mail size={20} /> Budget Alerts</h3>
          <p>Get notified when spending exceeds your budget thresholds</p>
          <div className="action-form">
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email"
              className="email-input"
            />
            <div className="budget-input-group">
              <span className="currency-symbol">$</span>
              <input 
                type="number" 
                value={budgetThreshold} 
                onChange={(e) => setBudgetThreshold(e.target.value)} 
                placeholder="Enter budget threshold"
                className="budget-input"
                min="0"
                step="0.01"
              />
            </div>
            <button 
              onClick={subscribe} 
              disabled={!email || !budgetThreshold || subscribeLoading}
              className="action-button secondary"
            >
              <Mail size={16} />
              {subscribeLoading ? "Subscribing..." : "Subscribe to Alerts"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}