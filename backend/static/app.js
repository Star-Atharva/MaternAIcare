function app() {
  return {
    view: 'login',
    user: { name: '', role: '', id: null },
    login: { username: '', password: '', loading: false, error: '' },
    patients: [],
    alerts: [],
    readings: [],
    latest: { bp: '-', hr: '-', spo2: '-', temp: '-' },
    simStatus: { running: false, scenario: null, speed: 1 },
    simSpeed: 5,
    _pollTimer: null,
    _chart: null,

    init() {
      const saved = localStorage.getItem('maternai_user');
      if (saved) {
        this.user = JSON.parse(saved);
        this.enterView();
      }
    },

    async doLogin() {
      this.login.loading = true;
      this.login.error = '';
      try {
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: this.login.username, password: this.login.password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login failed');
        this.user = { name: data.name, role: data.role, id: 1 };
        localStorage.setItem('maternai_user', JSON.stringify(this.user));
        this.enterView();
      } catch (e) {
        this.login.error = e.message;
      } finally {
        this.login.loading = false;
      }
    },

    quickLogin(role) {
      this.login.username = role;
      this.login.password = role === 'mother' ? 'mother123' : role === 'caretaker' ? 'care123' : 'clinic123';
      this.doLogin();
    },

    enterView() {
      if (this.user.role === 'mother') {
        this.view = 'mother';
        this.initChart();
        this.startPolling();
      } else {
        this.view = 'list';
        this.loadPatients();
      }
      setTimeout(function() { if (window.lucide) lucide.createIcons(); }, 100);
    },

    logout() {
      localStorage.removeItem('maternai_user');
      this.view = 'login';
      this.user = { name: '', role: '', id: null };
      if (this._pollTimer) clearInterval(this._pollTimer);
      if (this._chart) { this._chart.destroy(); this._chart = null; }
    },

    async loadPatients() {
      try {
        const res = await fetch('/patients/list?role=' + this.user.role + '&user_id=' + this.user.id);
        this.patients = await res.json();
      } catch (e) { console.error(e); }
    },

    openPatient(id) {
      this.view = 'mother';
      this.user.role = 'mother';
      this.initChart();
      this.startPolling();
    },

    startPolling() {
      if (this._pollTimer) clearInterval(this._pollTimer);
      this.poll();
      this._pollTimer = setInterval(() => this.poll(), 3000);
    },

    async poll() {
      try {
        const results = await Promise.all([
          fetch('/readings/1?limit=200'),
          fetch('/alerts/1'),
          fetch('/sim/status')
        ]);
        this.readings = await results[0].json();
        this.alerts = await results[1].json();
        this.simStatus = await results[2].json();
        this.updateLatest();
        this.updateChart();
        setTimeout(function() { if (window.lucide) lucide.createIcons(); }, 50);
      } catch (e) { console.error(e); }
    },

    updateLatest() {
      const latestByType = {};
      for (const r of this.readings) {
        if (!latestByType[r.sensor_type]) latestByType[r.sensor_type] = r.value;
      }
      if (latestByType.bp) this.latest.bp = latestByType.bp.systolic + '/' + latestByType.bp.diastolic;
      if (latestByType.hr) this.latest.hr = latestByType.hr.bpm + ' bpm';
      if (latestByType.spo2) this.latest.spo2 = latestByType.spo2.percent + '%';
      if (latestByType.temp) this.latest.temp = latestByType.temp.celsius + ' C';
    },

    initChart() {
      const self = this;
      setTimeout(function() {
        const ctx = document.getElementById('vitalsChart');
        if (!ctx) return;
        if (self._chart) self._chart.destroy();
        self._chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: [],
            datasets: [
              { label: 'Systolic', data: [], borderColor: '#e11d48', backgroundColor: '#e11d4820', tension: 0.3, borderWidth: 2, pointRadius: 0, spanGaps: true },
              { label: 'Diastolic', data: [], borderColor: '#f43f5e', backgroundColor: '#f43f5e20', tension: 0.3, borderWidth: 2, pointRadius: 0, spanGaps: true },
              { label: 'HR', data: [], borderColor: '#6366f1', backgroundColor: '#6366f120', tension: 0.3, borderWidth: 2, pointRadius: 0, spanGaps: true },
              { label: 'SpO2', data: [], borderColor: '#0ea5e9', backgroundColor: '#0ea5e920', tension: 0.3, borderWidth: 2, pointRadius: 0, spanGaps: true }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            },
            scales: {
              x: { ticks: { font: { size: 10 }, maxTicksLimit: 12 } },
              y: { beginAtZero: false, ticks: { font: { size: 10 } } }
            }
          }
        });
      }, 150);
    },

    updateChart() {
      if (!this._chart) return;

      // Group readings into 1-second buckets
      const buckets = new Map();
      for (const r of this.readings) {
        const t = new Date(r.recorded_at).getTime();
        const bucket = Math.floor(t / 1000) * 1000;
        if (!buckets.has(bucket)) buckets.set(bucket, {});
        const b = buckets.get(bucket);
        if (r.sensor_type === 'bp')   { b.sys = r.value.systolic; b.dia = r.value.diastolic; }
        if (r.sensor_type === 'hr')   { b.hr  = r.value.bpm; }
        if (r.sensor_type === 'spo2') { b.spo2 = r.value.percent; }
      }

      const sortedBuckets = [...buckets.entries()].sort((a, b) => a[0] - b[0]);
      const labels = [];
      const sys = [], dia = [], hr = [], spo2 = [];

      for (const [ts, b] of sortedBuckets) {
        labels.push(new Date(ts).toLocaleTimeString('en-US', { hour12: false }));
        sys.push(b.sys !== undefined ? b.sys : null);
        dia.push(b.dia !== undefined ? b.dia : null);
        hr.push(b.hr !== undefined ? b.hr : null);
        spo2.push(b.spo2 !== undefined ? b.spo2 : null);
      }

      this._chart.data.labels = labels;
      this._chart.data.datasets[0].data = sys;
      this._chart.data.datasets[1].data = dia;
      this._chart.data.datasets[2].data = hr;
      this._chart.data.datasets[3].data = spo2;
      this._chart.update('none');
    },

    async startSim(scenario) {
      await fetch('/sim/start/' + scenario + '?patient_id=1&speed=' + this.simSpeed, { method: 'POST' });
    },

    async stopSim() {
      await fetch('/sim/stop', { method: 'POST' });
    },

    async resetData() {
      await fetch('/sim/reset/1', { method: 'POST' });
      this.alerts = [];
      this.readings = [];
      if (this._chart) {
        this._chart.data.labels = [];
        for (let i = 0; i < 4; i++) this._chart.data.datasets[i].data = [];
        this._chart.update('none');
      }
    },

    fmtTime(iso) {
      try { return new Date(iso.replace(' ', 'T')).toLocaleTimeString('en-US', { hour12: false }); }
      catch (e) { return iso; }
    }
  };
}