import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseSearch from './pages/CaseSearch';
import EntityProfile from './pages/EntityProfile';
import KnowledgeGraph from './pages/KnowledgeGraph';
import AlertsFindings from './pages/AlertsFindings';
import MOSimilarity from './pages/MOSimilarity';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
            <Route path="alerts" element={<AlertsFindings />} />
            <Route path="mo-similarity" element={<MOSimilarity />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
