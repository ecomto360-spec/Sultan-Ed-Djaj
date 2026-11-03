import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { Order } from '../../types';
import {
  buildWhatsAppMessage,
  getWhatsAppShareUrl,
  copyWhatsAppMessage,
} from '../../services/whatsappService';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Users,
  AlertCircle,
  Send,
  RotateCw,
  Link as LinkIcon,
  Save,
} from 'lucide-react';

interface WhatsAppPreviewModalProps {
  order: Order;
  onClose: () => void;
  onSentSuccess?: () => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  order,
  onClose,
  onSentSuccess,
}) => {
  const { language, settings, updateSettings, markOrderSentToWhatsApp } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedAndOpen, setCopiedAndOpen] = useState(false);
  const [groupUrlInput, setGroupUrlInput] = useState(settings.whatsAppGroupInviteUrl || '');
  const [isEditingGroupUrl, setIsEditingGroupUrl] = useState(false);
  const [saveGroupSuccess, setSaveGroupSuccess] = useState(false);

  useEffect(() => {
    setMessageText(buildWhatsAppMessage(order));
  }, [order]);

  const hasGroupLink = Boolean(
    settings.whatsAppGroupInviteUrl && settings.whatsAppGroupInviteUrl.trim().startsWith('http')
  );

  const handleCopy = async () => {
    const success = await copyWhatsAppMessage(order, messageText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyAndOpenGroup = async () => {
    await copyWhatsAppMessage(order, messageText);
    markOrderSentToWhatsApp(order.id);
    setCopiedAndOpen(true);
    setTimeout(() => setCopiedAndOpen(false), 2500);

    if (settings.whatsAppGroupInviteUrl) {
      window.open(settings.whatsAppGroupInviteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDirectShareClick = () => {
    markOrderSentToWhatsApp(order.id);
    copyWhatsAppMessage(order, messageText);
    onSentSuccess?.();
  };

  const handleSaveGroupUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = groupUrlInput.trim();
    updateSettings({ whatsAppGroupInviteUrl: clean });
    setIsEditingGroupUrl(false);
    setSaveGroupSuccess(true);
    setTimeout(() => setSaveGroupSuccess(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        dir={isArabic ? 'rtl' : 'ltr'}
        className="w-full max-w-lg bg-[#18181c] border border-zinc-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[94dvh] overflow-hidden text-zinc-100 space-y-3.5 animate-scaleUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageCircle className="w-5 h-5 fill-emerald-500/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {isArabic ? 'إرسال الطلب إلى مجموعة واتساب السائقين' : 'Dispatch Commande • Groupe WhatsApp'}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-amber-400 font-bold border border-zinc-700">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {isArabic
                  ? 'لكي يرى عامل التوصيل في المجموعة تفاصيل الطلب ويمر لاستلامه'
                  : 'Afin qu\'un livreur du groupe voie la commande et vienne la récupérer'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status / Success Banner */}
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-medium text-[11px] sm:text-xs">
              {order.sentToWhatsApp
                ? (isArabic ? '✅ تم إرسال هذا الطلب مسبقاً لمجموعة الواتساب' : '✅ Commande déjà envoyée au groupe WhatsApp')
                : (isArabic ? '⚡ الطلب مقبول وقيد التحضير • جاهز للمشاركة مع السائقين' : '⚡ Commande acceptée • Prête à être envoyée aux livreurs')}
            </span>
          </div>
          {order.sentAt && (
            <span className="font-mono text-[10px] text-emerald-400 shrink-0">
              {new Date(order.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* WhatsApp Group Quick Access Card */}
        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-zinc-200">
                {isArabic ? 'رابط مجموعة واتساب للعمال والسائقين :' : 'Groupe WhatsApp des Livreurs :'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingGroupUrl(!isEditingGroupUrl)}
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              <span>{hasGroupLink ? (isArabic ? 'تعديل الرابط' : 'Modifier lien') : (isArabic ? 'إضافة رابط' : 'Ajouter lien')}</span>
            </button>
          </div>

          {/* Form to update group link */}
          {(!hasGroupLink || isEditingGroupUrl) && (
            <form onSubmit={handleSaveGroupUrl} className="flex gap-2 pt-1">
              <input
                type="url"
                value={groupUrlInput}
                onChange={e => setGroupUrlInput(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="flex-1 bg-zinc-950 rounded-xl px-3 py-1.5 text-xs text-white border border-zinc-700 font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <Save className="w-3 h-3" />
                <span>{isArabic ? 'حفظ' : 'Enregistrer'}</span>
              </button>
            </form>
          )}

          {saveGroupSuccess && (
            <div className="text-[11px] text-emerald-400 font-medium">
              {isArabic ? '✓ تم حفظ رابط المجموعة بنجاح !' : '✓ Lien du groupe enregistré avec succès !'}
            </div>
          )}

          {/* Direct group actions if link exists */}
          {hasGroupLink && !isEditingGroupUrl && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={settings.whatsAppGroupInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markOrderSentToWhatsApp(order.id)}
                className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isArabic ? 'فتح مجموعة واتساب' : 'Ouvrir le groupe WhatsApp'}</span>
                <ExternalLink className="w-3 h-3 opacity-75" />
              </a>

              <button
                type="button"
                onClick={handleCopyAndOpenGroup}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                title="Copie le message et ouvre directement le groupe WhatsApp"
              >
                {copiedAndOpen ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{isArabic ? 'تم النسخ والفتح !' : '✓ Copié !'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isArabic ? 'نسخ وفتح المجموعة' : 'Copier & Ouvrir'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Editable Message Preview */}
        <div className="flex-1 flex flex-col min-h-0 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>{isArabic ? 'معاينة الرسالة الموجهة للسائقين (قابلة للتعديل) :' : 'Message prêt pour les livreurs (modifiable) :'}</span>
            <button
              onClick={() => setMessageText(buildWhatsAppMessage(order))}
              className="flex items-center gap-1 text-zinc-400 hover:text-amber-400 transition"
              title="Réinitialiser au texte par défaut"
            >
              <RotateCw className="w-3 h-3" />
              <span>{isArabic ? 'إعادة الضبط' : 'Réinitialiser'}</span>
            </button>
          </div>

          <textarea
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            rows={7}
            className="w-full flex-1 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-emerald-500 resize-none shadow-inner"
            placeholder="Texte du message WhatsApp..."
            dir="ltr"
          />
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition active:scale-95"
            title="Copier le texte dans le presse-papier"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">{isArabic ? 'تم النسخ !' : '✓ Copié !'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>{isArabic ? 'نسخ النص' : 'Copier le texte'}</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition"
            >
              {isArabic ? 'إغلاق' : 'Fermer'}
            </button>

            {/* Direct universal WhatsApp link button */}
            <a
              href={getWhatsAppShareUrl(messageText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDirectShareClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-950/40 transition"
            >
              <Send className="w-4 h-4" />
              <span>
                {order.sentToWhatsApp
                  ? isArabic
                    ? 'إعادة الإرسال عبر واتساب'
                    : 'Renvoyer sur WhatsApp'
                  : isArabic
                  ? 'إرسال عبر واتساب'
                  : 'Envoyer sur WhatsApp'}
              </span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
