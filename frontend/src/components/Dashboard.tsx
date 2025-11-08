import React, { useEffect, useState } from "react";
import { fetchCostSummary, fetchUnusedResources, requestWeeklyReport, subscribeBudgetAlerts } from "../api/costApi";
import { CostSummary, UnusedResource } from "../types";
import CostChart from "./CostChart";
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, Mail, Download, FileText } from "./Icons";

interface DashboardProps {
  onNavigateToReports: () => void;
}

export default function Dashboard({ onNavigateToReports }: DashboardProps): JSX.Element {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [unused, setUnused] = useState<UnusedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [budgetThreshold, setBudgetThreshold] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, u] = await Promise.all([fetchCostSummary(), fetchUnusedResources()]);
        if (!mounted) return;
        setSummary(s);
        setUnused(u);
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

  const totalSavings = unused.reduce((acc, resource) => acc + resource.estimatedMonthlySavingsUsd, 0);

  return (
    <div className="dashboard">
      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">${summary?.total.toFixed(2) || "0.00"}</div>
            <div className="metric-label">Total Cost</div>
          </div>
        </div>

        <div className="metric-card">
          <div className={`metric-icon ${summary && summary.weeklyDeltaPercent < 0 ? 'positive' : 'negative'}`}>
            {summary && summary.weeklyDeltaPercent < 0 ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
          </div>
          <div className="metric-content">
            <div className={`metric-value ${summary && summary.weeklyDeltaPercent < 0 ? 'positive' : 'negative'}`}>
              {summary?.weeklyDeltaPercent.toFixed(1) || "0.0"}%
            </div>
            <div className="metric-label">Weekly Change</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon warning">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{unused.length}</div>
            <div className="metric-label">Unused Resources</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon positive">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">${totalSavings.toFixed(2)}</div>
            <div className="metric-label">Potential Savings</div>
          </div>
        </div>
      </div>

      {/* Cost Chart */}
      <div className="chart-section">
        <div className="card">
          <h2>Cost Breakdown by Tags</h2>
          {summary?.byTag ? (
            <CostChart data={summary.byTag} />
          ) : (
            <div className="no-data">No cost data available</div>
          )}
        </div>
      </div>

      {/* Unused Resources */}
      <div className="card">
        <h2>Unused Resources</h2>
        {unused.length ? (
          <div className="resources-list">
            {unused.map((resource) => (
              <div key={resource.id} className="resource-item">
                <div className="resource-main">
                  <div className="resource-type">{resource.type}</div>
                  <div className="resource-id">{resource.id}</div>
                  <div className="resource-region">{resource.region || "Global"}</div>
                </div>
                <div className="resource-savings">
                  <div className="savings-amount">${resource.estimatedMonthlySavingsUsd.toFixed(2)}/mo</div>
                  <div className="savings-label">Potential Savings</div>
                </div>
                {resource.details && (
                  <div className="resource-details">{resource.details}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No unused resources found! 🎉</div>
        )}
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
          <h3><AlertTriangle size={20} /> Budget Alerts</h3>
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