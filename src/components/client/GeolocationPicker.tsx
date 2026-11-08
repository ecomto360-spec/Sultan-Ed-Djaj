import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { MapPin, Navigation, RefreshCw, AlertCircle, CheckCircle2, Compass, Clock, MapPinned } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Sélection d'adresse de livraison (Tâche C) :
//   • mode par défaut = position GPS / adresse du profil, sans saisie ;
//   • « Autre adresse » cochée = champ texte + pin déplaçable, pour cette commande seulement.
export interface DeliveryAddressData {
  address: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  otherAddressUsed: boolean;
}

interface InitialAddressHint {
  address?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface RecentAddressOption {
  address: string;
  landmark?: string | null;
  mapUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface GeolocationPickerProps {
  initialAddress?: InitialAddressHint;
  recentAddresses?: RecentAddressOption[];
  onAddressSelect: (data: DeliveryAddressData) => void;
}

const DEFAULT_CENTER = { lat: 36.7161, lng: 3.0514 }; // Birkhadem

export const GeolocationPicker: React.FC<GeolocationPickerProps> = ({
  initialAddress,
  recentAddresses,
  onAddressSelect,
}) => {
  const { language } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  // Adresse résolue sans saisie : issue du GPS (reverse geocoding) ou du profil.
  const [gpsLabel, setGpsLabel] = useState((initialAddress?.address || '').trim());
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialAddress?.latitude != null && initialAddress?.longitude != null
      ? { lat: initialAddress.latitude, lng: initialAddress.longitude }
      : null
  );

  // « Autre adresse » : texte saisi pour CETTE commande uniquement.
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherAddress, setOtherAddress] = useState('');

  // Status & Error
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState(false);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  const recentList = useMemo(
    () =>
      (recentAddresses || [])
        .filter(a => a && typeof a.address === 'string' && a.address.trim())
        .slice(0, 3),
    [recentAddresses]
  );

  const baseLabel = (gpsLabel || (initialAddress?.address || '').trim()).trim();

  // Notifie le parent à chaque changement (payload complet).
  useEffect(() => {
    onAddressSelect({
      address: otherChecked ? otherAddress.trim() : baseLabel,
      landmark: (initialAddress?.landmark || '').trim() || undefined,
      latitude: coords?.lat,
      longitude: coords?.lng,
      otherAddressUsed: otherChecked,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherChecked, otherAddress, baseLabel, coords, initialAddress?.landmark]);

  // Initialise la carte Leaflet une seule fois.
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const centerLat = coords?.lat || DEFAULT_CENTER.lat;
    const centerLng = coords?.lng || DEFAULT_CENTER.lng;

    try {
      const leaflet: any = (L as any)?.default || L;
      if (leaflet && typeof leaflet.map === 'function') {
        if ((container as any)._leaflet_id) {
          (container as any)._leaflet_id = null;
        }

        // Fix default Leaflet icon assets path
        if (leaflet.Icon?.Default?.prototype) {
          try {
            delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
            leaflet.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
          } catch {}
        }

        const map = leaflet.map(container, {
          center: [centerLat, centerLng],
          zoom: 15,
          zoomControl: true,
        });

        if (typeof leaflet.tileLayer === 'function') {
          leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
          }).addTo(map);
        }

        if (typeof leaflet.marker === 'function') {
          const marker = leaflet.marker([centerLat, centerLng], { draggable: true }).addTo(map);

          marker.on('dragend', async () => {
            const position = marker.getLatLng();
            setCoords({ lat: position.lat, lng: position.lng });
            await reverseGeocode(position.lat, position.lng);
          });
          markerInstanceRef.current = marker;
        }

        mapInstanceRef.current = map;
      }
    } catch (err) {
      console.warn('Leaflet map initialization warning:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentre la carte quand les coordonnées changent (GPS, adresse récente).
  useEffect(() => {
    if (!coords || !mapInstanceRef.current) return;
    mapInstanceRef.current.setView([coords.lat, coords.lng], 15);
    markerInstanceRef.current?.setLatLng([coords.lat, coords.lng]);
  }, [coords]);

  // Reverse geocoding via Nominatim OpenStreetMap : remplit le libellé GPS.
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': isArabic ? 'ar,fr' : 'fr,ar',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const addrDetails = data.address || {};

        const road =
          addrDetails.road || addrDetails.pedestrian || addrDetails.suburb || String(data.display_name || '').split(',')[0];
        const sub = addrDetails.suburb || addrDetails.neighbourhood || addrDetails.city_district || '';

        const fullAddr = [road, sub].filter(Boolean).join(', ') || String(data.display_name || '').slice(0, 60);
        if (fullAddr) {
          setGpsLabel(fullAddr);
          return;
        }
      }
    } catch {
      // Réseau indisponible : libellé générique ci-dessous.
    }
    setGpsLabel(isArabic ? 'موقع GPS محدد' : 'Position GPS');
  };

  // One-Click Geolocation Handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoError(
        isArabic
          ? 'تحديد الموقع غير مدعوم في متصفحك. يمكنك إدخال العنوان يدوياً.'
          : "La géolocalisation n'est pas supportée par votre navigateur. Cochez « Autre adresse » pour saisir l'adresse."
      );
      return;
    }

    setIsLocating(true);
    setGeoError(null);
    setGeoSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCoords({ lat, lng });
        await reverseGeocode(lat, lng);

        setIsLocating(false);
        setGeoSuccess(true);
        setTimeout(() => setGeoSuccess(false), 3000);
      },
      error => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError(
            isArabic
              ? 'تم رفض إذن تحديد الموقع. يرجى تفعيله من إعدادات المتصفح أو إدخال العنوان يدوياً.'
              : "Permission de géolocalisation refusée. Veuillez l'activer dans les paramètres ou cochez « Autre adresse »."
          );
        } else if (error.code === error.TIMEOUT) {
          setGeoError(
            isArabic
              ? 'انتهت مهلة البحث عن الموقع. يرجى المحاولة مرة أخرى أو إدخال العنوان يدوياً.'
              : 'Délai d’attente dépassé. Réessayez, ou cochez « Autre adresse ».'
          );
        } else {
          setGeoError(
            isArabic
              ? 'تعذر تحديد الموقع حالياً. يمكنك إدخال العنوان يدوياً.'
              : "Impossible de déterminer votre position. Cochez « Autre adresse » pour la saisir."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const selectRecentAddress = (recent: RecentAddressOption) => {
    setOtherChecked(true);
    setOtherAddress(recent.address);
    if (recent.latitude != null && recent.longitude != null) {
      setCoords({ lat: recent.latitude, lng: recent.longitude });
    }
  };

  return (
    <div className="space-y-3 bg-white dark:bg-[#16161a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
      {/* Titre + bouton géolocalisation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <label className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
          <span>{isArabic ? 'عنوان التوصيل :' : 'Adresse de livraison :'}</span>
        </label>

        <button
          type="button"
          disabled={isLocating}
          onClick={handleLocateMe}
          className={`h-11 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-sm ${
            isLocating
              ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 border border-orange-300 dark:border-orange-500/40 cursor-wait'
              : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 shadow-orange-950/20'
          }`}
        >
          {isLocating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              <span>{isArabic ? 'جاري تحديد الموقع...' : 'Localisation en cours...'}</span>
            </>
          ) : (
            <>
              <Compass className="w-4 h-4 shrink-0" />
              <span>{isArabic ? '📍 استخدم موقعي' : '📍 Utiliser ma position'}</span>
            </>
          )}
        </button>
      </div>

      {/* Retours géolocalisation */}
      {geoError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 text-xs flex items-start gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{geoError}</span>
        </div>
      )}

      {geoSuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{isArabic ? 'تم تحديد موقعك بدقة على الخريطة!' : 'Position géolocalisée avec succès !'}</span>
        </div>
      )}

      {/* Adresse active (mode par défaut : GPS ou profil, aucune saisie) */}
      {!otherChecked && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
            baseLabel
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Navigation className="w-4 h-4 shrink-0 mt-0.5" />
          {baseLabel ? (
            <span className="font-bold leading-relaxed break-words">{baseLabel}</span>
          ) : (
            <span className="leading-relaxed">
              {isArabic
                ? 'اضغط « 📍 استخدم موقعي » أو فعّل « عنوان آخر » لإدخال العنوان.'
                : 'Touchez « 📍 Utiliser ma position », ou cochez « Autre adresse » pour la saisir.'}
            </span>
          )}
        </div>
      )}

      {/* Checkbox « Autre adresse (optionnel) » */}
      <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 cursor-pointer select-none hover:border-orange-400 dark:hover:border-orange-500/50 transition">
        <input
          type="checkbox"
          checked={otherChecked}
          onChange={e => setOtherChecked(e.target.checked)}
          className="w-5 h-5 accent-orange-600 shrink-0 cursor-pointer"
        />
        <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
          {isArabic ? 'عنوان آخر (اختياري)' : 'Autre adresse (optionnel)'}
        </span>
      </label>

      {/* Champ de saisie affiché uniquement si « Autre adresse » est cochée */}
      {otherChecked && (
        <div className="space-y-2 animate-fadeIn">
          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
            {isArabic ? 'عنوان التوصيل (شارع / حي / نقطة دالة) *' : 'Adresse de livraison (rue / quartier / repère) *'}
          </label>
          <input
            type="text"
            value={otherAddress}
            onChange={e => setOtherAddress(e.target.value)}
            placeholder={isArabic ? 'مثال: حي البساتين، مقابل المحطة' : 'Ex: Quartier Les Vergers, en face de la station'}
            className="w-full h-11 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
          />
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {isArabic
              ? 'هذا العنوان يخص هذا الطلب فقط ولن يحل محل عنوانك الرئيسي.'
              : 'Cette adresse ne s’applique qu’à cette commande : elle ne remplace pas votre adresse principale.'}
          </p>
        </div>
      )}

      {/* Adresses récentes (max 3, issues du profil) */}
      {recentList.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {isArabic ? 'عناوينك الأخيرة :' : 'Vos adresses récentes :'}
          </span>
          <div className="flex flex-col gap-1.5">
            {recentList.map((recent, index) => (
              <button
                key={`${recent.address}-${index}`}
                type="button"
                onClick={() => selectRecentAddress(recent)}
                className="h-11 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-orange-400 dark:hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-start flex items-center gap-2 transition group"
              >
                <MapPinned className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 leading-snug line-clamp-2 break-words">
                  {recent.address}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Carte Leaflet interactive (pin déplaçable) */}
      <div className="space-y-1 pt-1">
        <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <span>{isArabic ? 'الخريطة التفاعلية (اسحب العلامة للتعديل):' : 'Carte interactive (déplacez le marqueur) :'}</span>
          {coords && (
            <span className="font-mono text-[10px] text-orange-600 dark:text-orange-400">
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
          )}
        </span>

        <div
          ref={mapContainerRef}
          className="w-full h-40 rounded-xl border border-zinc-300 dark:border-zinc-700 overflow-hidden shadow-inner z-0"
        />
      </div>
    </div>
  );
};
