import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AssetPage from './pages/AssetPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import FamilyManagement from './pages/FamilyManagement';
import Appearance from './pages/Appearance';
import Security from './pages/Security';
import DataExport from './pages/DataExport';
import { AuthProvider } from './context/AuthContext';
import { AssetProvider } from './context/AssetContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AssetProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/stocks" element={<ProtectedRoute><AssetPage type="Stocks" /></ProtectedRoute>} />
                <Route path="/crypto" element={<ProtectedRoute><AssetPage type="Crypto" /></ProtectedRoute>} />
                <Route path="/commodities" element={<ProtectedRoute><AssetPage type="Commodities" /></ProtectedRoute>} />
                <Route path="/real-estate" element={<ProtectedRoute><AssetPage type="Real Estate" /></ProtectedRoute>} />
                <Route path="/etfs" element={<ProtectedRoute><AssetPage type="ETFs" /></ProtectedRoute>} />
                <Route path="/bonds" element={<ProtectedRoute><AssetPage type="Bonds" /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/family" element={<ProtectedRoute><FamilyManagement /></ProtectedRoute>} />
                <Route path="/appearance" element={<ProtectedRoute><Appearance /></ProtectedRoute>} />
                <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
                <Route path="/export" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </AssetProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;

