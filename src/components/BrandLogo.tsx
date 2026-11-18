import { useId } from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
} as const;

const textClasses = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
} as const;

export function BrandLogo({ size = 'md', showWordmark = true }: BrandLogoProps) {
  const gradientId = useId();

  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={`${sizeClasses[size]} shrink-0 drop-shadow-xs`}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="4"
            y1="2"
            x2="36"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />
        <path
          d="M11 13.5C11 11.8431 12.3431 10.5 14 10.5H23.5C25.1569 10.5 26.5 11.8431 26.5 13.5V15H14C12.3431 15 11 14.3284 11 13.5Z"
          fill="#A7F3D0"
        />
        <rect x="9.5" y="14" width="21" height="15.5" rx="4" fill="#FFFFFF" />
        <path
          d="M22.5 19.25H30.5V24.25H22.5C21.1193 24.25 20 23.1307 20 21.75C20 20.3693 21.1193 19.25 22.5 19.25Z"
          fill="#059669"
        />
        <circle cx="22.75" cy="21.75" r="1.4" fill="#FDE68A" />
      </svg>

      {showWordmark && (
        <span
          className={`${textClasses[size]} font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap`}
        >
          DuitKu
        </span>
      )}
    </div>
  );
}
