import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import IdeaValidator from './components/IdeaValidator';
import CodeGenerator from './components/CodeGenerator';
import CodeStudio from './components/CodeStudio';
import PlagiarismChecker from './components/PlagiarismChecker';
import LiteratureReview from './components/LiteratureReview';
import PrototypeBuilder from './components/PrototypeBuilder';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import { apiService } from './services/api';

// New sidebar components
import Analytics from './components/Analytics';
import Reports from './components/Reports';
import Rewards from './components/Rewards';
import Wallet from './components/Wallet';
import Tasks from './components/Tasks';
import Settings from './components/Settings';

const queryClient = new QueryClient();

const ProtectedLayout = () => {
  if (!apiService.auth.getToken()) {
    return <Navigate to="/login" replace />;
  }
  return <DashboardLayout />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<LandingPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/idea-validator" element={<IdeaValidator />} />
          <Route path="/code-generator" element={<CodeGenerator />} />
          <Route path="/codestudio" element={<CodeStudio />} />
          <Route path="/plagiarism-checker" element={<PlagiarismChecker />} />
          <Route path="/literature-review" element={<LiteratureReview />} />
          <Route path="/prototype-builder" element={<PrototypeBuilder />} />
          
          {/* New sidebar routes */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </Router>
  </QueryClientProvider>
);

export default App;
