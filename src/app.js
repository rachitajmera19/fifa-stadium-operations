// Aegis FIFA 2026 - Main Application Controller
import { renderStadiumMap, updateSectorState } from './stadium_map.js';
import { askAegis, setApiKey, getApiKey, isApiConfigured, sanitizeHTML } from './ai_engine.js';

// Application State
const state = {
  currentView: 'fan', // 'fan' or 'staff'
  selectedSector: null,
  isSpeechActive: false,
  isA11yHudActive: false,
  energySavingMode: false,
  hvacLevel: 75,
  waterLevel: 75,
  lightingLevel: 80,
  alerts: [
    {
      id: 'alert-1',
      title: 'South Stand Congestion',
      desc: 'Active supporters area exceeding 90% capacity. Restroom wait times exceed 25 mins.',
      type: 'alert-danger',
      time: '13:42',
      sectorId: 'sector-south'
    },
    {
      id: 'alert-2',
      title: 'Gate C Sensor Failure',
      desc: 'Turnstile A4 card reader offline. Manual tickets verification active.',
      type: 'alert-warning',
      time: '13:35',
      sectorId: 'sector-east'
    }
  ],
  personnel: [
    { id: 'p1', name: 'Carlos R. (Steward)', status: 'Available', sectorId: null },
    { id: 'p2', name: 'Aisha M. (Volunteer)', status: 'Available', sectorId: null },
    { id: 'p3', name: 'Markus K. (Security)', status: 'Assigned (VIP)', sectorId: 'sector-vip' },
    { id: 'p4', name: 'Siddharth S. (Steward)', status: 'Available', sectorId: null }
  ]
};

// Web Speech API interfaces
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initEventListeners();
  renderMapComponent();
  initSpeechSystem();
  loadStoredSettings();
  
  // Show welcome chat message
  addMessage('ai', "Hello! I am Aegis, your AI Stadium Operations and Fan Experience Assistant. How can I help you today?", 'fan');
  addMessage('ai', "Aegis Operations Center online. Monitoring MetLife Stadium infrastructure. Real-time parameters stable.", 'staff');
});

// Setup DOM element controllers
function initUI() {
  const selectHandler = (sector) => {
    state.selectedSector = sector;
    updateSectorDetailsPanel();
  };
  
  renderStadiumMap('stadium-map-fan', selectHandler);
  renderStadiumMap('stadium-map-staff', selectHandler);
  
  updateAlertsFeed();
  updatePersonnelList();
  updateEnergySavings();
}

function renderMapComponent() {
  const containerId = state.currentView === 'fan' ? 'stadium-map-fan' : 'stadium-map-staff';
  renderStadiumMap(containerId, (sector) => {
    state.selectedSector = sector;
    updateSectorDetailsPanel();
  });
}

function initEventListeners() {
  // View Switcher Buttons
  const btnFan = document.getElementById('btn-view-fan');
  const btnStaff = document.getElementById('btn-view-staff');
  
  btnFan.addEventListener('click', () => switchView('fan'));
  btnStaff.addEventListener('click', () => switchView('staff'));
  
  // Chat inputs
  const btnSendFan = document.getElementById('btn-send-fan');
  const txtInputFan = document.getElementById('txt-input-fan');
  
  const btnSendStaff = document.getElementById('btn-send-staff');
  const txtInputStaff = document.getElementById('txt-input-staff');
  
  btnSendFan.addEventListener('click', () => handleChatSubmit('fan'));
  txtInputFan.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSubmit('fan');
  });
  
  btnSendStaff.addEventListener('click', () => handleChatSubmit('staff'));
  txtInputStaff.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSubmit('staff');
  });
  
  // Quick guide buttons (Fan mode)
  document.querySelectorAll('.guide-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-query');
      const input = document.getElementById('txt-input-fan');
      input.value = text;
      handleChatSubmit('fan');
    });
  });

  // Settings Panel actions
  const btnSaveKey = document.getElementById('btn-save-key');
  const txtApiKey = document.getElementById('txt-api-key');
  
  btnSaveKey.addEventListener('click', () => {
    setApiKey(txtApiKey.value);
    alert('API Key updated successfully! Connection status will update on next query.');
    updateApiKeyStatus();
  });

  // Accessibility Toggles
  const chkContrast = document.getElementById('chk-high-contrast');
  const chkLargeText = document.getElementById('chk-large-text');
  const chkA11yHud = document.getElementById('chk-a11y-hud');
  const btnCloseA11y = document.getElementById('btn-close-a11y-hud');
  
  chkContrast.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('high-contrast');
      localStorage.setItem('AEGIS_HIGH_CONTRAST', 'true');
    } else {
      document.body.classList.remove('high-contrast');
      localStorage.setItem('AEGIS_HIGH_CONTRAST', 'false');
    }
  });

  chkLargeText.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('large-text');
      localStorage.setItem('AEGIS_LARGE_TEXT', 'true');
    } else {
      document.body.classList.remove('large-text');
      localStorage.setItem('AEGIS_LARGE_TEXT', 'false');
    }
  });

  chkA11yHud.addEventListener('change', (e) => {
    state.isA11yHudActive = e.target.checked;
    document.getElementById('a11y-speech-hud').style.display = state.isA11yHudActive ? 'flex' : 'none';
    localStorage.setItem('AEGIS_A11Y_HUD', state.isA11yHudActive ? 'true' : 'false');
  });

  btnCloseA11y.addEventListener('click', () => {
    state.isA11yHudActive = false;
    document.getElementById('a11y-speech-hud').style.display = 'none';
    chkA11yHud.checked = false;
    localStorage.setItem('AEGIS_A11Y_HUD', 'false');
  });

  // Sustainability Controls
  const toggleOpt = document.getElementById('toggle-sustainability-opt');
  const sliderHvac = document.getElementById('slider-hvac');
  const sliderWater = document.getElementById('slider-water');
  const sliderLighting = document.getElementById('slider-lighting');
  
  toggleOpt.addEventListener('change', (e) => {
    state.energySavingMode = e.target.checked;
    if (state.energySavingMode) {
      sliderHvac.value = 55;
      sliderWater.value = 95;
      sliderLighting.value = 60;
      updateSustainabilityStats(55, 95, 60);
      addMessage('ai', "🌱 **AI Sustainability Protocol Activated:** HVAC cooled output reduced to 55%. Greywater grid efficiency bumped to 95%. LED output reduced to 60%. Smart grid savings optimized.", 'staff');
    } else {
      sliderHvac.value = 75;
      sliderWater.value = 75;
      sliderLighting.value = 80;
      updateSustainabilityStats(75, 75, 80);
      addMessage('ai', "⚙️ **Standard Operations Restored:** HVAC levels reset to 75%. Water grid reset to 75%. Lighting levels reset to 80%.", 'staff');
    }
  });

  sliderHvac.addEventListener('input', (e) => {
    state.hvacLevel = parseInt(e.target.value);
    document.getElementById('lbl-hvac-val').innerText = `${state.hvacLevel}%`;
    updateEnergySavings();
  });

  sliderWater.addEventListener('input', (e) => {
    state.waterLevel = parseInt(e.target.value);
    document.getElementById('lbl-water-val').innerText = `${state.waterLevel}%`;
    updateEnergySavings();
  });

  sliderLighting.addEventListener('input', (e) => {
    state.lightingLevel = parseInt(e.target.value);
    document.getElementById('lbl-lighting-val').innerText = `${state.lightingLevel}%`;
    updateEnergySavings();
  });

  // Dispatch and Personnel Assignment Dialog
  const btnAssign = document.getElementById('btn-assign-personnel');
  const selectPersonnel = document.getElementById('select-personnel');
  
  btnAssign.addEventListener('click', () => {
    const pId = selectPersonnel.value;
    if (!state.selectedSector) {
      alert('Please select a stadium sector on the map first.');
      return;
    }
    const staffMember = state.personnel.find(p => p.id === pId);
    if (staffMember) {
      staffMember.status = `Assigned (${state.selectedSector.name.split(' ')[0]})`;
      staffMember.sectorId = state.selectedSector.id;
      updatePersonnelList();
      
      // Update sector status risk if South Stand is dispatched
      if (state.selectedSector.id === 'sector-south') {
        updateSectorState('sector-south', { risk: 'medium', capacity: 88 });
        // Mitigate alert
        const alertIndex = state.alerts.findIndex(a => a.sectorId === 'sector-south');
        if (alertIndex > -1) {
          state.alerts.splice(alertIndex, 1);
          updateAlertsFeed();
        }
      }
      // Update sector status risk if North Stand is dispatched (during train delay)
      else if (state.selectedSector.id === 'sector-north' && state.selectedSector.risk === 'high') {
        updateSectorState('sector-north', { risk: 'medium', capacity: 80 });
      }
      
      addMessage('ai', `👮 **Personnel Dispatched:** ${staffMember.name} has been deployed to the ${state.selectedSector.name} to mitigate operations flow.`, 'staff');
      updateSectorDetailsPanel();
      updatePersonnelCounts();
    }
  });

  // Transit Incident Simulator actions
  const btnSimulateTransit = document.getElementById('btn-simulate-transit-delay');
  const btnRestoreTransit = document.getElementById('btn-restore-transit');

  btnSimulateTransit.addEventListener('click', () => {
    // 1. Update transit text
    document.getElementById('transit-train-status-fan').innerText = 'DELAYED (Power Drop)';
    document.getElementById('transit-train-status-fan').style.color = 'var(--danger)';
    document.getElementById('transit-train-status-staff').innerText = 'DELAYED (Power Drop)';
    document.getElementById('transit-train-status-staff').style.color = 'var(--danger)';
    
    // 2. Update badges
    document.getElementById('transit-indicator-fan').innerText = 'INCIDENT LEVEL 1';
    document.getElementById('transit-indicator-fan').style.background = 'var(--danger)';
    document.getElementById('transit-indicator-staff').innerText = 'INCIDENT LEVEL 1';
    document.getElementById('transit-indicator-staff').style.background = 'var(--danger)';

    // 3. Highlight North Stand (station exit concourse) to high danger capacity
    updateSectorState('sector-north', { 
      risk: 'high', 
      capacity: 95, 
      waitRestroom: 18, 
      waitConcessions: 22,
      description: '⚠️ Transit bottleneck backing up into North Concourse. Meadowlands express rail lines delayed. Sector is congested.'
    });

    // 4. Update HUD metrics
    document.getElementById('lbl-safety-val').innerText = '78%';
    document.getElementById('lbl-safety-val').style.color = 'var(--danger)';
    document.getElementById('lbl-grid-val').innerText = '85%';
    document.getElementById('lbl-grid-val').style.color = 'var(--danger)';
    
    // Update Load Bar
    document.getElementById('lbl-queue-val').innerText = 'CRITICAL (72%)';
    document.getElementById('lbl-queue-val').style.color = 'var(--danger)';
    document.getElementById('bar-queue-load').style.width = '72%';
    document.getElementById('bar-queue-load').style.background = 'linear-gradient(90deg, var(--warning), var(--danger))';

    // 5. Append alert
    const newAlert = {
      id: 'alert-transit-delay',
      title: 'Meadowlands Express Delayed',
      desc: 'Rail power grid drop. Penn Station express delayed 25 mins. Platform congestion critical.',
      type: 'alert-danger',
      time: '14:45',
      sectorId: 'sector-north'
    };
    state.alerts.unshift(newAlert);
    updateAlertsFeed();

    // 6. Append AI Assistant Message
    addMessage('ai', `🚨 **Meadowlands Transit Alert:** Express rail lines to Manhattan are delayed. Crowd backlog detected in Sector North. Advise staff to re-route passengers to Concourse A/B Shuttle Bus loops. Recommended dispatcher deploy 2 stewards immediately.`, 'staff');
    
    if (state.selectedSector && state.selectedSector.id === 'sector-north') {
      state.selectedSector = {
        id: 'sector-north',
        name: 'North Stand (General Admission)',
        capacity: 95,
        risk: 'high',
        waitRestroom: 18,
        waitConcessions: 22,
        gates: 'Gates A & B',
        description: '⚠️ Transit bottleneck backing up into North Concourse. Meadowlands express rail lines delayed. Sector is congested.'
      };
      updateSectorDetailsPanel();
    }

    // Toggle simulator buttons
    btnSimulateTransit.style.display = 'none';
    btnRestoreTransit.style.display = 'block';
  });

  btnRestoreTransit.addEventListener('click', () => {
    // 1. Reset transit text
    document.getElementById('transit-train-status-fan').innerText = 'On Time (10m)';
    document.getElementById('transit-train-status-fan').style.color = 'var(--success)';
    document.getElementById('transit-train-status-staff').innerText = 'On Time (10m)';
    document.getElementById('transit-train-status-staff').style.color = 'var(--success)';
    
    // 2. Reset badges
    document.getElementById('transit-indicator-fan').innerText = 'STABLE RUNNING';
    document.getElementById('transit-indicator-fan').style.background = 'var(--success)';
    document.getElementById('transit-indicator-staff').innerText = 'STABLE RUNNING';
    document.getElementById('transit-indicator-staff').style.background = 'var(--success)';

    // 3. Reset North Stand
    updateSectorState('sector-north', { 
      risk: 'low', 
      capacity: 65, 
      waitRestroom: 8, 
      waitConcessions: 12,
      description: 'Active fan zone. Fluid crowd movements, low queue times.'
    });

    // 4. Reset HUD metrics
    document.getElementById('lbl-safety-val').innerText = '94%';
    document.getElementById('lbl-safety-val').style.color = 'var(--success)';
    document.getElementById('lbl-grid-val').innerText = '98.8%';
    document.getElementById('lbl-grid-val').style.color = 'var(--secondary)';
    
    // Reset Load Bar
    document.getElementById('lbl-queue-val').innerText = 'MODERATE (42%)';
    document.getElementById('lbl-queue-val').style.color = 'var(--warning)';
    document.getElementById('bar-queue-load').style.width = '42%';
    document.getElementById('bar-queue-load').style.background = 'linear-gradient(90deg, var(--success), var(--warning))';

    // 5. Clear alert
    state.alerts = state.alerts.filter(a => a.id !== 'alert-transit-delay');
    updateAlertsFeed();

    // 6. Log completion
    addMessage('ai', `✅ **Transit Operations Restored:** Special rail express trains departing normally. Platforms cleared. Concourse flow stabilized.`, 'staff');
    
    if (state.selectedSector && state.selectedSector.id === 'sector-north') {
      state.selectedSector = {
        id: 'sector-north',
        name: 'North Stand (General Admission)',
        capacity: 65,
        risk: 'low',
        waitRestroom: 8,
        waitConcessions: 12,
        gates: 'Gates A & B',
        description: 'Active fan zone. Fluid crowd movements, low queue times.'
      };
      updateSectorDetailsPanel();
    }

    // Toggle simulator buttons
    btnSimulateTransit.style.display = 'block';
    btnRestoreTransit.style.display = 'none';
  });
}

function switchView(view) {
  state.currentView = view;
  
  document.getElementById('btn-view-fan').classList.toggle('active', view === 'fan');
  document.getElementById('btn-view-staff').classList.toggle('active', view === 'staff');
  
  document.getElementById('btn-view-fan').setAttribute('aria-selected', view === 'fan' ? 'true' : 'false');
  document.getElementById('btn-view-staff').setAttribute('aria-selected', view === 'staff' ? 'true' : 'false');
  
  document.getElementById('panel-fan').classList.toggle('active', view === 'fan');
  document.getElementById('panel-staff').classList.toggle('active', view === 'staff');
  
  renderMapComponent();
  
  const container = document.getElementById(`chat-messages-${view}`);
  if (container) container.scrollTop = container.scrollHeight;
}

// Load settings from localStorage
function loadStoredSettings() {
  const txtApiKey = document.getElementById('txt-api-key');
  txtApiKey.value = getApiKey();
  updateApiKeyStatus();

  if (localStorage.getItem('AEGIS_HIGH_CONTRAST') === 'true') {
    document.getElementById('chk-high-contrast').checked = true;
    document.body.classList.add('high-contrast');
  }
  
  if (localStorage.getItem('AEGIS_LARGE_TEXT') === 'true') {
    document.getElementById('chk-large-text').checked = true;
    document.body.classList.add('large-text');
  }

  if (localStorage.getItem('AEGIS_A11Y_HUD') === 'true') {
    document.getElementById('chk-a11y-hud').checked = true;
    state.isA11yHudActive = true;
    document.getElementById('a11y-speech-hud').style.display = 'flex';
  }
}

function updateApiKeyStatus() {
  const isConfigured = isApiConfigured();
  const dots = document.querySelectorAll('.status-dot');
  const labels = document.querySelectorAll('.chat-status-text');
  
  dots.forEach(dot => {
    dot.className = `status-dot ${isConfigured ? '' : 'simulated'}`;
  });
  
  labels.forEach(lbl => {
    lbl.innerText = isConfigured ? 'Gemini 2.5 Flash' : 'Aegis Local Simulation';
  });
}

// Speech vocalization triggers
function initSpeechSystem() {
  const voiceBtnFan = document.getElementById('btn-voice-fan');
  const voiceBtnStaff = document.getElementById('btn-voice-staff');
  
  if (!recognition) {
    if (voiceBtnFan) voiceBtnFan.style.display = 'none';
    if (voiceBtnStaff) voiceBtnStaff.style.display = 'none';
    return;
  }
  
  const setupSpeech = (btn, view) => {
    btn.addEventListener('click', () => {
      if (state.isSpeechActive) {
        recognition.stop();
        btn.classList.remove('listening');
        state.isSpeechActive = false;
      } else {
        btn.classList.add('listening');
        state.isSpeechActive = true;
        recognition.start();
      }
    });
    
    recognition.addEventListener('result', (e) => {
      const transcript = e.results[0][0].transcript;
      const input = document.getElementById(`txt-input-${view}`);
      input.value = transcript;
      handleChatSubmit(view);
    });
    
    recognition.addEventListener('end', () => {
      btn.classList.remove('listening');
      state.isSpeechActive = false;
    });
  };
  
  if (voiceBtnFan) setupSpeech(voiceBtnFan, 'fan');
  if (voiceBtnStaff) setupSpeech(voiceBtnStaff, 'staff');
}

export function speak(text) {
  // 1. Display on visual HUD
  const hud = document.getElementById('a11y-speech-hud');
  const textEl = document.getElementById('a11y-speech-text');
  
  if (hud && textEl) {
    textEl.innerText = `"${text}"`;
    // Flashing visual border pulse animation
    hud.style.borderColor = 'var(--accent-pink)';
    setTimeout(() => {
      hud.style.borderColor = 'var(--secondary)';
    }, 1200);
  }

  // 2. Synthesize browser vocalization
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

// Chat submitting engine
async function handleChatSubmit(view) {
  const inputEl = document.getElementById(`txt-input-${view}`);
  const text = inputEl.value.trim();
  if (!text) return;
  
  // Safe HTML escapes
  const cleanInput = sanitizeHTML(text);
  
  addMessage('user', cleanInput, view);
  inputEl.value = '';
  
  const loadingMsgId = addMessage('ai', 'Thinking...', view);
  const response = await askAegis(text, view === 'staff');
  
  updateMessage(loadingMsgId, response, view);
  
  if (state.isSpeechActive || view === 'fan') {
    // Escapes special markdown markup characters before synthesizing speech
    const speechText = response.replace(/[#*`]/g, '').substring(0, 160) + '...';
    speak(speechText);
  }
}

function addMessage(sender, text, view) {
  const chatMsgs = document.getElementById(`chat-messages-${view}`);
  if (!chatMsgs) return null;
  
  const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const msgEl = document.createElement('div');
  msgEl.id = id;
  msgEl.className = `chat-message ${sender}`;
  msgEl.innerHTML = formatMarkdown(text);
  
  chatMsgs.appendChild(msgEl);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  return id;
}

function updateMessage(id, text, view) {
  const msgEl = document.getElementById(id);
  if (msgEl) {
    msgEl.innerHTML = formatMarkdown(text);
    const chatMsgs = document.getElementById(`chat-messages-${view}`);
    if (chatMsgs) chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }
}

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n/g, '<br/>');
}

// Alert mitigation
function updateAlertsFeed() {
  const alertsList = document.getElementById('alerts-feed-list');
  if (!alertsList) return;
  
  if (state.alerts.length === 0) {
    alertsList.innerHTML = `<div class="detail-label" style="text-align:center; padding: 2rem;">No active operation incidents. All systems normal.</div>`;
    return;
  }
  
  alertsList.innerHTML = state.alerts.map(alert => `
    <div class="alert-item ${alert.type}" id="${alert.id}">
      <div class="alert-content">
        <span class="alert-title">${alert.title}</span>
        <span class="alert-desc">${alert.desc}</span>
      </div>
      <div class="alert-meta">
        <span class="alert-time">${alert.time}</span>
        <button class="btn-mitigate" data-sector="${alert.sectorId}" data-id="${alert.id}">Mitigate</button>
      </div>
    </div>
  `).join('');

  alertsList.querySelectorAll('.btn-mitigate').forEach(btn => {
    btn.addEventListener('click', () => {
      const sectorId = btn.getAttribute('data-sector');
      const alertId = btn.getAttribute('data-id');
      
      updateSectorState(sectorId, { risk: 'low', capacity: 70 });
      
      // If resolving train delay alert, reset buttons UI
      if (alertId === 'alert-transit-delay') {
        document.getElementById('btn-restore-transit').click();
        return;
      }
      
      state.alerts = state.alerts.filter(a => a.id !== alertId);
      updateAlertsFeed();
      
      addMessage('ai', `✅ **Incident Mitigated:** Handled alert at Sector ${sectorId.split('-')[1]}. Sector operations restored to stable.`, 'staff');
      if (state.selectedSector && state.selectedSector.id === sectorId) {
        state.selectedSector.risk = 'low';
        state.selectedSector.capacity = 70;
        updateSectorDetailsPanel();
      }
    });
  });
}

function updatePersonnelList() {
  const list = document.getElementById('dispatch-list-container');
  const dropdown = document.getElementById('select-personnel');
  if (!list || !dropdown) return;
  
  list.innerHTML = state.personnel.map(p => `
    <div class="dispatch-row">
      <div class="personnel-info">
        <span class="personnel-name">${p.name}</span>
        <span class="personnel-status">${p.status}</span>
      </div>
      ${p.sectorId ? `<button class="btn-dispatch-action recall-btn" data-id="${p.id}">Recall</button>` : `<span class="detail-label">STANDBY</span>`}
    </div>
  `).join('');

  dropdown.innerHTML = state.personnel
    .filter(p => p.sectorId === null)
    .map(p => `<option value="${p.id}">${p.name}</option>`)
    .join('');

  if (dropdown.options.length === 0) {
    dropdown.innerHTML = `<option value="">All Stewards Deployed</option>`;
  }

  list.querySelectorAll('.recall-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-id');
      const staffMember = state.personnel.find(p => p.id === pId);
      if (staffMember) {
        staffMember.status = 'Available';
        staffMember.sectorId = null;
        updatePersonnelList();
        addMessage('ai', `🔄 **Personnel Recall:** ${staffMember.name} has returned to operations base and is on standby.`, 'staff');
        updatePersonnelCounts();
      }
    });
  });
}

function updateSectorDetailsPanel() {
  const panelId = state.currentView === 'fan' ? 'sector-detail-fan' : 'sector-detail-staff';
  const panel = document.getElementById(panelId);
  if (!panel) return;
  
  if (!state.selectedSector) {
    panel.innerHTML = `<div class="detail-label" style="text-align:center; padding: 2rem;">Select a stadium sector on the map above to view real-time parameters.</div>`;
    return;
  }
  
  const sector = state.selectedSector;
  const isHighRisk = sector.risk === 'high';
  
  panel.innerHTML = `
    <div class="card-title-group">
      <h3 class="card-title">📍 ${sector.name}</h3>
      <span class="logo-badge" style="background: ${isHighRisk ? 'var(--danger)' : 'var(--primary)'}; color: ${isHighRisk ? '#fff' : 'var(--bg-darker)'}">${sector.risk.toUpperCase()} RISK</span>
    </div>
    <div class="map-details-grid">
      <div class="detail-item">
        <span class="detail-label">Sector Occupancy</span>
        <span class="detail-value">${sector.capacity}%</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Nearby Gates</span>
        <span class="detail-value">${sector.gates}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Restrooms Queue</span>
        <span class="detail-value">${sector.waitRestroom} mins</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Concessions Queue</span>
        <span class="detail-value">${sector.waitConcessions} mins</span>
      </div>
    </div>
    <div class="detail-item" style="margin-top: 0.5rem;">
      <span class="detail-label">Aegis Guidance</span>
      <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 4px;">${sector.description}</p>
    </div>
  `;
}

function updateSustainabilityStats(hvac, water, lighting) {
  state.hvacLevel = hvac;
  state.waterLevel = water;
  state.lightingLevel = lighting;
  
  document.getElementById('lbl-hvac-val').innerText = `${hvac}%`;
  document.getElementById('lbl-water-val').innerText = `${water}%`;
  document.getElementById('lbl-lighting-val').innerText = `${lighting}%`;
  updateEnergySavings();
}

function updateEnergySavings() {
  const hvacSavings = (100 - state.hvacLevel) * 120;
  const waterSavings = (state.waterLevel - 50) * 80;
  const lightSavings = (100 - state.lightingLevel) * 65;
  const totalSavings = Math.round(hvacSavings + waterSavings + lightSavings);
  
  const label = document.getElementById('lbl-sustainability-savings');
  if (label) label.innerText = `${totalSavings.toLocaleString()} kWh/hr`;
}

function updatePersonnelCounts() {
  const dispatched = state.personnel.filter(p => p.sectorId !== null).length;
  const total = state.personnel.length;
  document.getElementById('lbl-dispatch-count').innerText = `${dispatched} / ${total}`;
}
