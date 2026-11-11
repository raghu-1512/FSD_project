import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Medicines } from './pages/Medicines';
import { Batches } from './pages/Batches';
import { ExpiryAlerts } from './pages/ExpiryAlerts';
import { Recalls } from './pages/Recalls';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

// Layout wrapper for authenticated pages
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area (offset by sidebar width on large screens) */}
      <div className="lg:pl-68 flex flex-col flex-1 min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Academic Project Footer */}
        <footer className="px-6 py-4 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
          <p className="leading-relaxed">
            <strong>Medicine Expiry & Recall Alert System</strong> · Academic Full Stack Development (FSD) Project · Frontend LocalStorage Demonstration
          </p>
        </footer>
      </div>
    </div>
  );
};

// Login Route Guard: if already logged in, redirect to dashboard
const LoginRoute: React.FC = () => {
  const { user } = useApp();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />

          <Route
            path="/"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />

          <Route
            path="/medicines"
            element={
              <AppLayout>
                <Medicines />
              </AppLayout>
            }
          />

          <Route
            path="/batches"
            element={
              <AppLayout>
                <Batches />
              </AppLayout>
            }
          />

          <Route
            path="/expiry-alerts"
            element={
              <AppLayout>
                <ExpiryAlerts />
              </AppLayout>
            }
          />

          <Route
            path="/recalls"
            element={
              <AppLayout>
                <Recalls />
              </AppLayout>
            }
          />

          <Route
            path="/inventory"
            element={
              <AppLayout>
                <Inventory />
              </AppLayout>
            }
          />

          <Route
            path="/reports"
            element={
              <AppLayout>
                <Reports />
              </AppLayout>
            }
          />

          <Route
            path="/settings"
            element={
              <AppLayout>
                <Settings />
              </AppLayout>
            }
          />

          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
