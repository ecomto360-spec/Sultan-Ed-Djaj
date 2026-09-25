import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { HeaderBar } from './components/common/HeaderBar';
import { ClientMobileSimulator } from './components/client/ClientMobileSimulator';
import { CommercialBackOffice } from './components/commercial/CommercialBackOffice';

const MainLayout: React.FC = () => {
  const { view, language } = useApp();

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className={`min-h-screen flex flex-col bg-[#0c0c0e] text-zinc-100 font-sans ${
        language === 'ar' ? 'font-arabic' : ''
      }`}
    >
      {/* Dark Top Prototype Bar: Identical to Agro Rayane spec */}
      <HeaderBar />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {view === 'client' ? (
          <ClientMobileSimulator />
        ) : (
          <CommercialBackOffice />
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
