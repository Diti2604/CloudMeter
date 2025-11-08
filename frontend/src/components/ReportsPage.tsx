import React, { useState, useEffect } from "react";
import { fetchWeeklyReport } from "../api/costApi";
import { WeeklyReport } from "../types";
import { Download, FileText, Calendar, DollarSign, TrendingDown, TrendingUp, ArrowLeft } from "./Icons";

interface ReportsPageProps {
  onBack: () => void;
}

export default function ReportsPage({ onBack }: ReportsPageProps): JSX.Element {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const reportData = await fetchWeeklyReport();
      setReport(reportData);
    } catch (err) {
      setError("Failed to generate report. Please try again.");
      console.error("Report generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!report) return;
    
    // Create a new window with the PDF content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const pdfContent = generatePDFContent(report);
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Trigger print dialog for PDF generation
    setTimeout(() => {
      printWindow.print();
    }, 100);
  };

  const generatePDFContent = (reportData: WeeklyReport): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AWS Cost Report - ${reportData.period}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: white;
            padding: 20px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #0066cc;
            padding-bottom: 20px;
          }
          .header h1 { 
            color: #0066cc; 
            font-size: 28px; 
            margin-bottom: 5px; 
          }
          .header p { 
            color: #666; 
            font-size: 16px; 
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .summary-card { 
            background: #f8f9fa; 
            border: 1px solid #e9ecef; 
            border-radius: 8px; 
            padding: 20px; 
            text-align: center; 
          }
          .summary-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #0066cc; 
            margin-bottom: 5px; 
          }
          .summary-label { 
            font-size: 14px; 
            color: #666; 
          }
          .positive { color: #28a745 !important; }
          .negative { color: #dc3545 !important; }
          .section { 
            margin-bottom: 30px; 
          }
          .section h2 { 
            color: #333; 
            margin-bottom: 15px; 
            font-size: 20px;
            border-left: 4px solid #0066cc;
            padding-left: 10px;
          }
          .cost-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          .cost-table th, .cost-table td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
          }
          .cost-table th { 
            background-color: #0066cc; 
            color: white; 
            font-weight: 600;
          }
          .cost-table tr:nth-child(even) { 
            background-color: #f8f9fa; 
          }
          .resource-item { 
            background: #fff; 
            border: 1px solid #e9ecef; 
            border-radius: 6px; 
            padding: 15px; 
            margin-bottom: 10px; 
          }
          .resource-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 8px; 
          }
          .resource-type { 
            font-weight: bold; 
            color: #0066cc; 
          }
          .savings { 
            color: #28a745; 
            font-weight: bold; 
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            color: #666; 
            font-size: 12px; 
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AWS Cost Optimization Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()} | Period: ${reportData.period}</p>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-value">$${reportData.totalCost.toFixed(2)}</div>
            <div class="summary-label">Total Cost</div>
          </div>
          <div class="summary-card">
            <div class="summary-value ${reportData.weeklyChange >= 0 ? 'negative' : 'positive'}">
              ${reportData.weeklyChange >= 0 ? '+' : ''}${reportData.weeklyChange.toFixed(1)}%
            </div>
            <div class="summary-label">Weekly Change</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">$${reportData.potentialSavings.toFixed(2)}</div>
            <div class="summary-label">Potential Savings</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${reportData.resourceCount}</div>
            <div class="summary-label">Total Resources</div>
          </div>
        </div>

        <div class="section">
          <h2>Cost Breakdown by Service</h2>
          <table class="cost-table">
            <thead>
              <tr>
                <th>Service/Tag</th>
                <th>Current Cost</th>
                <th>Previous Week</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.costBreakdown.map(item => `
                <tr>
                  <td>${item.service}</td>
                  <td>$${item.currentCost.toFixed(2)}</td>
                  <td>$${item.previousCost.toFixed(2)}</td>
                  <td class="${item.change >= 0 ? 'negative' : 'positive'}">
                    ${item.change >= 0 ? '+' : ''}${item.change.toFixed(1)}%
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Unused Resources & Optimization Opportunities</h2>
          ${reportData.unusedResources.map(resource => `
            <div class="resource-item">
              <div class="resource-header">
                <span class="resource-type">${resource.type}</span>
                <span class="savings">Save $${resource.monthlySavings.toFixed(2)}/month</span>
              </div>
              <div><strong>Resource ID:</strong> ${resource.id}</div>
              <div><strong>Region:</strong> ${resource.region}</div>
              <div><strong>Recommendation:</strong> ${resource.recommendation}</div>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>Recommendations</h2>
          <ul style="padding-left: 20px;">
            ${reportData.recommendations.map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
          </ul>
        </div>

        <div class="footer">
          <p>This report was generated automatically by the AWS Cost Optimizer tool.</p>
          <p>For questions or support, please contact your system administrator.</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Cost Reports</h1>
        <p>Generate and view detailed AWS cost analysis reports</p>
      </div>

      <div className="reports-actions">
        <button 
          onClick={generateReport} 
          disabled={loading}
          className="generate-button"
        >
          <FileText size={20} />
          {loading ? "Generating Report..." : "Generate Weekly Report"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {report && (
        <div className="report-container">
          <div className="report-header">
            <div className="report-meta">
              <h2>Weekly Cost Report</h2>
              <div className="report-period">
                <Calendar size={16} />
                <span>{report.period}</span>
              </div>
            </div>
            <button onClick={downloadPDF} className="download-button">
              <Download size={16} />
              Download PDF
            </button>
          </div>

          <div className="report-content">
            {/* Summary Cards */}
            <div className="report-summary">
              <div className="summary-card">
                <div className="summary-icon">
                  <DollarSign size={24} />
                </div>
                <div className="summary-info">
                  <div className="summary-value">${report.totalCost.toFixed(2)}</div>
                  <div className="summary-label">Total Cost</div>
                </div>
              </div>

              <div className="summary-card">
                <div className={`summary-icon ${report.weeklyChange < 0 ? 'positive' : 'negative'}`}>
                  {report.weeklyChange < 0 ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
                </div>
                <div className="summary-info">
                  <div className={`summary-value ${report.weeklyChange < 0 ? 'positive' : 'negative'}`}>
                    {report.weeklyChange >= 0 ? '+' : ''}{report.weeklyChange.toFixed(1)}%
                  </div>
                  <div className="summary-label">Weekly Change</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon positive">
                  <DollarSign size={24} />
                </div>
                <div className="summary-info">
                  <div className="summary-value">${report.potentialSavings.toFixed(2)}</div>
                  <div className="summary-label">Potential Savings</div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="report-section">
              <h3>Cost Breakdown by Service</h3>
              <div className="cost-breakdown-table">
                <table>
                  <thead>
                    <tr>
                      <th>Service/Tag</th>
                      <th>Current Cost</th>
                      <th>Previous Week</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.costBreakdown.map((item, index) => (
                      <tr key={index}>
                        <td className="service-name">{item.service}</td>
                        <td className="cost-current">${item.currentCost.toFixed(2)}</td>
                        <td className="cost-previous">${item.previousCost.toFixed(2)}</td>
                        <td className={`cost-change ${item.change >= 0 ? 'negative' : 'positive'}`}>
                          {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Unused Resources */}
            <div className="report-section">
              <h3>Optimization Opportunities</h3>
              <div className="unused-resources">
                {report.unusedResources.map((resource, index) => (
                  <div key={index} className="unused-resource-card">
                    <div className="resource-header">
                      <div className="resource-type">{resource.type}</div>
                      <div className="savings-badge">${resource.monthlySavings.toFixed(2)}/mo</div>
                    </div>
                    <div className="resource-details">
                      <div className="resource-field">
                        <span className="field-label">Resource ID:</span>
                        <span className="field-value">{resource.id}</span>
                      </div>
                      <div className="resource-field">
                        <span className="field-label">Region:</span>
                        <span className="field-value">{resource.region}</span>
                      </div>
                      <div className="resource-field">
                        <span className="field-label">Recommendation:</span>
                        <span className="field-value">{resource.recommendation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="report-section">
              <h3>Recommendations</h3>
              <div className="recommendations-list">
                {report.recommendations.map((recommendation, index) => (
                  <div key={index} className="recommendation-item">
                    <div className="recommendation-bullet">•</div>
                    <div className="recommendation-text">{recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}