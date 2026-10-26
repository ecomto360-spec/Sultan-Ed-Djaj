import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { HeaderBar } from './components/common/HeaderBar';
import { ClientMobileSimulator } from './components/client/ClientMobileSimulator';
import { ClientApp } from './components/client/ClientApp';
import { AdminApp } from './components/commercial/AdminApp';

/**
 * /conception : Vue de conception & prototypage conservée à l'identique
 * (Bandeau Prototype Sultan Ed-Djaj, bascule Vue Client / Vue Commercial,
 * options Smartphone Cadré / Plein écran, langue FR/AR).
 * Réutilise ClientApp (via ClientMobileSimulator) et AdminApp sans duplication.
 */
const ConceptionLayout: React.FC = () => {
  const { view, language } = useApp();

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className={`min-h-screen flex flex-col bg-[#f8f7f4] dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 font-sans ${
        language === 'ar' ? 'font-arabic' : ''
      }`}
    >
      {/* Bandeau Prototype Sultan Ed-Djaj – Basculer la vue */}
      <HeaderBar />

      {/* Zone principale réutilisant ClientApp et AdminApp */}
      <div className="flex-1 flex flex-col min-h-0">
        {view === 'client' ? (
          <ClientMobileSimulator />
        ) : (
          <AdminApp embedded />
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* / -> Vue Client uniquement, mobile-first, plein écran, max-w 480px sur desktop */}
            <Route path="/" element={<ClientApp />} />

            {/* /admin -> Vue Commercial (Back-Office) uniquement, plein écran, sélecteur de rôle conservé */}
            <Route path="/admin" element={<AdminApp />} />

            {/* /conception -> Vue Prototype complète conservée à l'identique */}
            <Route path="/conception" element={<ConceptionLayout />} />

            {/* Toute autre route -> redirection vers / */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
