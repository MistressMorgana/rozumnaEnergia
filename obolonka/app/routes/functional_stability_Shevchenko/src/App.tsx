import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import type { Snapshot, BatteryData, LoadData } from './types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';

/* ── colour helpers ─────────────────────────────────── */
const MODE_COLORS: Record<string, string> = {
  NORMAL: '#22c55e',
  STRESSED: '#eab308',
  OVERLOAD: '#f97316',
  CRITICAL: '#ef4444',
  FAILURE_RECOVERY: '#a855f7',
};

const RISK_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  DEGRADED: '#eab308',
  FAILED: '#ef4444',
  DISCONNECTED: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  IMPORTANT: '#f59e0b',
  OPTIONAL: '#6b7280',
};

const SCENARIO_LABELS: Record<string, string> = {
  NORMAL: 'Нормальна робота',
  BATTERY_DEGRADATION: 'Деградація батареї',
  BATTERY_FAILURE: 'Відмова батареї',
  OVERLOAD: 'Перевантаження',
  LOAD_SHEDDING: 'Скидання навантаження',
  RECOVERY: 'Відновлення',
};

const MODE_LABELS: Record<string, string> = {
  NORMAL: 'НОРМАЛЬНИЙ',
  STRESSED: 'НАПРУЖЕНИЙ',
  OVERLOAD: 'ПЕРЕВАНТАЖЕННЯ',
  CRITICAL: 'КРИТИЧНИЙ',
  FAILURE_RECOVERY: 'ВІДНОВЛЕННЯ',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'АКТИВНА',
  DEGRADED: 'ДЕГРАДОВАНА',
  FAILED: 'ВІДМОВА',
  DISCONNECTED: "ВІДКЛЮЧЕНА",
};

/* ── styles ─────────────────────────────────── */
const css = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Manrope', sans-serif;
    background: #0a0e1a;
    color: #e2e8f0;
    overflow-x: hidden;
  }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .dashboard {
    max-width: 1440px;
    margin: 0 auto;
    padding: 20px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .header h1 {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .conn-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 20px;
    background: rgba(255,255,255,0.05);
  }
  .conn-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
  }
  .scenarios {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .sc-btn {
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: #94a3b8;
    cursor: pointer;
    font-size: 13px;
    font-family: 'Manrope', sans-serif;
    font-weight: 600;
    transition: all 0.2s;
  }
  .sc-btn:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }
  .sc-btn.active {
    background: rgba(96,165,250,0.15);
    border-color: #60a5fa;
    color: #60a5fa;
  }
  .grid-top {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  .card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 16px;
  }
  .card-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #64748b;
    margin-bottom: 12px;
    font-weight: 700;
  }
  .stability-ring {
    width: 160px; height: 160px;
    margin: 0 auto 12px;
    position: relative;
  }
  .stability-ring svg { width: 100%; height: 100%; }
  .stability-val {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }
  .stability-val .num {
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
  }
  .stability-val .lbl {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
  }
  .mode-badge {
    text-align: center;
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.5px;
  }
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  .stat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 14px;
  }
  .stat-label {
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    margin-top: 4px;
  }
  .grid-batteries {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  .bat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 16px;
    position: relative;
    overflow: hidden;
  }
  .bat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
  }
  .bat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .bat-name { font-weight: 700; font-size: 15px; }
  .bat-status {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 6px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .bat-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .bat-metric {
    background: rgba(0,0,0,0.2);
    border-radius: 8px;
    padding: 8px 10px;
  }
  .bat-metric .label { font-size: 10px; color: #64748b; text-transform: uppercase; }
  .bat-metric .value { font-size: 16px; font-weight: 700; margin-top: 2px; }
  .soh-bar {
    height: 4px;
    background: rgba(255,255,255,0.06);
    border-radius: 2px;
    margin-top: 10px;
    overflow: hidden;
  }
  .soh-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s;
  }
  .grid-bottom {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  .loads-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .load-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: rgba(0,0,0,0.2);
    border-radius: 8px;
    font-size: 13px;
  }
  .load-item .name { font-weight: 600; }
  .load-item .badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
  }
  .log-list {
    max-height: 260px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .log-entry {
    font-size: 12px;
    padding: 6px 10px;
    background: rgba(0,0,0,0.2);
    border-radius: 6px;
    border-left: 3px solid #3b82f6;
    font-family: 'JetBrains Mono', monospace;
    line-height: 1.4;
    word-break: break-word;
  }
  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  @media (max-width: 1024px) {
    .grid-top { grid-template-columns: 1fr; }
    .grid-batteries { grid-template-columns: 1fr 1fr; }
    .stats-row { grid-template-columns: repeat(2, 1fr); }
    .charts-row { grid-template-columns: 1fr; }
    .grid-bottom { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .grid-batteries { grid-template-columns: 1fr; }
    .loads-grid { grid-template-columns: 1fr; }
  }
`;

/* ── Stability Ring ─────────────────────────────────── */
function StabilityRing({ score, risk }: { score: number; risk: string }) {
  const r = 65;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = RISK_COLORS[risk] || '#60a5fa';

  return (
    <div className="stability-ring">
      <svg viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="80" cy="80" r={r} fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 0.6s, stroke 0.3s' }}
        />
      </svg>
      <div className="stability-val">
        <div className="num mono" style={{ color }}>{score.toFixed(0)}</div>
        <div className="lbl">Стабільність</div>
      </div>
    </div>
  );
}

/* ── Battery Card ───────────────────────────────────── */
function BatteryCard({ bat, onRemove }: { bat: BatteryData; onRemove: (id: number) => void }) {
  const c = STATUS_COLORS[bat.status];
  const sohColor = bat.soh > 60 ? '#22c55e' : bat.soh > 30 ? '#eab308' : '#ef4444';
  return (
    <div className="bat-card" style={{ borderTopColor: c }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c }} />
      <div className="bat-header">
        <span className="bat-name">{bat.name}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="bat-status" style={{ background: c + '22', color: c }}>
            {STATUS_LABELS[bat.status]}
          </span>
          <button onClick={() => onRemove(bat.id)} style={{
            background: 'rgba(239,68,68,0.15)', border: 'none', color: '#f87171',
            borderRadius: 4, cursor: 'pointer', fontSize: 12, padding: '2px 6px', fontWeight: 700,
          }} title="Видалити батарею">✕</button>
        </div>
      </div>
      <div className="bat-metrics">
        <div className="bat-metric">
          <div className="label">Напруга</div>
          <div className="value mono">{bat.voltage.toFixed(1)}В</div>
        </div>
        <div className="bat-metric">
          <div className="label">Струм</div>
          <div className="value mono">{bat.current.toFixed(1)}А</div>
        </div>
        <div className="bat-metric">
          <div className="label">Темп.</div>
          <div className="value mono">{bat.temperature.toFixed(0)}°C</div>
        </div>
        <div className="bat-metric">
          <div className="label">Реле</div>
          <div className="value" style={{ color: bat.relay_closed ? '#22c55e' : '#ef4444' }}>
            {bat.relay_closed ? '● ON' : '○ OFF'}
          </div>
        </div>
      </div>
      <div className="soh-bar">
        <div className="soh-fill" style={{ width: `${bat.soh}%`, background: sohColor }} />
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
        SOH: <span className="mono" style={{ color: sohColor }}>{bat.soh.toFixed(1)}%</span>
      </div>
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────── */
const modalCss = `
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); z-index: 1000;
    display: flex; align-items: center; justify-content: center;
  }
  .modal {
    background: #1e293b; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px; padding: 24px; min-width: 340px; max-width: 420px;
  }
  .modal h3 { margin-bottom: 16px; font-size: 16px; font-weight: 700; }
  .modal label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px; margin-top: 10px; }
  .modal input, .modal select {
    width: 100%; padding: 8px 10px; border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3);
    color: #e2e8f0; font-size: 13px; font-family: 'JetBrains Mono', monospace;
  }
  .modal-actions { display: flex; gap: 8px; margin-top: 18px; justify-content: flex-end; }
  .modal-actions button {
    padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer;
    font-weight: 700; font-size: 13px; font-family: 'Manrope', sans-serif;
  }
  .btn-primary { background: #3b82f6; color: #fff; }
  .btn-cancel { background: rgba(255,255,255,0.06); color: #94a3b8; }
  .btn-add-sm {
    padding: 6px 14px; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.03); color: #64748b; cursor: pointer;
    font-size: 12px; font-weight: 700; font-family: 'Manrope', sans-serif; transition: all 0.2s;
  }
  .btn-add-sm:hover { border-color: #60a5fa; color: #60a5fa; background: rgba(96,165,250,0.08); }
  .btn-export {
    padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04); color: #94a3b8; cursor: pointer;
    font-size: 12px; font-weight: 700; font-family: 'Manrope', sans-serif; transition: all 0.2s;
  }
  .btn-export:hover { border-color: #22c55e; color: #22c55e; }
`;

/* ── App ────────────────────────────────────────────── */
export default function App() {
  const {
    snapshot, history, connected, setScenario,
    addBattery, removeBattery, editBattery,
    addLoad, removeLoad, editLoad,
    exportLogs,
  } = useWebSocket();
  const [activeScenario, setActiveScenario] = useState('NORMAL');
  const [showBatModal, setShowBatModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Battery form state
  const [batForm, setBatForm] = useState({ name: '', voltage: '12.8', soh: '95', max_current: '250', internal_resistance: '0.005' });
  // Load form state
  const [loadForm, setLoadForm] = useState({ name_uk: '', power_watts: '200', priority: 'OPTIONAL' });

  const handleScenario = (sc: string) => {
    setActiveScenario(sc);
    setScenario(sc);
  };

  const handleAddBattery = () => {
    const nextId = (snapshot?.batteries?.length || 0) + 1;
    addBattery({
      name: batForm.name || `BAT-${nextId}`,
      voltage: parseFloat(batForm.voltage) || 12.8,
      soh: parseFloat(batForm.soh) || 95,
      max_current: parseFloat(batForm.max_current) || 250,
      internal_resistance: parseFloat(batForm.internal_resistance) || 0.005,
    });
    setShowBatModal(false);
    setBatForm({ name: '', voltage: '12.8', soh: '95', max_current: '250', internal_resistance: '0.005' });
  };

  const handleAddLoad = () => {
    addLoad({
      name: loadForm.name_uk,
      name_uk: loadForm.name_uk || 'Нове навантаження',
      power_watts: parseFloat(loadForm.power_watts) || 100,
      priority: loadForm.priority,
    });
    setShowLoadModal(false);
    setLoadForm({ name_uk: '', power_watts: '200', priority: 'OPTIONAL' });
  };

  const s = snapshot;
  const st = s?.state;
  const f = s?.fuzzy;

  const chartData = history.map(h => ({
    t: h.tick,
    stability: h.state.stability_score,
    voltage: h.state.system_voltage,
    current: h.state.system_current,
  }));

  return (
    <>
      <style>{css}{modalCss}</style>
      <div className="dashboard">
        {/* Header */}
        <div className="header">
          <h1>⚡ Розумна Енергосистема — Цифровий Двійник</h1>
          <div className="conn-badge">
            <div className="conn-dot" style={{ background: connected ? '#22c55e' : '#ef4444' }} />
            {connected ? 'Підключено' : 'Відключено'}
            {s && <span className="mono" style={{ color: '#475569' }}>&nbsp;| тік {s.tick}</span>}
          </div>
        </div>

        {/* Scenarios */}
        <div className="scenarios">
          <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center', marginRight: 4, fontWeight: 600 }}>
            СЦЕНАРІЇ:
          </span>
          {Object.entries(SCENARIO_LABELS).map(([k, v]) => (
            <button
              key={k}
              className={`sc-btn ${activeScenario === k ? 'active' : ''}`}
              onClick={() => handleScenario(k)}
            >
              {v}
            </button>
          ))}
        </div>

        {!s ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#475569' }}>
            Очікування даних...
          </div>
        ) : (
          <>
            {/* Top: Stability + Stats */}
            <div className="grid-top">
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="card-title">Стабільність системи</div>
                <StabilityRing score={st!.stability_score} risk={st!.risk_level} />
                <div
                  className="mode-badge"
                  style={{
                    background: (MODE_COLORS[st!.mode] || '#6b7280') + '22',
                    color: MODE_COLORS[st!.mode] || '#6b7280',
                    marginTop: 8,
                    width: '100%',
                  }}
                >
                  {MODE_LABELS[st!.mode] || st!.mode}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
                  Рівень ризику: <span style={{ color: RISK_COLORS[st!.risk_level], fontWeight: 700 }}>
                    {st!.risk_level}
                  </span>
                </div>
              </div>

              <div>
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-label">Напруга системи</div>
                    <div className="stat-value mono" style={{ color: '#60a5fa' }}>{st!.system_voltage.toFixed(1)}В</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Загальний струм</div>
                    <div className="stat-value mono" style={{ color: '#a78bfa' }}>{st!.system_current.toFixed(1)}А</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Активні батареї</div>
                    <div className="stat-value mono" style={{
                      color: st!.active_batteries === st!.total_batteries ? '#22c55e' : '#f97316'
                    }}>
                      {st!.active_batteries}/{st!.total_batteries}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Навантаження</div>
                    <div className="stat-value mono" style={{ color: '#f472b6' }}>
                      {st!.active_load_watts.toFixed(0)}
                      <span style={{ fontSize: 13, color: '#64748b' }}>/{st!.total_load_watts.toFixed(0)}Вт</span>
                    </div>
                  </div>
                </div>

                {st!.shed_load_watts > 0 && (
                  <div style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: '#fca5a5',
                    fontWeight: 600,
                    marginBottom: 12,
                  }}>
                    ⚠ Скинуто навантаження: {st!.shed_load_watts.toFixed(0)} Вт
                  </div>
                )}

                {/* Charts */}
                <div className="charts-row">
                  <div className="card">
                    <div className="card-title">Стабільність</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="gStab" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="t" hide />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: '#64748b' }}
                        />
                        <Area type="monotone" dataKey="stability" stroke="#22c55e" fill="url(#gStab)" strokeWidth={2} dot={false} name="Стабільність" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <div className="card-title">Напруга (В)</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="t" hide />
                        <YAxis domain={[9, 15]} hide />
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                        />
                        <Line type="monotone" dataKey="voltage" stroke="#60a5fa" strokeWidth={2} dot={false} name="Напруга" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <div className="card-title">Струм (А)</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="gCur" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="t" hide />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                        />
                        <Area type="monotone" dataKey="current" stroke="#a78bfa" fill="url(#gCur)" strokeWidth={2} dot={false} name="Струм" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Batteries header + Add button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div className="card-title" style={{ marginBottom: 0 }}>Батареї</div>
              <button className="btn-add-sm" onClick={() => setShowBatModal(true)}>+ Додати батарею</button>
            </div>
            <div className="grid-batteries" style={{
              gridTemplateColumns: `repeat(${Math.min(s.batteries.length + 1, 4)}, 1fr)`
            }}>
              {s.batteries.map(b => (
                <BatteryCard key={b.id} bat={b} onRemove={(id) => removeBattery(id)} />
              ))}
            </div>

            {/* Bottom: Loads + Log */}
            <div className="grid-bottom">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div className="card-title" style={{ marginBottom: 0 }}>Навантаження</div>
                  <button className="btn-add-sm" onClick={() => setShowLoadModal(true)}>+ Додати</button>
                </div>
                <div className="loads-grid">
                  {s.loads.map(l => (
                    <div key={l.id} className="load-item" style={{
                      opacity: l.status === 'SHED' ? 0.45 : 1,
                    }}>
                      <div>
                        <div className="name">{l.name_uk}</div>
                        <div className="mono" style={{ fontSize: 12, color: '#94a3b8' }}>
                          {l.power_watts.toFixed(0)} Вт
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span className="badge" style={{
                            background: PRIORITY_COLORS[l.priority] + '22',
                            color: PRIORITY_COLORS[l.priority],
                          }}>
                            {l.priority === 'CRITICAL' ? 'КРИТ.' : l.priority === 'IMPORTANT' ? 'ВАЖЛ.' : 'НЕОБ.'}
                          </span>
                          <button onClick={() => removeLoad(l.id)} style={{
                            background: 'none', border: 'none', color: '#64748b',
                            cursor: 'pointer', fontSize: 11, padding: '0 2px',
                          }} title="Видалити">✕</button>
                        </div>
                        <span style={{
                          fontSize: 10,
                          color: l.status === 'ACTIVE' ? '#22c55e' : '#ef4444',
                          fontWeight: 700,
                        }}>
                          {l.status === 'ACTIVE' ? '● УВІМКН.' : '○ ВИМКН.'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div className="card-title" style={{ marginBottom: 0 }}>Журнал дій контролера</div>
                  <button className="btn-export" onClick={exportLogs}>⬇ Зберегти логи</button>
                </div>
                <div className="log-list">
                  {st!.actions_log.length === 0 ? (
                    <div style={{ color: '#475569', fontSize: 13, padding: 12 }}>Немає дій</div>
                  ) : (
                    st!.actions_log.map((a, i) => {
                      const borderColor = a.includes('АВАРІЯ') || a.includes('ВІДМОВА') ? '#ef4444'
                        : a.includes('СКИДАННЯ') || a.includes('ЗАХИСТ') ? '#f97316'
                        : a.includes('ВІДНОВЛЕННЯ') ? '#22c55e'
                        : a.includes('КОНФІГ') ? '#a78bfa'
                        : '#3b82f6';
                      return (
                        <div key={i} className="log-entry" style={{ borderLeftColor: borderColor }}>
                          {a}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Fuzzy debug info */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">Нечітка логіка — Вихідні сигнали</div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
                <div>Скидання необов'язкових: <span className="mono" style={{ color: f!.shed_optional > 0.5 ? '#f97316' : '#22c55e' }}>{f!.shed_optional.toFixed(3)}</span></div>
                <div>Скидання важливих: <span className="mono" style={{ color: f!.shed_important > 0.5 ? '#ef4444' : '#22c55e' }}>{f!.shed_important.toFixed(3)}</span></div>
                <div>Рекомендований режим: <span className="mono" style={{ color: MODE_COLORS[f!.recommended_mode] || '#fff' }}>{MODE_LABELS[f!.recommended_mode] || f!.recommended_mode}</span></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal: Add Battery ── */}
      {showBatModal && (
        <div className="modal-overlay" onClick={() => setShowBatModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Додати батарею</h3>
            <label>Назва</label>
            <input value={batForm.name} onChange={e => setBatForm(p => ({ ...p, name: e.target.value }))} placeholder="BAT-4" />
            <label>Напруга (В)</label>
            <input type="number" step="0.1" value={batForm.voltage} onChange={e => setBatForm(p => ({ ...p, voltage: e.target.value }))} />
            <label>SOH (%)</label>
            <input type="number" step="1" value={batForm.soh} onChange={e => setBatForm(p => ({ ...p, soh: e.target.value }))} />
            <label>Макс. струм (А)</label>
            <input type="number" step="10" value={batForm.max_current} onChange={e => setBatForm(p => ({ ...p, max_current: e.target.value }))} />
            <label>Внутрішній опір (Ом)</label>
            <input type="number" step="0.001" value={batForm.internal_resistance} onChange={e => setBatForm(p => ({ ...p, internal_resistance: e.target.value }))} />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowBatModal(false)}>Скасувати</button>
              <button className="btn-primary" onClick={handleAddBattery}>Додати</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add Load ── */}
      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Додати навантаження</h3>
            <label>Назва (укр.)</label>
            <input value={loadForm.name_uk} onChange={e => setLoadForm(p => ({ ...p, name_uk: e.target.value }))} placeholder="Новий споживач" />
            <label>Потужність (Вт)</label>
            <input type="number" step="50" value={loadForm.power_watts} onChange={e => setLoadForm(p => ({ ...p, power_watts: e.target.value }))} />
            <label>Пріоритет</label>
            <select value={loadForm.priority} onChange={e => setLoadForm(p => ({ ...p, priority: e.target.value }))}>
              <option value="CRITICAL">Критичний</option>
              <option value="IMPORTANT">Важливий</option>
              <option value="OPTIONAL">Необов'язковий</option>
            </select>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowLoadModal(false)}>Скасувати</button>
              <button className="btn-primary" onClick={handleAddLoad}>Додати</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
