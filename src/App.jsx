import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoModeProvider } from './context/DemoModeContext';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseSearch from './pages/CaseSearch';
import EntityProfile from './pages/EntityProfile';
import KnowledgeGraph from './pages/KnowledgeGraph';
import AlertsFindings from './pages/AlertsFindings';
import MOSimilarity from './pages/MOSimilarity';
import CaseCanvas from './pages/CaseCanvas';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="min-h-screen bg-[#0A192F] flex items-center justify-center text-white font-mono">Loading secure session...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <DemoModeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="cases" element={<CaseSearch />} />
              <Route path="entities" element={<EntityProfile />} />
              <Route path="graph" element={<KnowledgeGraph />} />
              <Route path="canvas" element={<CaseCanvas />} />
              <Route path="alerts" element={<AlertsFindings />} />
              <Route path="mo-similarity" element={<MOSimilarity />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </DemoModeProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
