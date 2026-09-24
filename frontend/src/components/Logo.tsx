import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
}

export function Logo({ size = 34, showText = true, light = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <defs>
            <linearGradient id="maitri-logo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="38" height="38" rx="12" fill="url(#maitri-logo)" />
          <path d="M12.5 28.5c0-6 4-10 9-11" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".95" />
          <path d="M22 18.5c3.4 0 6 2.6 6 6.2 0 2.2-1.2 3.8-2.8 3.8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity=".55" />
          <circle cx="22" cy="18.6" r="3.1" fill="#fff" opacity=".95" />
          <path d="M10.5 22.5h3.2l1.6-3.4 2.2 6 1.8-3.6h3.2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".85" />
        </svg>
      </div>
      {showText && (
        <div className="leading-none">
          <p
            className={cn('font-display font-bold tracking-tight', light ? 'text-white' : 'text-ink')}
            style={{ fontSize: size * 0.47 }}
          >
            Maitri <span style={{ color: '#8B7CFF' }}>AI</span>
          </p>
          <p className={cn('text-[10px] mt-1 font-medium tracking-wide', light ? 'text-white/60' : 'text-muted')}>
            MATERNAL INTELLIGENCE
          </p>
        </div>
      )}
    </div>
  );
}