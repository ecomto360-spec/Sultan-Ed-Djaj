import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientHeader } from './ClientHeader';
import { ClientMenu } from './ClientMenu';
import { ClientCart } from './ClientCart';
import { ClientTracking } from './ClientTracking';
import { ClientProfile } from './ClientProfile';
import { ClientBottomNav } from './ClientBottomNav';
import { ClientAuthModal } from './ClientAuthModal';

interface ClientAppProps {
  /**
   * When true, renders only the inner client viewport (used inside /conception simulator).
   * When false or omitted (route /), renders the standalone mobile-first full-screen layout
   * with centered max-w-[480px] container on desktop.
   */
  embedded?: boolean;
}

export const ClientApp: React.FC<ClientAppProps> = ({ embedded = false }) => {
  const { currentCustomer, clientTab, language } = useApp();

  useEffect(() => {
    if (!embedded && typeof document !== 'undefined') {
      document.title = 'Sultan Ed-Djaj (سلطان الدجاج) – Commande en ligne 24h/24';
    }
  }, [embedded]);

  const clientBody = (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-[#f8f7f4] dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 h-full w-full transition-colors">
      {!currentCustomer ? (
        <ClientAuthModal />
      ) : (
        <>
          {/* Client App Top Bar */}
          <ClientHeader />

          {/* Active Client Tab */}
          {clientTab === 'menu' && <ClientMenu />}
          {clientTab === 'cart' && <ClientCart />}
          {clientTab === 'tracking' && <ClientTracking />}
          {clientTab === 'profile' && <ClientProfile />}

          {/* Bottom Navigation Bar */}
          <ClientBottomNav />
        </>
      )}
    </div>
  );

  if (embedded) {
    return clientBody;
  }

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className={`min-h-dvh h-dvh w-full bg-[#edebe4] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans flex justify-center overflow-hidden transition-colors ${
        language === 'ar' ? 'font-arabic' : ''
      }`}
    >
      <main className="w-full max-w-[480px] h-full flex flex-col bg-[#f8f7f4] dark:bg-[#121215] sm:border-x sm:border-zinc-300 dark:sm:border-zinc-800/80 sm:shadow-[0_0_60px_rgba(0,0,0,0.15)] dark:sm:shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden transition-colors">
        {clientBody}
      </main>
    </div>
  );
};
