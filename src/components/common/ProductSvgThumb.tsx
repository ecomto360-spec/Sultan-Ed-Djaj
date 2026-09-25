import React from 'react';
import { Product } from '../../types';

interface ProductSvgThumbProps {
  type: Product['imageType'];
  className?: string;
}

export const ProductSvgThumb: React.FC<ProductSvgThumbProps> = ({ type, className = 'w-full h-full' }) => {
  switch (type) {
    case 'poulet-roti':
      return (
        <svg viewBox="0 0 160 120" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="roastGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </radialGradient>
            <linearGradient id="boneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e5e7eb" />
            </linearGradient>
            <filter id="crispShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
            </filter>
          </defs>
          <rect width="160" height="120" rx="12" fill="#18181b" />
          {/* Platter */}
          <ellipse cx="80" cy="92" rx="60" ry="18" fill="#27272a" />
          <ellipse cx="80" cy="90" rx="54" ry="14" fill="#3f3f46" opacity="0.6" />
          {/* Main Chicken Body */}
          <g filter="url(#crispShadow)">
            <ellipse cx="80" cy="62" rx="42" ry="26" fill="url(#roastGrad)" />
            {/* Drumstick Left */}
            <path d="M 52 64 C 40 50, 30 65, 38 78 C 45 84, 58 75, 52 64 Z" fill="#b45309" />
            <rect x="25" y="68" width="14" height="6" rx="3" fill="url(#boneGrad)" transform="rotate(-25 25 68)" />
            {/* Drumstick Right */}
            <path d="M 108 64 C 120 50, 130 65, 122 78 C 115 84, 102 75, 108 64 Z" fill="#b45309" />
            <rect x="120" y="62" width="14" height="6" rx="3" fill="url(#boneGrad)" transform="rotate(25 120 62)" />
            {/* Golden Roast Crust Highlights */}
            <ellipse cx="78" cy="54" rx="28" ry="14" fill="#f59e0b" opacity="0.8" />
            <path d="M 68 50 Q 80 46 92 50" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
            <circle cx="70" cy="60" r="1.5" fill="#78350f" />
            <circle cx="85" cy="58" r="1.5" fill="#78350f" />
            <circle cx="95" cy="64" r="1.5" fill="#78350f" />
            <circle cx="76" cy="68" r="1.5" fill="#78350f" />
          </g>
          {/* Herbs & Garnish */}
          <circle cx="60" cy="85" r="4" fill="#15803d" />
          <circle cx="100" cy="86" r="4" fill="#15803d" />
          <circle cx="82" cy="88" r="3" fill="#dc2626" />
          {/* Steam */}
          <path d="M72 32 Q 76 22 72 14" stroke="#e4e4e7" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
          <path d="M82 28 Q 86 18 82 10" stroke="#e4e4e7" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
        </svg>
      );

    case 'poulet-braise':
      return (
        <svg viewBox="0 0 160 120" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="braiseGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#c2410c" />
              <stop offset="100%" stopColor="#431407" />
            </radialGradient>
            <linearGradient id="emberGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
          <rect width="160" height="120" rx="12" fill="#141416" />
          {/* Glowing Coals / Charbon */}
          <ellipse cx="80" cy="98" rx="60" ry="12" fill="#262626" />
          <circle cx="50" cy="98" r="7" fill="url(#emberGlow)" opacity="0.8" />
          <circle cx="75" cy="100" r="9" fill="url(#emberGlow)" opacity="0.9" />
          <circle cx="95" cy="97" r="8" fill="url(#emberGlow)" opacity="0.85" />
          <circle cx="115" cy="99" r="6" fill="url(#emberGlow)" opacity="0.75" />
          {/* Grill Wire */}
          <line x1="25" y1="88" x2="135" y2="88" stroke="#71717a" strokeWidth="2.5" />
          <line x1="35" y1="92" x2="125" y2="92" stroke="#52525b" strokeWidth="2" />
          {/* Braised Chicken */}
          <ellipse cx="80" cy="62" rx="40" ry="24" fill="url(#braiseGrad)" />
          {/* Braise Char Marks */}
          <path d="M 52 50 L 68 76" stroke="#1c1917" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 72 46 L 88 78" stroke="#1c1917" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 92 48 L 106 74" stroke="#1c1917" strokeWidth="3.5" strokeLinecap="round" />
          {/* Fire Spark */}
          <path d="M 40 70 Q 42 60 48 58 Q 44 65 42 70" fill="#facc15" />
          <path d="M 120 72 Q 124 64 122 56 Q 118 64 117 72" fill="#f97316" />
        </svg>
      );

    case 'frites':
      return (
        <svg viewBox="0 0 160 120" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <linearGradient id="boxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>
          <rect width="160" height="120" rx="12" fill="#18181b" />
          {/* Shadow */}
          <ellipse cx="80" cy="104" rx="35" ry="8" fill="#09090b" opacity="0.6" />
          {/* Fries Sticks */}
          <rect x="52" y="24" width="9" height="52" rx="2" fill="url(#fryGrad)" transform="rotate(-15 52 24)" />
          <rect x="66" y="18" width="9" height="58" rx="2" fill="url(#fryGrad)" transform="rotate(-6 66 18)" />
          <rect x="80" y="15" width="9" height="60" rx="2" fill="url(#fryGrad)" transform="rotate(3 80 15)" />
          <rect x="94" y="20" width="9" height="54" rx="2" fill="url(#fryGrad)" transform="rotate(14 94 20)" />
          <rect x="105" y="30" width="9" height="46" rx="2" fill="url(#fryGrad)" transform="rotate(22 105 30)" />
          <rect x="42" y="32" width="9" height="44" rx="2" fill="url(#fryGrad)" transform="rotate(-22 42 32)" />
          {/* Red Cornet / Carton */}
          <path d="M 45 60 L 56 102 L 104 102 L 115 60 Q 80 72 45 60 Z" fill="url(#boxGrad)" />
          {/* Logo badge on box */}
          <circle cx="80" cy="84" r="10" fill="#fef08a" />
          <path d="M 77 82 L 80 78 L 83 82 L 80 87 Z" fill="#b45309" />
        </svg>
      );

    case 'hmiss':
      return (
        <svg viewBox="0 0 160 120" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="hmissBowl" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#78350f" />
            </radialGradient>
          </defs>
          <rect width="160" height="120" rx="12" fill="#18181b" />
          {/* Traditional clay ramekin */}
          <ellipse cx="80" cy="65" rx="52" ry="34" fill="#92400e" stroke="#78350f" strokeWidth="4" />
          <ellipse cx="80" cy="63" rx="44" ry="26" fill="url(#hmissBowl)" />
          {/* Roasted Green Peppers */}
          <ellipse cx="68" cy="60" rx="14" ry="9" fill="#15803d" />
          <ellipse cx="90" cy="68" rx="16" ry="10" fill="#166534" />
          {/* Red Peppers */}
          <ellipse cx="85" cy="56" rx="15" ry="9" fill="#dc2626" />
          <ellipse cx="64" cy="68" rx="12" ry="7" fill="#b91c1c" />
          {/* Charred specks */}
          <circle cx="68" cy="58" r="2" fill="#18181b" />
          <circle cx="86" cy="65" r="2.5" fill="#18181b" />
          <circle cx="75" cy="66" r="1.5" fill="#18181b" />
          {/* Olive Oil & Garlic */}
          <ellipse cx="80" cy="63" rx="20" ry="8" fill="#ca8a04" opacity="0.4" />
          <ellipse cx="80" cy="62" rx="4" ry="3" fill="#fef08a" />
          {/* Black Olive in center */}
          <circle cx="80" cy="62" r="5" fill="#1c1917" stroke="#44403c" strokeWidth="1" />
        </svg>
      );

    case 'riz':
      return (
        <svg viewBox="0 0 160 120" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bowlGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
          </defs>
          <rect width="160" height="120" rx="12" fill="#18181b" />
          {/* Shadow */}
          <ellipse cx="80" cy="100" rx="42" ry="10" fill="#09090b" opacity="0.6" />
          {/* Rice Mound */}
          <ellipse cx="80" cy="60" rx="42" ry="24" fill="#fef3c7" />
          <ellipse cx="80" cy="56" rx="36" ry="18" fill="#fde68a" />
          {/* Vermicelli browned strands */}
          <path d="M 64 54 Q 72 50 78 55" stroke="#92400e" strokeWidth="2" fill="none" />
          <path d="M 76 60 Q 84 57 90 62" stroke="#92400e" strokeWidth="2" fill="none" />
          <path d="M 85 50 Q 94 48 98 54" stroke="#92400e" strokeWidth="2" fill="none" />
          <path d="M 60 62 Q 68 64 74 61" stroke="#b45309" strokeWidth="1.8" fill="none" />
          {/* Garnish parsley */}
          <circle cx="80" cy="48" r="3" fill="#16a34a" />
          <circle cx="83" cy="46" r="2.5" fill="#15803d" />
          {/* Ceramic Bowl */}
          <path d="M 38 60 Q 40 96 80 96 Q 120 96 122 60 Z" fill="url(#bowlGrad)" stroke="#52525b" strokeWidth="2" />
        </svg>
      );

    case 'matlouh':
      return (
        <svg viewBox="0 0 160 120" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="matlouhGrad" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#fed7aa" />
              <stop offset="85%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </radialGradient>
          </defs>
          <rect width="160" height="120" rx="12" fill="#18181b" />
          {/* Flatbread Matlouh */}
          <ellipse cx="80" cy="64" rx="52" ry="32" fill="url(#matlouhGrad)" stroke="#ea580c" strokeWidth="1.5" />
          {/* Traditional Fork / Steam Prick marks */}
          <circle cx="60" cy="56" r="2" fill="#9a3412" />
          <circle cx="68" cy="52" r="2" fill="#9a3412" />
          <circle cx="76" cy="50" r="2" fill="#9a3412" />
          <circle cx="84" cy="50" r="2" fill="#9a3412" />
          <circle cx="92" cy="52" r="2" fill="#9a3412" />
          <circle cx="100" cy="56" r="2" fill="#9a3412" />
          {/* Center toasted semolina spots */}
          <ellipse cx="80" cy="64" rx="20" ry="12" fill="#ffedd5" opacity="0.6" />
          <circle cx="74" cy="65" r="1.5" fill="#7c2d12" />
          <circle cx="86" cy="63" r="1.5" fill="#7c2d12" />
          <circle cx="80" cy="70" r="1.5" fill="#7c2d12" />
          {/* Nigella / Sanoudj seeds */}
          <circle cx="65" cy="68" r="1.2" fill="#18181b" />
          <circle cx="95" cy="66" r="1.2" fill="#18181b" />
          <circle cx="82" cy="58" r="1.2" fill="#18181b" />
        </svg>
      );

    case 'boisson':
      return (
        <svg viewBox="0 0 160 120" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="juiceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <rect width="160" height="120" rx="12" fill="#18181b" />
          {/* Shadow */}
          <ellipse cx="80" cy="102" rx="22" ry="6" fill="#09090b" opacity="0.6" />
          {/* Glass */}
          <path d="M 64 36 L 68 96 L 92 96 L 96 36 Z" fill="none" stroke="#71717a" strokeWidth="2" />
          {/* Juice Liquid */}
          <path d="M 65 48 L 68 94 L 92 94 L 95 48 Z" fill="url(#juiceGrad)" opacity="0.9" />
          {/* Ice Cubes */}
          <rect x="72" y="52" width="12" height="12" rx="2" fill="#ffffff" opacity="0.4" transform="rotate(12 72 52)" />
          <rect x="76" y="70" width="10" height="10" rx="2" fill="#ffffff" opacity="0.3" transform="rotate(-8 76 70)" />
          {/* Straw */}
          <path d="M 85 92 L 85 24 L 98 16" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Lemon Slice */}
          <circle cx="64" cy="36" r="10" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
          {/* Fresh Mint Leaf */}
          <path d="M 94 34 Q 104 30 102 38 Q 96 40 94 34 Z" fill="#22c55e" />
        </svg>
      );

    default:
      return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-400">
          🍗
        </div>
      );
  }
};
