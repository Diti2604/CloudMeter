import React from "react";
import Dashboard from "./components/Dashboard";

export default function App(): JSX.Element {
  return (
    <div className="app">
      <header className="header">
        <h1>Cloud Cost Optimizer</h1>
        <p className="subtitle">Weekly cost insights, unused resources, and budget alerts</p>
      </header>
      <main>
        <Dashboard />
      </main>
      <footer className="footer">© {new Date().getFullYear()} Cost Optimizer</footer>
    </div>
  );
}