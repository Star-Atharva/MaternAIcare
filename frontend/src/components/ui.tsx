import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* --------------------------------- Card --------------------------------- */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('bg-white border border-line rounded-2xl shadow-card', className)} {...props} />
  )
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5 sm:p-6', className)} {...props} />
);
export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 sm:px-6 pb-5 sm:pb-6', className)} {...props} />
);

/* -------------------------------- Button -------------------------------- */
const buttonVariants = cva(
  'focusable inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed rounded-xl active:scale-[.98]',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark shadow-[0_6px_18px_-8px_rgba(91,95,239,.9)]',
        ai: 'text-white shadow-[0_6px_18px_-8px_rgba(139,124,255,.9)] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]',
        soft: 'bg-primary-soft text-primary hover:bg-[#E4E4FD]',
        ghost: 'text-muted hover:text-ink hover:bg-[#F2F4F7]',
        outline: 'border border-line bg-white text-ink hover:border-[#D3DAE5] hover:bg-[#FAFBFD]',
        danger: 'bg-crit text-white hover:bg-[#C93F3F]',
        warn: 'bg-warn text-white hover:bg-[#DE971F]',
      },
      size: {
        sm: 'text-[13px] px-3 py-1.5',
        md: 'text-sm px-4 py-2.5',
        lg: 'text-[15px] px-5 py-3 rounded-2xl',
        icon: 'p-2.5',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, icon, iconRight, children, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {icon}
      {children}
      {iconRight}
    </button>
  )
);
Button.displayName = 'Button';

/* -------------------------------- Badge --------------------------------- */
const TONE: Record<string, { c: string; bg: string; tx: string; label: string }> = {
  healthy: { c: '#31A56D', bg: '#EAF7F0', tx: '#1E7A50', label: 'Stable' },
  watch: { c: '#F2A93B', bg: '#FEF6E7', tx: '#96650F', label: 'Watch' },
  critical: { c: '#E05252', bg: '#FDECEC', tx: '#9E2B2B', label: 'Urgent review' },
  primary: { c: '#5B5FEF', bg: '#EEEEFE', tx: '#3B3FC4', label: 'Info' },
  neutral: { c: '#667085', bg: '#F2F4F7', tx: '#475467', label: 'Neutral' },
  fetal: { c: '#35B8A4', bg: '#E8F7F4', tx: '#1B7F70', label: 'Fetal' },
  rose: { c: '#E86A8A', bg: '#FDEEF2', tx: '#B93D5E', label: 'Maternal' },
  ai: { c: '#8B7CFF', bg: '#F1EEFF', tx: '#5B4FD1', label: 'AI' },
};
export { TONE };

interface BadgeProps {
  tone?: keyof typeof TONE;
  pulse?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ tone = 'healthy', pulse = false, className, children }: BadgeProps) {
  const t = TONE[tone] ?? TONE.neutral;
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full', className)}
      style={{ background: t.bg, color: t.tx }}
    >
      <span
        className={cn('dot-live', !pulse && '!w-1.5 !h-1.5 !after:hidden')}
        style={{ background: t.c, color: t.c }}
      />
      {children ?? t.label}
    </span>
  );
}

export function Dot({ tone = 'healthy', pulse = true, size = 8 }: { tone?: keyof typeof TONE; pulse?: boolean; size?: number }) {
  const t = TONE[tone] ?? TONE.neutral;
  return (
    <span
      className={cn('dot-live', !pulse && '!after:hidden')}
      style={{ background: t.c, color: t.c, width: size, height: size }}
    />
  );
}

/* ------------------------------ Skeleton -------------------------------- */
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('skeleton', className)} />
);

/* -------------------------- Section header ------------------------------ */
interface SectionHeadProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHead({ title, subtitle, action, className }: SectionHeadProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h3 className="font-display text-[17px] font-bold text-ink leading-tight">{title}</h3>
        {subtitle && <p className="text-[13px] text-muted mt-1 leading-snug">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ----------------------------- Input / Field ---------------------------- */
export const inputCls =
  'focusable w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-[14px] text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition placeholder:text-muted/60';

export function Field({
  label, hint, important, children,
}: { label: string; hint?: string; important?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
        {label}
        {important && (
          <span className="text-[10px] font-bold text-primary bg-primary-soft px-1.5 py-0.5 rounded">IMPORTANT</span>
        )}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="block text-[11.5px] text-muted mt-1.5">{hint}</span>}
    </label>
  );
}

/* --------------------------- Empty state -------------------------------- */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] flex items-center justify-center text-muted mb-4">
          {icon}
        </div>
      )}
      <p className="font-semibold text-ink text-[15px]">{title}</p>
      {message && <p className="text-[13px] text-muted mt-1.5 max-w-xs leading-relaxed">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------ Range picker ---------------------------- */
export function RangePicker({
  value, onChange, options = ['6h', '24h', '7d', '30d'],
}: { value: string; onChange: (v: string) => void; options?: string[] }) {
  return (
    <div className="inline-flex p-1 bg-[#F2F4F7] rounded-xl">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            'focusable px-3 py-1.5 rounded-lg text-[12px] font-semibold transition',
            value === o ? 'bg-white text-primary shadow-card' : 'text-muted hover:text-ink'
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
export function ChipSelect({
  options, value, onChange, multi = true,
}: { options: string[]; value: string[] | string; onChange: (v: any) => void; multi?: boolean }) {
  const list = multi ? (value as string[]) : [value as string];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = list.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => {
              if (!multi) return onChange(o);
              onChange(active ? list.filter((x) => x !== o) : [...list, o]);
            }}
            className={cn(
              'focusable text-[12.5px] font-semibold px-3 py-2 rounded-xl border transition-all',
              active ? 'bg-primary-soft border-primary/30 text-primary' : 'bg-white border-line text-muted hover:border-[#D3DAE5] hover:text-ink'
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}