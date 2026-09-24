import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import LoginPage from '@/pages/auth/LoginPage';
import SignupWizard from '@/pages/auth/SignupWizard';
import { AppShell, MobileNav } from '@/components/layout';
import { Button } from '@/components/ui';

function Placeholder({ title }: { title: string }) {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white rounded-2xl border border-line shadow-card p-8">
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <p className="text-muted mt-2">
            Signed in as <strong>{user?.name}</strong> ({user?.role}).
          </p>
          <p className="text-muted mt-4 text-sm">
            ✅ Install works. ✅ Auth works. ✅ Routing works.
          </p>
          <p className="text-muted mt-2 text-sm">
            Full pages coming in the next message.
          </p>
          <div className="flex gap-2 mt-6">
            <Button onClick={() => navigate('/app/dashboard')}>Dashboard</Button>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useApp();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={<SignupWizard />} />
      <Route path="/app" element={user ? <AppShell /> : <Navigate to="/" replace />}>
        <Route path="dashboard" element={<Placeholder title="Dashboard" />} />
        <Route path="*" element={<Placeholder title="Page" />} />
      </Route>
    </Routes>
  );
}