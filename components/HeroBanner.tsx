import Image from "next/image";

export default function HeroBanner() {
  return (
    <div className="relative w-full h-40 sm:h-56 rounded-2xl overflow-hidden mb-10 bg-[#160b33]">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d1259" />
            <stop offset="40%" stopColor="#221463" />
            <stop offset="70%" stopColor="#161a55" />
            <stop offset="100%" stopColor="#0a1440" />
          </linearGradient>

          <radialGradient id="glowPurple" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glowBlue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="ribbonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4de8ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#4de8ff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#4de8ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ribbonMagenta" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d65cff" stopOpacity="0" />
            <stop offset="50%" stopColor="#d65cff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d65cff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ribbonIndigo" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c6fff" stopOpacity="0" />
            <stop offset="50%" stopColor="#7c6fff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7c6fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ribbonWhite" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <filter id="blurSoft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="blurWide" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="blurFine" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        <rect width="800" height="300" fill="url(#bgGrad)" />

        <ellipse cx="90" cy="40" rx="220" ry="140" fill="url(#glowPurple)" />
        <ellipse cx="720" cy="260" rx="240" ry="150" fill="url(#glowBlue)" />

        <g filter="url(#blurWide)">
          <path
            d="M -100 60 Q 250 10, 500 55 T 900 40"
            stroke="url(#ribbonIndigo)"
            strokeWidth="10"
            fill="none"
          >
            <animate
              attributeName="d"
              dur="14s"
              repeatCount="indefinite"
              values="
                M -100 60 Q 250 10, 500 55 T 900 40;
                M -100 75 Q 250 35, 500 45 T 900 65;
                M -100 60 Q 250 10, 500 55 T 900 40"
            />
          </path>
        </g>

        <g filter="url(#blurSoft)">
          <path
            d="M -100 90 Q 250 40, 500 90 T 900 70"
            stroke="url(#ribbonCyan)"
            strokeWidth="3"
            fill="none"
          >
            <animate
              attributeName="d"
              dur="9s"
              repeatCount="indefinite"
              values="
                M -100 90 Q 250 40, 500 90 T 900 70;
                M -100 100 Q 250 60, 500 80 T 900 90;
                M -100 90 Q 250 40, 500 90 T 900 70"
            />
          </path>
          <path
            d="M -100 220 Q 300 260, 550 210 T 900 230"
            stroke="url(#ribbonMagenta)"
            strokeWidth="3"
            fill="none"
          >
            <animate
              attributeName="d"
              dur="11s"
              repeatCount="indefinite"
              values="
                M -100 220 Q 300 260, 550 210 T 900 230;
                M -100 210 Q 300 240, 550 230 T 900 210;
                M -100 220 Q 300 260, 550 210 T 900 230"
            />
          </path>
        </g>

        <g filter="url(#blurFine)" opacity="0.8">
          <path
            d="M -100 88 Q 250 38, 500 88 T 900 68"
            stroke="url(#ribbonWhite)"
            strokeWidth="1"
            fill="none"
          >
            <animate
              attributeName="d"
              dur="9s"
              repeatCount="indefinite"
              values="
                M -100 88 Q 250 38, 500 88 T 900 68;
                M -100 98 Q 250 58, 500 78 T 900 88;
                M -100 88 Q 250 38, 500 88 T 900 68"
            />
          </path>
          <path
            d="M -100 235 Q 300 195, 550 245 T 900 225"
            stroke="url(#ribbonWhite)"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          >
            <animate
              attributeName="d"
              dur="13s"
              repeatCount="indefinite"
              values="
                M -100 235 Q 300 195, 550 245 T 900 225;
                M -100 225 Q 300 215, 550 235 T 900 245;
                M -100 235 Q 300 195, 550 245 T 900 225"
            />
          </path>
        </g>
      </svg>

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="relative w-full max-w-md h-16 sm:h-24">
          <Image
            src="/dokks-logo.png"
            alt="Dokks"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}