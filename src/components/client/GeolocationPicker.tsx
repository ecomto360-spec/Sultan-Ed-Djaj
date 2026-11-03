import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { MapPin, Navigation, RefreshCw, AlertCircle, CheckCircle2, Building, Compass } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SavedAddress {
  address: string;
  commune: string;
  wilaya: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

interface GeolocationPickerProps {
  initialAddress?: SavedAddress;
  onAddressSelect: (data: SavedAddress) => void;
}

const STORAGE_LAST_ADDRESS_KEY = 'sultan_last_address_v2';

export const GeolocationPicker: React.FC<GeolocationPickerProps> = ({
  initialAddress,
  onAddressSelect,
}) => {
  const { language } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  // Address fields
  const [address, setAddress] = useState(initialAddress?.address || '');
  const [commune, setCommune] = useState(initialAddress?.commune || 'Birkhadem');
  const [wilaya, setWilaya] = useState(initialAddress?.wilaya || 'Alger');
  const [landmark, setLandmark] = useState(initialAddress?.landmark || '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialAddress?.latitude && initialAddress?.longitude
      ? { lat: initialAddress.latitude, lng: initialAddress.longitude }
      : null
  );

  // Status & Error
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState(false);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  // Load last address from localStorage if initial is empty
  useEffect(() => {
    if (!initialAddress?.address) {
      try {
        const savedRaw = localStorage.getItem(STORAGE_LAST_ADDRESS_KEY);
        if (savedRaw) {
          const saved: SavedAddress = JSON.parse(savedRaw);
          if (saved.address) {
            setAddress(saved.address);
            if (saved.commune) setCommune(saved.commune);
            if (saved.wilaya) setWilaya(saved.wilaya);
            if (saved.landmark) setLandmark(saved.landmark);
            if (saved.latitude && saved.longitude) {
              setCoords({ lat: saved.latitude, lng: saved.longitude });
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }, [initialAddress]);

  // Update parent whenever form changes
  useEffect(() => {
    const payload: SavedAddress = {
      address: address.trim(),
      commune: commune.trim() || 'Birkhadem',
      wilaya: wilaya.trim() || 'Alger',
      landmark: landmark.trim() || undefined,
      latitude: coords?.lat,
      longitude: coords?.lng,
    };
    onAddressSelect(payload);

    // Save to localStorage for future orders
    if (address.trim()) {
      try {
        localStorage.setItem(STORAGE_LAST_ADDRESS_KEY, JSON.stringify(payload));
      } catch {
        // ignore
      }
    }
  }, [address, commune, wilaya, landmark, coords]);

  // Initialize or update Leaflet map container
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const defaultLat = coords?.lat || 36.7161; // Birkhadem
    const defaultLng = coords?.lng || 3.0514;

    try {
      const leaflet: any = (L as any)?.default || L;
      if (!mapInstanceRef.current && leaflet && typeof leaflet.map === 'function') {
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
          center: [defaultLat, defaultLng],
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
          const marker = leaflet.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

          marker.on('dragend', async () => {
            const position = marker.getLatLng();
            setCoords({ lat: position.lat, lng: position.lng });
            await reverseGeocode(position.lat, position.lng);
          });
          markerInstanceRef.current = marker;
        }

        mapInstanceRef.current = map;
      } else if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([defaultLat, defaultLng], 15);
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([defaultLat, defaultLng]);
        }
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
  }, [coords]);

  // Reverse geocoding helper via Nominatim OpenStreetMap
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

        const road = addrDetails.road || addrDetails.pedestrian || addrDetails.suburb || data.display_name.split(',')[0];
        const sub = addrDetails.suburb || addrDetails.neighbourhood || addrDetails.city_district || '';
        const com = addrDetails.town || addrDetails.city || addrDetails.municipality || 'Birkhadem';
        const wil = addrDetails.state || addrDetails.county || 'Alger';

        const fullAddr = [road, sub].filter(Boolean).join(', ') || data.display_name.slice(0, 60);

        setAddress(fullAddr);
        setCommune(com);
        setWilaya(wil);
      }
    } catch {
      // Fallback: preserve existing manual entry or generic label
      if (!address) {
        setAddress(isArabic ? 'موقع محدد على الخريطة' : 'Position sélectionnée sur la carte');
      }
    }
  };

  // One-Click Geolocation Handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoError(
        isArabic
          ? 'تحديد الموقع غير مدعوم في متصفحك. يرجى كتابة العنوان يدوياً.'
          : "La géolocalisation n'est pas supportée par votre navigateur. Veuillez saisir l'adresse manuellement."
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
              : "Permission de géolocalisation refusée. Veuillez l'activer dans les paramètres ou saisir votre adresse ci-dessous."
          );
        } else if (error.code === error.TIMEOUT) {
          setGeoError(
            isArabic
              ? 'انتهت مهلة البحث عن الموقع. يرجى المحاولة مرة أخرى أو إدخال العنوان يدوياً.'
              : 'Délai d’attente dépassé. Veuillez réessayer ou taper votre adresse.'
          );
        } else {
          setGeoError(
            isArabic
              ? 'تعذر تحديد الموقع حالياً. يمكنك إدخال العنوان يدوياً.'
              : "Impossible de déterminer votre position. Vous pouvez saisir l'adresse ci-dessous."
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

  return (
    <div className="space-y-3 bg-white dark:bg-[#16161a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
      {/* Top Title & Geolocation Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <label className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
          <span>{isArabic ? 'عنوان التوصيل :' : 'Adresse de livraison :'}</span>
        </label>

        {/* Prominent Geolocation Button */}
        <button
          type="button"
          disabled={isLocating}
          onClick={handleLocateMe}
          className={`h-10 px-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-sm ${
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
              <span>{isArabic ? '📍 تحديد موئعي بنقرة واحدة' : '📍 Utiliser ma position'}</span>
            </>
          )}
        </button>
      </div>

      {/* Geolocation Feedback Alert */}
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

      {/* Address Form Inputs */}
      <div className="space-y-2.5 pt-1">
        <div>
          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
            {isArabic ? 'العنوان / الشارع / الحي *' : 'Rue / Quartier / Adresse *'}
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder={isArabic ? 'مثال: حي البساتين، الشارع الرئيسي' : 'Ex: Quartier Les Vergers, Rue principale'}
            className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              {isArabic ? 'البلدية *' : 'Commune *'}
            </label>
            <input
              type="text"
              required
              value={commune}
              onChange={e => setCommune(e.target.value)}
              placeholder="Birkhadem"
              className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              {isArabic ? 'الولاية *' : 'Wilaya *'}
            </label>
            <input
              type="text"
              required
              value={wilaya}
              onChange={e => setWilaya(e.target.value)}
              placeholder="Alger"
              className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
            {isArabic ? 'نقطة دالة / العمارة / الطابق (اختياري)' : 'Repère / Étage / Indication (optionnel)'}
          </label>
          <div className="relative">
            <Building className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 ${isArabic ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={landmark}
              onChange={e => setLandmark(e.target.value)}
              placeholder={isArabic ? 'مثال: مقابل محطة المترو، العمارة ب الطابق 3' : 'Ex: En face station métro, Bât B 3ème étage'}
              className={`w-full h-10 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition ${
                isArabic ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Interactive Leaflet Map Preview */}
      <div className="space-y-1 pt-1">
        <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <span>{isArabic ? 'تحديد الخريطة التفاعلية (يمكنك سحب العلامة):' : 'Carte interactive (déplacez le marqueur) :'}</span>
          {coords && (
            <span className="font-mono text-[10px] text-orange-600 dark:text-orange-400">
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
          )}
        </span>

        <div
          ref={mapContainerRef}
          className="w-full h-36 rounded-xl border border-zinc-300 dark:border-zinc-700 overflow-hidden shadow-inner z-0"
        />
      </div>
    </div>
  );
};
