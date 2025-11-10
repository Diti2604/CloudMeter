import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import ReportsPage from "./components/ReportsPage";

type Page = 'dashboard' | 'reports';

export default function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'reports':
        return <ReportsPage onBack={() => setCurrentPage('dashboard')} />;
      default:
        return <Dashboard onNavigateToReports={() => setCurrentPage('reports')} />;
    }
  };

  return (
    <div className="app">
      {currentPage === 'dashboard' && (
        <header className="header">
          <h1>CloudMeter</h1>
          <p className="subtitle">Weekly cost insights, unused resources, and budget alerts</p>
        </header>
      )}
      <main>
        {renderPage()}
      </main>
      {currentPage === 'dashboard' && (
        <footer className="footer">© {new Date().getFullYear()} Cost Optimizer</footer>
      )}
    </div>
  );
}