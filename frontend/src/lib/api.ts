/**
 * Service layer — swap mock implementations with real HTTP/WebSocket calls.
 * The UI never talks to a transport directly; it uses these namespaces.
 */
import type { Alert, Device, Notification, Patient } from '@/types';
import { DEVICES, PATIENTS } from './mock';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const api = {
  auth: {
    async signIn(_email: string, _password: string, role: string) {
      await delay(650);
      return { role };
    },
    async signOut() { await delay(120); },
  },
  patients: {
    async list(): Promise<Patient[]> { await delay(180); return PATIENTS; },
    async get(id: string): Promise<Patient | undefined> {
      await delay(150);
      return PATIENTS.find((p) => p.id === id);
    },
  },
  devices: {
    async list(): Promise<Device[]> { await delay(150); return DEVICES; },
  },
  sensors: {
    /**
     * Real implementation would open MQTT / WebSocket here and emit
     * SensorReading frames. Returns an unsubscribe function.
     */
    subscribe(_onReading: (r: unknown) => void): () => void {
      return () => {};
    },
  },
  alerts: {
    async list(): Promise<Alert[]> { await delay(120); return []; },
  },
  notifications: {
    async list(): Promise<Notification[]> { await delay(120); return []; },
  },
};