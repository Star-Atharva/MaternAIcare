import type { Device, Patient } from '@/types';
import { seededRand, round1 } from './utils';

export const PATIENTS: Patient[] = [
  { id: 'p1', name: 'Priya Sharma', age: 29, ga: '32w + 4d', gaWeeks: 32, edd: '12 Nov 2026', hr: 78, fhr: 142, bp: '118/76', spo2: 98, temp: 36.8, status: 'stable', updated: '12 sec ago', risk: 'Low', ward: 'OPD-2', parity: 'G2P1' },
  { id: 'p2', name: 'Ananya Iyer', age: 34, ga: '36w + 1d', gaWeeks: 36, edd: '24 Oct 2026', hr: 92, fhr: 156, bp: '134/88', spo2: 97, temp: 37.1, status: 'watch', updated: '28 sec ago', risk: 'Moderate', ward: 'IPD-1', parity: 'G3P2' },
  { id: 'p3', name: 'Meera Nair', age: 26, ga: '28w + 5d', gaWeeks: 28, edd: '18 Dec 2026', hr: 82, fhr: 138, bp: '112/72', spo2: 99, temp: 36.6, status: 'stable', updated: '1 min ago', risk: 'Low', ward: 'OPD-1', parity: 'G1P0' },
  { id: 'p4', name: 'Fatima Khan', age: 31, ga: '34w + 0d', gaWeeks: 34, edd: '02 Nov 2026', hr: 104, fhr: 168, bp: '146/94', spo2: 96, temp: 37.3, status: 'critical', updated: '4 sec ago', risk: 'High', ward: 'HDU-1', parity: 'G2P1' },
  { id: 'p5', name: 'Sneha Reddy', age: 27, ga: '30w + 2d', gaWeeks: 30, edd: '05 Dec 2026', hr: 76, fhr: 145, bp: '116/74', spo2: 98, temp: 36.7, status: 'stable', updated: '2 min ago', risk: 'Low', ward: 'OPD-3', parity: 'G1P0' },
  { id: 'p6', name: 'Divya Menon', age: 38, ga: '37w + 3d', gaWeeks: 37, edd: '15 Oct 2026', hr: 88, fhr: 148, bp: '128/82', spo2: 97, temp: 36.9, status: 'watch', updated: '45 sec ago', risk: 'Moderate', ward: 'IPD-2', parity: 'G4P3' },
  { id: 'p7', name: 'Ritu Agarwal', age: 24, ga: '22w + 6d', gaWeeks: 22, edd: '22 Jan 2027', hr: 74, fhr: 150, bp: '110/70', spo2: 99, temp: 36.5, status: 'stable', updated: '3 min ago', risk: 'Low', ward: 'OPD-1', parity: 'G1P0' },
  { id: 'p8', name: 'Kavya Desai', age: 33, ga: '35w + 5d', gaWeeks: 35, edd: '30 Oct 2026', hr: 86, fhr: 140, bp: '124/80', spo2: 98, temp: 36.8, status: 'stable', updated: '1 min ago', risk: 'Low', ward: 'IPD-3', parity: 'G2P0' },
];

export const DEVICES: Device[] = [
  { id: 'd1', name: 'Maternal wearable band', type: 'Wearable', icon: 'heart', status: 'connected', battery: 84, packet: '4 sec ago', signal: 92 },
  { id: 'd2', name: 'Pulse oximeter', type: 'SpO2 / HR', icon: 'droplet', status: 'connected', battery: 61, packet: '5 sec ago', signal: 88 },
  { id: 'd3', name: 'Thermal patch', type: 'Temperature', icon: 'thermometer', status: 'connected', battery: 47, packet: '8 sec ago', signal: 74 },
  { id: 'd4', name: 'Fetal Doppler array', type: 'Fetal HR', icon: 'waves', status: 'connected', battery: 100, packet: 'streaming', signal: 96 },
  { id: 'd5', name: 'Blood-pressure cuff', type: 'NIBP', icon: 'gauge', status: 'idle', battery: 22, packet: '26 min ago', signal: 60 },
];

export const INFRA = [
  { id: 'backend', name: 'Backend API', icon: 'server' as const, status: 'online', detail: 'Maitri core service • v2.4.1', metrics: [['Uptime', '99.98%'], ['Requests / min', '1,284'], ['Latency p95', '82 ms']] },
  { id: 'mqtt', name: 'MQTT / Sensor Gateway', icon: 'radio' as const, status: 'online', detail: 'TLS secured broker • 6 topics', metrics: [['Connected devices', '5'], ['Messages / sec', '38'], ['Packet loss', '0.02%']] },
  { id: 'ai', name: 'AI Anomaly Engine', icon: 'cpu' as const, status: 'processing', detail: 'Signal fusion model • v0.9-demo', metrics: [['Windows analysed', '12,480'], ['Inference time', '46 ms'], ['Flags today', '7']] },
  { id: 'db', name: 'Time-series Database', icon: 'database' as const, status: 'synced', detail: 'Encrypted at rest (AES-256)', metrics: [['Rows written', '2.1 M'], ['Replication lag', '0.4 s'], ['Retention', '365 d']] },
];

export const HIST_LEN = 48;

export function seedSeries(base: number, jitter: number, n = HIST_LEN) {
  const rand = seededRand(Math.floor(base * 97 + 13));
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += (rand() - 0.5) * jitter;
    out.push(round1(v));
  }
  return out;
}