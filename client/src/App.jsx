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
import { ProfileAnalysis } from './pages/ProfileAnalysis';
import { Ideas } from './pages/Ideas';
import { Calendar } from './pages/Calendar';
import { Posts } from './pages/Posts';
import { PostImport } from './pages/PostImport';
import { PostDetails } from './pages/PostDetails';
import { Campaigns } from './pages/Campaigns';
import { Settings } from './pages/Settings';

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
              <Route path="/profiles/:id/analysis" element={<ProfileAnalysis />} />
              <Route path="/analyze" element={<ProfileAnalysis />} />
              <Route path="/ideas" element={<Ideas />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/posts" element={<Posts />} />
              <Route path="/posts/import" element={<PostImport />} />
              <Route path="/posts/:id" element={<PostDetails />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/settings" element={<Settings />} />
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
