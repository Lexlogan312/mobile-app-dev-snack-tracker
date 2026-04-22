/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SnacksProvider } from './context/SnacksContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ShoppingListProvider } from './context/ShoppingListContext';
import { SettingsProvider } from './context/SettingsContext';
import { SuggestionsProvider } from './context/SuggestionsContext';
import { ScannerProvider } from './context/ScannerContext';

import BottomNav from './components/layout/BottomNav';
import AdminRoute from './components/admin/AdminRoute';

import Home from './pages/Home';
import SnackDetail from './pages/SnackDetail';
import Favorites from './pages/Favorites';
import ShoppingList from './pages/ShoppingList';
import AdminDashboard from './pages/AdminDashboard';
import AdminAddEditSnack from './pages/AdminAddEditSnack';
import AdminLogin from './pages/AdminLogin';
import AdminSettings from './pages/AdminSettings';
import Suggestions from './pages/Suggestions';

function AppContent() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-sans text-[var(--color-text-primary)] pb-safe">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/snack/:id" element={<SnackDetail />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/suggestions" element={<Suggestions />} />
        
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route path="/shopping-list" element={
          <AdminRoute>
            <ShoppingList />
          </AdminRoute>
        } />
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/settings" element={
          <AdminRoute>
            <AdminSettings />
          </AdminRoute>
        } />
        <Route path="/admin/snack/new" element={
          <AdminRoute>
            <AdminAddEditSnack />
          </AdminRoute>
        } />
        <Route path="/admin/snack/:id/edit" element={
          <AdminRoute>
            <AdminAddEditSnack />
          </AdminRoute>
        } />
      </Routes>
      
      <BottomNav />
      
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            borderRadius: '16px',
            padding: '12px 24px',
            fontWeight: 'bold',
            marginBottom: '80px',
            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.15)',
            border: '1px solid var(--color-border)'
          },
          success: {
            style: { background: 'var(--color-accent-mint)', color: '#1E1033' },
            iconTheme: { primary: '#1E1033', secondary: 'var(--color-accent-mint)' }
          },
          error: {
            style: { background: 'var(--color-accent-peach)', color: '#1E1033' },
            iconTheme: { primary: '#1E1033', secondary: 'var(--color-accent-peach)' }
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SnacksProvider>
          <FavoritesProvider>
            <ShoppingListProvider>
              <SuggestionsProvider>
                <ScannerProvider>
                  <Router>
                    <AppContent />
                  </Router>
                </ScannerProvider>
              </SuggestionsProvider>
            </ShoppingListProvider>
          </FavoritesProvider>
        </SnacksProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
