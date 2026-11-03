import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { MapPin, Phone, Clock, Navigation, ExternalLink, Compass, ShoppingBag, ArrowLeft } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const RESTAURANT_COORDS = { lat: 36.7161, lng: 3.0514 };

export const ClientStoreLocator: React.FC = () => {
  const { language, setClientTab, settings, clientPageContent } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const phoneNumber = clientPageContent?.contact?.phone || settings.phone || '+213 771 01 20 33';
  const cleanPhone = phoneNumber.replace(/[\s\-\.]/g, '');
  const addressText = clientPageContent?.contact?.address || 'Les Vergers · En face Technicum Lycée Zahoual, Birkhadem, Alger';
  const hoursText = clientPageContent?.contact?.hours || 'Ouvert 24h/24, 7j/7 (Non-stop)';
  const customMapsUrl = clientPageContent?.contact?.googleMapsUrl;

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    try {
      const leaflet: any = (L as any)?.default || L;
      if (!mapInstanceRef.current && leaflet && typeof leaflet.map === 'function') {
        if ((container as any)._leaflet_id) {
          (container as any)._leaflet_id = null;
        }

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
          center: [RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng],
          zoom: 15,
        });

        if (typeof leaflet.tileLayer === 'function') {
          leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
          }).addTo(map);
        }

        // Custom Red/Orange pin for Sultan Ed-Djaj
        if (typeof leaflet.marker === 'function') {
          const restaurantMarker = leaflet.marker([RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng]).addTo(map);
          restaurantMarker.bindPopup(`
            <div style="text-align: center; font-family: sans-serif;">
              <strong style="color: #ea580c; font-size: 13px;">Sultan Ed-Djaj (سلطان الدجاج)</strong><br/>
              <span style="font-size: 11px;">Les Vergers, Birkhadem, Alger</span>
            </div>
          `).openPopup();
        }

        mapInstanceRef.current = map;
      }
    } catch (err) {
      console.warn('Leaflet store locator initialization warning:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map when user position is acquired
  const handleGetUserLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      pos => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setUserCoords({ lat: uLat, lng: uLng });

        const dist = calculateDistance(uLat, uLng, RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng);
        setDistanceKm(dist);

        const leaflet: any = (L as any)?.default || L;
        if (mapInstanceRef.current && leaflet) {
          if (typeof leaflet.marker === 'function') {
            const userMarker = leaflet.marker([uLat, uLng]).addTo(mapInstanceRef.current);
            userMarker.bindPopup(isArabic ? 'موقعك الحالي' : 'Votre position');
          }

          if (typeof leaflet.latLngBounds === 'function') {
            const bounds = leaflet.latLngBounds([
              [RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng],
              [uLat, uLng],
            ]);
            mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
          }
        }

        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${RESTAURANT_COORDS.lat},${RESTAURANT_COORDS.lng}`;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3.5 pb-24 space-y-4 bg-[#f8f7f4] dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top Header Card */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#16161a] p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
            <span>{isArabic ? 'موقع مطعم سلطان الدجاج' : 'Localisation Sultan Ed-Djaj'}</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isArabic
              ? 'فرع بئر خادم — البساتين، الجزائر'
              : 'Restaurant Rôtisserie & Braisé · Les Vergers Birkhadem'}
          </p>
        </div>

        <button
          onClick={() => setClientTab('menu')}
          className="p-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition active:scale-95 shrink-0"
          title="Retour au menu"
        >
          <ArrowLeft className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Map View */}
      <div className="relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md">
        <div ref={mapRef} className="w-full h-full z-0" />

        {/* Floating Distance Badge */}
        {distanceKm !== null && (
          <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 shadow-lg text-xs font-black text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            <span>
              {isArabic ? `المسافة : ${distanceKm} كم` : `Distance : ${distanceKm} km`}
            </span>
          </div>
        )}

        {/* Locate Me button on map */}
        <button
          onClick={handleGetUserLocation}
          disabled={isLocating}
          className="absolute bottom-3 right-3 z-10 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-3.5 py-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 shadow-lg text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-95"
        >
          <Compass className={`w-4 h-4 text-orange-500 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isArabic ? 'حساب المسافة' : 'Calculer ma distance'}</span>
        </button>
      </div>

      {/* Restaurant Details Card */}
      <div className="bg-white dark:bg-[#16161a] p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
            Sultan Ed-Djaj (سلطان الدجاج)
          </h3>

          <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {addressText}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {hoursText}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-orange-500 shrink-0" />
              <a href={`tel:${cleanPhone}`} className="font-black text-orange-600 dark:text-orange-400 hover:underline">
                {phoneNumber}
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <a
            href={customMapsUrl || googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 border border-zinc-200 dark:border-zinc-700"
          >
            <ExternalLink className="w-4 h-4 text-orange-500" />
            <span>{isArabic ? 'الاتجاهات (Google Maps)' : "Obtenir l'itinéraire"}</span>
          </a>

          <a
            href={`tel:${cleanPhone}`}
            className="h-11 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 border border-zinc-200 dark:border-zinc-700"
          >
            <Phone className="w-4 h-4 text-emerald-500" />
            <span>{isArabic ? 'اتصل بنا' : 'Appeler'}</span>
          </a>

          <button
            onClick={() => setClientTab('menu')}
            className="h-11 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-orange-950/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isArabic ? 'ابدأ طلبك الآن' : 'Commencer votre commande'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
