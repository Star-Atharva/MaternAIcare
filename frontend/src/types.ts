export type Role = 'mother' | 'doctor' | 'nurse' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  ga: string;
  gaWeeks: number;
  edd: string;
  hr: number;
  fhr: number;
  bp: string;
  spo2: number;
  temp: number;
  status: 'stable' | 'watch' | 'critical';
  updated: string;
  risk: 'Low' | 'Moderate' | 'High';
  ward: string;
  parity: string;
}

export interface SensorReading {
  timestamp: number;
  deviceId: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  bloodPressure: { systolic: number; diastolic: number };
  fetalHeartRate: number;
  respiratoryRate: number;
}

export type Severity = 'normal' | 'watch' | 'critical';

export interface Anomaly {
  timestamp: number;
  type: string;
  severity: Severity;
  confidence: number;
  explanation: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

export interface Alert {
  id: string;
  level: Severity;
  title: string;
  detail: string;
  time: string;
  detected: string;
  why: string;
  action: string;
  ack: boolean;
  patient: string;
  simulated?: boolean;
}

export interface TimelineEvent {
  time: string;
  label: string;
  level: Severity;
  note: string;
}

export interface Notification {
  id: string;
  cat: 'Alerts' | 'Sensor' | 'Appointments' | 'System';
  level: Severity | 'info';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  icon: 'heart' | 'droplet' | 'thermometer' | 'waves' | 'gauge';
  status: 'connected' | 'idle' | 'disconnected';
  battery: number;
  packet: string;
  signal: number;
}

export interface StreamRow {
  t: string;
  label: string;
  value: string;
  tone: 'rose' | 'primary' | 'watch' | 'fetal' | 'ai' | 'healthy';
}

export interface VitalSample {
  hr: number; spo2: number; temp: number; rr: number;
  sys: number; dia: number; fhr: number; movement: number;
  hrH: number[]; fhrH: number[]; spo2H: number[];
  sysH: number[]; diaH: number[]; tempH: number[];
  stream: StreamRow[];
  lastUpdate: number;
  lastPacket: number;
  connected: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  note?: string;
  kind?: 'sensor' | 'ai';
}