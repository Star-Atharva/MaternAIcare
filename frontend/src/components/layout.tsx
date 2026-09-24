import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Activity, Baby, Bell, CheckCircle, ChevronRight, Clock, Cpu, Database,
  FileText, Grid3X3, Heart, Info, Layout, LogOut, MessageSquare, Monitor, Moon,
  MoreHorizontal, Radio, Settings, Shield, Sparkles, User, Users, Waves, X, Zap,
} from 'lucide-react';
import { Logo } from './Logo';
import { Button, Dot, Badge, TONE } from './ui';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

/* ------------------------------- Nav config ----------------------------- */
interface NavItem { id: string; label: string; icon: React.ReactNode; path: string }
interface NavGroup { group: string; items: NavItem[] }

const NAV: Record<Role, NavGroup[]> = {
  mother: [
    { group: 'Overview', items: [
      { id: 'dashboard', label: 'Dashboard', icon: <Grid3X3 size={17} />, path: '/app/dashboard' },
      { id: 'health', label: 'My Health', icon: <Activity size={17} />, path: '/app/health' },
      { id: 'baby', label: 'Baby Monitoring', icon: <Baby size={17} />, path: '/app/baby' },
    ]},
    { group: 'Track', items: [
      { id: 'sleep', label: 'Sleep', icon: <Moon size={17} />, path: '/app/sleep' },
      { id: 'checkin', label: 'Daily Check-in', icon: <CheckCircle size={17} />, path: '/app/checkin' },
      { id: 'symptoms', label: 'Symptoms', icon: <FileText size={17} />, path: '/app/symptoms' },
    ]},
    { group: 'Intelligence', items: [
      { id: 'ai', label: 'AI Insights', icon: <Sparkles size={17} />, path: '/app/ai' },
      { id: 'anomaly', label: 'Anomaly Detection', icon: <AlertTriangle size={17} />, path: '/app/anomaly' },
      { id: 'assistant', label: 'AI Assistant', icon: <MessageSquare size={17} />, path: '/app/assistant' },
      { id: 'reports', label: 'Reports', icon: <FileText size={17} />, path: '/app/reports' },
    ]},
    { group: 'System', items: [
      { id: 'sensors', label: 'Sensor Center', icon: <Radio size={17} />, path: '/app/sensors' },
      { id: 'system', label: 'System Monitor', icon: <Cpu size={17} />, path: '/app/system' },
    ]},
  ],
  doctor: [
    { group: 'Overview', items: [
      { id: 'dashboard', label: 'Clinical Monitoring', icon: <Grid3X3 size={17} />, path: '/app/dashboard' },
      { id: 'patients', label: 'Patients', icon: <Users size={17} />, path: '/app/patients' },
      { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={17} />, path: '/app/anomaly' },
    ]},
    { group: 'Clinical', items: [
      { id: 'ctg', label: 'CTG Monitor', icon: <Waves size={17} />, path: '/app/ctg' },
      { id: 'ai', label: 'AI Insights', icon: <Sparkles size={17} />, path: '/app/ai' },
      { id: 'reports', label: 'Reports', icon: <FileText size={17} />, path: '/app/reports' },
    ]},
    { group: 'Intelligence', items: [
      { id: 'assistant', label: 'AI Assistant', icon: <MessageSquare size={17} />, path: '/app/assistant' },
    ]},
    { group: 'System', items: [
      { id: 'sensors', label: 'Sensor Center', icon: <Radio size={17} />, path: '/app/sensors' },
      { id: 'system', label: 'System Monitor', icon: <Cpu size={17} />, path: '/app/system' },
    ]},
  ],
  nurse: [
    { group: 'Overview', items: [
      { id: 'dashboard', label: 'Care Dashboard', icon: <Grid3X3 size={17} />, path: '/app/dashboard' },
      { id: 'patients', label: 'Assigned Patients', icon: <Users size={17} />, path: '/app/patients' },
      { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={17} />, path: '/app/anomaly' },
    ]},
    { group: 'Care', items: [
      { id: 'checkins', label: 'Daily Check-ins', icon: <CheckCircle size={17} />, path: '/app/checkins' },
      { id: 'meds', label: 'Medication', icon: <FileText size={17} />, path: '/app/meds' },
      { id: 'sensors', label: 'Device Status', icon: <Radio size={17} />, path: '/app/sensors' },
    ]},
    { group: 'Intelligence', items: [
      { id: 'assistant', label: 'AI Assistant', icon: <MessageSquare size={17} />, path: '/app/assistant' },
    ]},
  ],
  admin: [
    { group: 'Overview', items: [
      { id: 'dashboard', label: 'System Overview', icon: <Grid3X3 size={17} />, path: '/app/dashboard' },
      { id: 'users', label: 'Users & Roles', icon: <Users size={17} />, path: '/app/users' },
      { id: 'patients', label: 'Patient Registry', icon: <FileText size={17} />, path: '/app/patients' },
    ]},
    { group: 'Infrastructure', items: [
      { id: 'devices', label: 'Device Fleet', icon: <Radio size={17} />, path: '/app/devices' },
      { id: 'ai', label: 'AI Engine', icon: <Cpu size={17} />, path: '/app/ai' },
      { id: 'database', label: 'Data Layer', icon: <Database size={17} />, path: '/app/database' },
    ]},
    { group: 'Monitoring', items: [
      { id: 'system', label: 'System Monitor', icon: <Monitor size={17} />, path: '/app/system' },
      { id: 'logs', label: 'Event Log', icon: <FileText size={17} />, path: '/app/logs' },
      { id: 'assistant', label: 'AI Assistant', icon: <MessageSquare size={17} />, path: '/app/assistant' },
    ]},
  ],
};

/* -------------------------------- Sidebar ------------------------------- */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout, anomaly } = useApp();
  const navigate = useNavigate();
  if (!user) return null;
  const groups = NAV[user.role] ?? NAV.mother;

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-5">
        <Logo size={34} />
      </div>

      <nav className="flex-1 overflow-y-auto thin-scroll px-3 pb-4">
        {groups.map((g) => (
          <div key={g.group} className="mb-5">
            <p className="px-3 mb-2 text-[10.5px] font-bold tracking-wider text-muted/80 uppercase">{g.group}</p>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const showBadge = item.id === 'alerts' && anomaly.active && anomaly.phase === 'detected';
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'focusable w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200',
                        isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:text-ink hover:bg-[#F4F6FA]'
                      )
                    }
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {showBadge && <span className="w-2 h-2 rounded-full bg-warn" />}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-line">
        <NavLink
          to="/app/profile"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'focusable w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition',
              isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:text-ink hover:bg-[#F4F6FA]'
            )
          }
        >
          <User size={17} /> Profile
        </NavLink>
        <NavLink
          to="/app/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'focusable w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition',
              isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:text-ink hover:bg-[#F4F6FA]'
            )
          }
        >
          <Settings size={17} /> Settings
        </NavLink>
        <button
          onClick={async () => { await logout(); navigate('/'); }}
          className="focusable w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold text-muted hover:text-crit hover:bg-crit-soft transition"
        >
          <LogOut size={17} /> Logout
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[252px] bg-white border-r border-line z-30">
      <SidebarContent />
    </aside>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="absolute inset-y-0 left-0 w-[272px] bg-white shadow-lift"
          >
            <button
              onClick={onClose}
              className="focusable absolute top-5 right-4 p-2 rounded-xl text-muted hover:bg-[#F4F6FA]"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={onClose} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- Topbar ------------------------------- */
const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard', health: 'My Health', baby: 'Baby Monitoring', sleep: 'Sleep',
  checkin: 'Daily Check-in', symptoms: 'Symptoms', ai: 'AI Insights', anomaly: 'Anomaly Detection',
  reports: 'Reports', sensors: 'Sensor Center', system: 'System Monitor', assistant: 'Maitri AI Assistant',
  patients: 'Patients', alerts: 'Alerts', ctg: 'CTG Monitor', profile: 'Profile', settings: 'Settings',
  users: 'Users & Roles', devices: 'Device Fleet', database: 'Data Layer', logs: 'Event Log',
  checkins: 'Daily Check-ins', meds: 'Medication', notifications: 'Notifications',
};

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, demo, setDemo, simulateAnomaly, resolveAnomaly, anomaly, notifications } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  if (!user) return null;

  const slug = location.pathname.split('/').filter(Boolean).pop() ?? 'dashboard';
  const title = PAGE_TITLES[slug] ?? (user.role === 'doctor' ? 'Clinical Monitoring' : 'Dashboard');
  const unread = notifications.filter((n) => !n.read).length;
  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('');
  const showDemoControls = user.role === 'mother' || user.role === 'doctor';

  return (
    <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur-xl border-b border-line">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16">
        <button onClick={onOpenMenu} className="lg:hidden focusable p-2 -ml-1 rounded-xl text-muted hover:bg-white" aria-label="Open menu">
          <Layout size={19} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[15.5px] font-bold text-ink truncate">{title}</h1>
          <p className="text-[11.5px] text-muted hidden sm:block">
            {user.role === 'mother' ? 'Maitri AI · Personal monitoring' :
             user.role === 'doctor' ? 'Maitri AI · Clinical decision support' :
             user.role === 'nurse' ? 'Maitri AI · Ward care' : 'Maitri AI · Platform operations'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDemo(!demo)}
            aria-pressed={demo}
            className={cn(
              'focusable hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[12.5px] font-semibold transition',
              demo ? 'border-healthy/30 bg-healthy-soft text-[#1E7A50]' : 'border-line bg-white text-muted'
            )}
          >
            <Dot tone={demo ? 'healthy' : 'neutral'} pulse={demo} />
            {demo ? 'Live Demo' : 'Paused'}
          </button>

          {showDemoControls && (
            anomaly.active && anomaly.phase === 'detected' ? (
              <Button size="sm" variant="outline" onClick={resolveAnomaly} className="hidden sm:inline-flex">Resolve</Button>
            ) : (
              <Button size="sm" variant="ai" onClick={simulateAnomaly} className="hidden sm:inline-flex">
                <Zap size={14} /> Simulate anomaly
              </Button>
            )
          )}

          <button onClick={() => navigate('/app/assistant')} className="focusable p-2.5 rounded-xl text-muted hover:text-ink hover:bg-white transition" aria-label="AI Assistant">
            <MessageSquare size={18} />
          </button>

          <button
            onClick={() => navigate('/app/notifications')}
            className="focusable relative p-2.5 rounded-xl text-muted hover:text-ink hover:bg-white transition"
            aria-label={`Notifications, ${unread} unread`}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-crit text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/app/profile')}
            className="focusable flex items-center gap-2.5 pl-1.5 pr-1 sm:pr-3 py-1.5 rounded-2xl hover:bg-white transition"
          >
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}
            >
              {initials}
            </span>
            <span className="hidden md:block text-left leading-tight">
              <span className="block text-[12.5px] font-semibold text-ink">{user.name}</span>
              <span className="block text-[10.5px] text-muted capitalize">{user.role}</span>
            </span>
          </button>
        </div>
      </div>

      <div className="sm:hidden flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setDemo(!demo)}
          className={cn(
            'shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-semibold',
            demo ? 'border-healthy/30 bg-healthy-soft text-[#1E7A50]' : 'border-line bg-white text-muted'
          )}
        >
          <Dot tone={demo ? 'healthy' : 'neutral'} pulse={demo} /> {demo ? 'Live Demo' : 'Paused'}
        </button>
        {showDemoControls && (
          anomaly.active && anomaly.phase === 'detected' ? (
            <button onClick={resolveAnomaly} className="shrink-0 px-3 py-1.5 rounded-full border border-line bg-white text-[12px] font-semibold text-ink">Resolve</button>
          ) : (
            <button
              onClick={simulateAnomaly}
              className="shrink-0 px-3 py-1.5 rounded-full text-white text-[12px] font-semibold"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}
            >
              Simulate anomaly
            </button>
          )
        )}
      </div>
    </header>
  );
}

/* ------------------------------- Mobile nav ----------------------------- */
export function MobileNav() {
  const { user } = useApp();
  if (!user) return null;

  const items = user.role === 'mother'
    ? [
        { id: 'dashboard', label: 'Home', icon: <Grid3X3 size={19} />, path: '/app/dashboard' },
        { id: 'health', label: 'Health', icon: <Activity size={19} />, path: '/app/health' },
        { id: 'baby', label: 'Baby', icon: <Baby size={19} />, path: '/app/baby' },
        { id: 'anomaly', label: 'Alerts', icon: <AlertTriangle size={19} />, path: '/app/anomaly' },
        { id: 'profile', label: 'Profile', icon: <User size={19} />, path: '/app/profile' },
      ]
    : user.role === 'doctor'
    ? [
        { id: 'dashboard', label: 'Monitor', icon: <Grid3X3 size={19} />, path: '/app/dashboard' },
        { id: 'patients', label: 'Patients', icon: <Users size={19} />, path: '/app/patients' },
        { id: 'ctg', label: 'CTG', icon: <Waves size={19} />, path: '/app/ctg' },
        { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={19} />, path: '/app/anomaly' },
        { id: 'profile', label: 'Profile', icon: <User size={19} />, path: '/app/profile' },
      ]
    : user.role === 'nurse'
    ? [
        { id: 'dashboard', label: 'Care', icon: <Grid3X3 size={19} />, path: '/app/dashboard' },
        { id: 'patients', label: 'Patients', icon: <Users size={19} />, path: '/app/patients' },
        { id: 'checkins', label: 'Check-ins', icon: <CheckCircle size={19} />, path: '/app/checkins' },
        { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={19} />, path: '/app/anomaly' },
        { id: 'profile', label: 'Profile', icon: <User size={19} />, path: '/app/profile' },
      ]
    : [
        { id: 'dashboard', label: 'Overview', icon: <Grid3X3 size={19} />, path: '/app/dashboard' },
        { id: 'devices', label: 'Devices', icon: <Radio size={19} />, path: '/app/devices' },
        { id: 'ai', label: 'AI Engine', icon: <Cpu size={19} />, path: '/app/ai' },
        { id: 'system', label: 'Monitor', icon: <Monitor size={19} />, path: '/app/system' },
        { id: 'profile', label: 'Profile', icon: <User size={19} />, path: '/app/profile' },
      ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-xl border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {items.map((it) => (
          <NavLink
            key={it.id}
            to={it.path}
            className={({ isActive }) =>
              cn('focusable flex flex-col items-center gap-1 py-2.5 transition', isActive ? 'text-primary' : 'text-muted')
            }
          >
            {it.icon}
            <span className="text-[10.5px] font-semibold">{it.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/* -------------------------------- Toast host ---------------------------- */
export function ToastHost() {
  const { toasts } = useApp();
  const toneMap = { success: TONE.healthy, warn: TONE.watch, danger: TONE.critical, info: TONE.primary };
  return (
    <div className="fixed z-[60] bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:w-[360px] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const c = toneMap[t.type] ?? TONE.primary;
          const Icon = t.type === 'success' ? CheckCircle : t.type === 'warn' ? AlertTriangle : t.type === 'danger' ? X : Info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="pointer-events-auto bg-white border border-line rounded-2xl shadow-lift p-3.5 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.bg, color: c.tx }}>
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink leading-tight">{t.title}</p>
                {t.msg && <p className="text-[12px] text-muted mt-1 leading-snug">{t.msg}</p>}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- App Shell ------------------------------ */
export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setDrawerOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="lg:pl-[252px]">
        <Topbar onOpenMenu={() => setDrawerOpen(true)} />
        <main className="px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10 max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <ToastHost />
    </div>
  );
}