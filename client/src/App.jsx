import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/common/AppLayout';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profiles } from './pages/Profiles';
import { ProfileNew } from './pages/ProfileNew';
import { ProfileDetails } from './pages/ProfileDetails';
import { Feedback } from './pages/Feedback';
import { Ideas } from './pages/Ideas';
import { Calendar } from './pages/Calendar';
import { Campaigns } from './pages/Campaigns';
import { Settings } from './pages/Settings';
import { SocialAccounts } from './pages/SocialAccounts';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes wrapped in AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/profiles/new" element={<ProfileNew />} />
              <Route path="/profiles/:id" element={<ProfileDetails />} />
              <Route path="/profiles/:id/feedback" element={<Feedback />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/creative-ideas" element={<Ideas />} />
              <Route path="/ideas" element={<Ideas />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/accounts" element={<SocialAccounts />} />
              <Route path="/settings" element={<Settings />} />

              {/* Seamless Deprecation Redirects for Old Routes */}
              <Route path="/analyze" element={<Navigate to="/feedback" replace />} />
              <Route path="/analysis" element={<Navigate to="/feedback" replace />} />
              <Route path="/profiles/:id/analysis" element={<Navigate to="/feedback" replace />} />
              <Route path="/posts" element={<Navigate to="/calendar" replace />} />
              <Route path="/posts/*" element={<Navigate to="/calendar" replace />} />
            </Route>

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
