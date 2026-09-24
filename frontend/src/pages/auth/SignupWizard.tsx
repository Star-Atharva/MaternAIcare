import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, ChevronLeft, Info } from 'lucide-react';
import { Button, Card, ChipSelect, Field, inputCls } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Personal' },
  { id: 2, label: 'Pregnancy' },
  { id: 3, label: 'Health' },
  { id: 4, label: 'Sensors' },
  { id: 5, label: 'Complete' },
];

export default function SignupWizard() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '', age: '', phone: '', blood: '', height: '', weight: '',
    ga: '', trimester: 'Third', edd: '', prev: '0', prevComp: [] as string[], highRisk: 'No',
    bpHist: 'Normal', diabetes: 'No', anemia: 'No', thyroid: 'No', meds: '', allergies: '',
    baseBp: '', baseHr: '', baseSpo2: '', baseTemp: '',
    sleep: '7', stress: '4', activity: 'Moderate', water: '2',
  });
  const set = <K extends keyof typeof data>(k: K, v: (typeof data)[K]) => setData((d) => ({ ...d, [k]: v }));
  const pct = ((step - 1) / (STEPS.length - 1)) * 100;

  const finish = async () => {
    await login({ id: 'u-mother', name: data.name || 'Priya Sharma', email: 'priya.sharma@maitri.health', role: 'mother' });
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-5 py-8 sm:py-12">
        <div className="flex items-center justify-between">
          <Logo size={34} />
          <Link to="/" className="focusable text-[13px] font-semibold text-muted hover:text-ink rounded">Exit</Link>
        </div>

        <div className="mt-9">
          <div className="h-1.5 bg-[#EDF0F5] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            {STEPS.map((s) => {
              const active = s.id === step;
              const done = s.id < step;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                      done ? 'bg-healthy text-white' : active ? 'bg-primary text-white' : 'bg-[#EDF0F5] text-muted'
                    )}
                  >
                    {done ? '✓' : `0${s.id}`}
                  </span>
                  <span className={cn('text-[11.5px] font-semibold hidden sm:block', active ? 'text-ink' : 'text-muted')}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="mt-8 p-6 sm:p-8 animate-fadeUp">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-[22px] font-bold">Let's get to know you.</h2>
                <p className="text-muted text-[13.5px] mt-1.5 leading-relaxed">
                  Your information helps Maitri AI understand your baseline and identify meaningful changes.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name" important>
                  <input className={inputCls} placeholder="Priya Sharma" value={data.name} onChange={(e) => set('name', e.target.value)} />
                </Field>
                <Field label="Age" important>
                  <input className={inputCls} placeholder="29" value={data.age} onChange={(e) => set('age', e.target.value)} />
                </Field>
                <Field label="Phone">
                  <input className={inputCls} placeholder="+91 98765 43210" value={data.phone} onChange={(e) => set('phone', e.target.value)} />
                </Field>
                <Field label="Blood group" important>
                  <select className={inputCls} value={data.blood} onChange={(e) => set('blood', e.target.value)}>
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-[22px] font-bold">Pregnancy information</h2>
                <p className="text-muted text-[13.5px] mt-1.5">This calibrates your monitoring windows and expected milestones.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Gestational age" important hint="e.g. 32w + 4d">
                  <input className={inputCls} placeholder="32w + 4d" value={data.ga} onChange={(e) => set('ga', e.target.value)} />
                </Field>
                <Field label="Trimester" important>
                  <select className={inputCls} value={data.trimester} onChange={(e) => set('trimester', e.target.value)}>
                    <option>First</option><option>Second</option><option>Third</option>
                  </select>
                </Field>
                <Field label="Expected due date" important>
                  <input type="date" className={inputCls} value={data.edd} onChange={(e) => set('edd', e.target.value)} />
                </Field>
                <Field label="Previous pregnancies">
                  <select className={inputCls} value={data.prev} onChange={(e) => set('prev', e.target.value)}>
                    {['0', '1', '2', '3', '4+'].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Previous complications">
                <ChipSelect
                  value={data.prevComp}
                  onChange={(v) => set('prevComp', v)}
                  options={['None', 'Gestational diabetes', 'Hypertension', 'Preterm birth', 'Anaemia', 'Caesarean section']}
                />
              </Field>
              <Field label="High-risk pregnancy status" important>
                <ChipSelect
                  multi={false}
                  value={data.highRisk}
                  onChange={(v) => set('highRisk', v)}
                  options={['No', 'Under evaluation', 'Yes']}
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-[22px] font-bold">Medical history</h2>
                <p className="text-muted text-[13.5px] mt-1.5">Baseline context improves the accuracy of deviation detection.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Blood pressure history">
                  <select className={inputCls} value={data.bpHist} onChange={(e) => set('bpHist', e.target.value)}>
                    <option>Normal</option><option>Occasionally elevated</option><option>Diagnosed hypertension</option>
                  </select>
                </Field>
                <Field label="Diabetes">
                  <select className={inputCls} value={data.diabetes} onChange={(e) => set('diabetes', e.target.value)}>
                    <option>No</option><option>Gestational</option><option>Type 1</option><option>Type 2</option>
                  </select>
                </Field>
                <Field label="Anaemia">
                  <ChipSelect multi={false} value={data.anemia} onChange={(v) => set('anemia', v)} options={['No', 'Mild', 'Moderate']} />
                </Field>
                <Field label="Thyroid conditions">
                  <ChipSelect multi={false} value={data.thyroid} onChange={(v) => set('thyroid', v)} options={['No', 'Hypothyroid', 'Hyperthyroid']} />
                </Field>
              </div>
              <Field label="Current medications">
                <input className={inputCls} placeholder="e.g. Folic acid, Iron, Calcium" value={data.meds} onChange={(e) => set('meds', e.target.value)} />
              </Field>
              <Field label="Allergies">
                <input className={inputCls} placeholder="e.g. Penicillin" value={data.allergies} onChange={(e) => set('allergies', e.target.value)} />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-[22px] font-bold">Baseline measurements</h2>
                <p className="text-muted text-[13.5px] mt-1.5">A calm resting reading works best. You can update these later.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Blood pressure (mmHg)" important><input className={inputCls} placeholder="118/76" value={data.baseBp} onChange={(e) => set('baseBp', e.target.value)} /></Field>
                <Field label="Heart rate (bpm)" important><input className={inputCls} placeholder="78" value={data.baseHr} onChange={(e) => set('baseHr', e.target.value)} /></Field>
                <Field label="SpO₂ (%)" important><input className={inputCls} placeholder="98" value={data.baseSpo2} onChange={(e) => set('baseSpo2', e.target.value)} /></Field>
                <Field label="Temperature (°C)" important><input className={inputCls} placeholder="36.8" value={data.baseTemp} onChange={(e) => set('baseTemp', e.target.value)} /></Field>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-[22px] font-bold">Connect wearable / sensors</h2>
                <p className="text-muted text-[13.5px] mt-1.5">
                  Maitri AI streams readings from paired devices. Sensors are optional — you can connect them later.
                </p>
              </div>
              <div className="space-y-2.5">
                {['Maternal wearable band', 'Pulse oximeter', 'Thermal patch', 'Fetal Doppler array'].map((n) => (
                  <div key={n} className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-line bg-[#FCFDFE]">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-ink truncate">{n}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full bg-healthy-soft text-[#1E7A50]">
                      <CheckCircle size={13} /> Paired
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-primary-soft/60 border border-primary/10">
                <Info size={15} className="text-primary mt-0.5 shrink-0" />
                <p className="text-[12px] text-[#3B3FC4] leading-relaxed">
                  The demo runs on simulated sensor data. No real device is required for the hackathon walkthrough.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-line">
            <button
              onClick={() => (step === 1 ? navigate('/') : setStep((s) => s - 1))}
              className="focusable inline-flex items-center gap-2 text-[13.5px] font-semibold text-muted hover:text-ink rounded"
            >
              <ChevronLeft size={16} /> {step === 1 ? 'Back to sign in' : 'Back'}
            </button>
            <div className="flex items-center gap-2">
              {step < 5 && <Button variant="ghost" onClick={() => setStep(5)}>Skip for now</Button>}
              {step < 5
                ? <Button onClick={() => setStep((s) => s + 1)} iconRight={<ArrowRight size={16} />}>Continue</Button>
                : <Button variant="ai" onClick={finish}><CheckCircle size={16} /> Complete setup</Button>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}