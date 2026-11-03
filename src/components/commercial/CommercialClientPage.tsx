import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientPageContent } from '../../types';
import { processAndUploadProductImage } from '../../utils/imageUtils';
import { ClientApp } from '../client/ClientApp';
import {
  Smartphone,
  Save,
  Send,
  RotateCcw,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Megaphone,
  Store,
  Phone,
  FileText,
  Clock,
  MapPin,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const CommercialClientPage: React.FC = () => {
  const { clientPageContent, updateClientPageContent, publishClientPageContent, language } = useApp();
  const isArabic = language === 'ar';

  // Draft state for unsaved edits
  const [draft, setDraft] = useState<ClientPageContent>(clientPageContent);
  const [isDirty, setIsDirty] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Active section in editor
  const [activeSection, setActiveSection] = useState<'identity' | 'banner' | 'info' | 'announcement' | 'legal'>('identity');

  // Mobile split view toggle: 'editor' vs 'preview'
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Logo upload ref
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Sync draft when external changes arrive if not dirty
  useEffect(() => {
    if (!isDirty) {
      setDraft(clientPageContent);
    }
  }, [clientPageContent, isDirty]);

  const updateTopLevel = <K extends keyof ClientPageContent>(key: K, value: ClientPageContent[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const updateBanner = (patch: Partial<ClientPageContent['banner']>) => {
    setDraft(prev => ({
      ...prev,
      banner: { ...prev.banner, ...patch },
    }));
    setIsDirty(true);
  };

  const updateContact = (patch: Partial<ClientPageContent['contact']>) => {
    setDraft(prev => ({
      ...prev,
      contact: { ...prev.contact, ...patch },
    }));
    setIsDirty(true);
  };

  const updateService = (patch: Partial<ClientPageContent['service']>) => {
    setDraft(prev => ({
      ...prev,
      service: { ...prev.service, ...patch },
    }));
    setIsDirty(true);
  };

  const updateLegalPages = (patch: Partial<ClientPageContent['legalPages']>) => {
    setDraft(prev => ({
      ...prev,
      legalPages: { ...prev.legalPages, ...patch },
    }));
    setIsDirty(true);
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const res = await processAndUploadProductImage(file);
      if (res && res.imageUrl) {
        updateTopLevel('logoUrl', res.imageUrl);
      }
    } catch (e) {
      console.warn('Logo upload error:', e);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveDraft = () => {
    updateClientPageContent(draft);
    setIsDirty(false);
    setPublishStatus({ success: true, message: 'Brouillon enregistré en local' });
    setTimeout(() => setPublishStatus(null), 3000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishStatus(null);
    try {
      const ok = await publishClientPageContent(draft);
      if (ok) {
        setIsDirty(false);
        setPublishStatus({ success: true, message: 'Page client publiée en direct avec succès !' });
      } else {
        setPublishStatus({ success: false, message: 'Erreur lors de la publication sur le serveur.' });
      }
    } catch (e: any) {
      setPublishStatus({ success: false, message: e?.message || 'Erreur de publication.' });
    } finally {
      setIsPublishing(false);
      setTimeout(() => setPublishStatus(null), 4000);
    }
  };

  const handleResetToPublished = () => {
    if (confirm('Abandonner toutes les modifications non publiées ?')) {
      setDraft(clientPageContent);
      setIsDirty(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-5 space-y-4">
      {/* Top Bar with Status and Publish Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Gestion de la Page Client
              </h2>
              {isDirty ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                  Modifications non publiées
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40">
                  Synchronisé en ligne
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Personnalisez les textes, logos, bannières et informations visibles par vos clients.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile view switch */}
          <div className="xl:hidden flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-300 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setMobileView('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                mobileView === 'editor'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300'
              }`}
            >
              Éditer
            </button>
            <button
              type="button"
              onClick={() => setMobileView('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mobileView === 'preview'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Aperçu</span>
            </button>
          </div>

          {/* Reset button */}
          {isDirty && (
            <button
              type="button"
              onClick={handleResetToPublished}
              className="min-h-[40px] px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Annuler les modifications et revenir à la version publiée"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Annuler</span>
            </button>
          )}

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={!isDirty || isPublishing}
            className="min-h-[40px] px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition disabled:bg-zinc-100 dark:disabled:bg-zinc-800/80 disabled:text-zinc-400 dark:disabled:text-zinc-500 disabled:border-zinc-200 dark:disabled:border-zinc-800 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Enregistrer</span>
          </button>

          {/* Publish */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="min-h-[40px] px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publication...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publier en direct</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Publish Toast Notice */}
      {publishStatus && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 shrink-0 ${
            publishStatus.success
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          {publishStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{publishStatus.message}</span>
        </div>
      )}

      {/* Main Split Grid (Editor Left, Live Preview Right) */}
      <div className="flex-1 flex gap-5 min-h-0 overflow-hidden">
        {/* LEFT: Configuration Forms */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden ${
            mobileView === 'preview' ? 'hidden xl:flex' : 'flex'
          }`}
        >
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-2.5 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto shrink-0 scrollbar-none bg-zinc-100/80 dark:bg-zinc-900/90">
            <button
              onClick={() => setActiveSection('identity')}
              className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
                activeSection === 'identity'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 dark:hover:bg-orange-500/20'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Identité & Logo</span>
            </button>

            <button
              onClick={() => setActiveSection('banner')}
              className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
                activeSection === 'banner'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 dark:hover:bg-orange-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bannière Promo</span>
            </button>

            <button
              onClick={() => setActiveSection('info')}
              className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
                activeSection === 'info'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 dark:hover:bg-orange-500/20'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Coordonnées & Réseaux</span>
            </button>

            <button
              onClick={() => setActiveSection('announcement')}
              className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
                activeSection === 'announcement'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 dark:hover:bg-orange-500/20'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Annonce Flash</span>
            </button>

            <button
              onClick={() => setActiveSection('legal')}
              className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
                activeSection === 'legal'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 dark:hover:bg-orange-500/20'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Pages & Textes</span>
            </button>
          </div>

          {/* Form Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* 1. Identity & Logo */}
            {activeSection === 'identity' && (
              <div className="space-y-5 w-full">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">
                    Identité du Restaurant
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ces éléments apparaissent dans l'en-tête de la page client et les bannières.
                  </p>
                </div>

                {/* Logo Upload (Full Width Card) */}
                <div className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 shrink-0 flex items-center justify-center shadow-inner">
                    {draft.logoUrl ? (
                      <img src={draft.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-10 h-10 text-zinc-400" />
                    )}
                    {isUploadingLogo && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                    />
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Changer le logo</span>
                      </button>
                      {draft.logoUrl && (
                        <button
                          type="button"
                          onClick={() => updateTopLevel('logoUrl', undefined)}
                          className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Logo carré recommandé (PNG ou WebP, max 5 Mo).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Nom (Français)
                    </label>
                    <input
                      type="text"
                      value={draft.restaurantNameFr || ''}
                      onChange={e => updateTopLevel('restaurantNameFr', e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      الاسم (العربية)
                    </label>
                    <input
                      type="text"
                      value={draft.restaurantNameAr || ''}
                      onChange={e => updateTopLevel('restaurantNameAr', e.target.value)}
                      dir="rtl"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Slogan / Sous-titre (FR)
                    </label>
                    <input
                      type="text"
                      value={draft.taglineFr || ''}
                      onChange={e => updateTopLevel('taglineFr', e.target.value)}
                      placeholder="Ex: Le Spécialiste du Poulet Rôti & Braisé"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      الشعار (العربية)
                    </label>
                    <input
                      type="text"
                      value={draft.taglineAr || ''}
                      onChange={e => updateTopLevel('taglineAr', e.target.value)}
                      placeholder="مثال: أشهى دجاج محمر على الفحم"
                      dir="rtl"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Top Banner Promo */}
            {activeSection === 'banner' && (
              <div className="space-y-5 w-full">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">
                    Bannière Promotionnelle du Menu
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    S'affiche en tête du catalogue client pour mettre en valeur les offres spéciales.
                  </p>
                </div>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">
                      Activer la bannière promotionnelle
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Affiche l'encart promo en haut du menu client
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(draft.banner?.enabled)}
                    onChange={e => updateBanner({ enabled: e.target.checked })}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                  />
                </label>

                {draft.banner?.enabled && (
                  <div className="space-y-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                          Titre de la promo (FR)
                        </label>
                        <input
                          type="text"
                          value={draft.banner?.textFr || ''}
                          onChange={e => updateBanner({ textFr: e.target.value })}
                          placeholder="Ex: -15% sur les commandes du soir !"
                          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                          عنوان التخفيض (العربية)
                        </label>
                        <input
                          type="text"
                          value={draft.banner?.textAr || ''}
                          onChange={e => updateBanner({ textAr: e.target.value })}
                          placeholder="مثال: خصم 15% على وجبات المساء !"
                          dir="rtl"
                          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Restaurant Coordinates & Social */}
            {activeSection === 'info' && (
              <div className="space-y-5 w-full">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">
                    Coordonnées, Logistique & Réseaux
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ces données alimentent le pied de page, le tiroir latéral et le localisateur de magasin.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-orange-500" />
                      <span>Numéro de téléphone</span>
                    </label>
                    <input
                      type="text"
                      value={draft.contact?.phone || ''}
                      onChange={e => updateContact({ phone: e.target.value })}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>Horaires d'ouverture</span>
                    </label>
                    <input
                      type="text"
                      value={draft.contact?.hours || ''}
                      onChange={e => updateContact({ hours: e.target.value })}
                      placeholder="Ex: 24h/24 – 7j/7"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    <span>Adresse du restaurant</span>
                  </label>
                  <input
                    type="text"
                    value={draft.contact?.address || ''}
                    onChange={e => updateContact({ address: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Lien WhatsApp (Direct commande)
                    </label>
                    <input
                      type="url"
                      value={draft.contact?.whatsappUrl || ''}
                      onChange={e => updateContact({ whatsappUrl: e.target.value })}
                      placeholder="https://wa.me/213..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Lien Google Maps (Itinéraire)
                    </label>
                    <input
                      type="url"
                      value={draft.contact?.googleMapsUrl || ''}
                      onChange={e => updateContact({ googleMapsUrl: e.target.value })}
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Lien Facebook
                    </label>
                    <input
                      type="url"
                      value={draft.contact?.facebookUrl || ''}
                      onChange={e => updateContact({ facebookUrl: e.target.value })}
                      placeholder="https://facebook.com/..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Lien Instagram
                    </label>
                    <input
                      type="url"
                      value={draft.contact?.instagramUrl || ''}
                      onChange={e => updateContact({ instagramUrl: e.target.value })}
                      placeholder="https://instagram.com/..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Delivery Fee & Prep Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Frais de livraison standard (DA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={draft.service?.deliveryFee ?? 200}
                      onChange={e => updateService({ deliveryFee: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Temps de préparation estimé (min)
                    </label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={draft.service?.prepTimeMinutes ?? 25}
                      onChange={e => updateService({ prepTimeMinutes: Math.max(5, parseInt(e.target.value) || 20) })}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Flash Announcement */}
            {activeSection === 'announcement' && (
              <div className="space-y-5 w-full">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">
                    Bandeau d'Annonce Flash
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Affichez un message urgent en tête d'application (ex: fermeture exceptionnelle, arrivage chaud, etc.).
                  </p>
                </div>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">
                      Afficher le bandeau d'annonce
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Visible en haut de l'écran sur mobile
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(draft.service?.showAnnouncement)}
                    onChange={e => updateService({ showAnnouncement: e.target.checked })}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                  />
                </label>

                {draft.service?.showAnnouncement && (
                  <div className="space-y-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                        Texte de l'annonce (Français)
                      </label>
                      <input
                        type="text"
                        value={draft.service?.announcementNotice || ''}
                        onChange={e => updateService({ announcementNotice: e.target.value })}
                        placeholder="Ex: Fermé exceptionnellement aujourd'hui de 14h à 17h."
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Legal & Informative texts */}
            {activeSection === 'legal' && (
              <div className="space-y-5 w-full">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">
                    Pages d'Informations & Mentions Légales
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Éditez le texte affiché dans le menu hamburger (À propos, CGU, Confidentialité).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Texte "À propos de nous" (FR)
                    </label>
                    <textarea
                      rows={5}
                      value={draft.legalPages?.aboutFr || ''}
                      onChange={e => updateLegalPages({ aboutFr: e.target.value })}
                      className="w-full p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      نص "من نحن" (العربية)
                    </label>
                    <textarea
                      rows={5}
                      value={draft.legalPages?.aboutAr || ''}
                      onChange={e => updateLegalPages({ aboutAr: e.target.value })}
                      dir="rtl"
                      className="w-full p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Conditions Générales d'Utilisation (CGU)
                  </label>
                  <textarea
                    rows={4}
                    value={draft.legalPages?.cguFr || ''}
                    onChange={e => updateLegalPages({ cguFr: e.target.value })}
                    className="w-full p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Politique de Confidentialité
                  </label>
                  <textarea
                    rows={4}
                    value={draft.legalPages?.privacyFr || ''}
                    onChange={e => updateLegalPages({ privacyFr: e.target.value })}
                    className="w-full p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Smartphone Preview */}
        <div
          className={`flex-col items-center justify-center shrink-0 w-full xl:w-[420px] 2xl:w-[460px] ${
            mobileView === 'preview' ? 'flex' : 'hidden xl:flex'
          }`}
        >
          <div className="w-full flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-orange-500" />
              <span>Aperçu en direct (Smartphone)</span>
            </span>
            <span className="text-[10px] text-zinc-400">
              iPhone 15 Pro (Simulé)
            </span>
          </div>

          {/* Smartphone Frame */}
          <div className="relative w-full max-w-[390px] h-[720px] 2xl:h-[760px] rounded-[48px] bg-black p-3.5 shadow-2xl ring-1 ring-zinc-800 border-4 border-zinc-800 flex flex-col overflow-hidden">
            {/* Dynamic Island Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 mr-3" />
              <div className="w-2.5 h-2.5 rounded-full bg-blue-950/80" />
            </div>

            {/* Embedded Live Screen */}
            <div className="relative flex-1 w-full h-full rounded-[38px] overflow-hidden bg-[#f8f7f4] dark:bg-[#121215]">
              <ClientApp embedded />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
