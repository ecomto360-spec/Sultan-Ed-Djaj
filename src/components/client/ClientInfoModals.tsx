import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { X, Info, FileText, Shield, MessageCircle, MapPin, Phone, Clock } from 'lucide-react';

interface ClientInfoModalsProps {
  type: 'about' | 'cgu' | 'privacy' | 'contact' | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientInfoModals: React.FC<ClientInfoModalsProps> = ({ type, isOpen, onClose }) => {
  const { language, settings, clientPageContent } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  if (!isOpen || !type) return null;

  const phoneNumber = clientPageContent?.contact?.phone || settings.phone || '+213 771 01 20 33';
  const cleanPhone = phoneNumber.replace(/[\s\-\.]/g, '');
  const whatsappUrl = clientPageContent?.contact?.whatsappUrl || `https://wa.me/${cleanPhone}`;
  const addressText = clientPageContent?.contact?.address || 'Les Vergers, En face Technicum Lycée Zahoual, Birkhadem, Alger';
  const hoursText = clientPageContent?.contact?.hours || 'Ouvert 24h/24, 7j/7';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fadeIn p-0 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        dir={isArabic ? 'rtl' : 'ltr'}
        className="relative w-full max-w-[480px] bg-white dark:bg-[#16161a] rounded-t-[32px] sm:rounded-3xl shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 space-y-4 animate-slideUp max-h-[85vh] overflow-y-auto z-10 text-zinc-900 dark:text-zinc-100 transition-colors"
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto -mt-1 mb-2" />

        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${isArabic ? 'left-4' : 'right-4'} p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition`}
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {type === 'about' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-orange-600 dark:text-orange-400">
              <Info className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-black">{isArabic ? 'عن سلطان الدجاج' : 'À propos de Sultan Ed-Djaj'}</h2>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              <p>
                {isArabic
                  ? (clientPageContent?.legalPages?.aboutAr || 'سلطان الدجاج هو مطعم رائد متخصص في تحضير الدجاج المشوي والمحمر على الطريقة الجزائرية الأصيلة.')
                  : (clientPageContent?.legalPages?.aboutFr || 'Sultan Ed-Djaj est une rôtisserie spécialisée dans la préparation artisanale de poulets braisés et rôtis de haute qualité à Birkhadem (Les Vergers), Alger.')}
              </p>
            </div>
          </div>
        )}

        {type === 'cgu' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <FileText className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-black">{isArabic ? 'الشروط والأحكام العامة' : 'Conditions Générales de Vente'}</h2>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              <p>
                {clientPageContent?.legalPages?.cguFr || 'Toute commande passée via l’application est ferme après confirmation. Le paiement s’effectue en espèces à la livraison ou au comptoir.'}
              </p>
            </div>
          </div>
        )}

        {type === 'privacy' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-black">{isArabic ? 'سياسة الخصوصية' : 'Politique de Confidentialité'}</h2>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              <p>
                {clientPageContent?.legalPages?.privacyFr || 'Vos données personnelles (nom, téléphone, adresse) sont strictly utilisées pour le traitement de vos commandes et ne sont jamais retransmises à des tiers.'}
              </p>
            </div>
          </div>
        )}

        {type === 'contact' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-black">{isArabic ? 'اتصل بنا' : 'Contact & Assistance'}</h2>
            </div>

            <div className="space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
                <span>{addressText}</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Clock className="w-5 h-5 text-orange-500 shrink-0" />
                <span>{hoursText}</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Phone className="w-5 h-5 text-orange-500 shrink-0" />
                <a href={`tel:${cleanPhone}`} className="font-bold text-orange-600 dark:text-orange-400 hover:underline">
                  {phoneNumber}
                </a>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition active:scale-95 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isArabic ? 'محادثة مباشرة عبر واتساب' : 'Discuter sur WhatsApp'}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
