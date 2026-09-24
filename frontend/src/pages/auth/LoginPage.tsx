import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Lock, Mail, ShieldCheck, Cpu, Radio, Eye, EyeOff } from 'lucide-react';
import { Button, Card, inputCls, Dot } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

const ROLES: { id: Role; label: string; icon: React.ReactNode }[] = [
  { id: 'mother', label: 'Mother', icon: <Heart size={16} /> },
  { id: 'doctor', label: 'Doctor', icon: <Heart size={16} /> },
  { id: 'nurse', label: 'Nurse', icon: <Heart size={16} /> },
  { id: 'admin', label: 'Admin', icon: <Heart size={16} /> },
];

const DEFAULTS: Record<Role, { name: string; email: string }> = {
  mother: { name: 'Priya Sharma', email: 'priya.sharma@maitri.health' },
  doctor: { name: 'Dr. Rohan Menon', email: 'r.menon@maitri.health' },
  nurse: { name: 'Nurse Aarti P.', email: 'aarti.p@maitri.health' },
  admin: { name: 'Ops Admin', email: 'admin@maitri.health' },
};

function AuthIllustration() {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'linear-gradient(150deg,#3B3FC4 0%,#5B5FEF 42%,#8B5CF6 100%)' }}
    >
      <div className="absolute -top-24 -left-16 w-[420px] h-[420px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(255,255,255,.18),transparent 65%)' }} />
      <div className="absolute bottom-[-120px] right-[-80px] w-[460px] h-[460px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(232,106,138,.35),transparent 65%)' }} />

      <svg className="absolute bottom-0 left-1/2 -translate-x-1/2" width="520" height="560" viewBox="0 0 520 560" fill="none">
        <path d="M260 90c26 0 46 21 46 47 0 22-14 40-33 45 34 12 60 44 66 86 8 56-6 112-6 160 0 42 10 76 10 76H177s10-34 10-76c0-48-14-104-6-160 6-42 32-74 66-86-19-5-33-23-33-45 0-26 20-47 46-47z" fill="#fff" opacity=".13" />
        <path d="M232 268c34-10 66 4 78 34 10 26 4 60-12 84" stroke="#fff" strokeWidth="2.4" opacity=".5" strokeLinecap="round" fill="none" />
        <path d="M198 330h30l12-24 16 46 13-28h26" stroke="#7CF0DA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".95" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx="286" cy="322" r={26 + i * 26} stroke="#fff" strokeWidth="1" opacity={0.22 - i * 0.06} fill="none" />
        ))}
        <circle cx="286" cy="322" r="7" fill="#7CF0DA" />
      </svg>

      <div className="absolute inset-x-0 bottom-0 p-8 lg:p-12">
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/12 border border-white/20 backdrop-blur-md mb-5">
            <Dot tone="healthy" />
            <span className="text-[12px] font-semibold text-white/90">Demo mode available</span>
          </div>
          <h2 className="font-display text-white text-[26px] lg:text-[32px] leading-tight font-bold">
            Intelligent maternal care. Earlier awareness.
          </h2>
          <p className="text-white/70 text-[14px] mt-3 leading-relaxed">
            Continuous AI analysis of maternal and fetal signals from connected sensors — surfaced as clear, calm, decision-support information.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-7">
            {[
              { icon: <ShieldCheck size={17} className="text-white/85" />, t: 'Encrypted', s: 'End-to-end' },
              { icon: <Cpu size={17} className="text-white/85" />, t: 'AI engine', s: 'Real-time' },
              { icon: <Radio size={17} className="text-white/85" />, t: 'IoT sensors', s: '5 connected' },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md px-3.5 py-3">
                {f.icon}
                <p className="text-white text-[13px] font-semibold mt-2">{f.t}</p>
                <p className="text-white/55 text-[11px]">{f.s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('mother');
  const [email, setEmail] = useState(DEFAULTS.mother.email);
  const [password, setPassword] = useState('demo1234');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setEmail(DEFAULTS[role].email); }, [role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await login({ id: 'u-' + role, name: DEFAULTS[role].name, email, role });
    setBusy(false);
    navigate('/app/dashboard');
  };

  const googleLogin = async () => {
    await login({ id: 'u-' + role, name: DEFAULTS[role].name, email, role });
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg">
      <div className="hidden lg:block relative"><AuthIllustration /></div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px] animate-fadeUp">
          <div className="mb-8"><Logo size={38} /></div>

          <h1 className="font-display text-[28px] font-bold text-ink leading-tight">Welcome to Maitri AI</h1>
          <p className="text-muted text-[14px] mt-2">Intelligent monitoring for safer maternal care.</p>

          <div className="mt-7">
            <label className="text-[12px] font-semibold text-muted uppercase tracking-wide">Sign in as</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#F2F4F7] rounded-2xl mt-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    'focusable flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200',
                    role === r.id ? 'bg-white text-primary shadow-card' : 'text-muted hover:text-ink'
                  )}
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-[13px] font-semibold text-ink">Email / User ID</label>
              <div className="relative mt-1.5">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} className={cn(inputCls, 'pl-10')} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="pw" className="text-[13px] font-semibold text-ink">Password</label>
                <button type="button" className="focusable text-[12px] font-semibold text-primary hover:text-primary-dark rounded">
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-1.5">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="pw"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(inputCls, 'pl-10 pr-11')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="focusable absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 rounded"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </Button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px bg-line flex-1" />
              <span className="text-[11px] text-muted font-medium">OR</span>
              <div className="h-px bg-line flex-1" />
            </div>

            <Button type="button" variant="outline" size="lg" className="w-full" onClick={googleLogin}>
              <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
                <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3 0-5.6-2-6.6-4.8H1.4v3.1C3.4 21.3 7.4 24 12 24z" />
                <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.1 0 10 0 12s.5 3.9 1.4 5.5l4-3.1z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.4 6.8 9 4.8 12 4.8z" />
              </svg>
              Continue with Google
            </Button>
          </form>

          <p className="text-center text-[13px] text-muted mt-7">
            Don't have an account? <Link to="/signup" className="focusable font-semibold text-primary hover:text-primary-dark rounded">Create account</Link>
          </p>

          <div className="mt-8 flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-line">
            <ShieldCheck size={16} className="text-healthy mt-0.5 shrink-0" />
            <p className="text-[12px] text-muted leading-relaxed">
              Your health information is protected. Encrypted connection · Role-based access · Secure sensor transport.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}