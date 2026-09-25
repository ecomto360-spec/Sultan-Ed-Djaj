import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  isArabic?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  isArabic = false,
}) => {
  const iconSize = size === 'sm' ? 32 : size === 'md' ? 44 : 58;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Insignia SVG */}
      <div
        style={{ width: iconSize, height: iconSize }}
        className="relative shrink-0 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 p-1 border border-zinc-700/60 shadow-lg shadow-orange-950/30 flex items-center justify-center overflow-hidden"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoFlame" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
            <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          {/* Subtle backdrop circle */}
          <circle cx="50" cy="52" r="38" fill="#27272a" opacity="0.6" />
          {/* Sultan Crown */}
          <path d="M 32 36 L 40 44 L 50 30 L 60 44 L 68 36 L 66 48 L 34 48 Z" fill="url(#logoGold)" />
          <circle cx="32" cy="35" r="2" fill="#fff" />
          <circle cx="50" cy="29" r="2.5" fill="#fff" />
          <circle cx="68" cy="35" r="2" fill="#fff" />
          {/* Flame of the grill */}
          <path d="M50 42 C40 56, 32 65, 32 76 C32 86, 40 92, 50 92 C60 92, 68 86, 68 76 C68 65, 60 56, 50 42 Z" fill="url(#logoFlame)" />
          {/* Inner ember */}
          <path d="M50 56 C45 64, 40 70, 40 77 C40 83, 44 87, 50 87 C56 87, 60 83, 60 77 C60 70, 55 64, 50 56 Z" fill="#fef08a" opacity="0.9" />
          {/* Cross skewer */}
          <line x1="28" y1="84" x2="72" y2="84" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col text-start">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-extrabold tracking-tight text-white leading-tight font-serif" style={{ fontSize: size === 'sm' ? '1rem' : size === 'md' ? '1.2rem' : '1.5rem' }}>
            {isArabic ? 'سلطان الدجاج' : 'Sultan Ed-Djaj'}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
            {isArabic ? 'سلطان' : 'سلطان الدجاج'}
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] text-zinc-400 font-medium tracking-wide">
            {isArabic ? 'دجاج محمر ومشوي على الجمر – بئر خادم' : 'Poulet Braisé & Rôti • Birkhadem'}
          </span>
        )}
      </div>
    </div>
  );
};
