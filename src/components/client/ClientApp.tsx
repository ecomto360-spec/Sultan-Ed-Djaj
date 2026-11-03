import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientHeader } from './ClientHeader';
import { ClientDrawer } from './ClientDrawer';
import { ClientMenu } from './ClientMenu';
import { ClientCart } from './ClientCart';
import { ClientTracking } from './ClientTracking';
import { ClientProfile } from './ClientProfile';
import { ClientStoreLocator } from './ClientStoreLocator';
import { ClientStickyCartBar } from './ClientStickyCartBar';
import { ClientInfoModals } from './ClientInfoModals';
import { ClientBottomNav } from './ClientBottomNav';
import { ClientAuthModal } from './ClientAuthModal';

interface ClientAppProps {
  embedded?: boolean;
}

export const ClientApp: React.FC<ClientAppProps> = ({ embedded = false }) => {
  const { currentCustomer, clientTab, setClientTab, language } = useApp();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [infoModalType, setInfoModalType] = useState<'about' | 'cgu' | 'privacy' | 'contact' | null>(null);

  useEffect(() => {
    if (!embedded && typeof document !== 'undefined') {
      document.title = 'Sultan Ed-Djaj (سلطان الدجاج) – Commande en ligne 24h/24';
    }
  }, [embedded]);

  const handleNavigate = (tab: 'menu' | 'cart' | 'tracking' | 'profile' | 'store_locator' | 'favorites') => {
    if (tab === 'favorites') {
      setClientTab('menu');
    } else if (tab === 'store_locator') {
      setClientTab('store_locator' as any);
    } else {
      setClientTab(tab as any);
    }
  };

  const clientBody = (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-[#f8f7f4] dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 h-full w-full transition-colors">
      {!currentCustomer ? (
        <ClientAuthModal />
      ) : (
        <>
          {/* Header Bar with Logo, Hamburger & KFC Delivery Toggle */}
          <ClientHeader
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenCart={() => setClientTab('cart')}
            orderType={orderType}
            onOrderTypeChange={setOrderType}
          />

          {/* Active Client View */}
          {clientTab === 'menu' && <ClientMenu />}
          {clientTab === 'cart' && <ClientCart />}
          {clientTab === 'tracking' && <ClientTracking />}
          {clientTab === 'profile' && <ClientProfile />}
          {(clientTab as string) === 'store_locator' && <ClientStoreLocator />}

          {/* Floating Sticky Cart Bottom Bar */}
          <ClientStickyCartBar onOpenCart={() => setClientTab('cart')} />

          {/* Bottom Navigation Bar */}
          <ClientBottomNav />

          {/* Hamburger Drawer Overlay */}
          <ClientDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onNavigate={handleNavigate}
            onOpenInfoModal={setInfoModalType}
          />

          {/* Legal / Info Modals */}
          <ClientInfoModals
            type={infoModalType}
            isOpen={Boolean(infoModalType)}
            onClose={() => setInfoModalType(null)}
          />
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
