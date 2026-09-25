import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientHeader } from './ClientHeader';
import { ClientMenu } from './ClientMenu';
import { ClientCart } from './ClientCart';
import { ClientTracking } from './ClientTracking';
import { ClientProfile } from './ClientProfile';
import { ClientBottomNav } from './ClientBottomNav';
import { ClientAuthModal } from './ClientAuthModal';
import { Wifi, Battery, Signal } from 'lucide-react';

export const ClientMobileSimulator: React.FC = () => {
  const { currentCustomer, clientTab, language } = useApp();
  const [currentTime, setCurrentTime] = useState('19:45');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-2 sm:p-4 bg-[#0a0a0c] overflow-y-auto">
      {/* Phone outer wrapper (390 x 844 target, responsive to viewport) */}
      <div className="relative w-full max-w-[390px] h-[844px] max-h-[calc(100vh-80px)] rounded-[40px] sm:rounded-[48px] bg-[#121215] border-[8px] sm:border-[10px] border-[#25252b] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_80px_rgba(249,115,22,0.06)] flex flex-col overflow-hidden ring-1 ring-zinc-700/60">
        
        {/* Dynamic Island / Notch & Status Bar */}
        <div className="h-10 bg-[#121215] shrink-0 px-6 flex items-center justify-between z-40 select-none border-b border-zinc-900/60">
          {/* Time */}
          <span className="text-xs font-semibold text-zinc-300 font-mono tracking-tight">
            {currentTime}
          </span>

          {/* Dynamic Island pill */}
          <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center gap-1.5 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-zinc-800" />
            <span className="w-2 h-2 rounded-full bg-zinc-900" />
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Signal className="w-3 h-3 text-zinc-400" />
            <Wifi className="w-3 h-3 text-zinc-400" />
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Main Phone Viewport Area */}
        <div className="relative flex-1 flex flex-col overflow-hidden bg-[#121215]">
          {!currentCustomer ? (
            <ClientAuthModal />
          ) : (
            <>
              {/* Client App Top Bar */}
              <ClientHeader />

              {/* View body based on clientTab */}
              {clientTab === 'menu' && <ClientMenu />}
              {clientTab === 'cart' && <ClientCart />}
              {clientTab === 'tracking' && <ClientTracking />}
              {clientTab === 'profile' && <ClientProfile />}

              {/* Bottom Nav Bar */}
              <ClientBottomNav />
            </>
          )}
        </div>

        {/* Home bar indicator pill at bottom */}
        <div className="h-4 bg-[#161619] flex items-center justify-center shrink-0">
          <div className="w-32 h-1 bg-zinc-600/80 rounded-full" />
        </div>
      </div>
    </div>
  );
};
