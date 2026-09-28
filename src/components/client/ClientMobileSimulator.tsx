import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientHeader } from './ClientHeader';
import { ClientMenu } from './ClientMenu';
import { ClientCart } from './ClientCart';
import { ClientTracking } from './ClientTracking';
import { ClientProfile } from './ClientProfile';
import { ClientBottomNav } from './ClientBottomNav';
import { ClientAuthModal } from './ClientAuthModal';
import { Wifi, Battery, Signal, Smartphone, Maximize2 } from 'lucide-react';

export const ClientMobileSimulator: React.FC = () => {
  const { currentCustomer, clientTab, language, clientSimulatorMode, setClientSimulatorMode } = useApp();
  const [currentTime, setCurrentTime] = useState('19:45');
  const isArabic = language === 'ar';

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

  const renderClientBody = () => (
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
  );

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 bg-[#0a0a0c] overflow-y-auto">
      {/* Desktop / Tablet Mode Switcher Bar (Hidden on small mobile) */}
      <div className="hidden sm:flex items-center gap-2 mb-3 bg-zinc-900/90 px-3 py-1.5 rounded-2xl border border-zinc-800 text-xs shadow-md">
        <span className="text-zinc-400 font-medium mr-1">
          {isArabic ? 'عرض الزبون :' : 'Affichage client :'}
        </span>
        <button
          onClick={() => setClientSimulatorMode('frame')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition ${
            clientSimulatorMode === 'frame'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{isArabic ? 'هاتف (إطار)' : 'Smartphone (Cadré)'}</span>
        </button>

        <button
          onClick={() => setClientSimulatorMode('fluid')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition ${
            clientSimulatorMode === 'fluid'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{isArabic ? 'شاشة كاملة / تابلت' : 'Plein Écran / Tablette'}</span>
        </button>
      </div>

      {/* Screen Mode 1: Real Mobile (< 640px) OR Tablet/PC in Fluid Mode */}
      <div
        className={`w-full h-full flex flex-col ${
          clientSimulatorMode === 'fluid'
            ? 'sm:max-w-3xl lg:max-w-4xl sm:h-[calc(100dvh-130px)] sm:rounded-3xl sm:border sm:border-zinc-800 sm:shadow-2xl overflow-hidden'
            : 'sm:hidden'
        }`}
      >
        {renderClientBody()}
      </div>

      {/* Screen Mode 2: Framed Phone Simulator (Only on screens >= sm when frame mode is selected) */}
      {clientSimulatorMode === 'frame' && (
        <div className="hidden sm:flex relative w-full max-w-[390px] h-[844px] max-h-[calc(100vh-130px)] rounded-[48px] bg-[#121215] border-[10px] border-[#25252b] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_80px_rgba(249,115,22,0.06)] flex-col overflow-hidden ring-1 ring-zinc-700/60">
          {/* Dynamic Island & Status Bar */}
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

          {/* Main Phone Viewport */}
          {renderClientBody()}

          {/* Home bar indicator pill at bottom */}
          <div className="h-4 bg-[#161619] flex items-center justify-center shrink-0">
            <div className="w-32 h-1 bg-zinc-600/80 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};
