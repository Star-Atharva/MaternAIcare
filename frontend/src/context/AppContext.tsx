import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { DEVICES, PATIENTS, seedSeries, HIST_LEN } from '@/lib/mock';
import { clamp, clock, hhmm, rnd, round1, uid } from '@/lib/utils';
import type {
  Alert, Anomaly, ChatMessage, Device, Notification, Patient, Role, StreamRow, TimelineEvent, User, VitalSample,
} from '@/types';

export type Toast = { id: string; type: 'success' | 'warn' | 'danger' | 'info'; title: string; msg?: string };

interface AnomalyState {
  active: boolean;
  phase: 'idle' | 'analyzing' | 'detected' | 'resolved';
  startedAt: number | null;
}

interface AppState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  booting: boolean;

  demo: boolean;
  setDemo: (d: boolean) => void;

  live: VitalSample;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  acknowledgeAlert: (id: string) => void;
  escalateAlert: (id: string) => void;

  anomaly: AnomalyState;
  simulateAnomaly: () => void;
  resolveAnomaly: () => void;

  aiStatus: 'stable' | 'analyzing' | 'deviation';
  aiMessage: string;

  timeline: TimelineEvent[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  markAllRead: () => void;

  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => void;

  patients: Patient[];
  devices: Device[];

  addCheckin: () => void;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};

const initialLive = (): VitalSample => ({
  hr: 78, spo2: 98, temp: 36.8, rr: 16, sys: 118, dia: 76, fhr: 142, movement: 18,
  hrH: seedSeries(78, 3), fhrH: seedSeries(142, 4), spo2H: seedSeries(98, 0.5),
  sysH: seedSeries(118, 3), diaH: seedSeries(76, 2.4), tempH: seedSeries(36.8, 0.12),
  stream: [],
  lastUpdate: Date.now(), lastPacket: Date.now(), connected: true,
});

const INITIAL_ALERTS: Alert[] = [
  { id: 'a0', level: 'normal', title: 'All monitored signals stable', detail: 'No deviations from your personal baseline in the last 6 hours.', time: '09:20', detected: '09:20', why: 'Routine scheduled analysis window.', action: 'No action required.', ack: true, patient: 'Priya Sharma' },
  { id: 'a1', level: 'watch', title: 'Slight heart-rate deviation', detail: 'Heart rate briefly moved above your personal baseline range.', time: '11:45', detected: '11:45', why: 'Observed deviation from personal baseline (above +12%).', action: 'Rest and repeat measurement.', ack: true, patient: 'Priya Sharma' },
  { id: 'a2', level: 'watch', title: 'Elevated stress pattern', detail: 'Derived stress index remained elevated for 20 minutes.', time: '14:30', detected: '14:30', why: 'Sustained deviation in HR variability window.', action: 'Consider a short rest period and hydration.', ack: true, patient: 'Priya Sharma' },
];

const INITIAL_TIMELINE: TimelineEvent[] = [
  { time: '09:20', label: 'Normal', level: 'normal', note: 'All signals within baseline.' },
  { time: '11:45', label: 'Slight HR deviation', level: 'watch', note: 'Observed deviation from personal baseline.' },
  { time: '14:30', label: 'Elevated stress pattern', level: 'watch', note: 'HR variability window flagged for review.' },
  { time: '16:10', label: 'Normal', level: 'normal', note: 'Signals returned to baseline.' },
];

const INITIAL_NOTIFS: Notification[] = [
  { id: 'n1', cat: 'Alerts', level: 'watch', title: 'Heart-rate deviation detected', body: 'Maternal heart rate remained above the configured baseline.', time: '2 min ago', read: false },
  { id: 'n2', cat: 'Sensor', level: 'normal', title: 'Fetal Doppler reconnected', body: 'Streaming resumed after a brief interruption.', time: '46 min ago', read: false },
  { id: 'n3', cat: 'Appointments', level: 'info', title: 'Antenatal visit reminder', body: 'Scheduled for 18 Oct, 10:30 with Dr. R. Menon.', time: '3 h ago', read: true },
  { id: 'n4', cat: 'System', level: 'info', title: 'AI engine updated', body: 'Signal fusion model updated to v0.9-demo.', time: 'Yesterday', read: true },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(false);
  const [demo, setDemo] = useState(true);
  const [live, setLive] = useState<VitalSample>(initialLive);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [anomaly, setAnomaly] = useState<AnomalyState>({ active: false, phase: 'idle', startedAt: null });
  const [aiStatus, setAiStatus] = useState<'stable' | 'analyzing' | 'deviation'>('stable');
  const [aiMessage, setAiMessage] = useState('All monitored signals are within configured thresholds.');
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [patients] = useState<Patient[]>(PATIENTS);
  const [devices] = useState<Device[]>(DEVICES);

  const timers = useRef<number[]>([]);

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid();
    setToasts((x) => [...x, { id, ...t }]);
    const to = window.setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 4600);
    timers.current.push(to);
  }, []);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // Live telemetry simulation
  useEffect(() => {
    if (!user || !demo) return;
    const id = window.setInterval(() => {
      setLive((prev) => {
        const anomalyOn = anomaly.phase === 'detected';
        const hrTarget = anomalyOn ? 108 : 78;
        const fhrTarget = anomalyOn ? 158 : 142;

        const hr = round1(clamp(prev.hr + (hrTarget - prev.hr) * 0.28 + rnd(-1.8, 1.8), 58, 138));
        const fhr = round1(clamp(prev.fhr + (fhrTarget - prev.fhr) * 0.22 + rnd(-2.6, 2.6), 112, 182));
        const spo2 = round1(clamp(prev.spo2 + rnd(-0.35, 0.35) + (anomalyOn ? -0.16 : 0), 93, 100));
        const temp = round1(clamp(prev.temp + rnd(-0.06, 0.06), 36.1, 38.2));
        const rr = Math.round(clamp(prev.rr + rnd(-1, 1), 11, 24));
        const sys = Math.round(clamp(prev.sys + (anomalyOn ? 0.9 : 0) + rnd(-2, 2), 96, 152));
        const dia = Math.round(clamp(prev.dia + (anomalyOn ? 0.6 : 0) + rnd(-1.6, 1.6), 58, 100));

        const push = (arr: number[], v: number) => [...arr.slice(-(HIST_LEN - 1)), v];
        const stream: StreamRow[] = [
          { t: clock(), label: 'HR', value: `${hr} bpm`, tone: 'rose' },
          { t: clock(), label: 'SpO₂', value: `${spo2}%`, tone: 'primary' },
          { t: clock(), label: 'Temp', value: `${temp} °C`, tone: 'watch' },
          { t: clock(), label: 'FHR', value: `${fhr} bpm`, tone: 'fetal' },
          { t: clock(), label: 'AI', value: anomalyOn ? 'Pattern deviation' : 'No anomaly', tone: anomalyOn ? 'ai' : 'healthy' },
          ...prev.stream,
        ].slice(0, 9);

        return {
          ...prev, hr, fhr, spo2, temp, rr, sys, dia,
          hrH: push(prev.hrH, hr), fhrH: push(prev.fhrH, fhr),
          spo2H: push(prev.spo2H, spo2), sysH: push(prev.sysH, sys),
          diaH: push(prev.diaH, dia), tempH: push(prev.tempH, temp),
          stream,
          lastUpdate: Date.now(), lastPacket: Date.now(), connected: true,
        };
      });
    }, 2000);
    return () => clearInterval(id);
  }, [user, demo, anomaly.phase]);

  // AI status derived from anomaly phase
  useEffect(() => {
    if (anomaly.phase === 'analyzing') {
      setAiStatus('analyzing');
      setAiMessage('Analysing incoming maternal and fetal signal windows…');
    } else if (anomaly.phase === 'detected') {
      setAiStatus('deviation');
      setAiMessage('AI detected a pattern requiring review. This is not a diagnosis.');
    } else if (anomaly.phase === 'resolved') {
      setAiStatus('stable');
      setAiMessage('Signals returned to the configured baseline range.');
    } else {
      setAiStatus('stable');
      setAiMessage('All monitored signals are within configured thresholds.');
    }
  }, [anomaly.phase]);

  const login = useCallback(async (u: User) => {
    setBooting(true);
    await api.auth.signIn(u.email, 'demo', u.role);
    setBooting(false);
    setUser(u);
    pushToast({ type: 'success', title: `Welcome, ${u.name.split(' ')[0]}`, msg: 'Secure session established.' });
  }, [pushToast]);

  const logout = useCallback(async () => {
    await api.auth.signOut();
    setUser(null);
    setAnomaly({ active: false, phase: 'idle', startedAt: null });
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, ack: true } : x)));
    pushToast({ type: 'success', title: 'Alert acknowledged', msg: 'Recorded in the audit trail.' });
  }, [pushToast]);

  const escalateAlert = useCallback((id: string) => {
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, level: 'critical' } : x)));
    pushToast({ type: 'danger', title: 'Escalated', msg: 'On-call clinician notified.' });
  }, [pushToast]);

  const simulateAnomaly = useCallback(() => {
    setAnomaly({ active: true, phase: 'analyzing', startedAt: Date.now() });
    pushToast({ type: 'info', title: 'Demo mode', msg: 'Injecting a controlled heart-rate deviation…' });
    const t1 = window.setTimeout(() => {
      setAnomaly({ active: true, phase: 'detected', startedAt: Date.now() });
      const now = hhmm();
      setAlerts((a) => [{
        id: uid(), level: 'watch',
        title: 'Heart rate above personal baseline',
        detail: 'Heart rate remained above your personal baseline for 8 minutes.',
        time: now, detected: now,
        why: 'Sustained deviation from the personal baseline window (rolling 30 min).',
        action: 'Rest and repeat measurement. Consider contacting your care team if it persists.',
        ack: false, patient: 'Priya Sharma', simulated: true,
      }, ...a]);
      setTimeline((t) => [...t, { time: now, label: 'Pattern deviation detected', level: 'watch', note: 'AI flagged a sustained deviation for review.' }]);
      setNotifications((n) => [{
        id: uid(), cat: 'Alerts', level: 'watch',
        title: 'Heart-rate deviation detected',
        body: 'Maternal heart rate remained above the configured baseline.',
        time: 'just now', read: false,
      }, ...n]);
      pushToast({ type: 'warn', title: 'Watch alert generated', msg: 'Pattern deviation requires review. Not a diagnosis.' });
    }, 6000);
    timers.current.push(t1);
  }, [pushToast]);

  const resolveAnomaly = useCallback(() => {
    setAnomaly({ active: false, phase: 'resolved', startedAt: null });
    const now = hhmm();
    setTimeline((t) => [...t, { time: now, label: 'Normal', level: 'normal', note: 'Signals returned to baseline.' }]);
    pushToast({ type: 'success', title: 'Resolved', msg: 'Readings returned to the configured baseline.' });
  }, [pushToast]);

  const markAllRead = useCallback(() => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  }, []);

  const addCheckin = useCallback(() => {
    pushToast({ type: 'success', title: "Today's check-in saved", msg: 'Your daily health record has been updated.' });
  }, [pushToast]);

  const value: AppState = {
    user, login, logout, booting,
    demo, setDemo,
    live, alerts, setAlerts, acknowledgeAlert, escalateAlert,
    anomaly, simulateAnomaly, resolveAnomaly,
    aiStatus, aiMessage,
    timeline, notifications, setNotifications, markAllRead,
    toasts, pushToast,
    patients, devices,
    addCheckin,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export type { Anomaly };
export type { ChatMessage };