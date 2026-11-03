import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ClientApp } from './components/client/ClientApp';
import { AdminApp } from './components/commercial/AdminApp';

/**
 * Public storefront is the default route. The commercial workspace is only
 * mounted under /admin, including nested admin URLs and direct page reloads.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/admin/*" element={<AdminApp />} />
              <Route path="/" element={<ClientApp />} />
              {/* All non-admin paths stay in the client experience. */}
              <Route path="*" element={<ClientApp />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
