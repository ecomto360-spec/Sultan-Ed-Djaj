import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { UserRole } from '../../types';
import {
  Settings,
  Power,
  Clock,
  Motorbike,
  Timer,
  RotateCcw,
  Check,
  Globe,
  Phone,
  MessageCircle,
  ExternalLink,
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  RefreshCw,
  UserCheck,
  UserX,
  History,
  Copy,
  AlertTriangle,
  X,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  fetchTeamAccounts,
  createTeamAccount,
  regenerateAccountPin,
  toggleAccountStatus,
  deleteTeamAccount,
  changeAccountPin,
  fetchAuthAuditLogs,
  getStoredAdminRole,
  TeamAccountApi,
  AuthAuditLogApi,
} from '../../services/authService';

export const CommercialSettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToSeedData,
    language,
    setLanguage,
    isStoreActuallyOpen,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const currentRole = getStoredAdminRole() || 'gerant';
  const isManager = currentRole === 'gerant';

  // Form states
  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee);
  const [estimatedPrepTime, setEstimatedPrepTime] = useState(settings.estimatedPrepTimeMinutes);
  const [phone, setPhone] = useState(settings.phone);
  const [openTime, setOpenTime] = useState(settings.openTime);
  const [closeTime, setCloseTime] = useState(settings.closeTime);
  const [dailyChickenQuota, setDailyChickenQuota] = useState(settings.dailyChickenQuota || 100);
  const [autoSendWhatsAppOnAccept, setAutoSendWhatsAppOnAccept] = useState(
    Boolean(settings.autoSendWhatsAppOnAccept)
  );
  const [whatsAppGroupInviteUrl, setWhatsAppGroupInviteUrl] = useState(
    settings.whatsAppGroupInviteUrl || ''
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Team management states
  const [activeTab, setActiveTab] = useState<'general' | 'team'>('general');
  const [accounts, setAccounts] = useState<TeamAccountApi[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuthAuditLogApi[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Create member modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('caissier');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // One-time PIN revelation modal
  const [revealedPinModal, setRevealedPinModal] = useState<{
    memberName: string;
    pin: string;
    action: 'created' | 'regenerated';
  } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // Delete confirmation
  const [accountToDelete, setAccountToDelete] = useState<TeamAccountApi | null>(null);
  
  // Custom PIN change
  const [accountToChangePin, setAccountToChangePin] = useState<TeamAccountApi | null>(null);
  const [newCustomPin, setNewCustomPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);

  // Load team data & audit logs when switching to team tab
  const loadTeamData = async () => {
    setIsLoadingTeam(true);
    setTeamError(null);
    try {
      const [accs, logs] = await Promise.all([
        fetchTeamAccounts(),
        fetchAuthAuditLogs(),
      ]);
      setAccounts(accs);
      setAuditLogs(logs);
    } catch (err: any) {
      setTeamError(err?.message || 'Erreur de chargement des données équipe');
    } finally {
      setIsLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'team' && isManager) {
      loadTeamData();
    }
  }, [activeTab, isManager]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      deliveryFee,
      estimatedPrepTimeMinutes: estimatedPrepTime,
      phone,
      openTime,
      closeTime,
      dailyChickenQuota: Math.max(0, Math.round(dailyChickenQuota)),
      autoSendWhatsAppOnAccept,
      whatsAppGroupInviteUrl: whatsAppGroupInviteUrl.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    if (confirm(t.resetConfirm)) {
      resetToSeedData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  // Create Team Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    setIsSubmittingCreate(true);
    setTeamError(null);
    try {
      const res = await createTeamAccount(newMemberName.trim(), newMemberRole);
      setIsCreateModalOpen(false);
      setNewMemberName('');
      setNewMemberRole('caissier');
      
      // Reload list
      await loadTeamData();

      // Show ONE-TIME generated PIN modal
      setRevealedPinModal({
        memberName: res.account.name,
        pin: res.generatedPin,
        action: 'created',
      });
    } catch (err: any) {
      setTeamError(err?.message || 'Erreur lors de la création du membre');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Regenerate PIN
  const handleRegeneratePin = async (account: TeamAccountApi) => {
    if (!confirm(isArabic ? `هل تريد إعادة توليد رمز PIN جديد لـ ${account.name}؟` : `Régénérer un nouveau code PIN pour ${account.name} ?`)) {
      return;
    }

    try {
      const res = await regenerateAccountPin(account.id);
      await loadTeamData();
      setRevealedPinModal({
        memberName: account.name,
        pin: res.generatedPin,
        action: 'regenerated',
      });
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la régénération du PIN');
    }
  };

  // Toggle Account Status
  const handleToggleStatus = async (account: TeamAccountApi) => {
    const nextStatus = account.status === 'active' ? 'disabled' : 'active';
    try {
      await toggleAccountStatus(account.id, nextStatus);
      setAccounts(prev =>
        prev.map(a => (a.id === account.id ? { ...a, status: nextStatus } : a))
      );
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du changement de statut');
    }
  };

  // Delete Account
  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      await deleteTeamAccount(accountToDelete.id);
      setAccountToDelete(null);
      setAccounts(prev => prev.filter(a => a.id !== accountToDelete.id));
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression');
    }
  };

  // Set Custom PIN
  const handleSetCustomPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountToChangePin || !newCustomPin.trim()) return;

    setIsSettingPin(true);
    try {
      await changeAccountPin(accountToChangePin.id, newCustomPin.trim());
      setAccountToChangePin(null);
      setNewCustomPin('');
      alert(isArabic ? 'تم تحديث رمز PIN بنجاح !' : 'Code PIN mis à jour avec succès !');
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la mise à jour du PIN');
    } finally {
      setIsSettingPin(false);
    }
  };

  // Copy PIN helper
  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'gerant':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            {isArabic ? 'مدير' : 'Gérant'}
          </span>
        );
      case 'cuisinier':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 inline-flex items-center gap-1">
            👨‍🍳 {isArabic ? 'طباخ' : 'Cuisinier'}
          </span>
        );
      case 'caissier':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 inline-flex items-center gap-1">
            💳 {isArabic ? 'كاشير' : 'Caissier'}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 max-w-5xl">
      {/* Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">{t.settingsPageTitle}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t.settingsPageSubtitle}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{isArabic ? 'Général & Horaires' : 'Général & Horaires'}</span>
          </button>

          {isManager && (
            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'team'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isArabic ? 'Équipe & Accès' : 'Équipe & Accès'}</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{isArabic ? 'تم حفظ التعديلات بنجاح !' : 'Paramètres mis à jour avec succès !'}</span>
        </div>
      )}

      {resetSuccess && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          <span>{isArabic ? 'تمت استعادة البيانات الأصلية بنجاح !' : 'Données réinitialisées au jeu d\'essai d\'origine !'}</span>
        </div>
      )}

      {/* GENERAL TAB CONTENT */}
      {activeTab === 'general' && (
        <>
          {/* Manual Store Switch Open / Closed */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Power className={`w-4 h-4 ${settings.isOpen ? 'text-emerald-500' : 'text-red-500'}`} />
                  <span>{t.storeOpenStatus}</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isArabic
                    ? 'تحكم فوري: إمكانية فتح أو إغلاق استقبال طلبات الزبائن بنقرة واحدة.'
                    : 'Contrôle immédiat : permet d\'ouvrir ou fermer les prises de commande en un clic.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => updateSettings({ isOpen: !settings.isOpen, manualOverride: true })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  settings.isOpen
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>{settings.isOpen ? (isArabic ? 'مفتوح حالياً' : 'Actuellement OUVERT') : (isArabic ? 'مغلق حالياً' : 'Actuellement FERMÉ')}</span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
              {isArabic ? 'الوضع الفعلي للزبائن : ' : 'Statut effectif : '}
              <strong className={isStoreActuallyOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                {isStoreActuallyOpen
                  ? (isArabic ? 'استقبال الطلبات مفعل' : 'Le client peut commander')
                  : (isArabic ? 'الطلبات متوقفة حالياً' : 'Commandes bloquées')}
              </strong>{' '}
              {isArabic ? '(مفتوح 24 سا / 24 سا إلا عند نفاد كمية الدجاج اليومية)' : '(Ouvert 24h/24 sauf épuisement du stock journalier).'}
            </div>
          </div>

          {/* Main Settings Form */}
          <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-500" />
              <span>{isArabic ? 'أوقات العمل والتوصيل' : 'Horaires & Opérations'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Horaires */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.scheduledHours}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.openingHour} :</span>
                    <input
                      type="time"
                      value={openTime}
                      onChange={e => setOpenTime(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 mt-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.closingHour} :</span>
                    <input
                      type="time"
                      value={closeTime}
                      onChange={e => setCloseTime(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 mt-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {isArabic ? 'ساعات عمل سلطان الدجاج: 24 سا / 24 سا (7 أيام / 7).' : 'Horaires de Sultan Ed-Djaj : 24h / 24h (7j/7).'}
                </p>
              </div>

              {/* Delivery fee */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Motorbike className="w-3.5 h-3.5 text-orange-500" />
                  <span>{t.standardDeliveryFee}</span>
                </label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={e => setDeliveryFee(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {isArabic ? 'تطبق تلقائياً على طلبات التوصيل (افتراضياً 200 د.ج).' : 'Appliqués aux commandes livraison (défaut 200 DA).'}
                </p>
              </div>

              {/* Estimated prep time */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t.avgPrepTime}</span>
                </label>
                <input
                  type="number"
                  value={estimatedPrepTime}
                  onChange={e => setEstimatedPrepTime(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {isArabic ? 'يظهر في صفحة تتبع الطلب لدى الزبون (مثال: ~25 دقيقة).' : 'Affiché sur le tracker en direct du client (ex: ~25 min).'}
                </p>
              </div>

              {/* Contact phone */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-orange-500" />
                  <span>{isArabic ? 'رقم هاتف المطعم الرسمي' : 'Numéro de téléphone du restaurant'}</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {isArabic ? 'الرقم الرسمي: 33 20 01 771 213+' : 'Numéro officiel : +213 771 01 20 33.'}
                </p>
              </div>

              {/* Daily Chicken Quota */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <span className="text-sm">🍗</span>
                  <span>{isArabic ? 'حصة الدجاج اليومية التلقائية (عدد الدجاج/يوم)' : 'Quota quotidien automatique (nombre de poulets/jour)'}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={dailyChickenQuota}
                  onChange={e => setDailyChickenQuota(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {isArabic
                    ? 'يتم تجديد هذا العدد تلقائياً كل يوم عند بداية الخدمة (مثال: 100 دجاجة). هذا العدد لا يظهر للزبون.'
                    : 'Ce quota est réinitialisé automatiquement chaque jour (ex: 100 poulets). Ce nombre reste confidentiel et ne s\'affiche pas au client.'}
                </p>
              </div>

              {/* WhatsApp Dispatch Group Settings */}
              <div className="md:col-span-2 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <h4 className="font-bold text-zinc-900 dark:text-white text-xs">
                    {isArabic ? 'إعدادات مجموعة واتساب دسباتش (التوصيل والمطبخ)' : 'Groupe WhatsApp Dispatch (Livreurs & Cuisine)'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Toggle Envoi automatique */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-750">
                    <div className="pr-2">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block text-xs">
                        {isArabic ? 'إرسال تلقائي عند قبول الطلب' : 'Envoi automatique au groupe dès l\'acceptation'}
                      </span>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {isArabic
                          ? 'فتح نافذة واتساب تلقائياً عند تحويل الطلب إلى "قيد التحضير"'
                          : 'Ouvre le lien de partage WhatsApp dès que la commande passe en préparation'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoSendWhatsAppOnAccept(!autoSendWhatsAppOnAccept)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition shrink-0 ${
                        autoSendWhatsAppOnAccept
                          ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {autoSendWhatsAppOnAccept
                        ? (isArabic ? 'مفعّل' : 'Activé')
                        : (isArabic ? 'معطّل' : 'Désactivé')}
                    </button>
                  </div>

                  {/* Lien d'invitation du groupe WhatsApp */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-750">
                    <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between text-xs">
                      <span>{isArabic ? 'رابط دعوة مجموعة واتساب (اختياري)' : 'Lien d\'invitation du groupe WhatsApp'}</span>
                      {whatsAppGroupInviteUrl && whatsAppGroupInviteUrl.trim().startsWith('http') && (
                        <a
                          href={whatsAppGroupInviteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>{isArabic ? 'فتح المجموعة' : 'Ouvrir le groupe'}</span>
                        </a>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={whatsAppGroupInviteUrl}
                        onChange={e => setWhatsAppGroupInviteUrl(e.target.value)}
                        placeholder="https://chat.whatsapp.com/..."
                        className="flex-1 bg-white dark:bg-zinc-900 rounded-lg p-2 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      {whatsAppGroupInviteUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(whatsAppGroupInviteUrl, '_blank', 'noopener,noreferrer')}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-xs flex items-center gap-1 shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{isArabic ? 'فتح' : 'Ouvrir'}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {isArabic
                        ? 'يسمح للفريق بالانضمام للمجموعة بنقرة واحدة من لوحة التحكم.'
                        : 'Permet à l\'équipe et aux livreurs d\'accéder directement au groupe depuis le back-office.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
              >
                {isArabic ? 'حفظ التغييرات' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>

          {/* Language & Sound Preferences */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>{isArabic ? 'اللغة وإعدادات الصوت' : 'Langue & Préférences Audio'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{isArabic ? 'لغة الواجهة' : 'Langue de l\'interface'}</span>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{isArabic ? 'دعم كامل للغة العربية من اليمين إلى اليسار (RTL)' : 'Support complet RTL en Arabe'}</p>
                </div>
                <div className="flex gap-1 bg-zinc-200/80 dark:bg-zinc-900 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setLanguage('fr')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                      language === 'fr' ? 'bg-orange-600 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Français
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('ar')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                      language === 'ar' ? 'bg-orange-600 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    عربي
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{t.soundAlertsTitle}</span>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.enableSoundNotice}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    settings.soundEnabled
                      ? 'bg-orange-600/20 text-orange-700 dark:text-orange-400 border-orange-500/40'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {settings.soundEnabled ? (isArabic ? 'الصوت مفعّل' : 'Son Activé') : (isArabic ? 'الصوت صامت' : 'Son Muet')}
                </button>
              </div>
            </div>
          </div>

          {/* Reset Seed Data */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-red-200 dark:border-red-900/40 shadow-xs space-y-2 text-xs">
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>{t.dangerZone}</span>
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t.resetAllDataDesc}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-bold rounded-xl border border-red-300 dark:border-red-700/50 transition mt-1"
            >
              {t.resetAllData}
            </button>
          </div>
        </>
      )}

      {/* TEAM & ACCESS TAB CONTENT */}
      {activeTab === 'team' && isManager && (
        <div className="space-y-6">
          {teamError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{teamError}</span>
              </div>
              <button
                type="button"
                onClick={() => setTeamError(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Top Bar: Action Button + Security Notice */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-500" />
                <span>{isArabic ? 'إدارة حسابات الفريق ورموز Access' : 'Gestion des Accès & Collaborateurs'}</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isArabic
                  ? 'يتم تشفير رموز PIN على الخادم بـ Hash scrypt. لا يظهر أي رمز PIN في واجهة المستخدم بعد توليده.'
                  : 'Les codes PIN sont sécurisés et hachés côté serveur. Aucun PIN n\'est conservé en clair.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 shrink-0 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isArabic ? '+ إضافة عضو جديد' : '+ Ajouter un membre'}</span>
            </button>
          </div>

          {/* Accounts List Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <span>{isArabic ? 'حسابات الفريق النشطة' : 'Membres de l\'équipe'} ({accounts.length})</span>
              </h4>
              <button
                type="button"
                onClick={loadTeamData}
                disabled={isLoadingTeam}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition"
                title={isArabic ? 'تحديث البيانات' : 'Actualiser'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTeam ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingTeam ? (
              <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {isArabic ? 'جاري تحميل البيانات...' : 'Chargement des comptes équipe...'}
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {isArabic ? 'لا يوجد حسابات فريق مسجلة حالياً.' : 'Aucun compte collaborateur configuré.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 px-4">{isArabic ? 'الاسم' : 'Nom du collaborateur'}</th>
                      <th className="py-3 px-4">{isArabic ? 'الدور' : 'Rôle'}</th>
                      <th className="py-3 px-4">{isArabic ? 'الحالة' : 'Statut'}</th>
                      <th className="py-3 px-4">{isArabic ? 'آخر دخول' : 'Dernière connexion'}</th>
                      <th className="py-3 px-4 text-right">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {accounts.map(acc => (
                      <tr key={acc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                          {acc.name}
                        </td>
                        <td className="py-3 px-4">
                          {getRoleBadge(acc.role)}
                        </td>
                        <td className="py-3 px-4">
                          {acc.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {isArabic ? 'نشط' : 'Actif'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 inline-flex items-center gap-1">
                              {isArabic ? 'معطل' : 'Désactivé'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 text-[11px]">
                          {acc.lastLoginAt
                            ? new Date(acc.lastLoginAt).toLocaleString('fr-FR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : isArabic
                            ? 'لم يتصل بعد'
                            : 'Jamais connecté'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Regenerate PIN */}
                            <button
                              type="button"
                              onClick={() => handleRegeneratePin(acc)}
                              className="p-1.5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg transition"
                              title={isArabic ? 'إعادة توليد رمز PIN' : 'Régénérer le code PIN'}
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Set Custom PIN */}
                            <button
                              type="button"
                              onClick={() => setAccountToChangePin(acc)}
                              className="p-1.5 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg transition"
                              title={isArabic ? 'تعيين رمز PIN مخصص' : 'Définir un PIN personnalisé'}
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-bold">✎</span>
                            </button>

                            {/* Toggle Status */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(acc)}
                              className={`p-1.5 rounded-lg transition ${
                                acc.status === 'active'
                                  ? 'hover:bg-red-500/10 text-zinc-400 hover:text-red-500'
                                  : 'hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-500'
                              }`}
                              title={
                                acc.status === 'active'
                                  ? isArabic
                                    ? 'تعطيل الحساب'
                                    : 'Désactiver le compte'
                                  : isArabic
                                  ? 'تفعيل الحساب'
                                  : 'Activer le compte'
                              }
                            >
                              {acc.status === 'active' ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setAccountToDelete(acc)}
                              className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg transition"
                              title={isArabic ? 'حذف الحساب' : 'Supprimer le compte'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Auth Audit Log Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-orange-500" />
                <span>{isArabic ? 'سجل محاولات الدخول (Journal d\'Audit)' : 'Journal des connexions (Audit)'}</span>
              </h4>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {isArabic ? 'آخر 30 محاولة' : '30 dernières tentatives'}
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">
                {isArabic ? 'لا توجد محاولات دخول مسجلة حالياً.' : 'Aucun événement de connexion enregistré.'}
              </p>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto pr-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">{isArabic ? 'التاريخ والوقت' : 'Horodateur'}</th>
                      <th className="py-2 px-3">{isArabic ? 'النتيجة' : 'Résultat'}</th>
                      <th className="py-2 px-3">{isArabic ? 'المستخدم / الدور' : 'Utilisateur / Rôle'}</th>
                      <th className="py-2 px-3 text-right">{isArabic ? 'عنوان IP' : 'Adresse IP'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400 text-[11px] font-mono">
                          {new Date(log.timestamp).toLocaleString('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </td>
                        <td className="py-2 px-3">
                          {log.success ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3" />
                              {isArabic ? 'ناجح' : 'Succès'}
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 font-bold inline-flex items-center gap-1 text-[11px]">
                              <XCircle className="w-3 h-3" />
                              {isArabic ? 'فشل (PIN خاطئ)' : 'Échec (PIN erroné)'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-bold text-zinc-800 dark:text-zinc-200">
                          {log.accountName ? (
                            <span>{log.accountName} ({log.role})</span>
                          ) : log.role ? (
                            <span>{getRoleBadge(log.role)}</span>
                          ) : (
                            <span className="text-zinc-400 italic">{isArabic ? 'غير معروف' : 'Inconnu'}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-zinc-400 font-mono text-[11px]">
                          {log.ip}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE MEMBER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-orange-500" />
                <span>{isArabic ? 'إضافة عضو جديد للفريق' : 'Nouveau membre de l\'équipe'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block">
                  {isArabic ? 'اسم المتعاون / الحساب' : 'Nom du collaborateur'} *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder={isArabic ? 'مثال: كريم - كاشير المساء' : 'Ex: Karim (Caissier Soir)'}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block">
                  {isArabic ? 'الدور والصلاديات' : 'Rôle attribué'} *
                </label>
                <select
                  value={newMemberRole}
                  onChange={e => setNewMemberRole(e.target.value as UserRole)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="caissier">{isArabic ? '💳 كاشير (Caissier) - إدارة الطلبات والصندوق' : '💳 Caissier - Prise de commande & Caisse'}</option>
                  <option value="cuisinier">{isArabic ? '👨‍🍳 طباخ (Cuisinier) - شاشة المطبخ والتحضير' : '👨‍🍳 Cuisinier - Écran Cuisine & Préparation'}</option>
                  <option value="gerant">{isArabic ? '👑 مدير (Gérant) - وصول كامل للوحة الإدارة والمالية' : '👑 Gérant - Contrôle complet & Paramètres'}</option>
                </select>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] space-y-1">
                <p className="font-bold">🔐 {isArabic ? 'توليد تلقائي للرمز Security' : 'Génération automatique de code PIN'}</p>
                <p>
                  {isArabic
                    ? 'سيقوم النظام بتوليد رمز PIN عشوائي وآمن. سيظهر الرمز مرة واحدة فقط عند الحفظ.'
                    : 'Le système va générer un code PIN unique et sécurisé. Ce code ne sera réaffiché qu\'une seule fois.'}
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold"
                >
                  {isArabic ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate || !newMemberName.trim()}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold disabled:opacity-50"
                >
                  {isSubmittingCreate
                    ? isArabic
                      ? 'جاري التوليد...'
                      : 'Création...'
                    : isArabic
                    ? 'Générer le code PIN'
                    : 'Générer le code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONE-TIME GENERATED PIN REVEAL MODAL */}
      {revealedPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-orange-500/50 rounded-2xl p-6 max-w-sm w-full space-y-5 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center mx-auto border border-orange-500/40">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {revealedPinModal.action === 'created'
                  ? isArabic
                    ? 'تم إنشاء الحساب بنجاح !'
                    : 'Nouveau compte créé !'
                  : isArabic
                  ? 'تم إعادة توليد رمز PIN !'
                  : 'Nouveau code PIN généré !'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isArabic ? 'رمز PIN الخاص بـ ' : 'Code de connexion pour '}
                <strong className="text-orange-400">{revealedPinModal.memberName}</strong>
              </p>
            </div>

            {/* Generated PIN display card */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">
                {isArabic ? 'رمز الدخول (PIN)' : 'Code PIN de connexion'}
              </span>
              <div className="text-3xl font-mono font-black text-orange-400 tracking-widest selection:bg-orange-500 selection:text-white py-1">
                {revealedPinModal.pin}
              </div>
            </div>

            {/* Copy button */}
            <button
              type="button"
              onClick={() => handleCopyPin(revealedPinModal.pin)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                copiedPin
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              {copiedPin ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isArabic ? 'تم النسخ للحافظة !' : 'Copié dans le presse-papiers !'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-orange-400" />
                  <span>{isArabic ? 'نسخ الرمز' : 'Copier le code PIN'}</span>
                </>
              )}
            </button>

            {/* Warning note */}
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[11px] flex items-start gap-2 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {isArabic
                  ? 'تنبيه هائم: لن يتم إظهار هذا الرمز مرة أخرى أبداً! يرجى تدوينه أو إرساله للمتعاون فوراً.'
                  : 'Attention : Ce code ne sera plus jamais réaffiché. Transmettez-le immédiatement au collaborateur.'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setRevealedPinModal(null)}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              {isArabic ? 'فهمت، إغلاق' : 'J\'ai noté le code, fermer'}
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  {isArabic ? 'تأكيد حذف الحساب' : 'Supprimer le compte'}
                </h3>
                <p className="text-xs text-zinc-500">
                  {accountToDelete.name} ({getRoleBadge(accountToDelete.role)})
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {isArabic
                ? 'هل أنت تأكد من حذف هذا الحساب؟ لن يتمكن المتعاون من الدخول بعد الآن.'
                : 'Êtes-vous sûr de vouloir supprimer ce compte ? Le collaborateur ne pourra plus se connecter.'}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
              >
                {isArabic ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md"
              >
                {isArabic ? 'حذف نهائياً' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM PIN MODAL */}
      {accountToChangePin && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-orange-500" />
              <span>{isArabic ? 'تغيير رمز PIN لـ ' : 'Modifier PIN pour '} {accountToChangePin.name}</span>
            </h3>

            <form onSubmit={handleSetCustomPin} className="space-y-4 text-xs">
              <input
                type="number"
                required
                min="1000"
                max="999999"
                value={newCustomPin}
                onChange={e => setNewCustomPin(e.target.value)}
                placeholder={isArabic ? 'أدخل رمز PIN الجديد (4-6 أرقام)' : 'Entrez le nouveau PIN (4-6 chiffres)'}
                className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-center text-lg tracking-widest"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setAccountToChangePin(null); setNewCustomPin(''); }}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
                >
                  {isArabic ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={isSettingPin || !newCustomPin.trim()}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md"
                >
                  {isSettingPin ? (isArabic ? 'جاري الحفظ...' : 'Enregistrement...') : (isArabic ? 'تغيير الرمز' : 'Modifier le code')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
