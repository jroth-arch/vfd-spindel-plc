let authToken = null;
let selectedScenarioId = null;

const SCENARIOS = [
  {
    id: 'SAT-01',
    name: 'Rozbeh vretena bez safety rele',
    description: 'Zapne test override SafetyRelayAuxOk a provede dvoukrokovy Start sekvencni zapis.',
    writeSteps: [
      {
        writes: [
          { tag: '"DB_Config".InputSim.EnableSafetyRelayAuxOverride', value: true },
          { tag: '"DB_Config".InputSim.SafetyRelayAuxOk', value: true },
          { tag: '"DB_Config".InputSim.EnableEmergencyStopOverride', value: true },
          { tag: '"DB_Config".InputSim.EmergencyStop', value: false },
          { tag: '"DB_Alarms".VibCritical', value: false },
          { tag: '"DB_HMI".Spindle.Start', value: false },
          { tag: '"DB_HMI".Spindle.Stop', value: true }
        ],
        delayMs: 250
      },
      {
        writes: [
          { tag: '"DB_HMI".Spindle.Stop', value: false },
          { tag: '"DB_HMI".Spindle.Speed_RPM', value: 16000.0 },
          { tag: '"DB_HMI".Spindle.Start', value: true }
        ],
        delayMs: 300
      }
    ],
    checks: [
      { tag: '"DB_IO".DI.SafetyRelayAuxOk', op: 'eq', expected: true },
      { tag: '"DB_Status".Safety.PermitMotion', op: 'eq', expected: true },
      { tag: '"DB_Status".Spindel.TripActive', op: 'eq', expected: false },
      { tag: '"DB_IO".DQ.RunForwardCmd', op: 'eq', expected: true },
      { tag: '"DB_IO".AQ.SpeedVoltage', op: 'gt', expected: 0.0 }
    ]
  },
  {
    id: 'SAT-02',
    name: 'Safety trip pres VibCritical (2 faze)',
    description: 'Nejdriv overi, ze vreteno bezi bez tripu, potom zapne alarm a overi trip.',
    stages: [
      {
        name: 'Faze A: bezi bez tripu',
        writes: [
          { tag: '"DB_Config".InputSim.EnableSafetyRelayAuxOverride', value: true },
          { tag: '"DB_Config".InputSim.SafetyRelayAuxOk', value: true },
          { tag: '"DB_Config".InputSim.EnableEmergencyStopOverride', value: true },
          { tag: '"DB_Config".InputSim.EmergencyStop', value: false },
          { tag: '"DB_Alarms".VibCritical', value: false },
          { tag: '"DB_HMI".Spindle.Start', value: false },
          { tag: '"DB_HMI".Spindle.Stop', value: true }
        ],
        delayMs: 250,
        checks: []
      },
      {
        name: 'Faze A2: start vretena',
        writes: [
          { tag: '"DB_HMI".Spindle.Stop', value: false },
          { tag: '"DB_HMI".Spindle.Speed_RPM', value: 16000.0 },
          { tag: '"DB_HMI".Spindle.Start', value: true }
        ],
        delayMs: 300,
        checks: [
          { tag: '"DB_Status".Safety.PermitMotion', op: 'eq', expected: true },
          { tag: '"DB_Status".Spindel.TripActive', op: 'eq', expected: false },
          { tag: '"DB_IO".DQ.RunForwardCmd', op: 'eq', expected: true },
          { tag: '"DB_IO".AQ.SpeedVoltage', op: 'gt', expected: 0.0 }
        ]
      },
      {
        name: 'Faze B: vyvolani tripu',
        writes: [
          { tag: '"DB_Alarms".VibCritical', value: true }
        ],
        delayMs: 250,
        checks: [
          { tag: '"DB_Status".Safety.TripActive', op: 'eq', expected: true },
          { tag: '"DB_Status".Safety.PermitMotion', op: 'eq', expected: false },
          { tag: '"DB_IO".DQ.RunForwardCmd', op: 'eq', expected: false }
        ]
      }
    ]
  },
  {
    id: 'SAT-03',
    name: 'Bez auto-restartu po odezneni tripu (se safety simulaci)',
    description: 'Aktivuje safety simulaci, roztoči vreteno, vyvola trip a po odezneni overi, ze se samo nerozbehne.',
    stages: [
      {
        name: 'Faze A: safety simulace + rozbeh',
        writes: [
          { tag: '"DB_Config".InputSim.EnableSafetyRelayAuxOverride', value: true },
          { tag: '"DB_Config".InputSim.SafetyRelayAuxOk', value: true },
          { tag: '"DB_Config".InputSim.EnableEmergencyStopOverride', value: true },
          { tag: '"DB_Config".InputSim.EmergencyStop', value: false },
          { tag: '"DB_Alarms".VibCritical', value: false },
          { tag: '"DB_HMI".Spindle.Start', value: false },
          { tag: '"DB_HMI".Spindle.Stop', value: true }
        ],
        delayMs: 250,
        checks: []
      },
      {
        name: 'Faze A2: start',
        writes: [
          { tag: '"DB_HMI".Spindle.Stop', value: false },
          { tag: '"DB_HMI".Spindle.Speed_RPM', value: 16000.0 },
          { tag: '"DB_HMI".Spindle.Start', value: true }
        ],
        delayMs: 300,
        checks: [
          { tag: '"DB_Status".Spindel.TripActive', op: 'eq', expected: false },
          { tag: '"DB_IO".DQ.RunForwardCmd', op: 'eq', expected: true },
          { tag: '"DB_IO".AQ.SpeedVoltage', op: 'gt', expected: 0.0 }
        ]
      },
      {
        name: 'Faze B: vyvolani tripu',
        writes: [
          { tag: '"DB_Alarms".VibCritical', value: true }
        ],
        delayMs: 250,
        checks: [
          { tag: '"DB_Status".Safety.TripActive', op: 'eq', expected: true },
          { tag: '"DB_IO".DQ.RunForwardCmd', op: 'eq', expected: false }
        ]
      },
      {
        name: 'Faze C: odezneni bez novyho startu',
        writes: [
          { tag: '"DB_Alarms".VibCritical', value: false },
          { tag: '"DB_HMI".Spindle.Start', value: false },
          { tag: '"DB_HMI".Spindle.Stop', value: false }
        ],
        delayMs: 250,
        checks: [
          { tag: '"DB_Status".Safety.TripActive', op: 'eq', expected: false },
          { tag: '"DB_IO".DQ.RunForwardCmd', op: 'eq', expected: false },
          { tag: '"DB_Status".Spindel.RunLatched', op: 'eq', expected: false }
        ]
      }
    ]
  },
  {
    id: 'SAT-04',
    name: 'LabPSU AQ scaling (CONST)',
    description: 'Overi vystupy AQ2/AQ1/AQ3 a jejich prepocet na ridici napeti.',
    comment: 'Pracovni rozsahy: AQ3_OutputOff 5V=OFF, 0V=ON; AQ1_CurrentCtrl_V 0..5V <-> 0..60A (30A=2.5V); AQ2_VoltageCtrl_V 0..5V <-> ~0.8..16V (5V=16V, 0V~0.8V).',
    writes: [
      { tag: '"DB_Config".InputSim.EnableSafetyRelayAuxOverride', value: true },
      { tag: '"DB_Config".InputSim.SafetyRelayAuxOk', value: true },
      { tag: '"DB_Config".InputSim.EnableEmergencyStopOverride', value: true },
      { tag: '"DB_Config".InputSim.EmergencyStop', value: false },
      { tag: '"DB_Alarms".VibCritical', value: false },
      { tag: '"DB_HMI".LabPSU.Enable', value: true },
      { tag: '"DB_HMI".LabPSU.Mode', value: 1 },
      { tag: '"DB_HMI".LabPSU.BaseVoltage_V', value: 16.0 },
      { tag: '"DB_HMI".LabPSU.ConstCurrent_A', value: 30.0 }
    ],
    delayMs: 2000,
    checks: [
      { tag: '"DB_Status".Safety.PermitMotion', op: 'eq', expected: true },
      { tag: '"DB_IO".AQ.AQ3_OutputOff', op: 'approx', expected: 0.0, tol: 0.05 },
      { tag: '"DB_IO".AQ.AQ2_VoltageCtrl_V', op: 'approx', expected: 5.0, tol: 0.05 },
      { tag: '"DB_IO".AQ.AQ1_CurrentCtrl_V', op: 'approx', expected: 2.5, tol: 0.05 }
    ]
  },
  {
    id: 'SAT-05',
    name: 'LabPSU SAFE OFF',
    description: 'Zakaze LabPSU a overi bezpecny stav vystupu.',
    writes: [
      { tag: '"DB_HMI".LabPSU.Enable', value: false }
    ],
    checks: [
      { tag: '"DB_IO".AQ.AQ3_OutputOff', op: 'eq', expected: 5.0 },
      { tag: '"DB_Status".LabPSU.State', op: 'eq', expected: 0 },
      { tag: '"DB_Status".LabPSU.CurrentSet_A', op: 'eq', expected: 0.0 }
    ]
  },
  {
    id: 'SAT-06',
    name: 'LabPSU SINE_DEBUG write/read',
    description: 'Nastavi sinusovy rezim a overi ulozene parametry.',
    writes: [
      { tag: '"DB_HMI".LabPSU.Enable', value: true },
      { tag: '"DB_HMI".LabPSU.Mode', value: 2 },
      { tag: '"DB_HMI".LabPSU.CurrentOffset_A', value: 5.0 },
      { tag: '"DB_HMI".LabPSU.DebugAmplitude_A', value: 5.0 },
      { tag: '"DB_HMI".LabPSU.DebugFrequency_Hz', value: 2.0 }
    ],
    checks: [
      { tag: '"DB_HMI".LabPSU.Mode', op: 'eq', expected: 2 },
      { tag: '"DB_HMI".LabPSU.CurrentOffset_A', op: 'eq', expected: 5.0 },
      { tag: '"DB_HMI".LabPSU.DebugAmplitude_A', op: 'eq', expected: 5.0 },
      { tag: '"DB_HMI".LabPSU.DebugFrequency_Hz', op: 'eq', expected: 2.0 }
    ]
  },
  {
    id: 'SAT-07',
    name: 'Truth table safety DI0/DI1',
    description: 'Overi vsechny 4 kombinace DI0/DI1 a odpovídající stav safety, PermitMotion a LED vystupy.',
    stages: [
      {
        name: 'Faze 1: READY (DI1=1, DI0=1)',
        writes: [
          { tag: '"DB_Config".InputSim.EnableSafetyRelayAuxOverride', value: true },
          { tag: '"DB_Config".InputSim.SafetyRelayAuxOk', value: true },
          { tag: '"DB_Config".InputSim.EnableEmergencyStopOverride', value: true },
          { tag: '"DB_Config".InputSim.EmergencyStop', value: false }
        ],
        delayMs: 250,
        checks: [
          { tag: '"DB_Status".Safety.SafetyOk', op: 'eq', expected: true },
          { tag: '"DB_Status".Safety.PermitMotion', op: 'eq', expected: true },
          { tag: '"DB_Status".Safety.TripActive', op: 'eq', expected: false },
          { tag: '"DB_Status".Safety.TripCode', op: 'eq', expected: 0 },
          { tag: '"DB_IO".DQ.EmergencyStopButtonLed', op: 'eq', expected: false },
          { tag: '"DB_IO".DQ.ResetButtonLed', op: 'eq', expected: false }
        ]
      },
      {
        name: 'Faze 2: WAITING FOR RESET (DI1=1, DI0=0)',
        writes: [
          { tag: '"DB_Config".InputSim.SafetyRelayAuxOk', value: false },
          { tag: '"DB_Config".InputSim.EmergencyStop', value: false }
        ],
        delayMs: 250,
        checks: [
          { tag: '"DB_Status".Safety.SafetyOk', op: 'eq', expected: false },
          { tag: '"DB_Status".Safety.TripActive', op: 'eq', expected: true },
          { tag: '"DB_Status".Safety.TripCode', op: 'eq', expected: 2 },
          { tag: '"DB_IO".DQ.EmergencyStopButtonLed', op: 'eq', expected: false },
          { tag: '"DB_IO".DQ.ResetButtonLed', op: 'eq', expected: true }
        ]
      },
      {
        name: 'Faze 3: E-STOP ACTIVE (DI1=0, DI0=0)',
        writes: [
          { tag: '"DB_Config".InputSim.SafetyRelayAuxOk', value: false },
          { tag: '"DB_Config".InputSim.EmergencyStop', value: true }
        ],
        delayMs: 250,
        checks: [
          { tag: '"DB_Status".Safety.SafetyOk', op: 'eq', expected: false },
          { tag: '"DB_Status".Safety.TripActive', op: 'eq', expected: true },
          { tag: '"DB_Status".Safety.TripCode', op: 'eq', expected: 1 },
          { tag: '"DB_IO".DQ.EmergencyStopButtonLed', op: 'eq', expected: true },
          { tag: '"DB_IO".DQ.ResetButtonLed', op: 'eq', expected: false }
        ]
      },
      {
        name: 'Faze 4: E-STOP fault stav (DI1=0, DI0=1)',
        writes: [
          { tag: '"DB_Config".InputSim.SafetyRelayAuxOk', value: true },
          { tag: '"DB_Config".InputSim.EmergencyStop', value: true }
        ],
        delayMs: 250,
        checks: [
          { tag: '"DB_Status".Safety.SafetyOk', op: 'eq', expected: false },
          { tag: '"DB_Status".Safety.TripActive', op: 'eq', expected: true },
          { tag: '"DB_Status".Safety.TripCode', op: 'eq', expected: 1 },
          { tag: '"DB_IO".DQ.EmergencyStopButtonLed', op: 'eq', expected: true },
          { tag: '"DB_IO".DQ.ResetButtonLed', op: 'eq', expected: false }
        ]
      }
    ]
  },
  {
    id: 'LOG-01',
    name: 'Start a stop testu (logging)',
    description: 'Overi, ze FB_LogManager reaguje na start/stop prikaz.',
    expectedFail: true,
    expectedFailReason: 'DB_LogRuntime zatim neexistuje v PLC projektu – implementace logování není hotova.',
    writes: [
      { tag: '"DB_LogConfig".Enable', value: true }
    ],
    delayMs: 300,
    checks: [
      { tag: '"DB_LogRuntime".TestActive', op: 'eq', expected: false },
      { tag: '"DB_LogRuntime".Elapsed_s', op: 'eq', expected: 0.0 },
      { tag: '"DB_LogRuntime".SampleCounter', op: 'eq', expected: 0 }
    ]
  },
  {
    id: 'LOG-02',
    name: 'Plnění trend bufferu',
    description: 'Overi, ze se TrendWriteIdx pohybuje dopredu po spusteni testu.',
    expectedFail: true,
    expectedFailReason: 'DB_LogBuffer zatim neexistuje v PLC projektu.',
    writes: [
      { tag: '"DB_LogConfig".Enable', value: true }
    ],
    delayMs: 600,
    checks: [
      { tag: '"DB_LogBuffer".TrendWriteIdx', op: 'gt', expected: 0 }
    ]
  },
  {
    id: 'LOG-03',
    name: 'Trend buffer zaznamenava Trip',
    description: 'Overi, ze pri tripu se zaznamenava TripCode == 5 (VibAlarm).',
    expectedFail: true,
    expectedFailReason: 'DB_LogBuffer zatim neexistuje v PLC projektu.',
    stages: [
      {
        name: 'Faze A: Trigger VibCritical',
        writes: [
          { tag: '"DB_Config".InputSim.EnableSafetyRelayAuxOverride', value: true },
          { tag: '"DB_Config".InputSim.SafetyRelayAuxOk', value: true },
          { tag: '"DB_Config".InputSim.EnableEmergencyStopOverride', value: true },
          { tag: '"DB_Config".InputSim.EmergencyStop', value: false },
          { tag: '"DB_LogConfig".Enable', value: true },
          { tag: '"DB_Alarms".VibCritical', value: true }
        ],
        delayMs: 350,
        checks: [
          { tag: '"DB_LogBuffer".TrendBuffer[0].TripActive', op: 'eq', expected: true },
          { tag: '"DB_LogBuffer".TrendBuffer[0].TripCode', op: 'eq', expected: 5 }
        ]
      }
    ]
  },
  {
    id: 'LOG-04',
    name: 'Elapsed_s roste spravne',
    description: 'Overi, ze Elapsed_s po 2 sekundach odpovidá skutecnemu casu.',
    expectedFail: true,
    expectedFailReason: 'DB_LogRuntime zatim neexistuje v PLC projektu.',
    writes: [
      { tag: '"DB_LogConfig".Enable', value: true }
    ],
    delayMs: 2100,
    checks: [
      { tag: '"DB_LogRuntime".Elapsed_s', op: 'gt', expected: 2.0 },
      { tag: '"DB_LogRuntime".SampleCounter', op: 'gt', expected: 8 }
    ]
  },
  {
    id: 'LOG-05',
    name: 'Konec testu po timeoutu',
    description: 'Overi, ze po TestDuration_s se test sam zastavi.',
    expectedFail: true,
    expectedFailReason: 'DB_LogRuntime zatim neexistuje v PLC projektu.',
    writes: [
      { tag: '"DB_LogConfig".Enable', value: true },
      { tag: '"DB_LogConfig".TestDuration_s', value: 3 }
    ],
    delayMs: 4000,
    checks: [
      { tag: '"DB_LogRuntime".TestActive', op: 'eq', expected: false },
      { tag: '"DB_LogRuntime".Elapsed_s', op: 'gt', expected: 3.0 }
    ]
  }
];

function debug(text) {
  const el = document.getElementById('debug');
  if (el) el.textContent = text;
}

function setConnStatus(text, ok) {
  const el = document.getElementById('connStatus');
  el.textContent = text;
  el.className = ok ? 'status ok' : 'status bad';
}

async function rpc(method, params = null, needAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (needAuth && authToken) headers['X-Auth-Token'] = authToken;

  const req = { jsonrpc: '2.0', method, id: 1 };
  if (params !== null) req.params = params;

  const resp = await fetch('/api/jsonrpc', {
    method: 'POST',
    headers,
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: JSON.stringify([req])
  });

  if (!resp.ok) {
    throw new Error('HTTP ' + resp.status);
  }

  const data = await resp.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Prazdna odpoved API');
  }

  const item = data[0];
  if (item.error) {
    throw new Error(item.error.message + ' (code ' + item.error.code + ')');
  }

  return item.result;
}

async function rpcBatch(calls, needAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (needAuth && authToken) headers['X-Auth-Token'] = authToken;

  const payload = calls.map((call, idx) => {
    const req = { jsonrpc: '2.0', method: call.method, id: idx + 1 };
    if (call.params !== undefined && call.params !== null) {
      req.params = call.params;
    }
    return req;
  });

  const resp = await fetch('/api/jsonrpc', {
    method: 'POST',
    headers,
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    throw new Error('HTTP ' + resp.status);
  }

  const data = await resp.json();
  if (!Array.isArray(data)) {
    throw new Error('Neplatna batch odpoved');
  }

  const byId = new Map();
  for (const item of data) byId.set(item.id, item);

  return calls.map((_, idx) => {
    const item = byId.get(idx + 1);
    if (!item) throw new Error('Chybi batch polozka ' + (idx + 1));
    if (item.error) throw new Error(item.error.message + ' (code ' + item.error.code + ')');
    return item.result;
  });
}

async function login() {
  const user = document.getElementById('apiUser').value.trim();
  const password = document.getElementById('apiPassword').value;

  try {
    const result = await rpc('Api.Login', { user, password }, false);
    authToken = result.token;
    setConnStatus('Prihlaseno', true);
    debug('Login OK');
  } catch (err) {
    authToken = null;
    setConnStatus('Login failed', false);
    debug('Login error: ' + err.message);
    alert('Login selhal: ' + err.message);
  }
}

async function logout() {
  if (!authToken) {
    setConnStatus('Neprihlaseno', false);
    return;
  }

  try {
    await rpc('Api.Logout');
  } catch (_) {
  } finally {
    authToken = null;
    setConnStatus('Neprihlaseno', false);
    debug('Odhlaseno');
  }
}

function renderScenarioButtons() {
  const container = document.getElementById('scenarios');
  container.innerHTML = '';

  SCENARIOS.forEach((s) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = s.id + ' - ' + s.name;
    btn.onclick = () => selectScenario(s.id);
    btn.dataset.sid = s.id;
    container.appendChild(btn);
  });
}

function selectScenario(id) {
  selectedScenarioId = id;
  const scenario = SCENARIOS.find((x) => x.id === id);
  if (!scenario) return;

  const detail = document.getElementById('scenarioDetail');
  const writesSource = scenario.stages
    ? scenario.stages.flatMap((s) => s.writes || [])
    : (scenario.writeSteps
      ? scenario.writeSteps.flatMap((s) => s.writes)
      : (scenario.writes || []));
  const checksSource = scenario.stages
    ? scenario.stages.flatMap((s) => s.checks || [])
    : (scenario.checks || []);

  const writes = writesSource.map((w) => `<li><code>${escapeHtml(w.tag)}</code> = <b>${escapeHtml(String(w.value))}</b></li>`).join('');
  const checks = checksSource.map((c) => `<li><code>${escapeHtml(c.tag)}</code> ${escapeHtml(c.op)} <b>${escapeHtml(String(c.expected))}</b></li>`).join('');

  detail.innerHTML = `
    <h3>${escapeHtml(scenario.id)} - ${escapeHtml(scenario.name)}</h3>
    <p>${escapeHtml(scenario.description)}</p>
    ${scenario.comment ? `<p><b>Komentar:</b> ${escapeHtml(scenario.comment)}</p>` : ''}
    <div class="split">
      <div>
        <h4>Zapisovane tagy</h4>
        <ul>${writes}</ul>
      </div>
      <div>
        <h4>Kontrolni tagy</h4>
        <ul>${checks}</ul>
      </div>
    </div>
  `;

  document.querySelectorAll('#scenarios button').forEach((b) => {
    b.classList.toggle('active', b.dataset.sid === id);
  });

  // AQ1 chart section only for SAT-06
  const aq1Section = document.getElementById('aq1ChartSection');
  if (id === 'SAT-06') {
    aq1Section.style.display = '';
  } else {
    aq1Section.style.display = 'none';
  }
}
// --- AQ1_CurrentCtrl_V capture and chart for SAT-06 ---
let aq1Data = [];
let aq1Timer = null;
let aq1StartTime = 0;
let aq1ChartVoltage = null;
let aq1ChartCurrent = null;

window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('aq1StartBtn');
  if (btn) btn.onclick = startAq1Capture;
  const exp = document.getElementById('aq1ExportBtn');
  if (exp) exp.onclick = exportAq1Csv;
});

async function startAq1Capture() {
  aq1Data = [];
  aq1StartTime = Date.now();
  document.getElementById('aq1ChartStatus').textContent = 'Zaznamenávám...';
  document.getElementById('aq1ExportBtn').style.display = 'none';
  if (aq1ChartVoltage) { aq1ChartVoltage.destroy(); aq1ChartVoltage = null; }
  if (aq1ChartCurrent) { aq1ChartCurrent.destroy(); aq1ChartCurrent = null; }
  await captureAq1Loop();
}

async function captureAq1Loop() {
  const durationMs = 5000;
  const intervalMs = 50;
  const endTime = aq1StartTime + durationMs;
  while (Date.now() < endTime) {
    try {
      const val = await rpc('PlcProgram.Read', { var: '"DB_IO".AQ.AQ1_CurrentCtrl_V', mode: 'simple' });
      aq1Data.push({ t: Date.now() - aq1StartTime, v: val });
    } catch (e) {
      aq1Data.push({ t: Date.now() - aq1StartTime, v: null });
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  document.getElementById('aq1ChartStatus').textContent = 'Hotovo, vzorků: ' + aq1Data.length;
  document.getElementById('aq1ExportBtn').style.display = '';
  renderAq1Chart();
}

function renderAq1Chart() {
  const canvasVoltage = document.getElementById('aq1ChartVoltage');
  const canvasCurrent = document.getElementById('aq1ChartCurrent');
  const ctxVoltage = canvasVoltage.getContext('2d');
  const ctxCurrent = canvasCurrent.getContext('2d');
  const labels = aq1Data.map(d => (d.t / 1000).toFixed(2));
  const voltageData = aq1Data.map(d => d.v);
  const currentData = aq1Data.map(d => (typeof d.v === 'number' ? (d.v / 5.0) * 60.0 : null));

  if (window.Chart) {
    if (aq1ChartVoltage) aq1ChartVoltage.destroy();
    if (aq1ChartCurrent) aq1ChartCurrent.destroy();

    aq1ChartVoltage = new window.Chart(ctxVoltage, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'AQ1_CurrentCtrl_V [V]',
          data: voltageData,
          borderColor: 'blue',
          pointRadius: 0,
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        scales: {
          x: { title: { display: true, text: 'čas [s]' } },
          y: { title: { display: true, text: 'napětí na analogovém výstupu AQ1_CurrentCtrl_V [V]' }, min: 0 }
        },
        plugins: { legend: { display: false } },
        animation: false,
        responsive: false
      }
    });

    aq1ChartCurrent = new window.Chart(ctxCurrent, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Výstupní proud do uhlíků [A]',
          data: currentData,
          borderColor: '#0b6e4f',
          pointRadius: 0,
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        scales: {
          x: { title: { display: true, text: 'čas [s]' } },
          y: { title: { display: true, text: 'Výstupní proud do uhlíků[A]' }, min: 0 }
        },
        plugins: { legend: { display: false } },
        animation: false,
        responsive: false
      }
    });

    return;
  }

  drawAq1CanvasFallback(canvasVoltage, voltageData, 'AQ1 napeti [V]');
  drawAq1CanvasFallback(canvasCurrent, currentData, 'Vystupni proud [A]');
  document.getElementById('aq1ChartStatus').textContent += ' (fallback canvas, Chart.js neni nacten)';
}

function drawAq1CanvasFallback(canvas, data, yLabel) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const pad = 30;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // axes
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();

  ctx.fillStyle = '#444';
  ctx.font = '12px Segoe UI';
  ctx.fillText(yLabel, pad + 8, pad - 8);

  const valid = data.filter(v => typeof v === 'number');
  if (valid.length < 2) {
    ctx.fillStyle = '#444';
    ctx.fillText('Nedostatek dat pro vykresleni', pad + 10, pad + 20);
    return;
  }

  const minY = 0;
  const maxY = Math.max(...valid, 5);

  ctx.strokeStyle = '#0b6cf0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const v = typeof data[i] === 'number' ? data[i] : minY;
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - minY) / (maxY - minY || 1)) * (h - 2 * pad);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function exportAq1Csv() {
  let csv = 't_ms,AQ1_CurrentCtrl_V,OutputCurrent_A\n';
  for (const d of aq1Data) {
    const outCurrent = typeof d.v === 'number' ? (d.v / 5.0) * 60.0 : '';
    csv += `${d.t},${d.v},${outCurrent}\n`;
  }
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aq1_currentctrl_v.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function executeSelectedScenario() {
  if (!authToken) {
    alert('Nejdřív se přihlas.');
    return;
  }
  if (!selectedScenarioId) {
    alert('Vyber scenar.');
    return;
  }

  const scenario = SCENARIOS.find((x) => x.id === selectedScenarioId);
  if (!scenario) return;

  try {
    debug('Spoustim ' + scenario.id + ': zapis + cteni');

    if (scenario.stages && scenario.stages.length > 0) {
      const allRows = [];

      for (const stage of scenario.stages) {
        if (stage.writes && stage.writes.length > 0) {
          const writeCalls = stage.writes.map((w) => ({
            method: 'PlcProgram.Write',
            params: { var: w.tag, value: w.value, mode: 'simple' }
          }));
          await rpcBatch(writeCalls, true);
        }

        if (stage.delayMs && stage.delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, stage.delayMs));
        }

        if (stage.checks && stage.checks.length > 0) {
          const stageRows = await evaluateChecks(stage.checks, stage.name);
          allRows.push(...stageRows);

          if (!stageRows.every((r) => r.ok)) {
            renderResult(allRows);
            setResultSummary('FAIL - ' + scenario.id + ' (' + stage.name + ')', false);
            return;
          }
        }
      }

      renderResult(allRows, scenario.expectedFail);
      const allOk = allRows.every((r) => r.ok);
      if (scenario.expectedFail) {
        setResultSummary((allOk ? 'PASS (unexpected!)' : 'EXPECTED FAIL') + ' - ' + scenario.id, allOk ? true : null, true);
        if (!allOk && scenario.expectedFailReason) debug('Expected fail: ' + scenario.expectedFailReason);
      } else {
        setResultSummary((allOk ? 'PASS' : 'FAIL') + ' - ' + scenario.id + ' (' + allRows.filter((r) => r.ok).length + '/' + allRows.length + ')', allOk);
      }
      return;
    }

    if (scenario.writeSteps && scenario.writeSteps.length > 0) {
      for (const step of scenario.writeSteps) {
        const writeCalls = step.writes.map((w) => ({
          method: 'PlcProgram.Write',
          params: { var: w.tag, value: w.value, mode: 'simple' }
        }));
        await rpcBatch(writeCalls, true);
        if (step.delayMs && step.delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, step.delayMs));
        }
      }
    } else if (scenario.writes && scenario.writes.length > 0) {
      const writeCalls = scenario.writes.map((w) => ({
        method: 'PlcProgram.Write',
        params: { var: w.tag, value: w.value, mode: 'simple' }
      }));
      await rpcBatch(writeCalls, true);
    }

    // Pockani na cyklus PLC (nebo delsi, pokud scenar vyzaduje).
    await new Promise((resolve) => setTimeout(resolve, scenario.delayMs || 250));

    await evaluateScenario(scenario);
  } catch (err) {
    debug('Scenario error: ' + err.message);
    setResultSummary('CHYBA: ' + err.message, false);
  }
}

async function readSelectedScenarioOnly() {
  if (!authToken) {
    alert('Nejdřív se přihlas.');
    return;
  }
  if (!selectedScenarioId) {
    alert('Vyber scenar.');
    return;
  }

  const scenario = SCENARIOS.find((x) => x.id === selectedScenarioId);
  if (!scenario) return;

  try {
    debug('Spoustim ' + scenario.id + ': jen cteni');
    await evaluateScenario(scenario);
  } catch (err) {
    debug('Read-only error: ' + err.message);
    setResultSummary('CHYBA: ' + err.message, false);
  }
}

async function evaluateScenario(scenario) {
  const rows = await evaluateChecks(scenario.checks || [], 'Result');

  renderResult(rows, scenario.expectedFail);

  const allOk = rows.every((r) => r.ok);
  if (scenario.expectedFail) {
    const label = allOk ? 'PASS (unexpected!)' : 'EXPECTED FAIL';
    setResultSummary(label + ' - ' + scenario.id, allOk ? true : null, true);
    if (!allOk && scenario.expectedFailReason) {
      debug('Expected fail: ' + scenario.expectedFailReason);
    }
  } else {
    setResultSummary((allOk ? 'PASS' : 'FAIL') + ' - ' + scenario.id + ' (' + rows.filter((r) => r.ok).length + '/' + rows.length + ')', allOk);
  }
}

async function evaluateChecks(checks, stageName) {
  if (!checks || checks.length === 0) return [];

  const readCalls = checks.map((c) => ({
    method: 'PlcProgram.Read',
    params: { var: c.tag, mode: 'simple' }
  }));
  const values = await rpcBatch(readCalls, true);

  return checks.map((c, idx) => {
    const actual = values[idx];
    const ok = compare(actual, c);
    return { stage: stageName, tag: c.tag, expected: c.expected, actual, ok };
  });
}

function compare(actual, check) {
  const op = check.op;
  const expected = check.expected;

  switch (op) {
    case 'eq':
      if (typeof expected === 'number' && typeof actual === 'number') {
        return Math.abs(actual - expected) < 0.0001;
      }
      return actual === expected;
    case 'gt':
      if (typeof expected === 'number' && typeof actual === 'number') {
        return actual > expected;
      }
      return false;
    case 'approx':
      if (typeof expected === 'number' && typeof actual === 'number') {
        const tol = typeof check.tol === 'number' ? check.tol : 0.05;
        return Math.abs(actual - expected) <= tol;
      }
      return false;
    default:
      return false;
  }
}

function renderResult(rows, expectedFail = false) {
  const tbody = document.getElementById('resultBody');
  tbody.innerHTML = '';

  rows.forEach((r) => {
    const tr = document.createElement('tr');
    let pillClass, pillText;
    if (r.ok) {
      pillClass = 'pill pass';
      pillText = 'PASS';
    } else if (expectedFail) {
      pillClass = 'pill expected-fail';
      pillText = 'EXPECTED FAIL';
    } else {
      pillClass = 'pill fail';
      pillText = 'FAIL';
    }
    tr.innerHTML = `
      <td><code>${escapeHtml((r.stage ? '[' + r.stage + '] ' : '') + r.tag)}</code></td>
      <td>${escapeHtml(String(r.expected))}</td>
      <td>${escapeHtml(String(r.actual))}</td>
      <td><span class="${pillClass}">${pillText}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function setResultSummary(text, ok = null, expectedFail = false) {
  const el = document.getElementById('resultSummary');
  el.textContent = text;
  el.className = 'status';
  if (ok === true) el.classList.add('ok');
  else if (expectedFail) el.classList.add('expected-fail');
  else if (ok === false) el.classList.add('bad');
}

function parseManualValue(input) {
  const trimmed = input.trim();
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;
  const num = Number(trimmed);
  if (!Number.isNaN(num) && trimmed !== '') return num;
  return trimmed;
}

async function manualWrite() {
  if (!authToken) {
    alert('Nejdřív se přihlas.');
    return;
  }

  const tag = document.getElementById('manualTag').value.trim();
  const rawValue = document.getElementById('manualValue').value;
  const value = parseManualValue(rawValue);

  try {
    await rpc('PlcProgram.Write', { var: tag, value, mode: 'simple' }, true);
    document.getElementById('manualOutput').textContent = 'Zapsano: ' + tag + ' = ' + String(value);
    document.getElementById('manualOutput').className = 'status ok';
  } catch (err) {
    document.getElementById('manualOutput').textContent = 'Chyba zapisu: ' + err.message;
    document.getElementById('manualOutput').className = 'status bad';
  }
}

async function manualRead() {
  if (!authToken) {
    alert('Nejdřív se přihlas.');
    return;
  }

  const tag = document.getElementById('manualTag').value.trim();

  try {
    const val = await rpc('PlcProgram.Read', { var: tag, mode: 'simple' }, true);
    document.getElementById('manualOutput').textContent = 'Nacteno: ' + tag + ' = ' + String(val);
    document.getElementById('manualOutput').className = 'status ok';
  } catch (err) {
    document.getElementById('manualOutput').textContent = 'Chyba cteni: ' + err.message;
    document.getElementById('manualOutput').className = 'status bad';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  renderScenarioButtons();
  selectScenario('SAT-01');
});
