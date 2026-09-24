import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowRight, Baby, CheckCircle, Clock, Cpu, Droplet, Gauge,
  Heart, Info, Moon, Radio, Sparkles, Thermometer, Wind, XCircle, Zap,
} from 'lucide-react';
import { Badge, Button, Card, Dot, SectionHead, TONE } from './ui';
import { Sparkline, BarChart } from './charts';
import { useApp } from '@/context/AppContext';
import { cn, timeAgo } from '@/lib/utils';
import type { Alert, Device, StreamRow } from '@/types';

/* ----------------------------- Vitals Card ------------------------------ */
interface VitalsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  delta?: string;
  deltaDir?: 'up' | 'down' | 'flat';
  spark: number[];
  color: string;
  source: string;
  updated: string;
  flashKey: number | string;
}

export function VitalsCard({
  icon, label, value, unit, delta, deltaDir = 'flat', spark, color, source, updated, flashKey,
}: VitalsCardProps) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 700);
    return () => clearTimeout(t);
  }, [flashKey]);

  const up = deltaDir === 'up';
  const deltaColor = deltaDir === 'flat' ? 'text-muted' : up ? 'text-warn' : 'text-healthy';

  return (
    <Card className={cn('p-4 transition-shadow hover:shadow-lift', flash && 'flash')}>
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, color }}>
          {icon}
        </span>
        <div>
          <p className="text-[12.5px] font-semibold text-muted leading-tight">{label}</p>
          <p className="text-[10.5px] text-muted/80 mt-0.5">{source}</p>
        </div>
      </div>

      <div className="flex items-end justify-between mt-3.5 gap-2">
        <div>
          <p className="font-display text-[26px] font-bold text-ink leading-none num">
            {value}
            <span className="text-[12px] font-semibold text-muted ml-1">{unit}</span>
          </p>
          {delta && (
            <p className={cn('text-[11.5px] font-semibold mt-1.5 num', deltaColor)}>
              {delta}
            </p>
          )}
        </div>
        <Sparkline data={spark} color={color} width={78} height={30} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-line/70">
        <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-healthy">
          <Dot tone="healthy" size={6} /> Live sensor
        </span>
        <span className="text-[10.5px] text-muted">{updated}</span>
      </div>
    </Card>
  );
}

/* ----------------------------- Health Hero ------------------------------ */
export function HealthHero() {
  const { live, aiStatus, aiMessage, anomaly } = useApp();
  const detected = anomaly.phase === 'detected';
  const score = detected ? 74 : 92;
  const tone = detected ? TONE.watch : TONE.healthy;
  const r = 58;
  const c = 2 * Math.PI * r;

  return (
    <Card className="overflow-hidden relative">
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{ background: 'radial-gradient(900px 220px at 12% -30%, rgba(99,102,241,.10), transparent 70%)' }}
      />
      <div className="relative p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="relative shrink-0 mx-auto md:mx-0">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#EDF0F5" strokeWidth="11" />
            <circle
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={tone.c}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - score / 100)}
              style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,.8,.3,1), stroke .4s' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[34px] font-bold text-ink leading-none num">{score}</span>
            <span className="text-[10.5px] font-semibold text-muted mt-1">Health Score</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Your health status</p>
            <span className="text-[10px] font-semibold text-muted bg-[#F2F4F7] px-2 py-0.5 rounded-full">Demo wellness indicator</span>
          </div>
          <div className="mt-2">
            <Badge tone={detected ? 'watch' : 'healthy'} pulse>
              {detected ? 'Watch' : 'Stable'}
            </Badge>
          </div>
          <p className="text-[14px] text-ink mt-3 leading-relaxed max-w-lg">
            {detected
              ? 'A pattern deviation has been flagged for review. This is decision support, not a diagnosis.'
              : 'Your recent readings are within your personal baseline.'}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
            <span className="flex items-center gap-1.5 text-[12px] text-muted">
              <Clock size={13} /> Last updated: {timeAgo(live.lastUpdate)}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-muted">
              <Dot tone={live.connected ? 'healthy' : 'critical'} size={7} />
              Sensor connection: {live.connected ? 'Connected' : 'Disconnected'}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-muted">
              <Cpu size={13} className="text-ai" /> AI engine: {aiStatus === 'stable' ? 'Nominal' : aiStatus === 'analyzing' ? 'Analysing' : 'Deviation flagged'}
            </span>
          </div>
        </div>

        <div className="hidden xl:flex flex-col items-end gap-2 shrink-0">
          <div className="px-3.5 py-2.5 rounded-2xl bg-[#FBFCFE] border border-line text-right">
            <p className="text-[10.5px] font-semibold text-muted uppercase tracking-wide">Next antenatal visit</p>
            <p className="text-[13.5px] font-semibold text-ink mt-1">18 Oct · 10:30</p>
            <p className="text-[11px] text-muted">Dr. R. Menon · OPD-2</p>
          </div>
        </div>
      </div>

      <div className="relative border-t border-line px-5 sm:px-7 py-3 flex items-center gap-3 bg-[#FBFCFE]">
        <span
          className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', aiStatus === 'analyzing' && 'ai-orb')}
          style={aiStatus !== 'analyzing' ? { background: TONE.ai.bg, color: TONE.ai.tx } : {}}
        >
          <Cpu size={14} className={cn(aiStatus === 'analyzing' ? 'text-white ai-scan' : '')} />
        </span>
        <p className="text-[12.5px] text-muted leading-snug flex-1">
          <span className="font-semibold text-ink">AI observation · </span>
          {aiMessage}
        </p>
      </div>
    </Card>
  );
}

/* ------------------------ Anomaly Monitor Panel ------------------------- */
export function AnomalyMonitorPanel() {
  const { live, anomaly, aiStatus, aiMessage } = useApp();
  const detected = anomaly.phase === 'detected';
  const analyzing = anomaly.phase === 'analyzing';

  const rows = [
    { label: 'Maternal signals', ok: !detected, value: `${live.hr} bpm · ${live.spo2}%` },
    { label: 'Fetal signals', ok: !detected, value: `${live.fhr} bpm` },
    { label: 'Sleep pattern', ok: true, value: '7h 24m' },
    { label: 'Movement pattern', ok: !detected, value: `${live.movement} movements` },
  ];

  return (
    <Card className={cn('overflow-hidden', detected && 'border-warn/40')}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-[17px] font-bold text-ink flex items-center gap-2">
              AI Anomaly Detection
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ai-soft text-[#5B4FD1]">LIVE</span>
            </h3>
            <p className="text-[12.5px] text-muted mt-1">Continuous analysis of maternal and fetal signals.</p>
          </div>
          <div
            className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', analyzing && 'ai-orb')}
            style={!analyzing ? { background: detected ? TONE.watch.bg : TONE.ai.bg, color: detected ? TONE.watch.tx : TONE.ai.tx } : {}}
          >
            <Cpu size={19} className={cn(analyzing && 'text-white ai-scan')} />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#FBFCFE] border border-line/80">
              <span className="text-[13px] font-medium text-ink">{r.label}</span>
              <span className="flex items-center gap-3">
                <span className="text-[11.5px] text-muted num hidden sm:block">{r.value}</span>
                <Badge tone={r.ok ? 'healthy' : 'watch'}>{r.ok ? 'Stable' : 'Deviation'}</Badge>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 h-1.5 rounded-full bg-[#EDF0F5] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: analyzing ? '62%' : detected ? '100%' : '34%',
              background: detected ? 'linear-gradient(90deg,#F2A93B,#E05252)' : 'linear-gradient(90deg,#6366F1,#8B5CF6)',
            }}
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-[11.5px] text-muted">
            Last analysis: <span className="num font-semibold text-ink">{timeAgo(live.lastUpdate)}</span>
          </span>
          <span className="text-[11.5px] text-muted">
            Windows analysed today: <span className="num font-semibold text-ink">12,480</span>
          </span>
        </div>

        <div className={cn(
          'mt-4 p-3.5 rounded-2xl border text-[12.5px] leading-relaxed',
          detected ? 'bg-warn-soft border-warn/25 text-[#96650F]' : 'bg-ai-soft/60 border-ai/15 text-[#5B4FD1]'
        )}>
          <span className="font-semibold">{detected ? 'AI detected a pattern requiring review. ' : 'AI observation. '}</span>
          {aiMessage}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ Anomaly Timeline ------------------------ */
export function AnomalyTimeline() {
  const { timeline } = useApp();
  const map = { normal: TONE.healthy, watch: TONE.watch, critical: TONE.critical };

  return (
    <Card className="p-5 sm:p-6">
      <SectionHead title="Anomaly timeline" subtitle="Today's analysis events, most recent last." />
      <div className="mt-6 relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-line" />
        <div className="space-y-5">
          {timeline.map((e, i) => {
            const t = map[e.level as keyof typeof map] ?? TONE.healthy;
            return (
              <div key={i} className="relative flex gap-4">
                <span
                  className="relative z-10 mt-1 w-3.5 h-3.5 rounded-full border-[3px] border-white shrink-0"
                  style={{ background: t.c, boxShadow: `0 0 0 1px ${t.c}33` }}
                />
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[12px] font-bold num text-muted">{e.time}</span>
                    <span className="text-[13.5px] font-semibold" style={{ color: t.tx }}>{e.label}</span>
                  </div>
                  <p className="text-[12.5px] text-muted mt-1 leading-snug">{e.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-muted mt-5 pt-4 border-t border-line leading-relaxed">
        Events shown are AI-generated observations from configured thresholds. They are not clinical diagnoses.
      </p>
    </Card>
  );
}

/* -------------------------------- Alert Card ---------------------------- */
export function AlertCard({ alert, clinical = false }: { alert: Alert; clinical?: boolean }) {
  const { acknowledgeAlert, escalateAlert } = useApp();
  const tone = alert.level === 'critical' ? 'critical' : alert.level === 'watch' ? 'watch' : 'healthy';
  const t = TONE[tone];
  const Icon = tone === 'healthy' ? CheckCircle : tone === 'watch' ? AlertTriangle : XCircle;

  return (
    <Card className="p-4 sm:p-5" style={{ borderLeftWidth: 3, borderLeftColor: t.c }}>
      <div className="flex items-start gap-3.5">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.bg, color: t.tx }}>
          <Icon size={17} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={tone}>{tone === 'healthy' ? 'Normal' : tone === 'watch' ? 'Watch' : 'Urgent review'}</Badge>
            {alert.ack && <span className="text-[11px] font-semibold text-muted bg-[#F2F4F7] px-2 py-0.5 rounded-full">Acknowledged</span>}
            {alert.simulated && <span className="text-[11px] font-semibold text-ai bg-ai-soft px-2 py-0.5 rounded-full">Simulated</span>}
          </div>
          <p className="text-[14.5px] font-semibold text-ink mt-2.5 leading-snug">{alert.title}</p>
          <p className="text-[13px] text-muted mt-1.5 leading-relaxed">{alert.detail}</p>

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {[
              { k: 'Detected', v: alert.detected },
              { k: 'Why flagged', v: alert.why },
              { k: 'Recommended', v: alert.action },
            ].map((x) => (
              <div key={x.k} className="rounded-xl bg-[#FBFCFE] border border-line/80 p-3">
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted">{x.k}</p>
                <p className="text-[12.5px] text-ink mt-1 leading-snug">{x.v}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Link to="/app/anomaly"><Button size="sm" variant="outline">View details</Button></Link>
            {clinical && (
              <>
                <Link to="/app/patients"><Button size="sm" variant="soft">Review patient</Button></Link>
                <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>Acknowledge</Button>
                <Button size="sm" variant="danger" onClick={() => escalateAlert(alert.id)}>Escalate</Button>
              </>
            )}
            {!clinical && !alert.ack && (
              <Button size="sm" variant="soft" onClick={() => acknowledgeAlert(alert.id)}>Acknowledge</Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------- Sensor Card ---------------------------- */
const DEVICE_ICON: Record<Device['icon'], React.ReactNode> = {
  heart: <Heart size={18} />,
  droplet: <Droplet size={18} />,
  thermometer: <Thermometer size={18} />,
  waves: <Activity size={18} />,
  gauge: <Gauge size={18} />,
};

export function SensorCard({ device }: { device: Device }) {
  const connected = device.status === 'connected';
  const streaming = device.packet === 'streaming';

  return (
    <Card className="p-4 hover:shadow-lift transition-shadow">
      <div className="flex items-start justify-between">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: connected ? TONE.primary.bg : TONE.neutral.bg, color: connected ? TONE.primary.c : TONE.neutral.c }}
        >
          {DEVICE_ICON[device.icon]}
        </span>
        <Badge tone={connected ? (streaming ? 'fetal' : 'healthy') : 'neutral'} pulse={connected}>
          {streaming ? 'Streaming' : connected ? 'Connected' : 'Idle'}
        </Badge>
      </div>
      <p className="text-[13.5px] font-semibold text-ink mt-3.5 leading-tight">{device.name}</p>
      <p className="text-[11.5px] text-muted mt-0.5">{device.type}</p>

      <div className="mt-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-muted">Battery</span>
          <span className="num font-semibold text-ink">{device.battery}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#EDF0F5] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${device.battery}%`, background: device.battery > 30 ? TONE.healthy.c : TONE.watch.c }}
          />
        </div>
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-muted">Signal</span>
          <span className="num font-semibold text-ink">{device.signal}%</span>
        </div>
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-muted">Last packet</span>
          <span className="font-semibold text-ink">{device.packet}</span>
        </div>
      </div>
    </Card>
  );
}

/* --------------------------- Live Stream Panel -------------------------- */
export function LiveStreamPanel({ rows, height = 210 }: { rows: StreamRow[]; height?: number }) {
  const toneMap: Record<string, string> = {
    rose: TONE.rose.c, primary: TONE.primary.c, watch: TONE.watch.c,
    fetal: TONE.fetal.c, ai: TONE.ai.c, healthy: '#6EE7B7',
  };

  return (
    <div className="rounded-2xl bg-[#0F1424] p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-[11.5px] font-bold tracking-wide text-white/70 uppercase">
          <Dot tone="healthy" size={7} /> Live data stream
        </span>
        <span className="text-[10.5px] text-white/40 font-mono">MQTT · maitri/telemetry/#</span>
      </div>
      <div className="space-y-1.5 overflow-hidden" style={{ height }}>
        {rows.length === 0 && (
          <div className="space-y-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 rounded bg-white/[.04] animate-pulse" style={{ animationDelay: `${i * 90}ms` }} />
            ))}
          </div>
        )}
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg bg-white/[.03] border border-white/[.05] font-mono text-[11.5px]"
            style={{ opacity: Math.max(0.1, 1 - i * 0.09) }}
          >
            <span className="text-white/40 shrink-0">{r.t}</span>
            <span className="text-white/50 w-10 shrink-0">{r.label}</span>
            <ArrowRight size={12} className="text-white/25 shrink-0" />
            <span className="font-semibold num" style={{ color: toneMap[r.tone] ?? TONE.neutral.c }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Sleep Summary --------------------------- */
export function SleepSummaryCard() {
  const week = [6.4, 7.1, 6.8, 7.6, 7.9, 7.4, 7.4];
  return (
    <Card className="p-5">
      <SectionHead
        title="Sleep last night"
        subtitle="Auto-detected from wearable"
        action={<Link to="/app/sleep"><Button size="sm" variant="ghost"><ArrowRight size={14} /></Button></Link>}
      />
      <div className="flex items-end gap-3 mt-4">
        <p className="font-display text-[30px] font-bold text-ink leading-none">7h <span className="text-[22px]">24m</span></p>
        <Badge tone="healthy" className="mb-1">Good quality</Badge>
      </div>
      <div className="mt-4">
        <BarChart data={week} labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']} color="#8B7CFF" height={104} />
      </div>
      <p className="text-[11.5px] text-muted mt-2 leading-snug">
        Your sleep duration has decreased slightly over the last 3 nights.
      </p>
    </Card>
  );
}

/* ---------------------------- Sensor Status Card ------------------------ */
export function SensorStatusCard() {
  const { devices } = useApp();
  return (
    <Card className="p-5">
      <SectionHead
        title="Sensor status"
        subtitle="5 devices paired"
        action={<Link to="/app/sensors"><Button size="sm" variant="ghost"><Radio size={14} /></Button></Link>}
      />
      <div className="mt-4 space-y-2.5">
        {devices.slice(0, 4).map((d) => (
          <div key={d.id} className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#F4F6FA] text-muted flex items-center justify-center shrink-0">
              {DEVICE_ICON[d.icon]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-ink truncate">{d.name}</p>
              <p className="text-[11px] text-muted">{d.packet}</p>
            </div>
            <Dot tone={d.status === 'connected' ? 'healthy' : 'neutral'} size={7} />
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3.5 border-t border-line flex items-center justify-between">
        <span className="text-[11.5px] text-muted">Backend & AI engine</span>
        <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-healthy">
          <Dot tone="healthy" size={6} /> Online · processing
        </span>
      </div>
    </Card>
  );
}

/* ---------------------------- Checkin Prompt ---------------------------- */
export function CheckinPromptCard() {
  return (
    <Card className="p-5 flex flex-col">
      <SectionHead title="Daily check-in" subtitle="Takes about 40 seconds" />
      <div className="flex-1 flex flex-col justify-center py-4">
        <p className="text-[13.5px] text-ink font-medium">How are you feeling today?</p>
        <div className="flex gap-2 mt-3">
          {['😊', '🙂', '😐', '😟', '😣'].map((e, i) => (
            <Link
              key={i}
              to="/app/checkin"
              className="focusable w-10 h-10 rounded-xl border border-line bg-white hover:border-primary/40 hover:bg-primary-soft/50 transition text-[17px] flex items-center justify-center"
            >
              {e}
            </Link>
          ))}
        </div>
      </div>
      <Link to="/app/checkin"><Button className="w-full" variant="soft">Start today's check-in</Button></Link>
    </Card>
  );
}

/* ------------------------------- Fetal Summary -------------------------- */
export function FetalSummaryCard() {
  const { live } = useApp();
  return (
    <Card className="p-5 sm:p-6">
      <SectionHead
        title="Baby monitoring"
        subtitle="Fetal heart rate & movement from the Doppler array."
        action={<Link to="/app/baby"><Button size="sm" variant="ghost"><ArrowRight size={14} /></Button></Link>}
      />
      <div className="flex items-center gap-5 mt-5">
        <div
          className="w-[92px] h-[92px] rounded-3xl flex flex-col items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#E8F7F4,#F4FCFA)', border: '1px solid #C9EDE7' }}
        >
          <Baby size={20} className="text-fetal" />
          <span className="font-display text-[22px] font-bold text-ink leading-none mt-1.5 num">{Math.round(live.fhr)}</span>
          <span className="text-[10px] font-semibold text-muted">BPM</span>
        </div>
        <div className="flex-1 min-w-0">
          <Badge tone="fetal" pulse>Within monitored range</Badge>
          <p className="text-[12.5px] text-muted mt-2.5 leading-relaxed">
            Baseline <span className="font-semibold text-ink num">142 bpm</span> · Variability moderate · No decelerations in the last 30 minutes.
          </p>
          <Sparkline data={live.fhrH} color={TONE.fetal.c} width={200} height={36} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        {[
          { l: 'Movements today', v: live.movement, s: 'Normal range' },
          { l: 'Last CTG session', v: '14:05', s: '18 min duration' },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl bg-[#FBFCFE] border border-line p-3.5">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">{x.l}</p>
            <p className="font-display text-[18px] font-bold text-ink mt-1 num">{x.v}</p>
            <p className="text-[11px] text-muted mt-0.5">{x.s}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------------------- Chart Footer ------------------------------ */
export function ChartFooter({ source, updated }: { source: string; updated: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-line text-[11px] text-muted">
      <span className="flex items-center gap-1.5"><Radio size={12} /> Source: {source}</span>
      <span>Last updated: {updated}</span>
    </div>
  );
}

/* ------------------------------- Loading skeleton ----------------------- */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-8 w-72" />
      <div className="skeleton h-[220px] w-full rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-[168px] rounded-2xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="skeleton h-[340px] rounded-2xl" />
        <div className="skeleton h-[340px] rounded-2xl" />
      </div>
    </div>
  );
}

/* ----------------------------- Clinical Stat ---------------------------- */
export function ClinicalStat({ icon, label, value, tone, sub }: {
  icon: React.ReactNode; label: string; value: number | string; tone: keyof typeof TONE; sub?: string;
}) {
  const t = TONE[tone];
  return (
    <Card className="p-4">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.bg, color: t.tx }}>
        {icon}
      </span>
      <p className="font-display text-[28px] font-bold text-ink leading-none mt-3 num">{value}</p>
      <p className="text-[12.5px] font-semibold text-muted mt-2">{label}</p>
      {sub && <p className="text-[11px] text-muted mt-1">{sub}</p>}
    </Card>
  );
}