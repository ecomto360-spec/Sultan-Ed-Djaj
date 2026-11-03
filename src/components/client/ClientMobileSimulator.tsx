import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientApp } from './ClientApp';
import { Wifi, Battery, Signal, Smartphone, Maximize2 } from 'lucide-react';

export const ClientMobileSimulator: React.FC = () => {
  const { language, clientSimulatorMode, setClientSimulatorMode } = useApp();
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

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 bg-[#f1f0eb] dark:bg-[#0a0a0c] overflow-y-auto transition-colors">
      {/* Desktop / Tablet Mode Switcher Bar (Hidden on small mobile) */}
      <div className="hidden sm:flex items-center gap-2 mb-3 bg-white dark:bg-zinc-900/90 px-3 py-1.5 rounded-2xl border border-zinc-300 dark:border-zinc-800 text-xs shadow-md transition-colors">
        <span className="text-zinc-600 dark:text-zinc-400 font-medium mr-1">
          {isArabic ? 'عرض الزبون :' : 'Affichage client :'}
        </span>
        <button
          onClick={() => setClientSimulatorMode('frame')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition ${
            clientSimulatorMode === 'frame'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{isArabic ? 'هاتف (إطار)' : 'Smartphone (Cadré)'}</span>
        </button>

        <button
          onClick={() => setClientSimulatorMode('fluid')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition ${
            clientSimulatorMode === 'fluid'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
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
            ? 'sm:max-w-3xl lg:max-w-4xl sm:h-[calc(100dvh-130px)] sm:rounded-3xl sm:border sm:border-zinc-300 dark:sm:border-zinc-800 sm:shadow-2xl overflow-hidden'
            : 'sm:hidden'
        }`}
      >
        <ClientApp embedded />
      </div>

      {/* Screen Mode 2: Framed Phone Simulator (Only on screens >= sm when frame mode is selected) */}
      {clientSimulatorMode === 'frame' && (
        <div className="hidden sm:flex relative w-full max-w-[390px] h-[844px] max-h-[calc(100vh-130px)] rounded-[48px] bg-white dark:bg-[#121215] border-[10px] border-zinc-800 dark:border-[#25252b] shadow-[0_20px_50px_rgba(0,0,0,0.25),0_0_80px_rgba(249,115,22,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_80px_rgba(249,115,22,0.06)] flex-col overflow-hidden ring-1 ring-zinc-400/40 dark:ring-zinc-700/60 transition-colors">
          {/* Dynamic Island & Status Bar */}
          <div className="h-10 bg-white dark:bg-[#121215] shrink-0 px-6 flex items-center justify-between z-40 select-none border-b border-zinc-200 dark:border-zinc-900/60 transition-colors">
            {/* Time */}
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 font-mono tracking-tight">
              {currentTime}
            </span>

            {/* Dynamic Island pill */}
            <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center gap-1.5 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-zinc-700 dark:bg-zinc-800" />
              <span className="w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-900" />
            </div>

            {/* Indicators */}
            <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-300">
              <Signal className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
              <Wifi className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
              <Battery className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          {/* Main Phone Viewport */}
          <ClientApp embedded />

          {/* Home bar indicator pill at bottom */}
          <div className="h-4 bg-zinc-100 dark:bg-[#161619] flex items-center justify-center shrink-0 transition-colors">
            <div className="w-32 h-1 bg-zinc-400 dark:bg-zinc-600/80 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};
