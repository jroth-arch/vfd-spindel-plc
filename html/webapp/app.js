let authToken = null;
let pollTimer = null;
let keepAliveTimer = null;
let refreshInProgress = false;
let writeInProgress = false;

const TAGS = {
  safetyOk: '"DB_Status".Safety.SafetyOk',
  permitMotion: '"DB_Status".Safety.PermitMotion',
  tripActive: '"DB_Status".Safety.TripActive',
  tripCode: '"DB_Status".Safety.TripCode',
  statusText: '"DB_Status".Safety.StatusText',
  emergencyStop: '"DB_IO".DI.EmergencyStop',
  safetyRelayAuxOk: '"DB_IO".DI.SafetyRelayAuxOk',
  externalFault: '"DB_IO".DI.ExternalFault',
  tempHigh: '"DB_Alarms".TempHigh',
  vibCritical: '"DB_Alarms".VibCritical',
  spindleStart: '"DB_HMI".Spindle.Start',
  spindleStop: '"DB_HMI".Spindle.Stop',
  spindleSpeedRpm: '"DB_HMI".Spindle.Speed_RPM'
};

function showPage(pageId, btn) {
  const pages = document.getElementsByClassName('page');
  for (let i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
  }
  document.getElementById(pageId).classList.add('active');

  const buttons = document.getElementsByClassName('navbtn');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('active');
  }
  btn.classList.add('active');
}

function setConnStatus(text, ok) {
  const el = document.getElementById('connStatus');
  el.textContent = text;
  el.className = ok ? 'status-pill status-ok' : 'status-pill status-bad';
}

function setDebug(text) {
  console.log(text);
  const el = document.getElementById('debugText');
  if (el) {
    el.textContent = text;
  }
}

async function rpc(method, params = null, needAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (needAuth && authToken) {
    headers['X-Auth-Token'] = authToken;
  }

  const req = {
    jsonrpc: '2.0',
    method,
    id: 1
  };

  if (params !== null) {
    req.params = params;
  }

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
    throw new Error('Prázdná odpověď API');
  }

  const item = data[0];
  if (item.error) {
    throw new Error(item.error.message + ' (code ' + item.error.code + ')');
  }

  return item.result;
}

async function rpcBatch(calls, needAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (needAuth && authToken) {
    headers['X-Auth-Token'] = authToken;
  }

  const payload = calls.map((call, idx) => {
    const req = {
      jsonrpc: '2.0',
      method: call.method,
      id: idx + 1
    };
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
    throw new Error('Neplatná batch odpověď');
  }

  const byId = new Map();
  for (const item of data) {
    byId.set(item.id, item);
  }

  return calls.map((_, idx) => {
    const item = byId.get(idx + 1);
    if (!item) {
      throw new Error('Chybí batch položka ' + (idx + 1));
    }
    if (item.error) {
      throw new Error(item.error.message + ' (code ' + item.error.code + ')');
    }
    return item.result;
  });
}

async function login() {
  const user = document.getElementById('apiUser').value.trim();
  const password = document.getElementById('apiPassword').value;

  try {
    const result = await rpc('Api.Login', { user, password }, false);
    authToken = result.token;
    setConnStatus('Přihlášeno', true);
    setDebug('Login OK');
    startPolling();
    startKeepAlive();
    await refreshAll();
  } catch (err) {
    authToken = null;
    stopPolling();
    stopKeepAlive();
    setConnStatus('Login failed', false);
    setDebug('Login error: ' + err.message);
    alert('Login selhal: ' + err.message);
  }
}

async function logout() {
  stopPolling();
  stopKeepAlive();

  if (!authToken) {
    setConnStatus('Nepřihlášeno', false);
    setDebug('Logout bez aktivní session');
    return;
  }

  try {
    await rpc('Api.Logout');
  } catch (_) {
  } finally {
    authToken = null;
    setConnStatus('Nepřihlášeno', false);
    setDebug('Odhlášeno');
  }
}

async function keepAlive() {
  if (!authToken) return;

  try {
    await rpc('Api.Ping', null, true);
    setConnStatus('Přihlášeno', true);
  } catch (err) {
    stopPolling();
    stopKeepAlive();
    authToken = null;
    setConnStatus('Session vypršela', false);
    setDebug('KeepAlive error: ' + err.message);
  }
}

function startKeepAlive() {
  stopKeepAlive();
  keepAliveTimer = setInterval(keepAlive, 30000);
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

function setStandardToggle(toggleId, textId, value) {
  const toggle = document.getElementById(toggleId);
  const text = document.getElementById(textId);
  const active = !!value;

  if (toggle) {
    toggle.classList.toggle('active', active);
  }
  if (text) {
    text.textContent = active ? 'ACTIVE • PLC=true' : 'INACTIVE • PLC=false';
  }
}

function setSafetyRelayAuxToggle(value) {
  const toggle = document.getElementById('SafetyRelayAuxOkToggle');
  const text = document.getElementById('SafetyRelayAuxOkText');

  const plcValue = !!value;
  const healthy = plcValue === true;

  if (toggle) {
    toggle.classList.remove('active', 'safety-bad');
    if (healthy) {
      toggle.classList.add('active');
    } else {
      toggle.classList.add('active', 'safety-bad');
    }
  }

  if (text) {
    text.textContent = healthy
      ? 'OK • active low • PLC=true'
      : 'ACTIVE FAULT • active low • PLC=false';
  }
}

function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function syncSpindleFromNumber() {
  const rpmInput = document.getElementById('rpmInput');
  const rpmSlider = document.getElementById('rpmSlider');
  const rpmDisplay = document.getElementById('rpmDisplay');

  if (!rpmInput || !rpmSlider || !rpmDisplay) return;

  let rpm = parseFloat(rpmInput.value);
  if (isNaN(rpm)) rpm = 0;
  rpm = clamp(rpm, 0, 18000);

  rpmInput.value = rpm;
  rpmSlider.value = rpm;
  rpmDisplay.textContent = Math.round(rpm);
}

function syncSpindleFromSlider() {
  const rpmInput = document.getElementById('rpmInput');
  const rpmSlider = document.getElementById('rpmSlider');
  const rpmDisplay = document.getElementById('rpmDisplay');

  if (!rpmInput || !rpmSlider || !rpmDisplay) return;

  let rpm = parseFloat(rpmSlider.value);
  if (isNaN(rpm)) rpm = 0;

  rpmInput.value = rpm;
  rpmDisplay.textContent = Math.round(rpm);
}

function updateSpindleButtons(startValue, stopValue) {
  const startBtn = document.getElementById('spindleStartBtn');
  const stopBtn = document.getElementById('spindleStopBtn');

  if (startBtn) {
    startBtn.classList.toggle('start-active', !!startValue);
  }
  if (stopBtn) {
    stopBtn.classList.toggle('stop-active', !!stopValue);
  }

  const startVal = document.getElementById('spindleStartValue');
  const stopVal = document.getElementById('spindleStopValue');

  if (startVal) startVal.textContent = String(!!startValue);
  if (stopVal) stopVal.textContent = String(!!stopValue);
}

async function refreshAll() {
  if (!authToken || refreshInProgress || writeInProgress) {
    return;
  }

  refreshInProgress = true;

  try {
    const results = await rpcBatch([
      { method: 'PlcProgram.Read', params: { var: TAGS.safetyOk, mode: 'simple' } },
      { method: 'PlcProgram.Read', params: { var: TAGS.permitMotion, mode: 'simple' } },
      { method: 'PlcProgram.Read', params: { var: TAGS.tripActive, mode: 'simple' } },
      { method: 'PlcProgram.Read', params: { var: TAGS.tripCode, mode: 'simple' } },
      { method: 'PlcProgram.Read', params: { var: TAGS.statusText, mode: 'simple' } },
      { method: 'PlcProgram.Read', params: { var: TAGS.emergencyStop, mode: 'simple' } },
      { method: 'PlcProgram.Read', params: { var: TAGS.safetyRelayAuxOk, mode: 'simple' } },
      { method: 'PlcProgram.Read', params: { var: TAGS.externalFault, mode: 'simple' } },
      { method: 'PlcProgram.Read', params: { var: TAGS.tempHigh, mode: 'simple' } },
      { method: 'PlcProgram.Read', params: { var: TAGS.vibCritical, mode: 'simple' } },
      { method: 'PlcProgram.Read', params: { var: TAGS.spindleStart, mode: 'simple' } },
      { method: 'PlcProgram.Read', params: { var: TAGS.spindleStop, mode: 'simple' } }
    ]);

    const [
      safetyOk,
      permitMotion,
      tripActive,
      tripCode,
      statusText,
      emergencyStop,
      safetyRelayAuxOk,
      externalFault,
      tempHigh,
      vibCritical,
      spindleStart,
      spindleStop
    ] = results;

    const elSafetyOk = document.getElementById('valSafetyOk');
    const elPermitMotion = document.getElementById('valPermitMotion');
    const elTripActive = document.getElementById('valTripActive');
    const elTripCode = document.getElementById('valTripCode');
    const elStatusText = document.getElementById('valStatusText');
    const elLastRefresh = document.getElementById('valLastRefresh');

    if (elSafetyOk) elSafetyOk.textContent = String(safetyOk);
    if (elPermitMotion) elPermitMotion.textContent = String(permitMotion);
    if (elTripActive) elTripActive.textContent = String(tripActive);
    if (elTripCode) elTripCode.textContent = String(tripCode);
    if (elStatusText) elStatusText.textContent = String(statusText);
    if (elLastRefresh) elLastRefresh.textContent = new Date().toLocaleTimeString();

    setStandardToggle('EmergencyStopToggle', 'EmergencyStopText', emergencyStop);
    setSafetyRelayAuxToggle(safetyRelayAuxOk);
    setStandardToggle('ExternalFaultToggle', 'ExternalFaultText', externalFault);
    setStandardToggle('TempHighToggle', 'TempHighText', tempHigh);
    setStandardToggle('VibCriticalToggle', 'VibCriticalText', vibCritical);

    updateSpindleButtons(spindleStart, spindleStop);
    setConnStatus('Přihlášeno', true);
  } catch (err) {
    stopPolling();
    stopKeepAlive();
    authToken = null;
    setConnStatus('Chyba čtení z PLC', false);
    setDebug('Refresh error: ' + err.message);
  } finally {
    refreshInProgress = false;
  }
}

async function readBit(tag) {
  return await rpc('PlcProgram.Read', { var: tag, mode: 'simple' }, true);
}

async function writeBit(tag, value) {
  return await rpc('PlcProgram.Write', { var: tag, value, mode: 'simple' }, true);
}

function toggleEmergencyStop() {
  toggleBit(TAGS.emergencyStop, 'EmergencyStopToggle');
}

function toggleSafetyRelayAuxOk() {
  toggleBit(TAGS.safetyRelayAuxOk, 'SafetyRelayAuxOkToggle');
}

function toggleExternalFault() {
  toggleBit(TAGS.externalFault, 'ExternalFaultToggle');
}

function toggleTempHigh() {
  toggleBit(TAGS.tempHigh, 'TempHighToggle');
}

function toggleVibCritical() {
  toggleBit(TAGS.vibCritical, 'VibCriticalToggle');
}

async function toggleBit(tag, toggleId) {
  setDebug('CLICK: ' + tag + ' toggleId=' + toggleId + ' authToken=' + (authToken ? 'yes' : 'no') + ' writeInProgress=' + writeInProgress);

  if (!authToken) {
    alert('Nejdřív se přihlas.');
    return;
  }

  if (writeInProgress) {
    setDebug('CLICK ignored: writeInProgress=true');
    return;
  }

  writeInProgress = true;

  try {
    const current = await readBit(tag);
    setDebug('READ current: ' + tag + ' = ' + current);

    const next = !current;
    setDebug('WRITE start: ' + tag + ' current=' + current + ' next=' + next);

    const writeResult = await writeBit(tag, next);
    setDebug('WRITE result: ' + tag + ' -> ' + next + ' result=' + JSON.stringify(writeResult));

    if (tag === TAGS.safetyRelayAuxOk) {
      setSafetyRelayAuxToggle(next);
    } else {
      const textId = toggleId.replace('Toggle', 'Text');
      setStandardToggle(toggleId, textId, next);
    }

    writeInProgress = false;
    await refreshAll();
  } catch (err) {
    writeInProgress = false;
    setDebug('WRITE error: ' + tag + ' -> ' + err.message);
    alert('Zápis selhal: ' + err.message);
  }
}

async function spindleStartCommand() {
  if (!authToken) {
    alert('Nejdřív se přihlas.');
    return;
  }

  try {
    setDebug('SPINDLE START command');

    await rpcBatch([
      { method: 'PlcProgram.Write', params: { var: TAGS.spindleStart, value: true, mode: 'simple' } },
      { method: 'PlcProgram.Write', params: { var: TAGS.spindleStop, value: false, mode: 'simple' } }
    ], true);

    updateSpindleButtons(true, false);
    setDebug('SPINDLE START done');
  } catch (err) {
    setDebug('SPINDLE START error: ' + err.message);
    alert('Start selhal: ' + err.message);
  }
}

async function spindleStopCommand() {
  if (!authToken) {
    alert('Nejdřív se přihlas.');
    return;
  }

  try {
    setDebug('SPINDLE STOP command');

    await rpcBatch([
      { method: 'PlcProgram.Write', params: { var: TAGS.spindleStart, value: false, mode: 'simple' } },
      { method: 'PlcProgram.Write', params: { var: TAGS.spindleStop, value: true, mode: 'simple' } }
    ], true);

    updateSpindleButtons(false, true);
    setDebug('SPINDLE STOP done');
  } catch (err) {
    setDebug('SPINDLE STOP error: ' + err.message);
    alert('Stop selhal: ' + err.message);
  }
}

async function writeSpindleSpeed() {
  if (!authToken) {
    alert('Nejdřív se přihlas.');
    return;
  }

  try {
    const rpmInput = document.getElementById('rpmInput');
    let rpm = parseInt(rpmInput.value, 10);
    if (isNaN(rpm)) rpm = 0;
    rpm = clamp(rpm, 0, 18000);

    rpmInput.value = rpm;
    document.getElementById('rpmSlider').value = rpm;
    document.getElementById('rpmDisplay').textContent = rpm;

    const result = await rpc(
      'PlcProgram.Write',
      { var: TAGS.spindleSpeedRpm, value: rpm, mode: 'simple' },
      true
    );

    document.getElementById('spindleSpeedText').textContent = 'Zapsáno: ' + rpm + ' rpm';
    setDebug('WRITE spindle speed: ' + rpm + ' result=' + JSON.stringify(result));
  } catch (err) {
    document.getElementById('spindleSpeedText').textContent = 'Chyba zápisu otáček';
    setDebug('WRITE spindle speed error: ' + err.message);
    alert('Zápis otáček selhal: ' + err.message);
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(refreshAll, 500);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

window.addEventListener('beforeunload', function() {
  stopPolling();
  stopKeepAlive();
});