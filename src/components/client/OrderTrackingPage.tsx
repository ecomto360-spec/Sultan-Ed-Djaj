import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { fetchOrderRemote } from '../../services/orderService';
import { soundService } from '../../services/sound';
import { Order } from '../../types';
import { OrderTrackingView } from './OrderTrackingView';
import { BrandLogo } from '../common/BrandLogo';
import { ArrowLeft, Bell, Loader2, SearchX } from 'lucide-react';

// Page publique de suivi /commande/:id — accessible avec le jeton de suivi de
// l'URL (?t=...) même après effacement du localStorage. Rafraîchissement :
// 4 s onglet visible, 10 s en arrière-plan, arrêt à Livrée/Annulée.
export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { language, clearClientOrdersUnseen } = useApp();
  const isArabic = language === 'ar';

  const urlToken = searchParams.get('t') || undefined;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundUnlocked, setSoundUnlocked] = useState(true);
  const orderRef = useRef<Order | null>(null);
  const inFlightRef = useRef(false);
  const stoppedRef = useRef(false);

  useEffect(() => {
    clearClientOrdersUnseen();
  }, [clearClientOrdersUnseen]);

  const refresh = useCallback(async () => {
    if (!id || inFlightRef.current || stoppedRef.current) return;
    inFlightRef.current = true;
    try {
      const fresh = await fetchOrderRemote(id, urlToken);
      setOrder(prev => {
        orderRef.current = fresh;
        return JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh;
      });
      setError(null);
    } catch {
      setError(
        isArabic
          ? 'تعذر العثور على هذا الطلب أو الوصول إليه.'
          : 'Commande introuvable ou accès refusé.'
      );
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [id, urlToken, isArabic]);

  useEffect(() => {
    void refresh();
    let interval = setInterval(() => {
      void refresh();
    }, 4000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        clearInterval(interval);
        interval = setInterval(() => void refresh(), 4000);
        void refresh();
      } else {
        clearInterval(interval);
        interval = setInterval(() => void refresh(), 10000);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  // Arrêt du polling une fois la commande livrée/annulée : plus aucune
  // requête serveur. Une nouvelle visite relance naturellement la page.
  useEffect(() => {
    stoppedRef.current = Boolean(
      order && (order.status === 'delivered' || order.status === 'cancelled')
    );
  }, [order]);

  useEffect(() => {
    const checkAudio = setInterval(() => {
      setSoundUnlocked(soundService.isAudioUnlocked());
    }, 1500);
    setSoundUnlocked(soundService.isAudioUnlocked());
    return () => clearInterval(checkAudio);
  }, []);

  const handleUnlockSound = () => {
    const ok = soundService.unlockAudio();
    setSoundUnlocked(ok || soundService.isAudioUnlocked());
    if (ok) {
      soundService.playSuccess();
    }
  };

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className={`min-h-dvh w-full bg-[#edebe4] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans flex justify-center transition-colors ${
        isArabic ? 'font-arabic' : ''
      }`}
    >
      <main className="w-full max-w-[480px] h-dvh flex flex-col bg-[#f8f7f4] dark:bg-[#121215] sm:border-x sm:border-zinc-300 dark:sm:border-zinc-800/80 overflow-hidden">
        {/* En-tête */}
        <div className="shrink-0 px-4 py-3 bg-white dark:bg-[#161619] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-orange-400"
          >
            <ArrowLeft className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
            {isArabic ? 'القائمة' : 'Menu'}
          </Link>
          <BrandLogo size="sm" isArabic={isArabic} />
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3 text-center">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isArabic ? 'جاري تحميل الطلب...' : 'Chargement de la commande…'}
              </p>
            </div>
          ) : error || !order ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3 text-center px-6">
              <SearchX className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                {error || (isArabic ? 'طلب غير موجود' : 'Commande introuvable')}
              </p>
              <Link
                to="/"
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-black rounded-2xl shadow-md transition active:scale-95"
              >
                {isArabic ? 'العودة إلى القائمة' : 'Retour au menu'}
              </Link>
            </div>
          ) : (
            <>
              {!soundUnlocked && (
                <button
                  onClick={handleUnlockSound}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-orange-300 text-xs font-bold transition active:scale-95"
                >
                  <Bell className="w-4 h-4" />
                  {isArabic ? 'تفعيل الصوت' : '🔔 Activer le son'}
                </button>
              )}
              <OrderTrackingView order={order} />
              <Link
                to="/"
                className="block text-center w-full py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-amber-700 dark:hover:text-orange-400 transition"
              >
                {isArabic ? 'العودة إلى القائمة' : 'Retour au menu'}
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
