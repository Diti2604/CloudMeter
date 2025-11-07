import React, { useEffect, useState } from "react";

interface CostChartProps {
  data: Array<{ tag: string; cost: number }>;
}

export default function CostChart({ data }: CostChartProps): JSX.Element {
  const [animateChart, setAnimateChart] = useState(false);
  
  const colors = [
    { primary: "#00d4ff", secondary: "#0099cc" },
    { primary: "#00ff88", secondary: "#00cc6a" },
    { primary: "#ffb000", secondary: "#cc8800" },
    { primary: "#ff4757", secondary: "#cc3a47" },
    { primary: "#8b5cf6", secondary: "#7c3aed" },
    { primary: "#64ffda", secondary: "#4dd0e1" },
  ];
  
  const total = data.reduce((sum, item) => sum + item.cost, 0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateChart(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="modern-chart">
      <div className="chart-grid">
        {/* Donut Chart */}
        <div className="donut-chart-container">
          <div className="donut-chart">
            <svg width="280" height="280" viewBox="0 0 280 280">
              <defs>
                {colors.map((color, index) => (
                  <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color.primary} />
                    <stop offset="100%" stopColor={color.secondary} />
                  </linearGradient>
                ))}
              </defs>
              <circle
                cx="140"
                cy="140"
                r="100"
                fill="none"
                stroke="rgba(35, 53, 84, 0.3)"
                strokeWidth="20"
              />
              {data.map((item, index) => {
                const percentage = (item.cost / total) * 100;
                const strokeDasharray = `${(percentage / 100) * 628} 628`;
                const previousPercentages = data.slice(0, index).reduce((sum, prev) => sum + (prev.cost / total) * 100, 0);
                const rotation = (previousPercentages / 100) * 360 - 90;
                
                return (
                  <circle
                    key={item.tag}
                    cx="140"
                    cy="140"
                    r="100"
                    fill="none"
                    stroke={`url(#gradient-${index})`}
                    strokeWidth="20"
                    strokeDasharray={animateChart ? strokeDasharray : "0 628"}
                    strokeLinecap="round"
                    transform={`rotate(${rotation} 140 140)`}
                    className="donut-segment"
                  />
                );
              })}
            </svg>
            <div className="donut-center">
              <div className="donut-total">${total.toFixed(0)}</div>
              <div className="donut-label">Total Cost</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="chart-legend">
          <h3>Cost Breakdown</h3>
          <div className="legend-items">
            {data.map((item, index) => {
              const percentage = (item.cost / total) * 100;
              return (
                <div key={item.tag} className="legend-item">
                  <div 
                    className="legend-color"
                    style={{ background: `linear-gradient(135deg, ${colors[index % colors.length].primary}, ${colors[index % colors.length].secondary})` }}
                  ></div>
                  <div className="legend-content">
                    <div className="legend-tag">{item.tag}</div>
                    <div className="legend-values">
                      <span className="legend-amount">${item.cost.toFixed(2)}</span>
                      <span className="legend-percent">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}