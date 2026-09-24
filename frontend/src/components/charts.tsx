import React, { useEffect, useRef, useState } from 'react';
import { clamp } from '@/lib/utils';
import { cn } from '@/lib/utils';

/* --------------------------- useElementWidth ---------------------------- */
export function useElementWidth(initial = 640) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setW(el.clientWidth || initial);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [initial]);
  return [ref, w] as const;
}

/* ----------------------------- Sparkline -------------------------------- */
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  strokeWidth?: number;
}

export function Sparkline({ data, color = '#5B5FEF', width = 84, height = 30, fill = true, strokeWidth = 2 }: SparklineProps) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - 3 - ((v - min) / span) * (height - 6)] as const);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const gid = `sp${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={color} />
    </svg>
  );
}

/* --------------------------- Multi Line Chart --------------------------- */
interface Series {
  name: string;
  color: string;
  data: number[];
  area?: boolean;
  dashed?: boolean;
  width?: number;
}

interface Band { from: number; to: number; color?: string; opacity?: number }
interface Marker { index: number; color: string }

interface LineChartProps {
  series: Series[];
  height?: number;
  yMin?: number;
  yMax?: number;
  unit?: string;
  decimals?: number;
  xLabels?: string[];
  bands?: Band[];
  markers?: Marker[];
  className?: string;
}

export function LineChart({
  series, height = 210, yMin, yMax, unit = '', decimals = 0,
  xLabels = [], bands = [], markers = [], className,
}: LineChartProps) {
  const [ref, w] = useElementWidth();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 42, padR = 14, padT = 14;
  const padB = xLabels.length ? 26 : 14;
  const iw = Math.max(20, w - padL - padR);
  const ih = Math.max(20, height - padT - padB);

  const all = series.flatMap((s) => s.data).filter((v) => typeof v === 'number' && isFinite(v));
  let lo = yMin ?? Math.min(...all);
  let hi = yMax ?? Math.max(...all);
  if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; }
  if (lo === hi) { lo -= 1; hi += 1; }
  const padY = (hi - lo) * 0.14;
  if (yMin == null) lo -= padY;
  if (yMax == null) hi += padY;

  const n = Math.max(...series.map((s) => s.data.length), 2);
  const X = (i: number) => padL + (i / (n - 1)) * iw;
  const Y = (v: number) => padT + ih - ((v - lo) / (hi - lo)) * ih;
  const ticks = 4;
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => lo + ((hi - lo) * i) / ticks);
  const fmt = (v: number) => (decimals ? v.toFixed(decimals) : Math.round(v).toString());

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHover(clamp(Math.round(((x - padL) / iw) * (n - 1)), 0, n - 1));
  };

  return (
    <div ref={ref} className={cn('relative w-full', className)} style={{ height }}>
      <svg width={w} height={height} className="block">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`lg-${i}-${s.name.replace(/\W/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity=".20" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {bands.map((b, i) => (
          <rect
            key={i}
            x={padL}
            y={Y(b.to)}
            width={iw}
            height={Math.max(0, Y(b.from) - Y(b.to))}
            fill={b.color ?? '#31A56D'}
            opacity={b.opacity ?? 0.07}
            rx="6"
          />
        ))}

        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={padL + iw} y1={Y(v)} y2={Y(v)} stroke="#EDF0F5" strokeWidth="1" />
            <text x={padL - 10} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#98A2B3" fontFamily="Inter">
              {fmt(v)}
            </text>
          </g>
        ))}

        {series.map((s, si) => {
          const pts = s.data.map((v, i) => [X(i), Y(v)] as const);
          const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
          const area = `${line} L ${pts[pts.length - 1][0]} ${padT + ih} L ${pts[0][0]} ${padT + ih} Z`;
          return (
            <g key={si}>
              {s.area !== false && !s.dashed && (
                <path d={area} fill={`url(#lg-${si}-${s.name.replace(/\W/g, '')})`} />
              )}
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth={s.width ?? 2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={s.dashed ? '5 5' : undefined}
              />
            </g>
          );
        })}

        {markers.map((m, i) => (
          <g key={i}>
            <line x1={X(m.index)} x2={X(m.index)} y1={padT} y2={padT + ih} stroke={m.color} strokeWidth="1.2" strokeDasharray="3 4" />
            <circle cx={X(m.index)} cy={padT + 8} r="3.5" fill={m.color} />
          </g>
        ))}

        {hover != null && (
          <g>
            <line x1={X(hover)} x2={X(hover)} y1={padT} y2={padT + ih} stroke="#C6CDDA" strokeWidth="1" />
            {series.map((s, si) => s.data[hover] != null && (
              <circle key={si} cx={X(hover)} cy={Y(s.data[hover])} r="4" fill="#fff" stroke={s.color} strokeWidth="2.4" />
            ))}
          </g>
        )}

        {xLabels.map((l, i) => (
          <text
            key={i}
            x={padL + (i / Math.max(1, xLabels.length - 1)) * iw}
            y={height - 6}
            textAnchor="middle"
            fontSize="11"
            fill="#98A2B3"
            fontFamily="Inter"
          >
            {l}
          </text>
        ))}

        <rect
          x={padL}
          y={padT}
          width={iw}
          height={ih}
          fill="transparent"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: 'crosshair' }}
        />
      </svg>

      {hover != null && (
        <div
          className="absolute pointer-events-none bg-white border border-line rounded-xl shadow-lift px-3 py-2 z-10"
          style={{ left: clamp(X(hover) + 12, 8, Math.max(8, w - 168)), top: 8, minWidth: 130 }}
        >
          <p className="text-[11px] text-muted font-medium mb-1">
            {xLabels.length ? xLabels[Math.round((hover / (n - 1)) * (xLabels.length - 1))] : `#${hover + 1}`}
          </p>
          {series.map((s, si) => (
            <div key={si} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
              <span className="font-semibold num text-ink">
                {s.data[hover] != null ? `${decimals ? s.data[hover].toFixed(decimals) : Math.round(s.data[hover])}${unit}` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Bar Chart ------------------------------ */
interface BarChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
  unit?: string;
}

export function BarChart({ data, labels = [], color = '#5B5FEF', height = 150, unit = '' }: BarChartProps) {
  const [ref, w] = useElementWidth();
  const [hover, setHover] = useState<number | null>(null);
  const padB = 24, padT = 10;
  const ih = height - padB - padT;
  const max = Math.max(...data, 1);
  const gap = 10;
  const bw = Math.max(4, (w - gap * (data.length - 1)) / data.length);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      <svg width={w} height={height}>
        <line x1="0" x2={w} y1={padT + ih} y2={padT + ih} stroke="#EDF0F5" />
        {data.map((v, i) => {
          const h = (v / max) * ih;
          const x = i * (bw + gap);
          const active = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x} y={padT} width={bw} height={ih} fill="transparent" />
              <rect
                x={x}
                y={padT + ih - h}
                width={bw}
                height={h}
                rx={Math.min(7, bw / 2)}
                fill={color}
                opacity={active ? 1 : 0.78}
                style={{ transition: 'all .3s ease' }}
              />
              {labels[i] && (
                <text x={x + bw / 2} y={height - 7} textAnchor="middle" fontSize="11" fill="#98A2B3" fontFamily="Inter">
                  {labels[i]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div
          className="absolute bg-white border border-line rounded-lg shadow-lift px-2.5 py-1 text-[12px] font-semibold num"
          style={{ left: clamp(hover * (bw + gap) + bw / 2 - 30, 0, Math.max(0, w - 70)), top: 0 }}
        >
          {unit}{data[hover]}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- CTG Chart ----------------------------- */
interface CTGChartProps {
  data: { fhr: number[]; ua: number[] };
  height?: number;
  showMarkers?: boolean;
  rangeLabel?: string;
}

export function CTGChart({ data, height = 300, showMarkers = true, rangeLabel = 'Live' }: CTGChartProps) {
  const [ref, w] = useElementWidth();
  const padL = 44, padR = 14;
  const fhrH = Math.round(height * 0.62);
  const uaH = height - fhrH - 18;
  const iw = Math.max(20, w - padL - padR);
  const n = data.fhr.length;
  const X = (i: number) => padL + (i / (n - 1)) * iw;
  const fLo = 100, fHi = 190;
  const Yf = (v: number) => ((v - fLo) / (fHi - fLo)) * fhrH;
  const Yu = (v: number) => (v / 60) * uaH;

  const fPath = data.fhr.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${clamp(Yf(v), 2, fhrH - 2).toFixed(1)}`).join(' ');
  const uPath = data.ua.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${(uaH - Yu(v)).toFixed(1)}`).join(' ');

  const markers = showMarkers
    ? [
        { i: 47, color: '#31A56D' },
        { i: 99, color: '#E05252' },
        { i: 135, color: '#31A56D' },
        { i: 203, color: '#31A56D' },
        { i: 99, color: '#8B7CFF' },
      ]
    : [];

  return (
    <div ref={ref} className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-muted">
          Fetal heart rate (bpm)
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-healthy" />Accel</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-crit" />Decel</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-ai" />AI flag</span>
        </div>
      </div>

      <svg width={w} height={height} className="block">
        {[100, 120, 140, 160, 180].map((v) => (
          <g key={v}>
            <line x1={padL} x2={padL + iw} y1={Yf(v)} y2={Yf(v)} stroke="#EDF0F5" strokeWidth="1" />
            <text x={padL - 9} y={Yf(v) + 4} textAnchor="end" fontSize="10.5" fill="#98A2B3" fontFamily="Inter">{v}</text>
          </g>
        ))}
        <rect x={padL} y={Yf(110)} width={iw} height={Yf(160) - Yf(110)} fill="#31A56D" opacity=".055" rx="6" />
        <line x1={padL} x2={padL + iw} y1={Yf(142)} y2={Yf(142)} stroke="#35B8A4" strokeWidth="1.3" strokeDasharray="6 5" opacity=".85" />
        <path d={fPath} fill="none" stroke="#35B8A4" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" />

        {markers.map((m, i) => (
          <g key={i}>
            <line x1={X(m.i)} x2={X(m.i)} y1={2} y2={fhrH} stroke={m.color} strokeWidth="1" strokeDasharray="3 4" opacity=".55" />
            <circle cx={X(m.i)} cy={clamp(Yf(data.fhr[m.i]), 6, fhrH - 6)} r="3.6" fill="#fff" stroke={m.color} strokeWidth="2" />
          </g>
        ))}

        <line x1={padL} x2={padL + iw} y1={fhrH + 8} y2={fhrH + 8} stroke="#E6EAF0" />
        <text x={padL - 9} y={fhrH + 30} textAnchor="end" fontSize="10.5" fill="#98A2B3" fontFamily="Inter">UA</text>

        <g transform={`translate(0, ${fhrH + 8})`}>
          <path d={uPath} fill="none" stroke="#8B7CFF" strokeWidth="1.7" strokeLinejoin="round" />
        </g>

        {['-60m', '-45m', '-30m', '-15m', 'now'].map((l, i, arr) => (
          <text key={l} x={padL + (i / (arr.length - 1)) * iw} y={height - 3} textAnchor="middle" fontSize="10.5" fill="#98A2B3" fontFamily="Inter">{l}</text>
        ))}
      </svg>

      <div className="flex items-center justify-between mt-1 text-[11px] text-muted">
        <span>Uterine activity</span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1"><span className="w-4 h-[2px] bg-fetal" />FHR</span>
          <span className="flex items-center gap-1"><span className="w-4 h-[2px] bg-ai" />UA</span>
          <span className="num">Range: {rangeLabel}</span>
        </span>
      </div>
    </div>
  );
}